import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { z } from 'zod';
import { QueryFilter } from './mongodb-schema.js';
const { PINECONE_API_KEY } = process.env;
if (!PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is not set.');
}
const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
});
const server = new McpServer({
    name: 'pinecone',
    version: '1.0.0',
    capabilities: {
        resources: {},
        tools: {},
    },
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
server.tool('describe-index-stats', 'Describe the statistics of a Pinecone index', {
    indexName: z.string().describe('The name of the index'),
}, async ({ indexName }) => {
    const index = pc.index(indexName);
    const indexStats = await index.describeIndexStats();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(indexStats),
            },
        ],
    };
});
server.tool('create-index-for-model', 'Create a Pinecone index for a specific model', {
    indexName: z.string().describe('The name of the index to create'),
    model: z.enum(['llama-text-embed-v2', 'multilingual-e5-large', 'pinecone-sparse-english-v0']),
}, async ({ indexName, model }) => {
    // Check if the index already exists
    const existingIndexes = await pc.listIndexes();
    if (existingIndexes.indexes?.find((index) => index.name === indexName)) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Index "${indexName}" already exists.`,
                },
            ],
        };
    }
    // Create the new index
    const indexInfo = await pc.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
            model,
            fieldMap: { text: 'chunk_text' },
        },
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
});
server.tool('upsert', 'Insert or update text data in a Pinecone index', {
    indexName: z.string().describe('The name of the index to upsert into'),
    namespace: z.string().describe('The namespace to upsert into'),
    data: z.array(z.object({
        id: z.string().describe('The id of the data'),
        text: z.string().describe('The text data to upsert'),
        metadata: z
            .record(z.string().describe('The key of the metadata field'), z.string().describe('The value of the metadata field'))
            .describe('Metadata to associate with the data'),
    })),
}, async ({ indexName, namespace, data }) => {
    const ns = pc.index(indexName).namespace(namespace);
    const toUpsert = data.map((d) => ({
        id: d.id,
        chunk_text: d.text,
        ...d.metadata,
    }));
    await ns.upsertRecords(toUpsert);
    return {
        content: [{ type: 'text', text: 'Data upserted successfully' }],
    };
});
server.tool('search', 'Search an namespace for records that are similar to the query text', {
    indexName: z.string().describe('The name of the index to search'),
    namespace: z.string().describe('The namespace to search'),
    query: z.string().describe('The query text to search for'),
    topK: z.number().describe('The number of results to return'),
    fields: z.array(z.string()).optional().describe('The fields to return'),
    /* rerank: z
      .object({
        model: z
          .enum(['cohere-rerank-3.5', 'bge-reranker-v2-m3', 'pinecone-rerank-v0'])
          .describe('The reranker model to use'),
        rankFields: z.array(z.string()).max(1).describe('The field to rerank by. Only one field is supported.'),
        topN: z.number().optional().describe('The number of reranked results to return'),
        query: z
          .string()
          .optional()
          .describe('A query to use for reranking, which will override the original query'),
      })
      .optional()
      .describe('Optional reranking parameters'), */
    filter: QueryFilter.optional().describe('Optional metadata filter to apply to the search'),
}, async ({ indexName, namespace, query, topK, fields, filter,
//rerank
 }) => {
    console.error(filter);
    const ns = pc.index(indexName).namespace(namespace);
    const results = await ns.searchRecords({ query: { topK, inputs: { text: query, filter } }, fields });
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(results),
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Pinecone MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
