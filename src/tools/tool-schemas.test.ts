import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';

// Claude (and other clients) reject tool input schemas that contain JSON Schema
// composition keywords, so no registered tool may emit them. This guard boots
// the real server and inspects the schemas exactly as a client receives them
// via `tools/list`, so it covers every current and future tool automatically
// -- no per-tool assertion required. See #89 and #93 for the tools that
// originally tripped this.
const COMPOSITION_KEYWORDS = ['anyOf', 'oneOf', 'allOf'];

function findSchemaCompositionKeywords(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const keywords: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (COMPOSITION_KEYWORDS.includes(key)) {
      keywords.push(key);
    }
    keywords.push(...findSchemaCompositionKeywords(nested));
  }
  return keywords;
}

describe('registered tool schemas', () => {
  beforeEach(() => {
    vi.resetModules();
    // Database tools only register when an API key is present.
    vi.stubEnv('PINECONE_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('do not emit JSON Schema composition keywords rejected by Claude tools', async () => {
    const {default: setupServer} = await import('../server.js');
    const server = await setupServer();

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({name: 'schema-guard', version: '0.0.0'});
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const {tools} = await client.listTools();

      // Sanity check: fail loudly if tool discovery is broken, so a green run
      // can't mean "no tools were checked".
      expect(tools.length).toBeGreaterThan(0);

      const offenders = tools
        .map((tool) => ({
          name: tool.name,
          keywords: findSchemaCompositionKeywords(tool.inputSchema),
        }))
        .filter((entry) => entry.keywords.length > 0);

      expect(offenders).toEqual([]);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
