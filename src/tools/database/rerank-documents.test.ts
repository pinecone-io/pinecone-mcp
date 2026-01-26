import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addRerankDocumentsTool} from './rerank-documents.js';

describe('rerank-documents tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addRerankDocumentsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rerank-documents',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('reranks string documents successfully', async () => {
    const mockResults = {
      data: [
        {index: 0, score: 0.9, document: 'doc 1'},
        {index: 1, score: 0.7, document: 'doc 2'},
      ],
    };
    mockPc.inference.rerank.mockResolvedValue(mockResults);

    addRerankDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    const result = await tool!.handler({
      model: 'bge-reranker-v2-m3',
      query: 'test query',
      documents: ['doc 1', 'doc 2', 'doc 3'],
      options: {topN: 2},
    });

    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'bge-reranker-v2-m3',
      'test query',
      ['doc 1', 'doc 2', 'doc 3'],
      {topN: 2},
    );
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockResults, null, 2)}],
    });
  });

  it('reranks record documents with rankFields', async () => {
    const mockResults = {data: [{index: 0, score: 0.9}]};
    mockPc.inference.rerank.mockResolvedValue(mockResults);

    addRerankDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    await tool!.handler({
      model: 'cohere-rerank-3.5',
      query: 'test query',
      documents: [{title: 'Doc 1', body: 'Content 1'}],
      options: {topN: 1, rankFields: ['title', 'body']},
    });

    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'cohere-rerank-3.5',
      'test query',
      [{title: 'Doc 1', body: 'Content 1'}],
      {topN: 1, rankFields: ['title', 'body']},
    );
  });

  it('returns error response on API failure', async () => {
    mockPc.inference.rerank.mockRejectedValue(new Error('Rerank failed'));

    addRerankDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    const result = await tool!.handler({
      model: 'bge-reranker-v2-m3',
      query: 'test query',
      documents: ['doc 1'],
      options: {topN: 1},
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Rerank failed'}],
    });
  });
});
