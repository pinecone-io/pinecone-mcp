import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addSearchRecordsTool} from './search-records.js';

describe('search-records tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addSearchRecordsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'search-records',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('returns search results on success', async () => {
    const mockResults = {
      result: {
        hits: [
          {_id: '1', fields: {content: 'result 1'}, _score: 0.9},
          {_id: '2', fields: {content: 'result 2'}, _score: 0.8},
        ],
      },
    };
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue(mockResults);

    addSearchRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query: {inputs: {text: 'test query'}, topK: 10},
    });

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(mockPc._mockIndex.namespace).toHaveBeenCalledWith('test-ns');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResults, null, 2),
        },
      ],
    });
  });

  it('passes rerank options when provided', async () => {
    const mockResults = {result: {hits: []}};
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue(mockResults);

    addSearchRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-records');
    await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {
        model: 'bge-reranker-v2-m3',
        topN: 5,
        rankFields: ['content'],
      },
    });

    expect(mockPc._mockIndex._mockNamespace.searchRecords).toHaveBeenCalledWith({
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {
        model: 'bge-reranker-v2-m3',
        topN: 5,
        rankFields: ['content'],
      },
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockRejectedValue(new Error('Search failed'));

    addSearchRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query: {inputs: {text: 'test query'}, topK: 10},
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Search failed'}],
    });
  });
});
