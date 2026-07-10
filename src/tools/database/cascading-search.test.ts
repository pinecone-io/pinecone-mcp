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

  it('respects an explicit topN of 0 instead of falling back to topK', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue({
      result: {hits: [{_id: '1', fields: {content: 'result 1'}, _score: 0.9}]},
    });
    mockPc.inference.rerank.mockResolvedValue({data: []});

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns1'}],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 0, rankFields: ['content']},
    });

    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'bge-reranker-v2-m3',
      'test query',
      expect.any(Array),
      expect.objectContaining({topN: 0}),
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

  it('returns error response when all index searches fail', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockRejectedValue(new Error('Search failed'));

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = (await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns1'}],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    })) as {isError?: boolean; content: Array<{text: string}>};

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Search failed for index "index-1"');
    expect(result.content[0].text).toContain('Search failed');
  });

  it('returns partial results with a warning when only some index searches fail', async () => {
    const mockSearchResults = {
      result: {hits: [{_id: '1', fields: {content: 'result 1'}, _score: 0.9}]},
    };
    const mockRerankResults = {
      data: [{index: 0, score: 0.95, document: {content: 'result 1'}}],
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults)
      .mockRejectedValueOnce(new Error('index is down'));
    mockPc.inference.rerank.mockResolvedValue(mockRerankResults);

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = (await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns1'},
        {name: 'index-2', namespace: 'ns2'},
      ],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    })) as {isError?: boolean; content: Array<{text: string}>};

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Warning: results are partial');
    expect(result.content[0].text).toContain('Search failed for index "index-2"');
    expect(result.content[0].text).toContain(JSON.stringify(mockRerankResults, null, 2));
  });

  it('includes earlier index failures in the error when reranking fails', async () => {
    const mockSearchResults = {
      result: {hits: [{_id: '1', fields: {content: 'result 1'}, _score: 0.9}]},
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults)
      .mockRejectedValueOnce(new Error('index is down'));
    mockPc.inference.rerank.mockRejectedValue(new Error('rerank model unavailable'));

    addCascadingSearchTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = (await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns1'},
        {name: 'index-2', namespace: 'ns2'},
      ],
      query: {inputs: {text: 'test query'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', topN: 5, rankFields: ['content']},
    })) as {isError?: boolean; content: Array<{text: string}>};

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rerank model unavailable');
    expect(result.content[0].text).toContain('Search failed for index "index-2"');
  });
});
