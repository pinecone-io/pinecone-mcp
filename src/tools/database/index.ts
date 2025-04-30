import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {PINECONE_API_KEY} from '../../constants.js';
import {PINECONE_MCP_VERSION} from '../../version.js';
import {addCascadingSearchTool} from './cascading-search.js';
import {addCreateIndexForModelTool} from './create-index-for-model.js';
import {addDescribeIndexStatsTool} from './describe-index-stats.js';
import {addDescribeIndexTool} from './describe-index.js';
import {addListIndexesTool} from './list-indexes.js';
import {addRerankDocumentsTool} from './rerank-documents.js';
import {addSearchRecordsTool} from './search-records.js';
import {addUpsertRecordsTool} from './upsert-records.js';
import {deleteIndexRecordsTool} from './delete-index-records.js'

export default function addDatabaseTools(server: McpServer) {
  if (!PINECONE_API_KEY) {
    console.error('Skipping database tools -- PINECONE_API_KEY environment variable is not set.');
    return;
  }

  const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
    sourceTag: `pinecone-mcp@${PINECONE_MCP_VERSION}`,
  });

  addListIndexesTool(server, pc);
  addDescribeIndexTool(server, pc);
  addDescribeIndexStatsTool(server, pc);
  addCreateIndexForModelTool(server, pc);
  addUpsertRecordsTool(server, pc);
  addSearchRecordsTool(server, pc);
  addRerankDocumentsTool(server, pc);
  addCascadingSearchTool(server, pc);
}
