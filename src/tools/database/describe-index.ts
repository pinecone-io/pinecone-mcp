import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = 'Describe the configuration of a Pinecone index';

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexTool(server: McpServer, pc: Pinecone) {
  server.tool('describe-index', INSTRUCTIONS, SCHEMA, async ({name}) => {
    const indexInfo = await pc.describeIndex(name);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexInfo, null, 2),
        },
      ],
    };
  });
}
