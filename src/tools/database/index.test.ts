import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the Pinecone client
vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    listIndexes: vi.fn(),
    describeIndex: vi.fn(),
    createIndexForModel: vi.fn(),
    index: vi.fn(() => ({
      describeIndexStats: vi.fn(),
      namespace: vi.fn(() => ({
        searchRecords: vi.fn(),
        upsertRecords: vi.fn(),
      })),
    })),
    inference: {rerank: vi.fn()},
  })),
}));

describe('addDatabaseTools', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    vi.resetModules();
    mockServer = createMockServer();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers all database tools when API key is set', async () => {
    vi.stubEnv('PINECONE_API_KEY', 'test-api-key');

    const {default: addDatabaseTools} = await import('./index.js');
    addDatabaseTools(mockServer as never);

    const registeredTools = mockServer.getRegisteredToolNames();
    expect(registeredTools).toContain('list-indexes');
    expect(registeredTools).toContain('describe-index');
    expect(registeredTools).toContain('describe-index-stats');
    expect(registeredTools).toContain('create-index-for-model');
    expect(registeredTools).toContain('upsert-records');
    expect(registeredTools).toContain('search-records');
    expect(registeredTools).toContain('rerank-documents');
    expect(registeredTools).toContain('cascading-search');
    expect(registeredTools.length).toBe(8);
  });

  it('skips registration when API key is not set', async () => {
    vi.stubEnv('PINECONE_API_KEY', '');

    const {default: addDatabaseTools} = await import('./index.js');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    addDatabaseTools(mockServer as never);

    expect(mockServer.getRegisteredToolNames().length).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PINECONE_API_KEY'));

    consoleSpy.mockRestore();
  });

  it('creates Pinecone client with correct source tag', async () => {
    vi.stubEnv('PINECONE_API_KEY', 'test-api-key');

    const {Pinecone} = await import('@pinecone-database/pinecone');
    const {default: addDatabaseTools} = await import('./index.js');

    addDatabaseTools(mockServer as never);

    expect(Pinecone).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      sourceTag: expect.stringMatching(/^pinecone-mcp@/),
    });
  });
});
