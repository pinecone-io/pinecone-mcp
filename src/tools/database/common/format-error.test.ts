import {describe, it, expect} from 'vitest';
import {formatError} from './format-error.js';

describe('formatError', () => {
  it('extracts message from Error instances', () => {
    const error = new Error('Something went wrong');
    expect(formatError(error)).toBe('Something went wrong');
  });

  it('extracts message from Error subclasses', () => {
    const error = new TypeError('Invalid type');
    expect(formatError(error)).toBe('Invalid type');
  });

  it('converts string values directly', () => {
    expect(formatError('plain string error')).toBe('plain string error');
  });

  it('converts number values to string', () => {
    expect(formatError(404)).toBe('404');
  });

  it('converts null to string', () => {
    expect(formatError(null)).toBe('null');
  });

  it('converts undefined to string', () => {
    expect(formatError(undefined)).toBe('undefined');
  });

  it('converts objects to string', () => {
    expect(formatError({code: 'ERR'})).toBe('[object Object]');
  });

  describe('next-step guidance for Pinecone errors', () => {
    function namedError(name: string, message: string): Error {
      const e = new Error(message);
      e.name = name;
      return e;
    }

    it('appends guidance pointing to list-indexes for not-found errors', () => {
      const result = formatError(namedError('PineconeNotFoundError', 'HTTP status 404'));
      expect(result).toContain('HTTP status 404');
      expect(result).toContain('Next step:');
      expect(result).toContain('list-indexes');
    });

    it('marks authorization errors as non-retryable with a key fix', () => {
      const result = formatError(namedError('PineconeAuthorizationError', 'key rejected'));
      expect(result).toContain('Do not retry');
      expect(result).toContain('PINECONE_API_KEY');
    });

    it('marks bad requests as non-retryable with input-correction guidance', () => {
      const result = formatError(namedError('PineconeBadRequestError', 'dimension mismatch'));
      expect(result).toContain('do not retry');
      expect(result).toContain('describe-index');
    });

    it('marks transient errors as retryable', () => {
      for (const name of [
        'PineconeInternalServerError',
        'PineconeUnavailableError',
        'PineconeConnectionError',
        'PineconeMaxRetriesExceededError',
      ]) {
        const result = formatError(namedError(name, 'boom'));
        expect(result, `${name} should suggest retrying`).toContain('retry');
      }
    });

    it('leaves unrecognized error names unchanged', () => {
      expect(formatError(namedError('SomeOtherError', 'plain'))).toBe('plain');
    });
  });
});
