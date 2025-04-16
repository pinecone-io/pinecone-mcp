import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import addDatabaseTools from './tools/database/index.js';
import addDocsTools from './tools/docs/index.js';
import {PINECONE_MCP_VERSION} from './version.js';

const SERVER_INSTRUCTIONS = `Pinecone is a vector database that provides AI
tools and applications with fast, scalable, and flexible vector search. The
tools provided by this MCP server will help you understand Pinecone, write
effective code that makes use of Pinecone, and configure Pinecone to meet your
application's needs.

Pinecone stores data in indexes. Data is stored as records, which are a set of
fields with values. The index is configured with a field map that specifies
which field is indexed with a vector embedding. The embedded field may store a
text document or a chunk of text from a larger document. This is the only field
that is used for vector search. Other fields may be used to filter results.
Field values should be strings, numbers, booleans, or arrays; they should not be
objects.

If I ask you to write code for Pinecone, use the \`search-docs\` tool first to
find relevant documentation. Make sure you run exhaustive searches and reference
example code snippets that demonstrate proper usage of the latest SDK. If the
code uses an index or namespace, make sure you use the correct names I have
configured or help me create new ones. Use a consistent schema for all records
in a namespace, and make sure that field values are not objects.

If any of these instructions are unclear, or if you need more information on how
to use Pinecone, use the \`search-docs\` tool to find more information.

If you receive an unexpected error:
- Make sure you are following all instructions.
- Read and parse the error response to understand what happened.
- A "ValidationError" (-32602) means you made a mistake in your input. The error
response will include a path that indicates which field is incorrect. Correct
your input and try again.
- Search the documentation for more information.`;

export default async function setupServer() {
  const server = new McpServer(
    {
      name: 'pinecone-mcp',
      version: PINECONE_MCP_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  await addDocsTools(server);
  addDatabaseTools(server);

  return server;
}
