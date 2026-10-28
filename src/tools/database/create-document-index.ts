import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {CreateIndexSchemaField} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `Create a Pinecone document index: an index defined by a
schema of searchable "string" fields. Each field can declare "fullTextSearch"
(indexed for keyword search with BM25), "embed" (Pinecone embeds the text with a
hosted dense model for semantic search), "sparseEmbed" (a hosted sparse model),
or a combination. A good default is one field with both, for example
{"chunk_text": {"fullTextSearch": {"language": "en"}, "embed": {}}}, which
supports search by meaning and by exact terms on the same text. Fields you only
need to filter on are not declared here; send them as document metadata.
Use upsert-documents and search-documents with the new index. This call blocks
until the index is ready. If an index with the same name already exists, it is
returned unchanged instead of erroring.`;

const FULL_TEXT_SEARCH_SCHEMA = z
  .object({
    language: z
      .string()
      .optional()
      .describe('The language of the text, as an ISO 639-1 code such as "en". Defaults to "en".'),
    stemming: z.boolean().optional().describe('Whether to stem terms. Defaults to false.'),
    stopWords: z
      .boolean()
      .optional()
      .describe('Whether to remove stop words. Requires stemming. Defaults to false.'),
  })
  .describe('Index the field for full-text (BM25) search. Pass {} for the defaults.');

const EMBED_SCHEMA = z
  .object({
    model: z
      .string()
      .optional()
      .describe('A hosted dense embedding model. Defaults to "llama-text-embed-v2".'),
    dimension: z
      .number()
      .int()
      .optional()
      .describe("The vector dimension. Defaults to the model's default (1024)."),
  })
  .describe(
    `Have Pinecone embed the field's text with a hosted dense model. Pass {} for
    the default model. An index can have at most one field with "embed".`,
  );

const SPARSE_EMBED_SCHEMA = z
  .object({
    model: z
      .string()
      .optional()
      .describe('A hosted sparse embedding model. Defaults to "pinecone-sparse-english-v0".'),
  })
  .describe(
    `Have Pinecone embed the field's text with a hosted sparse model. Pass {} for
    the default model. An index can have at most one field with "sparseEmbed".`,
  );

const FIELD_SCHEMA = z
  .object({
    fullTextSearch: FULL_TEXT_SEARCH_SCHEMA.optional(),
    embed: EMBED_SCHEMA.optional(),
    sparseEmbed: SPARSE_EMBED_SCHEMA.optional(),
  })
  .refine((field) => field.fullTextSearch || field.embed || field.sparseEmbed, {
    message: 'A field must declare at least one of "fullTextSearch", "embed", or "sparseEmbed".',
  })
  .describe('A searchable string field.');

export const SCHEMA = {
  name: z.string().describe('A unique name to identify the new index.'),
  fields: z
    .record(z.string(), FIELD_SCHEMA)
    .describe('The searchable string fields of the index, keyed by field name.'),
  cloud: z
    .enum(['aws', 'gcp', 'azure'])
    .optional()
    .default('aws')
    .describe('The cloud provider for the index. Defaults to aws.'),
  region: z
    .string()
    .optional()
    .default('us-east-1')
    .describe(
      'The region for the index. Common regions: aws (us-east-1, us-west-2, eu-west-1), gcp (us-central1, europe-west1), azure (eastus, westeurope). Defaults to us-east-1.',
    ),
};

type FieldArgs = z.infer<typeof FIELD_SCHEMA>;

type CreateDocumentIndexArgs = {
  name: string;
  fields: Record<string, FieldArgs>;
  cloud: string;
  region: string;
};

export function addCreateDocumentIndexTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'create-document-index',
    {
      title: 'Create Document Index',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: true},
    },
    async (args, pc) => {
      const {name, fields, cloud, region} = args as CreateDocumentIndexArgs;
      const existingIndexes = await pc.listIndexes();
      const existingIndex = existingIndexes.indexes?.find((index) => index.name === name);
      if (existingIndex) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Index not created. An index named "${name}" already exists:
                    ${JSON.stringify(existingIndex, null, 2)}`,
            },
          ],
        };
      }

      const schemaFields: Record<string, CreateIndexSchemaField> = {};
      for (const [fieldName, field] of Object.entries(fields)) {
        schemaFields[fieldName] = {type: 'string', ...field} as CreateIndexSchemaField;
      }

      const indexInfo = await pc.indexes.create({
        name,
        schema: {fields: schemaFields},
        deployment: {deploymentType: 'managed', cloud, region},
        tags: {source: 'mcp'},
        waitUntilReady: true,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(indexInfo, null, 2),
          },
        ],
      };
    },
  );
}
