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
    // Register the tools anyway: each call will return an actionable error,
    // which keeps the failure visible to the connected agent instead of the
    // tools silently disappearing from the tool list.
    console.error(
      'Warning: PINECONE_API_KEY environment variable is not set. Database tools will return an error until it is provided.',
    );
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
