import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';

const INSTRUCTIONS = `Rerank a set of documents based on a query. Use this tool
when you have a collection of documents, and you want to determine which
documents are most relevant to the query.`;

export const RerankDocumentsOptions = z
  .object({
    topN: z.number().describe('The number of top results to return after reranking.'),
    rankFields: z
      .array(z.string().describe('The name of a field to rerank on.'))
      .optional()
      .describe(
        `The fields to rerank on. This should only be included if the documents
        are records. The "bge-reranker-v2-m3" and "pinecone-rerank-v0" models
        support only a single rerank field. "cohere-rerank-3.5" supports
        multiple rerank fields, ranked based on the order of the fields
        specified.`,
      ),
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

export const SCHEMA = {
  model: RERANK_MODEL_SCHEMA,
  query: z.string().describe('The query to rerank documents against.'),
  documents: Documents,
  options: RerankDocumentsOptions,
};

export function addRerankDocumentsTool(server: McpServer, pc: Pinecone) {
  server.tool(
    'rerank-documents',
    INSTRUCTIONS,
    SCHEMA,
    async ({model, query, documents, options}) => {
      const results = pc.inference.rerank(model, query, documents, options);
      return {
        content: [{type: 'text', text: JSON.stringify(results, null, 2)}],
      };
    },
  );
}
