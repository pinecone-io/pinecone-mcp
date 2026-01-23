import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addCascadingSearchTool} from './cascading-search.js';

describe('cascading-search tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addCascadingSearchTool(mockServer as never, mockPc as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'cascading-search',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({
          indexes: expect.anything(),
          query: expect.anything(),
          rerank: expect.anything(),
        }),
      }),
      expect.any(Function),
    );
  });

  it('searches across multiple indexes and reranks results', async () => {
    const mockSearchResults1 = {
      result: {
        hits: [
          {_id: 'rec-1', fields: {content: 'Hello from index 1'}},
          {_id: 'rec-2', fields: {content: 'World from index 1'}},
        ],
      },
    };
    const mockSearchResults2 = {
      result: {
        hits: [{_id: 'rec-3', fields: {content: 'Hi from index 2'}}],
      },
    };
    const mockRerankedResults = {
      data: [{index: 0, score: 0.95, document: {content: 'Hello from index 1'}}],
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults1)
      .mockResolvedValueOnce(mockSearchResults2);
    mockPc.inference.rerank.mockResolvedValue(mockRerankedResults);

    addCascadingSearchTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns-1'},
        {name: 'index-2', namespace: 'ns-2'},
      ],
      query: {inputs: {text: 'hello'}, topK: 10},
      rerank: {
        model: 'bge-reranker-v2-m3',
        topN: 5,
        rankFields: ['content'],
      },
    });

    expect(mockPc._mockIndex._mockNamespace.searchRecords).toHaveBeenCalledTimes(2);
    expect(mockPc.inference.rerank).toHaveBeenCalled();
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockRerankedResults, null, 2)}],
    });
  });

  it('deduplicates results by _id', async () => {
    const mockSearchResults1 = {
      result: {
        hits: [{_id: 'rec-1', fields: {content: 'Hello'}}],
      },
    };
    const mockSearchResults2 = {
      result: {
        hits: [{_id: 'rec-1', fields: {content: 'Hello duplicate'}}],
      },
    };

    mockPc._mockIndex._mockNamespace.searchRecords
      .mockResolvedValueOnce(mockSearchResults1)
      .mockResolvedValueOnce(mockSearchResults2);
    mockPc.inference.rerank.mockResolvedValue({data: []});

    addCascadingSearchTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    await tool!.handler({
      indexes: [
        {name: 'index-1', namespace: 'ns-1'},
        {name: 'index-2', namespace: 'ns-2'},
      ],
      query: {inputs: {text: 'hello'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', rankFields: ['content']},
    });

    // Should only have one document (deduplicated)
    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'bge-reranker-v2-m3',
      'hello',
      [{content: 'Hello'}], // Only the first occurrence
      expect.any(Object),
    );
  });

  it('handles empty results without calling rerank', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue({
      result: {hits: []},
    });

    addCascadingSearchTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns-1'}],
      query: {inputs: {text: 'hello'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', rankFields: ['content']},
    });

    expect(mockPc.inference.rerank).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify([], null, 2)}],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockRejectedValue(new Error('Search failed'));

    addCascadingSearchTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('cascading-search');
    const result = await tool!.handler({
      indexes: [{name: 'index-1', namespace: 'ns-1'}],
      query: {inputs: {text: 'hello'}, topK: 10},
      rerank: {model: 'bge-reranker-v2-m3', rankFields: ['content']},
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: Search failed'}],
    });
  });
});
