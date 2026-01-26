import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS =
  'Create a Pinecone index with integrated inference. Supports AWS, GCP, and Azure cloud providers.';

type CloudProvider = 'aws' | 'gcp' | 'azure';
type EmbedModel = 'multilingual-e5-large' | 'llama-text-embed-v2' | 'pinecone-sparse-english-v0';
type EmbedConfig = {
  model: EmbedModel;
  fieldMap: {text: string};
};

const SCHEMA = {
  name: z.string().describe('A unique name to identify the new index.'),
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
  embed: z
    .object({
      model: z
        .enum(['multilingual-e5-large', 'llama-text-embed-v2', 'pinecone-sparse-english-v0'])
        .describe(
          `Choose an embedding model:
          - "multilingual-e5-large" is an efficient dense embedding model
          trained on a mixture of multilingual datasets. It works well on messy
          data and short queries expected to return medium-length passages of
          text (1-2 paragraphs).
          - "llama-text-embed-v2" is a high-performance dense embedding model
          optimized for text retrieval and ranking tasks. It is trained on a
          diverse range of text corpora and provides strong performance on
          longer passages and structured documents.
          - "pinecone-sparse-english-v0" is a sparse embedding model for
          converting text to sparse vectors for keyword or hybrid search. The
          model directly estimates the lexical importance of tokens by
          leveraging their context.`,
        ),
      fieldMap: z
        .object({
          text: z.string().describe(
            `The name of the field in the data records that contains the text
            content to embed. Records in the index must contain this field.`,
          ),
        })
        .describe('Identify which field from your data records will be embedded.'),
    })
    .describe('Configure an embedding model that converts text into a vector.'),
};

type CreateIndexArgs = {
  name: string;
  cloud: CloudProvider;
  region: string;
  embed: EmbedConfig;
};

export function addCreateIndexForModelTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'create-index-for-model',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async (args, pc) => {
      const {name, cloud, region, embed} = args as CreateIndexArgs;
      try {
        // Check if the index already exists
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

        // Create the new index
        const indexInfo = await pc.createIndexForModel({
          name,
          cloud,
          region,
          embed,
          tags: {
            source: 'mcp',
            embedding_model: embed.model,
          },
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
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
