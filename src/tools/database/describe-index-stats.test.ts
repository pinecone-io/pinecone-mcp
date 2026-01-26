import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addDescribeIndexStatsTool} from './describe-index-stats.js';

describe('describe-index-stats tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addDescribeIndexStatsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'describe-index-stats',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('returns index stats on success', async () => {
    const mockStats = {
      namespaces: {
        '': {recordCount: 100},
        ns1: {recordCount: 50},
      },
      dimension: 1536,
      totalRecordCount: 150,
    };
    mockPc._mockIndex.describeIndexStats.mockResolvedValue(mockStats);

    addDescribeIndexStatsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('describe-index-stats');
    const result = await tool!.handler({name: 'test-index'});

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({...mockStats, indexFullness: undefined}, null, 2),
        },
      ],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex.describeIndexStats.mockRejectedValue(new Error('API error'));

    addDescribeIndexStatsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('describe-index-stats');
    const result = await tool!.handler({name: 'test-index'});

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });
});
