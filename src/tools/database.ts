import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {PINECONE_API_KEY} from '../constants.js';
import {PINECONE_MCP_VERSION} from '../version.js';
import {CreateIndexForModelRequest} from './schema/CreateIndexForModelRequest.js';
import {DescribeIndexRequest} from './schema/DescribeIndexRequest.js';
import {DescribeIndexStatsRequest} from './schema/DescribeIndexStatsRequest.js';
import {SearchRecordsRequest} from './schema/SearchRecordsRequest.js';
import {UpsertRecordsRequest} from './schema/UpsertRecordsRequest.js';
import {RerankDocumentsRequest} from './schema/RerankDocumentsRequest.js';
import {CascadingSearchRequest} from './schema/CascadingSearchRequest.js';

export default function addDatabaseTools(server: McpServer) {
  if (!PINECONE_API_KEY) {
    console.error('Skipping database tools -- PINECONE_API_KEY environment variable is not set.');
    return;
  }

  const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
    sourceTag: `pinecone-mcp@${PINECONE_MCP_VERSION}`,
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
    'Describe the statistics of a Pinecone index and its namespaces',
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
      const results = await ns.searchRecords({query, rerank});
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

  server.tool(
    'rerank-documents',
    'Rerank a set of documents based on a query',
    RerankDocumentsRequest,
    async ({model, query, documents, options}) => {
      const results = pc.inference.rerank(model, query, documents, options);
      return {
        content: [{type: 'text', text: JSON.stringify(results)}],
      };
    },
  );

  server.tool(
    'cascading-search',
    'Search across multiple indexes/namespaces for records that are similar to the query text, deduplicate and rerank the results',
    CascadingSearchRequest,
    async ({indexes, query, rerank}) => {
      const initialResults = await Promise.all(
        indexes.map(async (index) => {
          const ns = pc.index(index.name).namespace(index.namespace || '');
          const results = await ns.searchRecords({query});
          return results;
        }),
      );

      const deduplicatedResults: Record<string, Record<string, string>> = {};
      for (const results of initialResults) {
        for (const hit of results.result.hits) {
          if (!deduplicatedResults[hit._id]) {
            deduplicatedResults[hit._id] = hit.fields as Record<string, string>;
          }
        }
      }
      const deduplicatedResultsArray = Object.values(deduplicatedResults);

      const rerankedResults = await pc.inference.rerank(
        rerank.model,
        rerank.query || query.inputs.text,
        deduplicatedResultsArray,
        {
          topN: rerank.topN || query.topK,
          rankFields: rerank.rankFields,
        },
      );

      return {
        content: [{type: 'text', text: JSON.stringify(rerankedResults)}],
      };
    },
  );
}
