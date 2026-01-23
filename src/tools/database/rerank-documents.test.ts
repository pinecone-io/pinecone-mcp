import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addRerankDocumentsTool} from './rerank-documents.js';

describe('rerank-documents tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addRerankDocumentsTool(mockServer as never, mockPc as never);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'rerank-documents',
      expect.any(String),
      expect.objectContaining({
        model: expect.anything(),
        query: expect.anything(),
        documents: expect.anything(),
      }),
      expect.any(Function),
    );
  });

  it('reranks string documents successfully', async () => {
    const mockResults = {
      data: [
        {index: 0, score: 0.95, document: {text: 'Hello world'}},
        {index: 1, score: 0.85, document: {text: 'Hi there'}},
      ],
    };
    mockPc.inference.rerank.mockResolvedValue(mockResults);

    addRerankDocumentsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    const documents = ['Hello world', 'Hi there', 'Goodbye'];
    const result = await tool!.handler({
      model: 'bge-reranker-v2-m3',
      query: 'greeting',
      documents,
      options: {topN: 2},
    });

    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'bge-reranker-v2-m3',
      'greeting',
      documents,
      {topN: 2},
    );
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockResults, null, 2)}],
    });
  });

  it('reranks record documents with rankFields', async () => {
    const mockResults = {data: [{index: 0, score: 0.9}]};
    mockPc.inference.rerank.mockResolvedValue(mockResults);

    addRerankDocumentsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    const documents = [{content: 'Hello world'}, {content: 'Hi there'}];
    await tool!.handler({
      model: 'cohere-rerank-3.5',
      query: 'greeting',
      documents,
      options: {topN: 1, rankFields: ['content']},
    });

    expect(mockPc.inference.rerank).toHaveBeenCalledWith(
      'cohere-rerank-3.5',
      'greeting',
      documents,
      {
        topN: 1,
        rankFields: ['content'],
      },
    );
  });

  it('returns error response on API failure', async () => {
    mockPc.inference.rerank.mockRejectedValue(new Error('Rerank failed'));

    addRerankDocumentsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('rerank-documents');
    const result = await tool!.handler({
      model: 'bge-reranker-v2-m3',
      query: 'test',
      documents: ['doc1', 'doc2'],
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: Rerank failed'}],
    });
  });
});
