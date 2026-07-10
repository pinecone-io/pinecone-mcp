/**
 * Recovery guidance appended to error messages, keyed by the `name` of the
 * error classes thrown by the Pinecone SDK (see @pinecone-database/pinecone
 * errors). Matching on `name` avoids a hard dependency on the SDK's error
 * class hierarchy. Each entry tells the calling agent whether the failure is
 * retryable and what to do next.
 */
const ERROR_GUIDANCE: Record<string, string> = {
  PineconeNotFoundError:
    'The requested resource does not exist. Do not retry with the same input. ' +
    'If the error refers to an index, call list-indexes to see valid index names.',
  PineconeAuthorizationError:
    'The API key was rejected. Do not retry. Ask the user to verify PINECONE_API_KEY ' +
    '(keys are managed at https://app.pinecone.io) and restart the MCP server.',
  PineconeBadRequestError:
    'The request was invalid and will fail again unless corrected — do not retry ' +
    'with the same input. Check that records and filters match the index ' +
    'configuration (call describe-index to see its embedding model and fieldMap).',
  PineconeConflictError:
    'A resource with this name already exists. Do not retry with the same name. ' +
    'Call list-indexes to see existing indexes, or choose a different name.',
  PineconeInternalServerError:
    'Pinecone encountered an internal error. This is usually transient — wait a few seconds and retry.',
  PineconeUnavailableError:
    'Pinecone is temporarily unavailable. This is transient — wait a few seconds and retry.',
  PineconeMaxRetriesExceededError:
    'The request kept failing after retries. This is usually transient — wait longer and retry, ' +
    'or tell the user Pinecone appears to be unreachable.',
  PineconeConnectionError:
    'Could not reach Pinecone. This is usually a transient network issue — retry once; ' +
    'if it persists, ask the user to check their network connection and proxy settings.',
};

/**
 * Formats an unknown error value for display in tool error responses.
 * Preserves error messages from Error instances while handling non-Error
 * values, and appends actionable next-step guidance for known Pinecone errors.
 */
export function formatError(e: unknown): string {
  if (!(e instanceof Error)) {
    return String(e);
  }
  const guidance = ERROR_GUIDANCE[e.name];
  return guidance ? `${e.message}\n\nNext step: ${guidance}` : e.message;
}
