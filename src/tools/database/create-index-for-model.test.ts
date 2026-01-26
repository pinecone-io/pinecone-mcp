import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addCreateIndexForModelTool} from './create-index-for-model.js';

describe('create-index-for-model tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name and schema', () => {
    addCreateIndexForModelTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'create-index-for-model',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({
          name: expect.any(Object),
          cloud: expect.any(Object),
          region: expect.any(Object),
          embed: expect.any(Object),
        }),
      }),
      expect.any(Function),
    );
  });

  it('creates index with specified cloud and region', async () => {
    const mockIndexInfo = {
      name: 'new-index',
      dimension: 1024,
      host: 'new-index.pinecone.io',
    };
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.createIndexForModel.mockResolvedValue(mockIndexInfo);

    addCreateIndexForModelTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'new-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    });

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
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockIndexInfo, null, 2),
        },
      ],
    });
  });

  it('creates index with custom cloud and region', async () => {
    const mockIndexInfo = {
      name: 'gcp-index',
      dimension: 1024,
      host: 'gcp-index.pinecone.io',
    };
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.createIndexForModel.mockResolvedValue(mockIndexInfo);

    addCreateIndexForModelTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'gcp-index',
      cloud: 'gcp',
      region: 'us-central1',
      embed: {
        model: 'llama-text-embed-v2',
        fieldMap: {text: 'body'},
      },
    });

    expect(mockPc.createIndexForModel).toHaveBeenCalledWith(
      expect.objectContaining({
        cloud: 'gcp',
        region: 'us-central1',
      }),
    );
    const typedResult = result as {content: Array<{text: string}>};
    expect(typedResult.content[0].text).toContain('gcp-index');
  });

  it('returns message when index already exists', async () => {
    const existingIndex = {name: 'existing-index', dimension: 1536};
    mockPc.listIndexes.mockResolvedValue({indexes: [existingIndex]});

    addCreateIndexForModelTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = (await tool!.handler({
      name: 'existing-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    })) as {content: Array<{text: string}>};

    expect(mockPc.createIndexForModel).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('already exists');
  });

  it('returns error response on API failure', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.createIndexForModel.mockRejectedValue(new Error('API error'));

    addCreateIndexForModelTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-index-for-model');
    const result = await tool!.handler({
      name: 'new-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: {text: 'content'},
      },
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'API error'}],
    });
  });
});
