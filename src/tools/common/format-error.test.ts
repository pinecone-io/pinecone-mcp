import {Errors} from '@pinecone-database/pinecone';
import {describe, it, expect} from 'vitest';
import {formatError, errorResult} from './format-error.js';

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
    it('appends guidance pointing to list-indexes for not-found errors', () => {
      const result = formatError(
        new Errors.PineconeNotFoundError({status: 404, message: 'HTTP status 404'}),
      );
      expect(result).toContain('Next step:');
      expect(result).toContain('list-indexes');
    });

    it('marks authorization errors as non-retryable with a key fix', () => {
      const result = formatError(new Errors.PineconeAuthorizationError({status: 401}));
      expect(result).toContain('Do not retry');
      expect(result).toContain('PINECONE_API_KEY');
    });

    it('marks bad requests as non-retryable with input-correction guidance', () => {
      const result = formatError(
        new Errors.PineconeBadRequestError({status: 400, message: 'dimension mismatch'}),
      );
      expect(result).toContain('dimension mismatch');
      expect(result).toContain('do not retry');
      expect(result).toContain('describe-index');
    });

    it('marks transient errors as retryable', () => {
      const transientErrors = [
        new Errors.PineconeInternalServerError({status: 500, message: 'boom'}),
        new Errors.PineconeUnavailableError({status: 503, message: 'boom'}),
        new Errors.PineconeConnectionError(new Error('boom')),
        new Errors.PineconeMaxRetriesExceededError(3),
      ];
      for (const error of transientErrors) {
        const result = formatError(error);
        expect(result, `${error.name} should suggest retrying`).toContain('retry');
      }
    });

    it('does not resolve guidance from Object.prototype members', () => {
      const error = new Error('plain');
      error.name = 'toString';
      expect(formatError(error)).toBe('plain');
    });

    it('leaves errors merely named like Pinecone errors unchanged', () => {
      const error = new Error('plain');
      error.name = 'PineconeNotFoundError';
      expect(formatError(error)).toBe('plain');
    });
  });
});

describe('errorResult', () => {
  it('builds the standard MCP error envelope', () => {
    expect(errorResult('boom')).toEqual({
      isError: true,
      content: [{type: 'text', text: 'boom'}],
    });
  });
});
