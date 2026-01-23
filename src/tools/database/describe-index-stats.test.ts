import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addDescribeIndexStatsTool} from './describe-index-stats.js';

describe('describe-index-stats tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addDescribeIndexStatsTool(mockServer as never, mockPc as never);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'describe-index-stats',
      expect.any(String),
      expect.objectContaining({name: expect.anything()}),
      expect.any(Function),
    );
  });

  it('returns index stats on success', async () => {
    const mockStats = {
      namespaces: {
        '': {recordCount: 100},
        'namespace-1': {recordCount: 50},
      },
      dimension: 1536,
      indexFullness: 0.5,
      totalRecordCount: 150,
    };
    mockPc._mockIndex.describeIndexStats.mockResolvedValue(mockStats);

    addDescribeIndexStatsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('describe-index-stats');
    const result = await tool!.handler({name: 'test-index'});

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(mockPc._mockIndex.describeIndexStats).toHaveBeenCalled();

    // indexFullness should be excluded from the response
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

    addDescribeIndexStatsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('describe-index-stats');
    const result = await tool!.handler({name: 'test-index'});

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });
});
