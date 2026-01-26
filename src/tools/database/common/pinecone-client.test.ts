import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

// Type for the mocked Pinecone client
interface MockPineconeClient {
  _config: Record<string, unknown>;
}

// Mock the Pinecone client
vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation((config) => ({
    _config: config,
  })),
}));

// Mock constants - we'll control PINECONE_API_KEY via stubEnv
vi.mock('../../../constants.js', () => ({
  get PINECONE_API_KEY() {
    return process.env.PINECONE_API_KEY;
  },
}));

// Mock version
vi.mock('../../../version.js', () => ({
  PINECONE_MCP_VERSION: '0.0.0-test',
}));

describe('pinecone-client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PINECONE_API_KEY', 'test-api-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('getPineconeClient', () => {
    it('throws when PINECONE_API_KEY is not set', async () => {
      vi.stubEnv('PINECONE_API_KEY', '');

      const {getPineconeClient} = await import('./pinecone-client.js');

      expect(() => getPineconeClient()).toThrow('PINECONE_API_KEY environment variable is not set');
    });

    it('returns a Pinecone client when API key is set', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client = getPineconeClient() as unknown as MockPineconeClient;

      expect(client).toBeDefined();
      expect(client._config).toEqual({
        apiKey: 'test-api-key',
        sourceTag: 'pinecone-mcp@0.0.0-test',
      });
    });

    it('returns cached client on subsequent calls with same caller', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client1 = getPineconeClient();
      const client2 = getPineconeClient();

      expect(client1).toBe(client2);
    });

    it('returns cached client when caller has no model', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client1 = getPineconeClient();
      const client2 = getPineconeClient({provider: 'anthropic'});

      expect(client1).toBe(client2);
    });

    it('creates separate clients for different callers with models', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client1 = getPineconeClient({model: 'gpt-4'});
      const client2 = getPineconeClient({model: 'claude-3'});

      expect(client1).not.toBe(client2);
    });

    it('includes caller info in client config when model is provided', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client = getPineconeClient({provider: 'openai', model: 'gpt-4'}) as unknown as MockPineconeClient;

      expect(client._config).toEqual({
        apiKey: 'test-api-key',
        sourceTag: 'pinecone-mcp@0.0.0-test',
        caller: {provider: 'openai', model: 'gpt-4'},
      });
    });

    it('includes caller info without provider when only model is provided', async () => {
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      const client = getPineconeClient({model: 'gpt-4'}) as unknown as MockPineconeClient;

      expect(client._config).toEqual({
        apiKey: 'test-api-key',
        sourceTag: 'pinecone-mcp@0.0.0-test',
        caller: {model: 'gpt-4'},
      });
    });
  });

  describe('clearClientCache', () => {
    it('clears the client cache', async () => {
      const {Pinecone} = await import('@pinecone-database/pinecone');
      const {getPineconeClient, clearClientCache} = await import('./pinecone-client.js');
      clearClientCache();

      getPineconeClient();
      expect(Pinecone).toHaveBeenCalledTimes(1);

      clearClientCache();
      getPineconeClient();
      expect(Pinecone).toHaveBeenCalledTimes(2);
    });
  });
});
