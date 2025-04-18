import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';

const INSTRUCTIONS = 'Search Pinecone documentation for relevant information';

const SCHEMA = {
  query: z.string().describe('The text to search for.'),
};

type SearchDocsResult = {
  content: {
    type: 'text';
    text: string;
  }[];
};

export function addSearchDocsTool(server: McpServer, client: Client) {
  server.tool('search-docs', INSTRUCTIONS, SCHEMA, async ({query}) => {
    return (await client.callTool({
      name: 'get_context',
      arguments: {query},
    })) as SearchDocsResult;
  });
}
