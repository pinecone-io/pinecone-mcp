import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = `This tool describes the statistics of a Pinecone index.
Use this tool to get an overview of the index's size, or to determine the
namespaces that exist within the index. The response contains the following
fields:
- "totalRecordCount" is the total number of records in the index.
- "namespaces" breaks down the record count by namespace.`;

const SCHEMA = {
  name: z.string().describe('The name of the index to describe.'),
};

export function addDescribeIndexStatsTool(server: McpServer, pc: Pinecone) {
  server.tool('describe-index-stats', INSTRUCTIONS, SCHEMA, async ({name}) => {
    const indexInfo = await pc.describeIndex(name);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexInfo, ['namespaces', 'dimension', 'totalRecordCount'], 2),
        },
      ],
    };
  });
}
