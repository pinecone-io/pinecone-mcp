import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addCreateIndexForModelTool} from './create-index-for-model.js';

describe('create-index-for-model tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addCreateIndexForModelTool(mockServer as never, mockPc as never);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'create-index-for-model',
      expect.any(String),
      expect.objectContaining({name: expect.anything(), embed: expect.anything()}),
      expect.any(Function),
    );
  });

  it('creates index when it does not exist', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    const mockNewIndex = {
      name: 'new-index',
      dimension: 1024,
      metric: 'cosine',
    };
    mockPc.createIndexForModel.mockResolvedValue(mockNewIndex);

    addCreateIndexForModelTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'new-index',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    });

    expect(mockPc.listIndexes).toHaveBeenCalled();
    expect(mockPc.createIndexForModel).toHaveBeenCalledWith({
      name: 'new-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
      tags: {
        source: 'mcp',
        embedding_model: 'multilingual-e5-large',
      },
      waitUntilReady: true,
    });
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockNewIndex, null, 2)}],
    });
  });

  it('returns message when index already exists', async () => {
    const existingIndex = {name: 'existing-index', dimension: 768};
    mockPc.listIndexes.mockResolvedValue({indexes: [existingIndex]});

    addCreateIndexForModelTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'existing-index',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    });

    expect(mockPc.createIndexForModel).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Index not created'),
        },
      ],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.createIndexForModel.mockRejectedValue(new Error('API error'));

    addCreateIndexForModelTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'new-index',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });
});
