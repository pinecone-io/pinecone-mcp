# Complete Pinecone Workflow in Cursor

## Objective

Learn how to set up and use the Pinecone MCP server in Cursor for a complete end-to-end workflow: from initial configuration through index creation, data management, and semantic search.

## Prerequisites

- [Cursor IDE](https://cursor.sh) installed
- [Node.js](https://nodejs.org) v18 or later installed
- Pinecone account with API key from [app.pinecone.io](https://app.pinecone.io)

## Overview

This guide walks you through a complete workflow:
1. Installing and configuring the Pinecone MCP server in Cursor
2. Creating your first index
3. Upserting data
4. Performing searches
5. Using advanced features like reranking and metadata filtering

## Step-by-Step Workflow

### Step 1: Initial Setup

#### 1.1 Verify Prerequisites

Open Cursor's terminal (`` Ctrl+` `` or `` Cmd+` ``) and verify Node.js is installed:

```bash
node --version
# Should show v18.0.0 or later

npx --version
# Should show a version number
```

#### 1.2 Get Your Pinecone API Key

1. Navigate to [app.pinecone.io](https://app.pinecone.io)
2. Sign in or create an account
3. Go to "API Keys" section
4. Create a new API key or copy an existing one
5. Keep this key secure - you'll need it in the next step

#### 1.3 Configure MCP Server in Cursor

**Option A: Project-Level Configuration**

Create `.cursor/mcp.json` in your project root:

```bash
mkdir -p .cursor
```

Create or edit `.cursor/mcp.json` with the following content:

```json
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": [
        "-y",
        "@pinecone-database/mcp"
      ],
      "env": {
        "PINECONE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Replace `YOUR_API_KEY_HERE` with your actual Pinecone API key.

**Option B: Global Configuration**

To use Pinecone MCP across all projects, create `.cursor/mcp.json` in your home directory instead:

```bash
# macOS/Linux
mkdir -p ~/.cursor
nano ~/.cursor/mcp.json

# Windows
mkdir %USERPROFILE%\.cursor
notepad %USERPROFILE%\.cursor\mcp.json
```

Use the same JSON configuration as above.

#### 1.4 Verify MCP Server Status

1. Open Cursor Settings (`` Cmd+, `` on macOS, `` Ctrl+, `` on Windows)
2. Navigate to **MCP** section
3. Look for "pinecone" in the list of MCP servers
4. Status should show "Connected" or "Running"
5. If not connected, restart Cursor

#### 1.5 Optional: Configure Cursor Rules

Create a `.cursorrules` file in your project to guide Cursor on using the Pinecone MCP:

```
# .cursorrules
When working with Pinecone:
- Always use the Pinecone MCP server tools for Pinecone operations
- Search Pinecone documentation before implementing solutions
- Use integrated inference for all index operations
- Include error handling for all Pinecone operations
- Prefer metadata filtering over post-processing results
- Use reranking for improved search quality in user-facing features
```

### Step 2: Create Your First Index

#### 2.1 Open Cursor Chat

Open the AI chat panel:
- Press `` Cmd+L `` (macOS) or `` Ctrl+L `` (Windows)
- Or click the chat icon in the sidebar

#### 2.2 Create an Index

Type this prompt in the chat:

```
Create a new Pinecone index called 'project-docs' using the multilingual-e5-large model
```

#### 2.3 Review the Response

Cursor will use the `create-index-for-model` MCP tool. You should see output like:

```
I've created a new Pinecone index with the following configuration:

Index Name: project-docs
Model: multilingual-e5-large
Dimension: 1024
Metric: cosine
Cloud: aws
Region: us-east-1

The index is now ready for use.
```

#### 2.4 Verify Index Creation

Confirm the index exists:

```
List all my Pinecone indexes and their configurations
```

You should see `project-docs` in the list.

### Step 3: Upsert Data to Your Index

#### 3.1 Prepare Sample Data

For this example, we'll add documentation about a fictional API:

```
Upsert the following API documentation into my 'project-docs' index:

1. "The /users endpoint returns a list of all users. Supports pagination with ?page and ?limit parameters. Requires authentication."

2. "The /auth/login endpoint accepts POST requests with email and password. Returns a JWT token valid for 24 hours."

3. "The /products endpoint returns product catalog. Supports filtering by category, price range, and availability. Results can be sorted by price, name, or popularity."

4. "Rate limits: 100 requests per minute for free tier, 1000 requests per minute for pro tier. Returns 429 status code when exceeded."

5. "Webhook notifications can be configured in the dashboard. Supports events: user.created, order.completed, payment.failed. Payload is JSON with event type and data."
```

#### 3.2 Review Upsert Results

Cursor will process the request and confirm:

```
Successfully upserted 5 records to the 'project-docs' index:
- doc-1: /users endpoint documentation
- doc-2: /auth/login endpoint documentation  
- doc-3: /products endpoint documentation
- doc-4: Rate limits documentation
- doc-5: Webhook documentation

All records are now searchable.
```

### Step 4: Search Your Index

#### 4.1 Basic Search

Try a natural language search:

```
Search my 'project-docs' index for information about authentication
```

#### 4.2 Review Search Results

You should see relevant matches:

```
Found 2 relevant results:

1. Score: 0.87
   "The /auth/login endpoint accepts POST requests with email and password. Returns a JWT token valid for 24 hours."

2. Score: 0.64
   "The /users endpoint returns a list of all users. Supports pagination with ?page and ?limit parameters. Requires authentication."
```

#### 4.3 Try Different Queries

```
# Find information about pagination
Search my 'project-docs' index for "how to paginate results"

# Find information about rate limits
Search my 'project-docs' index for "API request limits"

# Find information about products
Search my 'project-docs' index for "filtering and sorting products"
```

### Step 5: Advanced Features

#### 5.1 Add Metadata for Better Filtering

Upsert data with metadata:

```
Upsert these additional docs to my 'project-docs' index with metadata:

1. Title: "WebSocket Real-time API"
   Text: "Connect to wss://api.example.com/ws for real-time updates. Requires authentication token in connection string."
   Category: "advanced"
   Version: "v2"
   
2. Title: "Batch Operations API"  
   Text: "The /batch endpoint accepts up to 1000 operations in a single request. Useful for bulk imports or updates."
   Category: "advanced"
   Version: "v2"
   
3. Title: "Getting Started Guide"
   Text: "Create an account, generate an API key, and make your first API call in under 5 minutes."
   Category: "tutorial"
   Version: "v1"
```

#### 5.2 Search with Metadata Filtering

```
Search my 'project-docs' index for "API" where category equals "advanced"
```

Should return only the advanced documentation.

#### 5.3 Use Reranking for Better Results

```
Search my 'project-docs' index for "how to set up authentication and make API calls", retrieve 10 results, and rerank them to show the most relevant
```

Reranking will reorder results for optimal relevance.

### Step 6: Check Index Statistics

```
Describe the stats for my 'project-docs' index
```

You'll see information like:

```
Index: project-docs
Total vectors: 8
Dimensions: 1024
Index fullness: 0.01%

Namespaces:
- default: 8 vectors
```

### Step 7: Using Pinecone MCP in Your Code

#### 7.1 Generate Code with Pinecone Integration

Ask Cursor to generate code that uses Pinecone:

```
Create a Python function that searches my Pinecone index for user queries and returns the top 3 results
```

Cursor will generate code and may use the MCP server to verify index configuration:

```python
from pinecone import Pinecone

def search_docs(query: str, top_k: int = 3):
    """Search the project-docs index for relevant documentation."""
    pc = Pinecone(api_key="your-api-key")
    index = pc.Index("project-docs")
    
    results = index.query(
        vector=query,  # With inference, can pass text directly
        top_k=top_k,
        include_metadata=True
    )
    
    return [
        {
            "text": match.metadata.get("text"),
            "score": match.score
        }
        for match in results.matches
    ]

# Example usage
results = search_docs("how to authenticate")
for result in results:
    print(f"Score: {result['score']:.2f}")
    print(f"Text: {result['text']}\n")
```

#### 7.2 Ask Cursor to Improve Code

```
Add error handling to this function and use exponential backoff for retries
```

Cursor will enhance the code with robust error handling.

## Common Workflows in Cursor

### Workflow 1: Documentation Q&A Bot

```
1. User: "Create a Q&A system for our API docs"

2. Cursor (using MCP):
   - Creates index
   - Uploads documentation
   - Generates search function
   - Creates simple web interface
   
3. User: "Add caching for frequently asked questions"

4. Cursor: Updates code with caching layer
```

### Workflow 2: Code Search Engine

```
1. User: "I want to search our codebase semantically"

2. Cursor (using MCP):
   - Creates 'codebase' index
   - Generates script to index all Python files
   - Creates search interface
   
3. User: "Search for 'authentication middleware functions'"

4. Cursor: Searches and shows relevant code snippets
```

### Workflow 3: Knowledge Base Integration

```
1. User: "Integrate our company knowledge base with this chatbot"

2. Cursor (using MCP):
   - Creates 'company-kb' index
   - Uploads knowledge base articles
   - Integrates search into chatbot
   - Adds reranking for better responses
```

## Tips and Tricks

### Using Chat Efficiently

**Reference files:**
```
Search my Pinecone index for content similar to @documentation.md
```

**Multi-step operations:**
```
Create an index called 'support-kb', upsert the contents of @knowledge-base.txt, then search for "password reset"
```

**Batch operations:**
```
Upsert all markdown files from the @docs/ directory into my 'documentation' index
```

### Using Composer for Complex Tasks

For multi-file projects:

1. Open Composer (`` Cmd+I `` or `` Ctrl+I ``)
2. Include relevant files with `@file` or `@folder`
3. Request complex operations:

```
@src/database/ @src/search/ 

Integrate Pinecone search into our existing database layer. Create a new SearchService class that:
1. Connects to our 'product-catalog' index
2. Provides search methods with caching
3. Handles errors gracefully
4. Logs search analytics
```

Composer will modify multiple files simultaneously.

### Debugging with MCP

```
# Check MCP connection
Is my Pinecone MCP server connected? Show me its status.

# Debug queries
Why did my search for "authentication" not return expected results? Show me the query that was sent.

# Verify configuration
What indexes do I have, and what models are they using?
```

### Keyboard Shortcuts

- `` Cmd/Ctrl+L ``: Open chat
- `` Cmd/Ctrl+I ``: Open Composer
- `` Cmd/Ctrl+K ``: Quick edit in file
- `` Cmd/Ctrl+` ``: Toggle terminal

## Common Issues and Solutions

### Issue: MCP Server Not Connecting

**Symptoms:**
- Pinecone tools not available in Cursor
- "pinecone" not showing in MCP settings

**Solutions:**
1. Verify `.cursor/mcp.json` is valid JSON
2. Check that Node.js and npx are in PATH
3. Restart Cursor completely (quit and reopen)
4. Check Cursor logs: **Help > Show Logs**

### Issue: Authentication Errors

**Symptoms:**
- "Invalid API key" errors
- Operations failing with auth errors

**Solutions:**
1. Verify API key in [Pinecone console](https://app.pinecone.io)
2. Check `.cursor/mcp.json` has correct API key
3. Ensure no extra spaces or quotes around key
4. Try regenerating API key in Pinecone console

### Issue: Slow Responses

**Symptoms:**
- Cursor taking long time to respond
- MCP operations timing out

**Solutions:**
1. Check internet connection
2. Verify Pinecone service status
3. Reduce batch sizes for large operations
4. Check Cursor MCP settings for timeout configuration

### Issue: Cursor Not Using MCP Tools

**Symptoms:**
- Cursor generates code instead of using MCP
- MCP tools not being called

**Solutions:**
1. Be explicit in prompts: "Use the Pinecone MCP to search..."
2. Check that MCP server is connected in settings
3. Try rephrasing prompts to be more action-oriented
4. Add Cursor rules to prefer MCP tools (`.cursorrules`)

## Best Practices

### 1. Use .cursorrules for Consistency

Create project-specific rules:

```
# .cursorrules
For Pinecone operations:
- Always use MCP tools instead of generating SDK code
- Search documentation before implementing features
- Use reranking for user-facing search
- Include error handling and retries
- Log operations for debugging
```

### 2. Organize Indexes Logically

```
Development workflow:
- dev-docs (development environment)
- staging-docs (testing)
- prod-docs (production)

Keep indexes separate to avoid cross-environment issues.
```

### 3. Version Control MCP Configuration

Add `.cursor/mcp.json` to `.gitignore` but create a template:

```json
// .cursor/mcp.json.template
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": ["-y", "@pinecone-database/mcp"],
      "env": {
        "PINECONE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Team members copy template to `.cursor/mcp.json` and add their key.

### 4. Leverage Cursor's Context

```
# Good - uses file context
@search.py is failing when querying Pinecone. Fix the error handling and add retries.

# Less effective
Fix my Pinecone search code
```

### 5. Iterative Development

```
1. Start simple:
   "Create a basic Pinecone search function"

2. Add features incrementally:
   "Add metadata filtering to the search function"
   "Add reranking"
   "Add caching"
   "Add error handling"

3. Test and refine:
   "Test the search function with edge cases"
```

## Production Checklist

Before deploying:

- [ ] Remove hardcoded API keys
- [ ] Implement proper error handling
- [ ] Add logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up backup/fallback indexes
- [ ] Test with production-scale data
- [ ] Document search functionality
- [ ] Set up alerts for failures
- [ ] Review security best practices
- [ ] Load test search endpoints

## Next Steps

- [Claude Desktop Workflow](./claude-desktop-workflow.md) - Use Pinecone with Claude Desktop
- [Gemini CLI Workflow](./gemini-cli-workflow.md) - Use Pinecone with Gemini CLI
- [Advanced Patterns](../advanced/) - Explore cascading search, analytics, and error handling

## Related Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [MCP Specification](https://modelcontextprotocol.io/introduction)
- [Pinecone MCP Server Docs](https://docs.pinecone.io/guides/operations/mcp-server)
- [Pinecone API Reference](https://docs.pinecone.io/reference)
