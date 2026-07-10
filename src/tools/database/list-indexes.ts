import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {formatError} from './common/format-error.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `List all Pinecone indexes in the project, including each
index's configuration and readiness status. Use this to discover valid index
names before calling other tools.`;

export function addListIndexesTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'list-indexes',
    {
      title: 'List Indexes',
      description: INSTRUCTIONS,
      inputSchema: {},
      annotations: {readOnlyHint: true},
    },
    async (_, pc) => {
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
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
