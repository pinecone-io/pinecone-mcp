import {z} from 'zod';
import {SearchRecordsQuery} from './SearchRecordsRequest.js';
import {RerankModel} from './RerankModel.js';
import {RerankDocumentsOptions} from './RerankDocumentsRequest.js';

const Index = z.object({
  name: z.string().describe('The name of an index to search.'),
  namespace: z
    .string()
    .describe('The namespace to search. This must be a valid namespace for the index.'),
});

const CascadingSearchRerank = z
  .object({
    model: RerankModel,
    query: z
      .string()
      .optional()
      .describe(
        'The query to rerank documents against. If a specific rerank query is specified, it overwrites the query input that was provided at the top level.',
      ),
    topN: z.number().optional().describe('The number of top results to return after reranking.'),
    rankFields: z
      .array(z.string().describe('The name of a field to rerank on.'))
      .describe(
        'The fields to rerank on. This should only be specified if the documents are records. The fields should be the names of the fields in the records.',
      )
      .optional(),
  })
  .describe('Specifies how the results should be reranked.');

export const CascadingSearchRequest = {
  indexes: z
    .array(Index)
    .describe(
      'The indexes/namespaces to search across. Records in the namespaces should share a common schema.',
    ),
  query: SearchRecordsQuery,
  rerank: CascadingSearchRerank,
};
