import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addSearchRecordsTool} from './search-records.js';

describe('search-records tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addSearchRecordsTool(mockServer as never, mockPc as never);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'search-records',
      expect.any(String),
      expect.objectContaining({
        name: expect.anything(),
        namespace: expect.anything(),
        query: expect.anything(),
      }),
      expect.any(Function),
    );
  });

  it('returns search results on success', async () => {
    const mockResults = {
      result: {
        hits: [
          {_id: 'rec-1', _score: 0.95, fields: {content: 'Hello'}},
          {_id: 'rec-2', _score: 0.85, fields: {content: 'World'}},
        ],
      },
    };
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue(mockResults);

    addSearchRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('search-records');
    const query = {inputs: {text: 'hello'}, topK: 10};
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query,
    });

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(mockPc._mockIndex.namespace).toHaveBeenCalledWith('test-ns');
    expect(mockPc._mockIndex._mockNamespace.searchRecords).toHaveBeenCalledWith({
      query,
      rerank: undefined,
    });
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockResults, null, 2)}],
    });
  });

  it('passes rerank options when provided', async () => {
    const mockResults = {result: {hits: []}};
    mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue(mockResults);

    addSearchRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('search-records');
    const query = {inputs: {text: 'hello'}, topK: 10};
    const rerank = {
      model: 'bge-reranker-v2-m3',
      topN: 5,
      rankFields: ['content'],
    };
    await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query,
      rerank,
    });

    expect(mockPc._mockIndex._mockNamespace.searchRecords).toHaveBeenCalledWith({
      query,
      rerank,
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.searchRecords.mockRejectedValue(new Error('Search failed'));

    addSearchRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('search-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      query: {inputs: {text: 'hello'}, topK: 10},
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: Search failed'}],
    });
  });
});
