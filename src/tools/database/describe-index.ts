import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = 'Describe the configuration of a Pinecone index';

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'describe-index',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async (args, pc) => {
      const {name} = args as {name: string};
      try {
        const indexInfo = await pc.describeIndex(name);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(indexInfo, null, 2),
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
