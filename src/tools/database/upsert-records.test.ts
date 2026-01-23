import {describe, it, expect} from 'vitest';
import {FIELD_VALUE_SCHEMA, RECORD_SCHEMA} from './upsert-records.js';

describe('FIELD_VALUE_SCHEMA', () => {
  it('accepts string values', () => {
    expect(FIELD_VALUE_SCHEMA.parse('hello')).toBe('hello');
  });

  it('accepts number values', () => {
    expect(FIELD_VALUE_SCHEMA.parse(42)).toBe(42);
    expect(FIELD_VALUE_SCHEMA.parse(3.14)).toBe(3.14);
  });

  it('accepts boolean values', () => {
    expect(FIELD_VALUE_SCHEMA.parse(true)).toBe(true);
    expect(FIELD_VALUE_SCHEMA.parse(false)).toBe(false);
  });

  it('accepts arrays of strings', () => {
    expect(FIELD_VALUE_SCHEMA.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('rejects null values', () => {
    const result = FIELD_VALUE_SCHEMA.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects nested objects', () => {
    const result = FIELD_VALUE_SCHEMA.safeParse({nested: 'object'});
    expect(result.success).toBe(false);
  });

  it('rejects arrays with non-string elements', () => {
    const result = FIELD_VALUE_SCHEMA.safeParse(['a', 123, 'b']);
    expect(result.success).toBe(false);
  });
});

describe('RECORD_SCHEMA', () => {
  it('accepts records with id field', () => {
    const record = {id: '123', name: 'test', value: 42};
    expect(RECORD_SCHEMA.parse(record)).toEqual(record);
  });

  it('accepts records with _id field', () => {
    const record = {_id: '123', name: 'test'};
    expect(RECORD_SCHEMA.parse(record)).toEqual(record);
  });

  it('rejects records without id or _id', () => {
    const result = RECORD_SCHEMA.safeParse({name: 'test', value: 42});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('A record must have an "id" or "_id" field.');
    }
  });

  it('accepts records with multiple valid field types', () => {
    const record = {
      id: 'rec-1',
      title: 'Hello',
      count: 10,
      active: true,
      tags: ['a', 'b'],
    };
    expect(RECORD_SCHEMA.parse(record)).toEqual(record);
  });

  it('rejects records with nested objects in fields', () => {
    const result = RECORD_SCHEMA.safeParse({
      id: '123',
      metadata: {nested: 'value'},
    });
    expect(result.success).toBe(false);
  });
});
