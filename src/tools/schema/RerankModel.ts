import {z} from 'zod';

export const RerankModel = z
  .union([
    z
      .literal('cohere-rerank-3.5')
      .describe(
        "`cohere-rerank-3.5` is Cohere's leading reranking model, balancing performance and latency for a wide range of enterprise search applications.",
      ),
    z
      .literal('bge-reranker-v2-m3')
      .describe(
        '`bge-reranker-v2-m3` is a high-performance, multilingual reranking model that works well on messy data and short queries expected to return medium-length passages of text (1-2 paragraphs).',
      ),
    z
      .literal('pinecone-rerank-v0')
      .describe(
        '`pinecone-rerank-v0` is a state of the art reranking model that out-performs competitors on widely accepted benchmarks. It can handle chunks up to 512 tokens (1-2 paragraphs).',
      ),
  ])
  .describe('The model to use for reranking.');
