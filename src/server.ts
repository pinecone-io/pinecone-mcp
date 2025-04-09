import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import addDatabaseTools from './tools/database.js';
import addDocsTools from './tools/docs.js';
import {PINECONE_MCP_VERSION} from './version.js';

const SERVER_INSTRUCTIONS = `This MCP server will help you write code for
Pinecone, and allows you to manage Pinecone indexes and documents.

Whenever I ask for code for Pinecone, use the \`search-docs\` tool to find
relevant documentation. Make sure you run exhaustive searches and ensure you
find proper syntax with the latest version of an SDK. Before writing any code,
make sure you're referencing example code snippets as much as possible. Do not
make up field names or values. Always search for the latest version of an SDK
and make sure you use that (for example, use \`pip install pinecone\`, which
is v6.0.0+, and not \`pip install pinecone-client\`).

If I need you to help me manage my Pinecone indexes, you can use any of the
index-related tools. \`list-indexes\` will list all of my indexes, and
\`describe-index\` will describe a specific index. \`describe-index-stats\` will
describe the statistics of a specific index and its namespaces. To create a new
index, use \`create-index-for-model\`, which will use an embedding model to
represent text as vectors.

To insert documents into an index, use \`upsert-records\`. Make sure that you
use a consistent schema for all documents in a namespace. Only the field
specified in the index's \`fieldMap\` will be embedded as a vector. Other fields
can be used for metadata filtering. Field values should be strings, numbers,
booleans, or arrays; they should not be objects.

To search for documents in an index, use \`search-records\`. Make sure to use a
query that accurately represents my request, and is not too specific or too
broad. For complicated requests, you may need to use metadata filtering or
reranking.
* Metadata filtering can be used to narrow down results, but is not always
required. Use your discretion. Overly specific or inaccurate metadata filters
will yield poor results. Metadata filtering should only be used if I need a
specific value or range of values. Make sure that the fields you filter on are
present in the records, and that they contain the expected values and value
types.
* Reranking can help determine which records are most relevant to the query. To
use a reranker, provide the \`rerank\` parameter to the \`search-records\` tool.
Rerankers are especially useful when the query returns lots of results, and it
is difficult to determine which ones are most relevant.

If any of these instructions are unclear, or if you need more information on how
to use the tools, or if you receive unexpected errors, use the \`search-docs\`
tool to find more information.`;

export default async function setupServer() {
  const server = new McpServer(
    {
      name: 'pinecone',
      version: PINECONE_MCP_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  addDatabaseTools(server);
  await addDocsTools(server);

  return server;
}
