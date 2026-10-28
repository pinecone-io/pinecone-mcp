import {afterAll, describe, expect, it} from 'vitest';
import {Pinecone} from '@pinecone-database/pinecone';
import {createMockServer} from '../test-utils/mock-server.js';
import {addCreateDocumentIndexTool} from '../tools/database/create-document-index.js';
import {addCreateIndexForModelTool} from '../tools/database/create-index-for-model.js';
import {addDescribeIndexStatsTool} from '../tools/database/describe-index-stats.js';
import {addListIndexesTool} from '../tools/database/list-indexes.js';
import {addSearchDocumentIndexTool} from '../tools/database/search-document-index.js';
import {addSearchRecordsTool} from '../tools/database/search-records.js';
import {addUpsertDocumentsTool} from '../tools/database/upsert-documents.js';
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
const DOC_INDEX_NAME = `${INDEX_NAME}-doc`;
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
  addCreateDocumentIndexTool(server as never);
  addUpsertDocumentsTool(server as never);
  addSearchDocumentIndexTool(server as never);

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
    for (const name of [INDEX_NAME, DOC_INDEX_NAME]) {
      try {
        await new Pinecone({apiKey}).deleteIndex(name);
      } catch {
        // Index may not have been created; ignore.
      }
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

  it(
    'creates a document index, upserts, and searches by meaning and by exact terms',
    async () => {
      await call('create-document-index', {
        name: DOC_INDEX_NAME,
        fields: {[TEXT_FIELD]: {fullTextSearch: {language: 'en'}, embed: {}}},
        cloud: 'aws',
        region: 'us-east-1',
      });

      const documents = [
        {
          _id: 'doc1',
          [TEXT_FIELD]: 'Refund requests must be submitted within 30 days of purchase.',
        },
        {
          _id: 'doc2',
          [TEXT_FIELD]: 'Error E1042: the connection timed out after 30 seconds.',
        },
        {_id: 'doc3', [TEXT_FIELD]: 'To reset your password, open Settings and choose Security.'},
      ];
      await call('upsert-documents', {name: DOC_INDEX_NAME, namespace: NAMESPACE, documents});

      const search = async (type: string, query: string) => {
        const res = await call('search-document-index', {
          name: DOC_INDEX_NAME,
          namespace: NAMESPACE,
          scoreBy: [{type, fields: [TEXT_FIELD], query}],
          topK: 3,
          includeFields: [TEXT_FIELD],
        });
        return JSON.parse(res.content[0].text) as Array<{_id: string}>;
      };

      const deadline = Date.now() + SEARCH_TIMEOUT_MS;
      let meaning: Array<{_id: string}> = [];
      while (Date.now() < deadline) {
        meaning = await search('embed', 'how do I get my money back?');
        if (meaning.length > 0) break;
        await sleep(3_000);
      }

      expect(meaning[0]?._id).toBe('doc1');
      const terms = await search('text', 'E1042');
      expect(terms.map((m) => m._id)).toEqual(['doc2']);
    },
    CREATE_TIMEOUT_MS,
  );
});
