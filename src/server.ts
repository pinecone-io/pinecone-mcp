import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import addDatabaseTools from './tools/database.js';
import addDocsTools from './tools/docs.js';
import {PINECONE_MCP_VERSION} from './version.js';

export default async function setupServer() {
  const server = new McpServer({
    name: 'pinecone',
    version: PINECONE_MCP_VERSION,
  });

  addDatabaseTools(server);
  await addDocsTools(server);

  return server;
}
