import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addCascadingSearchTool} from './cascading-search.js';

describe('cascading-search tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addCascadingSearchTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'cascading-search',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('searches across multiple indexes and reranks results', async () => {
    const mockSearchResults1 = {
      result: {
        hits: [
          {_id: '1', fields: {content: 'result 1'}, _score: 0.9},
          {_id: '2', fields: {content: 'result 2'}, _score: 0.8},
        ],
      },
    };
    const mockSearchResults2 = {
      result: {
        hits: [{_id: '3', fields: {content: 'result 3'}, _score: 0.85}],
      },
    };
    const mockRerankResults = {
      data: [
        {index: 0, score: 0.95, document: {content: 'result 1'}},
        {index: 2, score: 0.88, document: {content: 'result 3'}},
      ],
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults1)
      .mockResolvedValueOnce(mockSearchResults2);
    mockPc.inference.rerank.mockResolvedValue(mockRerankResults);

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns1'},
        {name: 'index-2', namespace: 'ns2'},
      ],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {
        model: 'bge-reranker-v2-m3',
        topN: 5,
        rankFields: ['content'],
      },
    });

    expect(mockPc.inference.rerank).toHaveBeenCalled();
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockRerankResults, null, 2),
        },
      ],
    });
  });

  it('deduplicates results by _id', async () => {
    const mockSearchResults1 = {
      result: {hits: [{_id: 'shared', fields: {content: 'shared content'}, _score: 0.9}]},
    };
    const mockSearchResults2 = {
      result: {hits: [{_id: 'shared', fields: {content: 'shared content different'}, _score: 0.8}]},
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults1)
      .mockResolvedValueOnce(mockSearchResults2);
    mockPc.inference.rerank.mockResolvedValue({data: []});

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns1'},
        {name: 'index-2', namespace: 'ns2'},
      ],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    });

    // Should only pass one document to rerank (deduplicated)
    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'bge-reranker-v2-m3',
      'test query',
      [{content: 'shared content'}], // First occurrence is kept
      expect.any(Object),
    );
  });

  it('handles empty results without calling rerank', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue({result: {hits: []}});

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns1'}],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    });

    expect(mockPc.inference.rerank).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [{type: 'text', text: '[]'}],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockRejectedValue(new Error('Search failed'));

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns1'}],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: Search failed'}],
    });
  });
});
