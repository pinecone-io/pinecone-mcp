import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {SEARCH_QUERY_SCHEMA} from './common/search-query.js';

const INSTRUCTIONS = `Use this tool to search across multiple indexes/namespaces
for records that are similar to the query text. Results from different indexes
are deduplicated based on their "_id" field, and then reranked using a
specialized reranking model. Only use this tool if the indexes contain data with
similar schemas.

The main use case for this tool is hybrid search, where you have a dense and a
sparse index each containing the same data. You can use this tool to search
across both indexes, combining the benefits of semantic and keyword search.

Make sure to use a query that accurately represents my request, and is not too
specific or too broad. You may also use the optional "query.filter" parameter:
- Metadata filtering can be used to narrow down results, but is not always
required. Use your discretion. Metadata filtering should only be used if I need
a specific value or range of values. To use a filter, provide the "query.filter"
parameter. Be sure to craft your filter carefully, because overly specific or
inaccurate metadata filters will yield poor results. Make sure that the fields
you filter on are present in the records, and that they contain the expected
values and data types.

If your search does not return the expected results, try the following:
- Use the "describe-index-stats" tool to verify that the indexes and namespaces
are present, and that the namespaces are not empty.
- An inaccurate metadata filter may be the cause of the lack of results. Try the
query without the "query.filter" parameter, and check that the filter makes
sense for the schema of the record data.
- Make sure that "rerank.rankFields" includes the field specified in the index's
"fieldMap". Use the "describe-index" tool and check the value of
"embed.fieldMap.text".`;

const INDEX_SCHEMA = z.object({
  name: z.string().describe('The name of an index to search.'),
  namespace: z
    .string()
    .describe('The namespace to search. This must be a valid namespace for the index.'),
});

const RERANK_SCHEMA = z
  .object({
    model: RERANK_MODEL_SCHEMA,
    topN: z
      .number()
      .optional()
      .describe(
        `The number of top results to return after reranking. This should be
        less than or equal to the value of "query.topK". Defaults to the value
        of "query.topK".`,
      ),
    rankFields: z.array(z.string().describe('The name of a field to rerank on.')).describe(
      `The fields to rerank on. Generally, this should include the field name
      specified in the index's "fieldMap". The "bge-reranker-v2-m3" and
      "pinecone-rerank-v0" models support only a single rerank field.
      "cohere-rerank-3.5" supports multiple rerank fields, ranked based on the
      order of the fields specified.`,
    ),
    query: z
      .string()
      .optional()
      .describe(
        `The query to rerank documents against. If a specific rerank query is
        specified, it overrides the query input that was provided at the top
        level. Otherwise, the same query will be used for both the initial
        search and the reranking.`,
      ),
  })
  .describe('Specifies how the results should be reranked.');

export const SCHEMA = {
  indexes: z
    .array(INDEX_SCHEMA)
    .describe(
      'The indexes/namespaces to search across. Records in the namespaces should share a common schema.',
    ),
  query: SEARCH_QUERY_SCHEMA,
  rerank: RERANK_SCHEMA,
};

export function addCascadingSearchTool(server: McpServer, pc: Pinecone) {
  server.tool('cascading-search', INSTRUCTIONS, SCHEMA, async ({indexes, query, rerank}) => {
    const initialResults = await Promise.all(
      indexes.map(async (index) => {
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
  });
}
