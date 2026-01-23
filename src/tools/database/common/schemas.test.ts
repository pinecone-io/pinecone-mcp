import {describe, it, expect} from 'vitest';
import {RERANK_MODEL_SCHEMA} from './rerank-model.js';
import {SEARCH_QUERY_SCHEMA} from './search-query.js';

describe('RERANK_MODEL_SCHEMA', () => {
  it('accepts valid rerank models', () => {
    expect(RERANK_MODEL_SCHEMA.parse('cohere-rerank-3.5')).toBe('cohere-rerank-3.5');
    expect(RERANK_MODEL_SCHEMA.parse('bge-reranker-v2-m3')).toBe('bge-reranker-v2-m3');
    expect(RERANK_MODEL_SCHEMA.parse('pinecone-rerank-v0')).toBe('pinecone-rerank-v0');
  });

  it('rejects invalid model names', () => {
    expect(() => RERANK_MODEL_SCHEMA.parse('invalid-model')).toThrow();
    expect(() => RERANK_MODEL_SCHEMA.parse('')).toThrow();
    expect(() => RERANK_MODEL_SCHEMA.parse(123)).toThrow();
  });

  it('provides helpful error for invalid values', () => {
    const result = RERANK_MODEL_SCHEMA.safeParse('wrong');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_enum_value');
    }
  });
});

describe('SEARCH_QUERY_SCHEMA', () => {
  it('accepts valid search queries', () => {
    const validQuery = {
      topK: 10,
      inputs: {text: 'search term'},
    };
    const result = SEARCH_QUERY_SCHEMA.parse(validQuery);
    expect(result.topK).toBe(10);
    expect(result.inputs.text).toBe('search term');
  });

  it('accepts queries with optional filter', () => {
    const queryWithFilter = {
      topK: 5,
      inputs: {text: 'query'},
      filter: {category: {$eq: 'test'}},
    };
    const result = SEARCH_QUERY_SCHEMA.parse(queryWithFilter);
    expect(result.filter).toEqual({category: {$eq: 'test'}});
  });

  it('allows filter to be undefined', () => {
    const queryWithoutFilter = {
      topK: 10,
      inputs: {text: 'query'},
    };
    const result = SEARCH_QUERY_SCHEMA.parse(queryWithoutFilter);
    expect(result.filter).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    expect(() => SEARCH_QUERY_SCHEMA.parse({})).toThrow();
    expect(() => SEARCH_QUERY_SCHEMA.parse({topK: 10})).toThrow();
    expect(() => SEARCH_QUERY_SCHEMA.parse({inputs: {text: 'test'}})).toThrow();
  });

  it('rejects invalid topK type', () => {
    const result = SEARCH_QUERY_SCHEMA.safeParse({
      topK: 'not a number',
      inputs: {text: 'query'},
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing text in inputs', () => {
    const result = SEARCH_QUERY_SCHEMA.safeParse({
      topK: 10,
      inputs: {},
    });
    expect(result.success).toBe(false);
  });
});
