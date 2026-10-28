import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {DocumentRecord} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {FRESHNESS_NOTE} from './common/messages.js';
import {registerDatabaseTool} from './common/register-tool.js';
import {FIELD_VALUE_SCHEMA} from './upsert-records.js';

const INSTRUCTIONS = `Insert or update documents in a Pinecone document index
(one created with create-document-index). Each document needs an "_id" and
plain text in every field the index declares with "embed"; Pinecone embeds that
text on write, so never send vectors. Call describe-index first to see the
schema. Fields not in the schema are stored as metadata you can filter on.
Documents with an existing "_id" are replaced. ${FRESHNESS_NOTE}`;

// The per-request cap when an index embeds a field; safe for every document index.
const BATCH_SIZE = 96;

export const DOCUMENT_SCHEMA = z
  .record(z.string(), FIELD_VALUE_SCHEMA)
  .refine((document) => typeof document._id === 'string' && document._id.length > 0, {
    message: 'A document must have a non-empty string "_id" field.',
  })
  .describe(
    `A document to upsert. Must have an "_id" field and plain text in each field
    the index declares with "embed".`,
  );

export const SCHEMA = {
  name: z.string().describe('The index to upsert into.'),
  namespace: z
    .string()
    .optional()
    .default('__default__')
    .describe('The namespace to upsert into. Defaults to "__default__".'),
  documents: z
    .array(DOCUMENT_SCHEMA)
    .min(1)
    .describe('The documents to upsert. Larger sets are sent in batches of 96.'),
};

type UpsertDocumentsArgs = {
  name: string;
  namespace: string;
  documents: DocumentRecord[];
};

export function addUpsertDocumentsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'upsert-documents',
    {
      title: 'Upsert Documents',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: false, destructiveHint: true, idempotentHint: true},
    },
    async (args, pc) => {
      const {name, namespace, documents} = args as UpsertDocumentsArgs;
      const index = pc.index({name, namespace});
      let upserted = 0;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const result = await index.documents.upsert({
          documents: documents.slice(i, i + BATCH_SIZE),
        });
        upserted += result.upsertedCount;
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `Upserted ${upserted} document(s) successfully. ${FRESHNESS_NOTE}`,
          },
        ],
      };
    },
  );
}
