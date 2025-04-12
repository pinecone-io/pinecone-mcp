import {z} from 'zod';
import {RerankModel} from './RerankModel.js';

export const SearchRecordsQuery = z
  .object({
    topK: z.number().describe('The number of results to return.'),
    inputs: z.object({
      text: z.string().describe('The text to search for.'),
    }),
    filter: z
      .any()
      .optional()
      .describe(
        "Optional metadata filter to apply to the search. Pinecone's filtering query language is based on MongoDB's query and projection operators. Pinecone currently supports a subset of those selectors: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists, $and, $or",
      ),
  })
  .describe('A query to search for records.');

export const SearchRecordsRerank = z.object({
  model: RerankModel,
  topN: z
    .number()
    .optional()
    .describe(
      'The number of top results to return after reranking. Defaults to the `topK` in `query`.',
    ),
  rankFields: z
    .array(z.string().describe('The name of a field to rerank on.'))
    .describe(
      "The fields to rerank on. Generally, this should be the field name specified in the index's `fieldMap`.",
    ),
  query: z
    .string()
    .optional()
    .describe(
      'The query to rerank documents against. If a specific rerank query is specified, it overwrites the query input that was provided at the top level.',
    ),
});

export const SearchRecordsRequest = {
  name: z.string().describe('The name of the index to search.'),
  namespace: z.string().describe('The namespace to search.'),
  query: SearchRecordsQuery,
  rerank: SearchRecordsRerank.optional(),
};
