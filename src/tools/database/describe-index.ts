import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {INDEX_CONFIG_DESCRIPTION} from './common/index-config.js';
import {z} from 'zod';

const INSTRUCTIONS = `This tool describes the configuration of a Pinecone index.
${INDEX_CONFIG_DESCRIPTION}`;

const SCHEMA = {
  name: z.string().describe('The name of the index to describe.'),
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
