import {describe, it, expect, beforeEach, vi} from 'vitest';
import {z} from 'zod';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addCreateDocumentIndexTool, SCHEMA} from './create-document-index.js';

describe('create-document-index tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name and schema', () => {
    addCreateDocumentIndexTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'create-document-index',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({
          name: expect.any(Object),
          fields: expect.any(Object),
          cloud: expect.any(Object),
          region: expect.any(Object),
        }),
      }),
      expect.any(Function),
    );
  });

  it('creates a document index with string fields', async () => {
    const mockIndexInfo = {name: 'docs', host: 'docs.pinecone.io'};
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.indexes.create.mockResolvedValue(mockIndexInfo);

    addCreateDocumentIndexTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-document-index');
    const result = await tool!.handler({
      name: 'docs',
      fields: {chunk_text: {fullTextSearch: {language: 'en'}, embed: {}}},
      cloud: 'aws',
      region: 'us-east-1',
    });

    expect(mockPc.indexes.create).toHaveBeenCalledWith({
      name: 'docs',
      schema: {
        fields: {
          chunk_text: {type: 'string', fullTextSearch: {language: 'en'}, embed: {}},
        },
      },
      deployment: {deploymentType: 'managed', cloud: 'aws', region: 'us-east-1'},
      tags: {source: 'mcp'},
      waitUntilReady: true,
    });
    expect(result).toEqual({
      content: [{type: 'text', text: JSON.stringify(mockIndexInfo, null, 2)}],
    });
  });

  it('returns message when index already exists', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: [{name: 'docs'}]});

    addCreateDocumentIndexTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-document-index');
    const result = (await tool!.handler({
      name: 'docs',
      fields: {chunk_text: {embed: {}}},
      cloud: 'aws',
      region: 'us-east-1',
    })) as {content: Array<{text: string}>};

    expect(mockPc.indexes.create).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('already exists');
  });

  it('returns error response on API failure', async () => {
    mockPc.listIndexes.mockResolvedValue({indexes: []});
    mockPc.indexes.create.mockRejectedValue(new Error('API error'));

    addCreateDocumentIndexTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('create-document-index');
    const result = await tool!.handler({
      name: 'docs',
      fields: {chunk_text: {embed: {}}},
      cloud: 'aws',
      region: 'us-east-1',
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'API error'}],
    });
  });

  it('rejects a field with no searchable aspect', () => {
    const schema = z.object(SCHEMA);
    expect(schema.safeParse({name: 'docs', fields: {chunk_text: {}}}).success).toBe(false);
    expect(schema.safeParse({name: 'docs', fields: {chunk_text: {embed: {}}}}).success).toBe(true);
  });

  it('defaults cloud and region', () => {
    const parsed = z.object(SCHEMA).parse({name: 'docs', fields: {chunk_text: {embed: {}}}});
    expect(parsed.cloud).toBe('aws');
    expect(parsed.region).toBe('us-east-1');
  });
});
