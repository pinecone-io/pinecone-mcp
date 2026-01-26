import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = 'Describe the statistics of a Pinecone index and its namespaces';

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexStatsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'describe-index-stats',
    {description: INSTRUCTIONS, inputSchema: SCHEMA},
    async (args, pc) => {
      const {name} = args as {name: string};
      try {
        const index = pc.index(name);
        const indexStats = await index.describeIndexStats();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({...indexStats, indexFullness: undefined}, null, 2),
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
