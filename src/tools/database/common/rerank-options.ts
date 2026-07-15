import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './rerank-model.js';

/**
 * The rerank options shared by search-records (where reranking is optional)
 * and cascading-search (where it is required). Each tool applies its own
 * top-level .describe() and .optional() as needed.
 */
export const RERANK_OPTIONS_SCHEMA = z.object({
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
});
