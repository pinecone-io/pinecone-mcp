import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import addDatabaseTools from './tools/database.js';
import {PINECONE_MCP_VERSION} from './version.js';

export default function setupServer() {
  const server = new McpServer({
    name: 'pinecone',
    version: PINECONE_MCP_VERSION,
  });

  addDatabaseTools(server);

  return server;
}
