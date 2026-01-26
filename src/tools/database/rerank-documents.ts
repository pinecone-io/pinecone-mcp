import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {RERANK_MODEL_SCHEMA} from './common/rerank-model.js';
import {registerDatabaseTool} from './common/register-tool.js';

type RerankModelType = 'bge-reranker-v2-m3' | 'pinecone-rerank-v0' | 'cohere-rerank-3.5';
type RerankOptionsType = {
  topN: number;
  rankFields?: string[];
};

const INSTRUCTIONS = `Rerank a set of documents based on a query`;

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

const Documents = z
  .union([
    z.array(z.string()).describe('An array of text documents to rerank.'),
    z.array(z.record(z.string(), z.string())).describe('An array of records to rerank.'),
  ])
  .describe(
    `A set of documents to rerank. Can either be an array of text documents
    (strings) or an array of records.`,
  );

export const SCHEMA = {
  model: RERANK_MODEL_SCHEMA,
  query: z.string().describe('The query to rerank documents against.'),
  documents: Documents,
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
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async (args, pc) => {
      const {model, query, documents, options} = args as RerankArgs;
      try {
        const results = await pc.inference.rerank(model, query, documents, options);
        return {
          content: [{type: 'text' as const, text: JSON.stringify(results, null, 2)}],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
