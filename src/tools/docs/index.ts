import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {DOCS_SSE_URL} from '../../constants.js';
import {PINECONE_MCP_VERSION} from '../../version.js';
import {addSearchDocsTool} from './search-docs.js';

export default async function addDocsTools(server: McpServer) {
  const sseTransport = new SSEClientTransport(new URL(DOCS_SSE_URL));

  const client = new Client({
    name: 'pinecone-docs',
    version: PINECONE_MCP_VERSION,
  });

  await client.connect(sseTransport);

  addSearchDocsTool(server, client);
}
