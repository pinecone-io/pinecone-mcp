import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {DOCS_SSE_URL, PINECONE_DOCS_API_KEY} from '../constants.js';
import {PINECONE_MCP_VERSION} from '../version.js';
import {SearchDocsRequest} from './schema/SearchDocsRequest.js';

type SearchDocsResult = {
  content: {
    type: 'text';
    text: string;
  }[];
};

export default async function addDocsTools(server: McpServer) {
  if (!PINECONE_DOCS_API_KEY) {
    console.error('Skipping docs tools -- PINECONE_DOCS_API_KEY environment variable is not set.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${PINECONE_DOCS_API_KEY}`,
  };

  const sseTransport = new SSEClientTransport(new URL(DOCS_SSE_URL), {
    eventSourceInit: {
      fetch: (...props: Parameters<typeof fetch>) => {
        const [url, init = {}] = props;
        return fetch(url, {...init, headers: {...init.headers, ...headers}});
      },
    },
    requestInit: {
      headers,
    },
  });

  const client = new Client({
    name: 'pinecone-mcp',
    version: PINECONE_MCP_VERSION,
  });

  await client.connect(sseTransport);

  server.tool('search-docs', 'Search the Pinecone docs', SearchDocsRequest, async ({query}) => {
    return (await client.callTool({
      name: 'get_context',
      arguments: {query},
    })) as SearchDocsResult;
  });
}
