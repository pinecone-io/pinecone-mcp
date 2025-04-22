import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {DOCS_SSE_URL} from '../../constants.js';
import {PINECONE_MCP_VERSION} from '../../version.js';

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

export function addSearchDocsTool(server: McpServer) {
  server.tool('search-docs', INSTRUCTIONS, SCHEMA, async ({query}) => {
    const sseTransport = new SSEClientTransport(new URL(DOCS_SSE_URL));

    const client = new Client({
      name: 'pinecone-docs',
      version: PINECONE_MCP_VERSION,
    });

    await client.connect(sseTransport);

    return (await client.callTool({
      name: 'get_context',
      arguments: {query},
    })) as SearchDocsResult;
  });
}
