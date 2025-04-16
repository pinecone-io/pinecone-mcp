import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';

const INSTRUCTIONS = `This tool searches Pinecone documentation for relevant
information. Use this tool whenever you need to write code that uses Pinecone,
or when you need to understand how Pinecone works.

When writing code that uses Pinecone, make sure to search the docs for
examples that demonstrate proper usage. Make sure to reference the provided code
snippets before generating code. Do not make up field names or values.

Before attempting to explain Pinecone concepts or how Pinecone works, make sure
to search the docs to find up-to-date, accurate information.

Make sure to target your searches with a single, specific topic in mind. For
a complex topic, break it down into smaller topics and search for each of those
individually. For example, if I ask you, "explain how to use the Python SDK to
upsert documents into an index with integrated inference", you could search for
"Python SDK upsert documents" and "integrated inference" individually, and then
combine the information you find.

If you receive unexpected errors, use this tool to search the docs for more
information.`;

const SCHEMA = {
  query: z.string().describe('The query to search for'),
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
