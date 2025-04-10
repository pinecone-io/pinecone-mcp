#!/usr/bin/env node
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import setupServer from './server.js';

async function main() {
  const server = await setupServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pinecone MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
