import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {SEARCH_QUERY_SCHEMA} from './common/search-query.js';

const INSTRUCTIONS = `Search across multiple indexes for records that are
similar to the query text, deduplicate and rerank the results.`;

const INDEX_SCHEMA = z.object({
  name: z.string().describe('An index to search.'),
  namespace: z.string().describe('A namespace to search.'),
});

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
  .describe(
    `Specifies how the results should be reranked. Use a "query" with a "topK"
    that returns more results than you need; then use "rerank" to select the
    most relevant "topN" results.`,
  );

export const SCHEMA = {
  indexes: z
    .array(INDEX_SCHEMA)
    .describe('The indexes to search across. Records in each index should share a common schema.'),
  query: SEARCH_QUERY_SCHEMA,
  rerank: RERANK_SCHEMA,
};

export function addCascadingSearchTool(server: McpServer, pc: Pinecone) {
  server.registerTool(
    'cascading-search',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async ({indexes, query, rerank}) => {
      try {
        const initialResults = await Promise.all(
          indexes.map(async (index: {name: string; namespace: string}) => {
            const ns = pc.index(index.name).namespace(index.namespace || '');
            const results = await ns.searchRecords({query});
            return results;
          }),
        );

        const deduplicatedResults: Record<string, Record<string, string>> = {};
        for (const results of initialResults) {
          for (const hit of results.result.hits) {
            if (!deduplicatedResults[hit._id]) {
              deduplicatedResults[hit._id] = hit.fields as Record<string, string>;
            }
          }
        }
        const deduplicatedResultsArray = Object.values(deduplicatedResults);

        const rerankedResults =
          deduplicatedResultsArray.length > 0
            ? await pc.inference.rerank(
                rerank.model,
                rerank.query || query.inputs.text,
                deduplicatedResultsArray,
                {
                  topN: rerank.topN || query.topK,
                  rankFields: rerank.rankFields,
                },
              )
            : [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rerankedResults, null, 2),
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text', text: String(e)}]};
      }
    },
  );
}
