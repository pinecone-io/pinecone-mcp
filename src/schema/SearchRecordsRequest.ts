import {z} from 'zod';

const SearchRecordsQuery = z.object({
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
});

const SearchRecordsRerank = z.object({
  model: z
    .union([
      z
        .literal('cohere-rerank-3.5')
        .describe(
          "`cohere-rerank-3.5` is Cohere's leading reranking model, balancing performance and latency for a wide range of enterprise search applications.",
        ),
      z
        .literal('bge-reranker-v2-m3')
        .describe(
          '`bge-reranker-v2-m3` is a high-performance, multilingual reranking model that works well on messy data and short queries expected to return medium-length passages of text (1-2 paragraphs).',
        ),
      z
        .literal('pinecone-rerank-v0')
        .describe(
          '`pinecone-rerank-v0` is a state of the art reranking model that out-performs competitors on widely accepted benchmarks. It can handle chunks up to 512 tokens (1-2 paragraphs).',
        ),
    ])
    .describe('The model to use for reranking.'),
  topN: z
    .number()
    .optional()
    .describe(
      'The number of top results to return after reranking. Defaults to the `topK` in `query`.',
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
