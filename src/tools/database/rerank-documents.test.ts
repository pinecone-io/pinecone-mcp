import {describe, it, expect, beforeEach, vi} from 'vitest';
import {z} from 'zod';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {DOCUMENTS_SCHEMA, SCHEMA} from './rerank-documents.js';

function findSchemaCompositionKeywords(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const keywords: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'anyOf' || key === 'oneOf' || key === 'allOf') {
      keywords.push(key);
    }
    keywords.push(...findSchemaCompositionKeywords(nested));
  }
  return keywords;
}

describe('DOCUMENTS_SCHEMA', () => {
  it('accepts an array of text documents', () => {
    expect(DOCUMENTS_SCHEMA.parse(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('accepts an array of string records', () => {
    const docs = [{title: 'Doc 1', body: 'Content'}];
    expect(DOCUMENTS_SCHEMA.parse(docs)).toEqual(docs);
  });

  it('accepts an empty array', () => {
    expect(DOCUMENTS_SCHEMA.parse([])).toEqual([]);
  });

  it('rejects non-array values', () => {
    expect(DOCUMENTS_SCHEMA.safeParse('not an array').success).toBe(false);
    expect(DOCUMENTS_SCHEMA.safeParse({title: 'Doc'}).success).toBe(false);
  });

  it('rejects arrays that mix strings and records', () => {
    expect(DOCUMENTS_SCHEMA.safeParse(['a', {title: 'Doc'}]).success).toBe(false);
  });

  it('rejects records with non-string values', () => {
    expect(DOCUMENTS_SCHEMA.safeParse([{title: 'Doc', score: 1}]).success).toBe(false);
  });

  it('exports without schema composition keywords rejected by Claude tools', () => {
    const inputSchema = z.object(SCHEMA);

    const jsonSchema = z.toJSONSchema(inputSchema);

    expect(findSchemaCompositionKeywords(jsonSchema)).toEqual([]);
  });
});

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
