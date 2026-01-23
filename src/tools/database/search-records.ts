import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {SEARCH_QUERY_SCHEMA} from './common/search-query.js';

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
};

export function addSearchRecordsTool(server: McpServer, pc: Pinecone) {
  server.registerTool(
    'search-records',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async ({name, namespace, query, rerank}) => {
      try {
        const ns = pc.index(name).namespace(namespace);
        const results = await ns.searchRecords({query, rerank});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text', text: String(e)}]};
      }
    },
  );
}
