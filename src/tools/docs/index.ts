import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {addSearchDocsTool} from './search-docs.js';

export default async function addDocsTools(server: McpServer) {
  addSearchDocsTool(server);
}
