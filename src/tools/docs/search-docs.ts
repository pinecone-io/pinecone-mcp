import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {DOCS_MCP_URL} from '../../constants.js';
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

let docsClient: Client | null = null;

async function getDocsClient(): Promise<Client> {
  if (!docsClient) {
    const httpTransport = new StreamableHTTPClientTransport(new URL(DOCS_MCP_URL));
    docsClient = new Client({
      name: 'pinecone-docs',
      version: PINECONE_MCP_VERSION,
    });
    await docsClient.connect(httpTransport);
  }
  return docsClient;
}

export function addSearchDocsTool(server: McpServer) {
  server.tool('search-docs', INSTRUCTIONS, SCHEMA, async ({query}) => {
    const client = await getDocsClient();

    return (await client.callTool({
      name: 'get_context',
      arguments: {query},
    })) as SearchDocsResult;
  });
}

// For testing: reset the cached client
export function resetDocsClient() {
  docsClient = null;
}
