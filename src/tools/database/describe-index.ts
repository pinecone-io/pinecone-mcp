import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `Describe the configuration of a Pinecone index, including
its embedding model and the "fieldMap" that names the record field holding the
text to embed. Call this before upsert-records to learn the required field
name. Check "status.ready" in the response to confirm the index can accept
upserts and queries.`;

const SCHEMA = {
  name: z.string().describe('The index to describe.'),
};

export function addDescribeIndexTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'describe-index',
    {
      title: 'Describe Index',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: true},
    },
    async (args, pc) => {
      const {name} = args as {name: string};
      const indexInfo = await pc.describeIndex(name);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(indexInfo, null, 2),
          },
        ],
      };
    },
  );
}
