import {z} from 'zod';

export const RERANK_MODEL_SCHEMA = z.enum([
  'cohere-rerank-3.5',
  'bge-reranker-v2-m3',
  'pinecone-rerank-v0',
]).describe(`The model to use for reranking. Pinecone supports the following
reranking models:
- "cohere-rerank-3.5" is Cohere's leading reranking model, balancing performance
and latency for a wide range of enterprise search applications.
- "bge-reranker-v2-m3" is a high-performance, multilingual reranking model that
works well on messy data and short queries expected to return medium-length
passages of text (1-2 paragraphs).
- "pinecone-rerank-v0" is a state of the art reranking model that out-performs
competitors on widely accepted benchmarks. It can handle chunks up to 512 tokens
(1-2 paragraphs).`);
