const DOCS_ASSISTANT_BASE_URL = 'https://prod-1-data.ke.pinecone.io';
const DOCS_ASSISTANT_NAME = 'pinecone-docs';
export const DOCS_SSE_URL = `${DOCS_ASSISTANT_BASE_URL}/mcp/assistants/${DOCS_ASSISTANT_NAME}/sse`;

export const {PINECONE_API_KEY, PINECONE_DOCS_API_KEY} = process.env;
