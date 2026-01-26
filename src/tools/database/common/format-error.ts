/**
 * Formats an unknown error value for display in tool error responses.
 * Preserves error messages from Error instances while handling non-Error values.
 */
export function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
