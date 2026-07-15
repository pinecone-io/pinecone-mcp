import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {registerDatabaseTool} from './common/register-tool.js';

type RerankModelType = 'bge-reranker-v2-m3' | 'pinecone-rerank-v0' | 'cohere-rerank-3.5';
type RerankOptionsType = {
  topN: number;
  rankFields?: string[];
};

const INSTRUCTIONS = `Rerank a set of provided documents by relevance to a
query. Use this for documents that did not come from a Pinecone search (e.g.
externally sourced text). To rerank the results of a single-index search,
prefer the "rerank" parameter of search-records instead of calling this tool
separately.`;

export const RerankDocumentsOptions = z
  .object({
    topN: z.number().describe('The number of results to return after reranking.'),
    rankFields: z
      .array(z.string())
      .optional()
      .describe(
        `The fields to rerank on. This should only be included if the documents
        are records. The "bge-reranker-v2-m3" and "pinecone-rerank-v0" models
        support only a single rerank field. "cohere-rerank-3.5" supports
        multiple rerank fields.`,
      ),
  })
  .optional();

function isStringRecord(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

function isDocumentSet(value: unknown) {
  return (
    Array.isArray(value) &&
    (value.every((item) => typeof item === 'string') || value.every(isStringRecord))
  );
}

export const DOCUMENTS_SCHEMA = z
  .any()
  .refine(isDocumentSet, {
    message:
      'Documents must be an array of text documents (strings) or an array of records with string values.',
  })
  .describe(
    `A set of documents to rerank. Can either be an array of text documents
    (strings) or an array of records. Record field values must be strings;
    records with number, boolean, or array fields are not accepted.`,
  );

export const SCHEMA = {
  model: RERANK_MODEL_SCHEMA,
  query: z.string().describe('The query to rerank documents against.'),
  documents: DOCUMENTS_SCHEMA,
  options: RerankDocumentsOptions,
};

type RerankArgs = {
  model: RerankModelType;
  query: string;
  documents: string[] | Record<string, string>[];
  options?: RerankOptionsType;
};

export function addRerankDocumentsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'rerank-documents',
    {
      title: 'Rerank Documents',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: true},
    },
    async (args, pc) => {
      const {model, query, documents, options} = args as RerankArgs;
      const results = await pc.inference.rerank(model, query, documents, options);
      return {
        content: [{type: 'text' as const, text: JSON.stringify(results, null, 2)}],
      };
    },
  );
}
