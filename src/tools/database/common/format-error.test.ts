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
});
