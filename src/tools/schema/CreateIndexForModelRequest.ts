import {z} from 'zod';

export const CreateIndexForModelRequest = {
  name: z.string().describe('A unique name that will identify the new index.'),
  embed: z
    .object({
      model: z
        .union([
          z
            .literal('multilingual-e5-large')
            .describe(
              '`multilingual-e5-large` is an efficient dense embedding model trained on a mixture of multilingual datasets. It works well on messy data and short queries expected to return medium-length passages of text (1-2 paragraphs).',
            ),
          z
            .literal('llama-text-embed-v2')
            .describe(
              '`llama-text-embed-v2` is a high-performance dense embedding model optimized for text retrieval and ranking tasks. It is trained on a diverse range of text corpora and provides strong performance on longer passages and structured documents.',
            ),
          z
            .literal('pinecone-sparse-english-v0')
            .describe(
              '`pinecone-sparse-english-v0` is a sparse embedding model for converting text to sparse vectors for keyword or hybrid semantic/keyword search. Built on the innovations of the DeepImpact architecture, the model directly estimates the lexical importance of tokens by leveraging their context, unlike traditional retrieval models like BM25, which rely solely on term frequency.',
            ),
        ])
        .describe('Which embedding model to use for the index.'),
      fieldMap: z
        .object({
          text: z
            .string()
            .describe('The name of the text field from your document model that will be embedded.'),
        })
        .describe(
          'A map that identifies which field from your document model that will be embedded.',
        ),
    })
    .describe('Configuration for the embedding model used for integrated inference.'),
};
