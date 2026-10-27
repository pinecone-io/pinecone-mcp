import {describe, it, expect, beforeEach, vi} from 'vitest';
import {z} from 'zod';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addUpsertDocumentsTool, SCHEMA} from './upsert-documents.js';

describe('upsert-documents tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addUpsertDocumentsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'upsert-documents',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('upserts documents into the named namespace', async () => {
    mockPc._mockIndex.documents.upsert.mockResolvedValue({upsertedCount: 2});
    const documents = [
      {_id: '1', chunk_text: 'first', category: 'a'},
      {_id: '2', chunk_text: 'second', category: 'b'},
    ];

    addUpsertDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-documents');
    const result = (await tool!.handler({
      name: 'docs',
      namespace: 'ns',
      documents,
    })) as {content: Array<{text: string}>};

    expect(mockPc.index).toHaveBeenCalledWith({name: 'docs', namespace: 'ns'});
    expect(mockPc._mockIndex.documents.upsert).toHaveBeenCalledWith({documents});
    expect(result.content[0].text).toContain('Upserted 2 document(s)');
  });

  it('sends more than 96 documents in batches of 96', async () => {
    mockPc._mockIndex.documents.upsert.mockImplementation(
      async ({documents}: {documents: unknown[]}) => ({upsertedCount: documents.length}),
    );
    const documents = Array.from({length: 200}, (_, i) => ({_id: `${i}`, chunk_text: `doc ${i}`}));

    addUpsertDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-documents');
    const result = (await tool!.handler({
      name: 'docs',
      namespace: '__default__',
      documents,
    })) as {content: Array<{text: string}>};

    const batchSizes = mockPc._mockIndex.documents.upsert.mock.calls.map(
      (call) => (call[0] as {documents: unknown[]}).documents.length,
    );
    expect(batchSizes).toEqual([96, 96, 8]);
    expect(result.content[0].text).toContain('Upserted 200 document(s)');
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex.documents.upsert.mockRejectedValue(new Error('API error'));

    addUpsertDocumentsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-documents');
    const result = await tool!.handler({
      name: 'docs',
      namespace: '__default__',
      documents: [{_id: '1', chunk_text: 'first'}],
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'API error'}],
    });
  });

  it('requires an _id on every document and defaults the namespace', () => {
    const schema = z.object(SCHEMA);
    expect(schema.safeParse({name: 'docs', documents: [{chunk_text: 'no id'}]}).success).toBe(
      false,
    );
    const parsed = schema.parse({name: 'docs', documents: [{_id: '1', chunk_text: 'ok'}]});
    expect(parsed.namespace).toBe('__default__');
  });
});
