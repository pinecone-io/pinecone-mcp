import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `List all Pinecone indexes`;

export function addListIndexesTool(server: McpServer) {
  registerDatabaseTool(server, 'list-indexes', {description: INSTRUCTIONS, inputSchema: {}}, async (_, pc) => {
    try {
      const indexes = await pc.listIndexes();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(indexes, null, 2),
          },
        ],
      };
    } catch (e) {
      return {isError: true, content: [{type: 'text' as const, text: String(e)}]};
    }
  });
}
