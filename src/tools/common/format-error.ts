import {Errors} from '@pinecone-database/pinecone';

/**
 * Recovery guidance appended to error messages for the error classes thrown by
 * the Pinecone SDK, matched by instanceof so an SDK class rename fails the
 * build instead of silently dropping guidance. Each entry tells the calling
 * agent whether the failure is retryable and what to do next.
 */
type ErrorClass = abstract new (...args: never[]) => Error;

const ERROR_GUIDANCE: ReadonlyArray<[ErrorClass, string]> = [
  [
    Errors.PineconeNotFoundError,
    'The requested resource does not exist. Do not retry with the same input. ' +
      'If the error refers to an index, call list-indexes to see valid index names.',
  ],
  [
    Errors.PineconeAuthorizationError,
    'The API key was rejected. Do not retry. Ask the user to verify PINECONE_API_KEY ' +
      '(keys are managed at https://app.pinecone.io) and restart the MCP server.',
  ],
  [
    Errors.PineconeBadRequestError,
    'The request was invalid and will fail again unless corrected — do not retry ' +
      'with the same input. Check that records and filters match the index ' +
      'configuration (call describe-index to see its embedding model and fieldMap).',
  ],
  [
    Errors.PineconeConflictError,
    'A resource with this name already exists. Do not retry with the same name. ' +
      'Call list-indexes to see existing indexes, or choose a different name.',
  ],
  [
    Errors.PineconeInternalServerError,
    'Pinecone encountered an internal error. This is usually transient — wait a few seconds and retry.',
  ],
  [
    Errors.PineconeUnavailableError,
    'Pinecone is temporarily unavailable. This is transient — wait a few seconds and retry.',
  ],
  [
    Errors.PineconeMaxRetriesExceededError,
    'The request kept failing after retries. This is usually transient — wait longer and retry, ' +
      'or tell the user Pinecone appears to be unreachable.',
  ],
  [
    Errors.PineconeConnectionError,
    'Could not reach Pinecone. This is usually a transient network issue — retry once; ' +
      'if it persists, ask the user to check their network connection and proxy settings.',
  ],
];

/**
 * Formats an unknown error value for display in tool error responses.
 * Preserves error messages from Error instances while handling non-Error
 * values, and appends actionable next-step guidance for known Pinecone errors.
 */
export function formatError(e: unknown): string {
  if (!(e instanceof Error)) {
    return String(e);
  }
  const entry = ERROR_GUIDANCE.find(([errorClass]) => e instanceof errorClass);
  return entry ? `${e.message}\n\nNext step: ${entry[1]}` : e.message;
}

/** Builds the standard MCP error result returned by all tools. */
export function errorResult(text: string) {
  return {isError: true, content: [{type: 'text' as const, text}]};
}
