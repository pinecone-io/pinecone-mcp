import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {FRESHNESS_NOTE} from './common/messages.js';
import {RERANK_OPTIONS_SCHEMA} from './common/rerank-options.js';
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

const INSTRUCTIONS = `Search an index for records that are semantically similar
to the query text. Only works with integrated-inference indexes (e.g. created
with create-index-for-model), which embed the query automatically; it fails on
standard indexes — use describe-index to check the index type. Returns hits
with "_id", "_score", and the record's stored "fields". ${FRESHNESS_NOTE}`;

const RERANK_SCHEMA = RERANK_OPTIONS_SCHEMA.optional().describe(
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
};

type SearchArgs = {
  name: string;
  namespace: string;
  query: SearchQuery;
  rerank?: SearchRerank;
};

export function addSearchRecordsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'search-records',
    {
      title: 'Search Records',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: true},
    },
    async (args, pc) => {
      const {name, namespace, query, rerank} = args as SearchArgs;
      const ns = pc.index(name).namespace(namespace);
      const results = await ns.searchRecords({query, rerank});
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );
}
