import {describe, it, expect, beforeEach, vi} from 'vitest';
import {z} from 'zod';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addSearchDocumentsTool, SCHEMA} from './search-documents.js';

describe('search-documents tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addSearchDocumentsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'search-documents',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('returns matches on success', async () => {
    const matches = [{_id: '1', _score: 0.42, chunk_text: 'Refund requests...'}];
    mockPc._mockIndex.documents.search.mockResolvedValue({matches, namespace: '__default__'});
    const scoreBy = [{type: 'embed', fields: ['chunk_text'], query: 'money back'}];

    addSearchDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-documents');
    const result = await tool!.handler({
      name: 'docs',
      namespace: '__default__',
      scoreBy,
      topK: 3,
      includeFields: ['chunk_text'],
    });

    expect(mockPc.index).toHaveBeenCalledWith({name: 'docs', namespace: '__default__'});
    expect(mockPc._mockIndex.documents.search).toHaveBeenCalledWith({
      scoreBy,
      topK: 3,
      includeFields: ['chunk_text'],
    });
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(matches, null, 2)}],
    });
  });

  it('passes a filter when provided', async () => {
    mockPc._mockIndex.documents.search.mockResolvedValue({matches: []});
    const filter = {category: {$eq: 'policy'}};

    addSearchDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-documents');
    await tool!.handler({
      name: 'docs',
      namespace: '__default__',
      scoreBy: [{type: 'text', fields: ['chunk_text'], query: 'E1042'}],
      topK: 10,
      includeFields: ['*'],
      filter,
    });

    expect(mockPc._mockIndex.documents.search).toHaveBeenCalledWith(
      expect.objectContaining({filter}),
    );
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex.documents.search.mockRejectedValue(new Error('API error'));

    addSearchDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-documents');
    const result = await tool!.handler({
      name: 'docs',
      namespace: '__default__',
      scoreBy: [{type: 'text', fields: ['chunk_text'], query: 'x'}],
      topK: 10,
      includeFields: ['*'],
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'API error'}],
    });
  });

  it('applies defaults and rejects unsupported scoring types', () => {
    const schema = z.object(SCHEMA);
    const parsed = schema.parse({
      name: 'docs',
      scoreBy: [{type: 'embed', fields: ['chunk_text'], query: 'q'}],
    });
    expect(parsed.namespace).toBe('__default__');
    expect(parsed.topK).toBe(10);
    expect(parsed.includeFields).toEqual(['*']);
    expect(
      schema.safeParse({
        name: 'docs',
        scoreBy: [{type: 'dense_vector', fields: ['v'], query: 'q'}],
      }).success,
    ).toBe(false);
  });
});
