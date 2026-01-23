import {describe, it, expect} from 'vitest';
import {z} from 'zod';
import {errorMap} from './error.js';

describe('errorMap', () => {
  describe('invalid_type errors', () => {
    it('formats type mismatch errors', () => {
      const schema = z.object({name: z.string()});
      const result = schema.safeParse({name: 123}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('name: Expected string, received number');
      }
    });

    it('handles nested paths', () => {
      const schema = z.object({
        user: z.object({
          email: z.string(),
        }),
      });
      const result = schema.safeParse({user: {email: 42}}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('user.email: Expected string, received number');
      }
    });

    it('handles array indices in paths', () => {
      const schema = z.object({
        items: z.array(z.string()),
      });
      const result = schema.safeParse({items: ['a', 'b', 123]}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('items[2]: Expected string, received number');
      }
    });
  });

  describe('invalid_enum_value errors', () => {
    it('lists valid enum options', () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      });
      const result = schema.safeParse({status: 'unknown'}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'status: Expected "active" | "inactive" | "pending"',
        );
      }
    });
  });

  describe('unrecognized_keys errors', () => {
    it('lists single unrecognized key', () => {
      const schema = z.object({name: z.string()}).strict();
      const result = schema.safeParse({name: 'test', extra: 'value'}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key: "extra"');
      }
    });

    it('lists multiple unrecognized keys', () => {
      const schema = z.object({name: z.string()}).strict();
      const result = schema.safeParse({name: 'test', extra1: 'a', extra2: 'b'}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized keys:');
        expect(result.error.issues[0].message).toContain('"extra1"');
        expect(result.error.issues[0].message).toContain('"extra2"');
      }
    });
  });

  describe('invalid_union errors', () => {
    it('formats union type errors', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
      });
      const result = schema.safeParse({value: []}, {errorMap});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expected');
        expect(result.error.issues[0].message).toContain('received');
      }
    });
  });
});
