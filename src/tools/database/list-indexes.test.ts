import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addListIndexesTool} from './list-indexes.js';

describe('list-indexes tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addListIndexesTool(mockServer as never, mockPc as never);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list-indexes',
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('returns formatted index list on success', async () => {
    const mockIndexes = {
      indexes: [
        {name: 'test-index-1', dimension: 1536},
        {name: 'test-index-2', dimension: 768},
      ],
    };
    mockPc.listIndexes.mockResolvedValue(mockIndexes);

    addListIndexesTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('list-indexes');
    const result = await tool!.handler({});

    expect(mockPc.listIndexes).toHaveBeenCalled();
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockIndexes, null, 2),
        },
      ],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc.listIndexes.mockRejectedValue(new Error('API error'));

    addListIndexesTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('list-indexes');
    const result = await tool!.handler({});

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });

  it('handles empty index list', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});

    addListIndexesTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('list-indexes');
    const result = await tool!.handler({});

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({indexes: []}, null, 2),
        },
      ],
    });
  });
});
