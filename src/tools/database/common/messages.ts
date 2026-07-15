/**
 * Shared eventual-consistency caveat surfaced to calling agents wherever
 * recently-written data may not be visible yet. Kept in one place so the
 * guidance cannot drift between tools.
 */
export const FRESHNESS_NOTE = `Newly upserted records can take a few seconds
to be indexed and become visible to search results and index stats; if recent
data is missing, wait briefly and retry.`;
