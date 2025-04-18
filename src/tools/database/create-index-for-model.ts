import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = 'Create a Pinecone index with integrated inference';

const SCHEMA = {
  name: z.string().describe('A unique name to identify the new index.'),
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

export function addCreateIndexForModelTool(server: McpServer, pc: Pinecone) {
  server.tool('create-index-for-model', INSTRUCTIONS, SCHEMA, async ({name, embed}) => {
    // Check if the index already exists
    const existingIndexes = await pc.listIndexes();
    const existingIndex = existingIndexes.indexes?.find((index) => index.name === name);
    if (existingIndex) {
      return {
        content: [
          {
            type: 'text',
            text: `Index not created. An index named "${name}" already exists:
                  ${JSON.stringify(existingIndex, null, 2)}`,
          },
        ],
      };
    }

    // Create the new index
    const indexInfo = await pc.createIndexForModel({
      name,
      cloud: 'aws',
      region: 'us-east-1',
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
          type: 'text',
          text: JSON.stringify(indexInfo, null, 2),
        },
      ],
    };
  });
}
