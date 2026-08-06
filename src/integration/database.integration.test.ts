import {afterAll, describe, expect, it} from 'vitest';
import {Pinecone} from '@pinecone-database/pinecone';
import {createMockServer} from '../test-utils/mock-server.js';
import {addCreateIndexForModelTool} from '../tools/database/create-index-for-model.js';
import {addDescribeIndexStatsTool} from '../tools/database/describe-index-stats.js';
import {addListIndexesTool} from '../tools/database/list-indexes.js';
import {addSearchRecordsTool} from '../tools/database/search-records.js';
import {addUpsertRecordsTool} from '../tools/database/upsert-records.js';

// Live integration test. Exercises the real MCP tool handlers against a real
// Pinecone project: create-index → upsert → search on a throwaway integrated
// index, then delete it. This is the smoke test the mocked unit suite cannot
// give us — it proves the Pinecone SDK actually accepts the calls the handlers
// make (e.g. the v6→v8 signature changes).
//
// Skipped unless PINECONE_API_KEY is set, so normal CI (no key) is unaffected.
// Run locally or in the dedicated integration workflow: `npm run test:integration`.
const apiKey = process.env.PINECONE_API_KEY;

// Unique, DNS-safe index name (lowercase alphanumerics + hyphens, <=45 chars).
const INDEX_NAME = `mcp-it-${Math.floor(Date.now() / 1000).toString(36)}`;
const NAMESPACE = 'integration';
const TEXT_FIELD = 'chunk_text';

const CREATE_TIMEOUT_MS = 300_000;
const SEARCH_TIMEOUT_MS = 120_000;

type ToolResult = {content: Array<{type: string; text: string}>; isError?: boolean};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.skipIf(!apiKey)('database tools — live Pinecone integration', () => {
  const server = createMockServer();
  addCreateIndexForModelTool(server as never);
  addUpsertRecordsTool(server as never);
  addSearchRecordsTool(server as never);
  addDescribeIndexStatsTool(server as never);
  addListIndexesTool(server as never);

  const call = async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
    const tool = server.getRegisteredTool(name);
    if (!tool) throw new Error(`tool ${name} not registered`);
    const result = (await tool.handler(args)) as ToolResult;
    if (result.isError) {
      throw new Error(`tool ${name} failed: ${result.content.map((c) => c.text).join('\n')}`);
    }
    return result;
  };

  afterAll(async () => {
    if (!apiKey) return;
    // Best-effort cleanup so a failed assertion never leaks a paid index.
    try {
      await new Pinecone({apiKey}).deleteIndex(INDEX_NAME);
    } catch {
      // Index may not have been created; ignore.
    }
  }, 60_000);

  it(
    'creates an integrated index, upserts, and searches records',
    async () => {
      // 1. Create — handler blocks until the index is ready (waitUntilReady).
      await call('create-index-for-model', {
        name: INDEX_NAME,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {model: 'multilingual-e5-large', fieldMap: {text: TEXT_FIELD}},
      });

      // 2. Upsert a handful of records with distinct content.
      const records = [
        {_id: 'rec1', [TEXT_FIELD]: 'The Eiffel Tower is located in Paris, France.'},
        {
          _id: 'rec2',
          [TEXT_FIELD]: 'Photosynthesis converts sunlight into chemical energy in plants.',
        },
        {_id: 'rec3', [TEXT_FIELD]: 'The mitochondrion is the powerhouse of the cell.'},
      ];
      await call('upsert-records', {name: INDEX_NAME, namespace: NAMESPACE, records});

      // 3. Wait for the records to become searchable (indexing is async).
      const deadline = Date.now() + SEARCH_TIMEOUT_MS;
      let hits: Array<{_id: string}> = [];
      while (Date.now() < deadline) {
        const res = await call('search-records', {
          name: INDEX_NAME,
          namespace: NAMESPACE,
          query: {topK: 3, inputs: {text: 'What landmark is in Paris?'}},
        });
        const parsed = JSON.parse(res.content[0].text);
        hits = parsed?.result?.hits ?? [];
        if (hits.length > 0) break;
        await sleep(3_000);
      }

      // 4. The most relevant hit should be the Paris record.
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]._id).toBe('rec1');
    },
    CREATE_TIMEOUT_MS,
  );
});
