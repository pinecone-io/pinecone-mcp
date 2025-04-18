import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = 'Describe the statistics of a Pinecone index and its namespaces';

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexStatsTool(server: McpServer, pc: Pinecone) {
  server.tool('describe-index-stats', INSTRUCTIONS, SCHEMA, async ({name}) => {
    const index = pc.index(name);
    const indexStats = await index.describeIndexStats();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({...indexStats, indexFullness: undefined}, null, 2),
        },
      ],
    };
  });
}
