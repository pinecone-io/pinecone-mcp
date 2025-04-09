import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import setupServer from './server.js';

const server = setupServer();

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pinecone MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
