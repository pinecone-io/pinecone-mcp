import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';

const INSTRUCTIONS = `List all Pinecone indexes`;

export function addListIndexesTool(server: McpServer, pc: Pinecone) {
  server.tool('list-indexes', INSTRUCTIONS, {}, async ({}) => {
    try {
      const indexes = await pc.listIndexes();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(indexes, null, 2),
          },
        ],
      };
    } catch (e) {
      return {isError: true, content: [{type: 'text', text: String(e)}]};
    }
  });
}
