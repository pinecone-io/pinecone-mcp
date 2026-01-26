import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addListIndexesTool} from './list-indexes.js';

describe('list-indexes tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addListIndexesTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list-indexes',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
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

    addListIndexesTool(mockServer as never);
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

    addListIndexesTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('list-indexes');
    const result = await tool!.handler({});

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });

  it('handles empty index list', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});

    addListIndexesTool(mockServer as never);
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
