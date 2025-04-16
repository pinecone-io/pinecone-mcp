import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {INDEX_CONFIG_DESCRIPTION} from './common/index-config.js';

const INSTRUCTIONS = `Use this tool to list all of my Pinecone indexes. The
response will contain an "indexes" field with an array of index configuration
objects. ${INDEX_CONFIG_DESCRIPTION}`;

export function addListIndexesTool(server: McpServer, pc: Pinecone) {
  server.tool('list-indexes', INSTRUCTIONS, {}, async ({}) => {
    const indexes = await pc.listIndexes();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indexes, null, 2),
        },
      ],
    };
  });
}
