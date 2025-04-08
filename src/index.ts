import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {CreateIndexForModelRequest} from './schema/CreateIndexForModelRequest.js';
import {DescribeIndexRequest} from './schema/DescribeIndexRequest.js';
import {DescribeIndexStatsRequest} from './schema/DescribeIndexStatsRequest.js';
import {UpsertRecordsRequest} from './schema/UpsertRecordsRequest.js';
import {PINECONE_MCP_VERSION} from './version.js';
import {SearchRecordsRequest} from './schema/SearchRecordsRequest.js';
const {PINECONE_API_KEY} = process.env;
if (!PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY environment variable is not set.');
}

const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
  sourceTag: `pinecone-mcp@${PINECONE_MCP_VERSION}`,
});

const server = new McpServer({
  name: 'pinecone',
  version: PINECONE_MCP_VERSION,
});

server.tool('list-indexes', 'List all Pinecone indexes', {}, async ({}) => {
  const indexes = await pc.listIndexes();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(indexes),
      },
    ],
  };
});

server.tool(
  'describe-index',
  'Describe the configuration of a Pinecone index',
  DescribeIndexRequest,
  async ({name}) => {
    const indexInfo = await pc.describeIndex(name);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexInfo),
        },
      ],
    };
  },
);

server.tool(
  'describe-index-stats',
  'Describe the statistics of a Pinecone index',
  DescribeIndexStatsRequest,
  async ({name}) => {
    const index = pc.index(name);
    const indexStats = await index.describeIndexStats();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexStats),
        },
      ],
    };
  },
);

server.tool(
  'create-index-for-model',
  'Create a Pinecone index for a specific model',
  CreateIndexForModelRequest,
  async ({name, embed}) => {
    // Check if the index already exists
    const existingIndexes = await pc.listIndexes();
    if (existingIndexes.indexes?.find((index) => index.name === name)) {
      return {
        content: [
          {
            type: 'text',
            text: `Index "${name}" already exists.`,
          },
        ],
      };
    }

    // Create the new index
    const indexInfo = await pc.createIndexForModel({
      name,
      cloud: 'aws',
      region: 'us-east-1',
      embed,
      waitUntilReady: true,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexInfo),
        },
      ],
    };
  },
);

server.tool(
  'upsert-records',
  'Insert or update records that contain text data into a Pinecone index',
  UpsertRecordsRequest,
  async ({name, namespace, records}) => {
    const ns = pc.index(name).namespace(namespace);
    await ns.upsertRecords(records);
    return {
      content: [{type: 'text', text: 'Data upserted successfully'}],
    };
  },
);

server.tool(
  'search-records',
  'Search a namespace for records that are similar to the query text',
  SearchRecordsRequest,
  async ({name, namespace, query, rerank}) => {
    const ns = pc.index(name).namespace(namespace);
    const results = await ns.searchRecords({
      query,
      rerank: rerank ? {rankFields: ['text'], ...rerank} : undefined,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pinecone MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
