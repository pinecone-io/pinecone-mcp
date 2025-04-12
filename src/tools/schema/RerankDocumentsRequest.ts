import {z} from 'zod';
import {RerankModel} from './RerankModel.js';

const RerankDocumentsOptions = z
  .object({
    topN: z.number().optional().describe('The number of top results to return after reranking.'),
    rankFields: z
      .array(z.string().describe('The name of a field to rerank on.'))
      .describe(
        'The fields to rerank on. This should only be specified if the documents are records. The fields should be the names of the fields in the records.',
      )
      .optional(),
  })
  .optional()
  .describe('Options for reranking.');

const Documents = z
  .union([
    z
      .array(z.string().describe('A text document to rerank.'))
      .describe('An array of text documents to rerank.'),
    z
      .array(z.record(z.string(), z.string()).describe('A document record to rerank.'))
      .describe('An array of document records to rerank.'),
  ])
  .describe(
    'The documents to rerank. Can either be an array of text documents or an array of document records.',
  );

export const RerankDocumentsRequest = {
  model: RerankModel,
  query: z.string().describe('The query to rerank documents against.'),
  documents: Documents,
  options: RerankDocumentsOptions,
};
