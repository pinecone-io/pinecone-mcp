import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {FRESHNESS_NOTE} from './common/messages.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `Describe the statistics of a Pinecone index, including
record counts per namespace. Use this to discover which namespaces exist in an
index. ${FRESHNESS_NOTE}`;

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexStatsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'describe-index-stats',
    {
      title: 'Describe Index Stats',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: true},
    },
    async (args, pc) => {
      const {name} = args as {name: string};
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
    },
  );
}
