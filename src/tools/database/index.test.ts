import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
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

  it('tools include llm_provider and llm_model in their schemas', async () => {
    vi.stubEnv('PINECONE_API_KEY', 'test-api-key');

    const {default: addDatabaseTools} = await import('./index.js');
    addDatabaseTools(mockServer as never);

    // Check that all tools have the LLM caller schema fields
    const registeredTools = mockServer.getRegisteredToolNames();
    for (const toolName of registeredTools) {
      const tool = mockServer.getRegisteredTool(toolName);
      expect(tool?.schema).toHaveProperty('llm_provider');
      expect(tool?.schema).toHaveProperty('llm_model');
    }
  });
});
