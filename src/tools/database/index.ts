import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {PINECONE_API_KEY} from '../../constants.js';
import {addCascadingSearchTool} from './cascading-search.js';
import {addCreateIndexForModelTool} from './create-index-for-model.js';
import {addDescribeIndexStatsTool} from './describe-index-stats.js';
import {addDescribeIndexTool} from './describe-index.js';
import {addListIndexesTool} from './list-indexes.js';
import {addRerankDocumentsTool} from './rerank-documents.js';
import {addSearchRecordsTool} from './search-records.js';
import {addUpsertRecordsTool} from './upsert-records.js';

export default function addDatabaseTools(server: McpServer) {
  if (!PINECONE_API_KEY) {
    console.error('Skipping database tools -- PINECONE_API_KEY environment variable is not set.');
    return;
  }

  addListIndexesTool(server);
  addDescribeIndexTool(server);
  addDescribeIndexStatsTool(server);
  addCreateIndexForModelTool(server);
  addUpsertRecordsTool(server);
  addSearchRecordsTool(server);
  addRerankDocumentsTool(server);
  addCascadingSearchTool(server);
}
