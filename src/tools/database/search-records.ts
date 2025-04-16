import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {SEARCH_QUERY_SCHEMA} from './common/search-query.js';

const INSTRUCTIONS = `Use this tool to search a namespace for records that are
similar to the query text. Make sure to use a query that accurately represents
my request, and is not too specific or too broad. You may also use the optional
"query.filter" or "rerank" parameters:
- Metadata filtering can be used to narrow down results, but is not always
required. Use your discretion. Metadata filtering should only be used if I need
a specific value or range of values. To use a filter, provide the "query.filter"
parameter. Be sure to craft your filter carefully, because overly specific or
inaccurate metadata filters will yield poor results. Make sure that the fields
you filter on are present in the records, and that they contain the expected
values and data types.
- Reranking can help determine which of the returned records are most relevant
to the query. To use a reranker, provide the "rerank" parameter. When reranking,
use a "query" with a "topK" that returns more results than you need, and then
use "rerank" to select the most relevant "topN" results.

If your search does not return the expected results, try the following:
- Use the "describe-index-stats" tool to verify that the index and namespace are
present, and that the namespace is not empty.
- An inaccurate metadata filter may be the cause of the lack of results. Try the
query without the "query.filter" parameter, and check that the filter makes
sense for the schema of the record data.
- If using reranking, make sure that "rerank.rankFields" includes the field
specified in the index's "fieldMap". Use the "describe-index" tool and check the
value of "embed.fieldMap.text".`;

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
  .optional()
  .describe('Provide this parameter to rerank the results with a specialized reranking model.');

const SCHEMA = {
  name: z.string().describe('The name of the index to search.'),
  namespace: z.string().describe('The namespace to search.'),
  query: SEARCH_QUERY_SCHEMA,
  rerank: RERANK_SCHEMA,
};

export function addSearchRecordsTool(server: McpServer, pc: Pinecone) {
  server.tool('search-records', INSTRUCTIONS, SCHEMA, async ({name, namespace, query, rerank}) => {
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
  });
}
