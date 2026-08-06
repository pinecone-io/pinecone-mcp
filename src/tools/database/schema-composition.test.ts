import {describe, it, expect} from 'vitest';
import {z} from 'zod';
import {SCHEMA as CASCADING_SEARCH_SCHEMA} from './cascading-search.js';
import {SCHEMA as CREATE_INDEX_SCHEMA} from './create-index-for-model.js';
import {SCHEMA as DESCRIBE_INDEX_SCHEMA} from './describe-index.js';
import {SCHEMA as DESCRIBE_INDEX_STATS_SCHEMA} from './describe-index-stats.js';
import {SCHEMA as RERANK_DOCUMENTS_SCHEMA} from './rerank-documents.js';
import {SCHEMA as SEARCH_RECORDS_SCHEMA} from './search-records.js';
import {SCHEMA as UPSERT_RECORDS_SCHEMA} from './upsert-records.js';

// Claude tool-use rejects JSON Schemas containing anyOf/oneOf/allOf composition
// keywords (see #89, #92, #93). This guards every tool's input schema against
// regressing, not just the one that originally broke.
function findSchemaCompositionKeywords(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const keywords: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'anyOf' || key === 'oneOf' || key === 'allOf') {
      keywords.push(key);
    }
    keywords.push(...findSchemaCompositionKeywords(nested));
  }
  return keywords;
}

const TOOL_SCHEMAS = {
  'cascading-search': CASCADING_SEARCH_SCHEMA,
  'create-index-for-model': CREATE_INDEX_SCHEMA,
  'describe-index': DESCRIBE_INDEX_SCHEMA,
  'describe-index-stats': DESCRIBE_INDEX_STATS_SCHEMA,
  'rerank-documents': RERANK_DOCUMENTS_SCHEMA,
  'search-records': SEARCH_RECORDS_SCHEMA,
  'upsert-records': UPSERT_RECORDS_SCHEMA,
};

describe('tool input schemas are Claude-compatible', () => {
  for (const [name, schema] of Object.entries(TOOL_SCHEMAS)) {
    it(`${name} exports without schema composition keywords`, () => {
      const jsonSchema = z.toJSONSchema(z.object(schema));
      expect(findSchemaCompositionKeywords(jsonSchema)).toEqual([]);
    });
  }
});
