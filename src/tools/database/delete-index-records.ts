import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = 'Delete records from a Pinecone index by ID';

const SCHEMA = {
  name: z.string().describe('The index to delete from.'),
  namespace: z.string().describe('The namespace to delete from.'),
  ids: z
    .array(z.string())
    .nonempty()
    .describe('A list of record IDs to delete.'),
};

export function deleteIndexRecordsTool(server: McpServer, pc: Pinecone) {
  server.tool('delete-index-records', INSTRUCTIONS, SCHEMA, async ({name, namespace, ids}) => {
    const ns = pc.index(name).namespace(namespace);
    await ns.deleteMany(ids);
    return {
      content: [{type: 'text', text: 'Records deleted successfully'}],
    };
  });
}
