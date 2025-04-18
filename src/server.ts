import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {errorMap} from './error.js';
import addDatabaseTools from './tools/database/index.js';
import addDocsTools from './tools/docs/index.js';
import {PINECONE_MCP_VERSION} from './version.js';

const SERVER_INSTRUCTIONS = `Pinecone is a vector database that provides AI
tools and applications with fast, scalable, and flexible vector search.

Instructions for usage:
- Always search the documentation before attempting to explain or write code for
Pinecone. When writing code, always refer to examples from the documentation. Do
not make assumptions about usage. Always use the latest SDK version.

- If the code uses an index or namespace, make sure you use the correct names I
have configured or help me create new ones.

- Always use a consistent schema for records in an index. Do not use different
field names in the same index. Always put the text content in the field named in
the index's "fieldMap". Do not use objects as field values. Do not include a
"metadata" field.

- When searching for records, make sure to use a query that accurately reflects
my needs. Only use a filter if you are sure it will help me find the records I
need. Craft filters knowing the schema of the data in the index.

- If you receive an error, read the error response to understand what went
wrong. "MCP error -32602" means your input was wrong. Correct your input by
following the instructions carefully.`;

export default async function setupServer() {
  z.setErrorMap(errorMap);

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
