import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {registerDatabaseTool} from './common/register-tool.js';
import {SEARCH_QUERY_SCHEMA} from './common/search-query.js';

type RerankModelType = 'bge-reranker-v2-m3' | 'pinecone-rerank-v0' | 'cohere-rerank-3.5';
type SearchQuery = {
  inputs: {text: string};
  topK: number;
  filter?: Record<string, unknown>;
};
type SearchRerank = {
  model: RerankModelType;
  topN?: number;
  rankFields: string[];
  query?: string;
};

const INSTRUCTIONS = 'Search an index for records that are similar to the query text';

const RERANK_SCHEMA = z
  .object({
    model: RERANK_MODEL_SCHEMA,
    topN: z
      .number()
      .optional()
      .describe(
        `The number of results to return after reranking. Must be less than or
        equal to the value of "query.topK".`,
      ),
    rankFields: z.array(z.string()).describe(
      `The fields to rerank on. This should include the field name specified
      in the index's "fieldMap". The "bge-reranker-v2-m3" and
      "pinecone-rerank-v0" models support only a single rerank field.
      "cohere-rerank-3.5" supports multiple rerank fields.`,
    ),
    query: z
      .string()
      .optional()
      .describe(
        `An optional query to rerank documents against. If not specified, the
        same query will be used for both the initial search and the reranking.`,
      ),
  })
  .optional()
  .describe(
    `Reranking can help determine which of the returned records are most
    relevant. When reranking, use a "query" with a "topK" that returns more
    results than you need; then use "rerank" to select the most relevant
    "topN" results.`,
  );

const SCHEMA = {
  name: z.string().describe('The index to search.'),
  namespace: z.string().describe('The namespace to search.'),
  query: SEARCH_QUERY_SCHEMA,
  rerank: RERANK_SCHEMA,
  selectedMetadataKeys: z
    .array(z.string())
    .optional()
    .describe(
      'Optional: List of metadata keys to return. If omitted, all metadata is returned (Potential PII risk).',
    ),
};

type SearchArgs = {
  name: string;
  namespace: string;
  query: SearchQuery;
  rerank?: SearchRerank;
  selectedMetadataKeys?: string[];
};
type SearchRecord = {
  metadata?: Record<string, unknown>;
} & Record<string, unknown>;
type SearchResults = {
  records?: SearchRecord[];
  matches?: SearchRecord[];
} & Record<string, unknown>;

export function addSearchRecordsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'search-records',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async (args, pc) => {
      const {name, namespace, query, rerank, selectedMetadataKeys} = args as SearchArgs;
      try {
        const ns = pc.index(name).namespace(namespace);
        const results = (await ns.searchRecords({query, rerank})) as SearchResults;

        // --- SECURITY PATCH: Metadata Filtering
        if (selectedMetadataKeys) {
          const filterRecordMetadata = (recordArray: SearchRecord[]) =>
            recordArray.map((record) => {
              if (!record.metadata) return record;
              const filteredMetadata: Record<string, unknown> = {};
              selectedMetadataKeys.forEach((key) => {
                if (record.metadata[key] !== undefined)
                  filteredMetadata[key] = record.metadata[key];
              });
              return {...record, metadata: filteredMetadata};
            });

          if (Array.isArray(results.records)) {
            results.records = filterRecordMetadata(results.records);
          }
          if (Array.isArray(results.matches)) {
            results.matches = filterRecordMetadata(results.matches);
          }
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
