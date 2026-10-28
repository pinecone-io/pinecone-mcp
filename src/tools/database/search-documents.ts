import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {FRESHNESS_NOTE} from './common/messages.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `Search a Pinecone document index (one created with
create-document-index). Call describe-index first to see which fields declare
"embed", "sparseEmbed", or "fullTextSearch". Rank with one or more "scoreBy"
clauses:
- "embed": search by meaning on a field with "embed". Pass the query as plain
text; Pinecone embeds it with the field's model.
- "sparse_embed": search a field with "sparseEmbed" the same way.
- "text": keyword (BM25) search on one or more full-text fields. Good for exact
terms like IDs, error codes, and names.
- "query_string": Lucene-style query syntax, with field qualifiers inside the
query (for example 'chunk_text:"exact phrase"'). Takes no "fields".
An "embed" or "sparse_embed" clause must be the only clause; "text" and
"query_string" clauses can be combined. To rank by meaning and by exact terms,
run two separate searches: their scores are on different scales, so don't
compare them across searches. Returns matches with "_id", "_score", and the
fields named in "includeFields". ${FRESHNESS_NOTE}`;

const SCORE_BY_SCHEMA = z
  .object({
    type: z.enum(['embed', 'sparse_embed', 'text', 'query_string']).describe('The scoring method.'),
    fields: z
      .array(z.string())
      .optional()
      .describe(
        'The fields to score. "embed" and "sparse_embed" take exactly one; "text" takes one or more; "query_string" takes none.',
      ),
    query: z.string().describe('The query text.'),
  })
  .describe('A scoring clause.');

export const SCHEMA = {
  name: z.string().describe('The index to search.'),
  namespace: z
    .string()
    .optional()
    .default('__default__')
    .describe('The namespace to search. Defaults to "__default__".'),
  scoreBy: z.array(SCORE_BY_SCHEMA).min(1).describe('The clauses that rank the documents.'),
  topK: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(10)
    .describe('The number of matches to return. Defaults to 10.'),
  filter: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      `An optional filter, such as {"category": {"$eq": "policy"}}. On a
      full-text field, "$match_phrase", "$match_all", and "$match_any" require
      terms, for example {"chunk_text": {"$match_all": "refund"}}.`,
    ),
  includeFields: z
    .array(z.string())
    .optional()
    .default(['*'])
    .describe('The fields to return with each match. Defaults to ["*"] (all stored fields).'),
};

type SearchDocumentsArgs = {
  name: string;
  namespace: string;
  scoreBy: Array<{type: string; fields?: string[]; query: string}>;
  topK: number;
  filter?: Record<string, unknown>;
  includeFields: string[];
};

export function addSearchDocumentsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'search-documents',
    {
      title: 'Search Documents',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: true},
    },
    async (args, pc) => {
      const {name, namespace, scoreBy, topK, filter, includeFields} = args as SearchDocumentsArgs;
      const index = pc.index({name, namespace});
      const results = await index.documents.search({
        scoreBy,
        topK,
        includeFields,
        ...(filter ? {filter} : {}),
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(results.matches, null, 2),
          },
        ],
      };
    },
  );
}
