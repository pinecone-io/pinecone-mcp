# Pinecone Developer MCP Server

[![npm version](https://img.shields.io/npm/v/@pinecone-database/mcp.svg)](https://www.npmjs.com/package/@pinecone-database/mcp)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/pinecone-io/pinecone-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/pinecone-io/pinecone-mcp/actions/workflows/ci.yml)

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) is a standard that allows coding assistants and other AI tools to interact with platforms like Pinecone. The Pinecone Developer MCP Server allows you to connect these tools with Pinecone projects and documentation.

Once connected, AI tools can:
* Search [Pinecone documentation](https://docs.pinecone.io) to answer questions accurately.
* Help you configure indexes based on your application's needs.
* Generate code informed by your index configuration and data, as well as Pinecone documentation and examples.
* Upsert and search for data in indexes, allowing you to test queries and evaluate results within your dev environment.

See the [docs](https://docs.pinecone.io/guides/operations/mcp-server) for more detailed information.

This MCP server is focused on improving the experience of developers working with Pinecone as part of their technology stack. It is intended for use with coding assistants. Pinecone also offers the [Assistant MCP](https://github.com/pinecone-io/assistant-mcp), which is designed to provide AI assistants with relevant context sourced from your knowledge base.

## Setup

To configure the MCP server to access your Pinecone project, you will need to generate an API key using the [console](https://app.pinecone.io). Without an API key, your AI tool will still be able to search documentation. However, it will not be able to manage or query your indexes.

The MCP server requires [Node.js](https://nodejs.org) v18 or later. Ensure that `node` and `npx` are available in your `PATH`.

Next, you will need to configure your AI assistant to use the MCP server.

### Configure Cursor

To add the Pinecone MCP server to a project, create a `.cursor/mcp.json` file in the project root (if it doesn't already exist) and add the following configuration:

```json
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": [
        "-y", "@pinecone-database/mcp"
      ],
      "env": {
        "PINECONE_API_KEY": "<your pinecone api key>"
      }
    }
  }
}
```

You can check the status of the server in **Cursor Settings > MCP**.

To enable the server globally, add the configuration to the `.cursor/mcp.json` in your home directory instead.

It is recommended to use rules to instruct Cursor on proper usage of the MCP server. Check out the [docs](https://docs.pinecone.io/guides/operations/mcp-server#configure-cursor) for some suggestions.

### Configure Claude desktop

Use Claude desktop to locate the `claude_desktop_config.json` file by navigating to **Settings > Developer > Edit Config**. Add the following configuration:

```json
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": [
        "-y", "@pinecone-database/mcp"
      ],
      "env": {
        "PINECONE_API_KEY": "<your pinecone api key>"
      }
    }
  }
}
```

Restart Claude desktop. On the new chat screen, you should see a hammer (MCP) icon appear with the new MCP tools available.

### Use as a Gemini CLI extension

To install this as a [Gemini CLI](https://github.com/google-gemini/gemini-cli) extension, run the following command:

```bash
gemini extensions install https://github.com/pinecone-io/pinecone-mcp
```

You will need to provide your Pinecone API key in the `PINECONE_API_KEY` environment variable.

```bash
export PINECONE_API_KEY=<your pinecone api key>
```

When you run `gemini` and press `ctrl+t`, `pinecone` should now be shown in the list of installed MCP servers.

## Usage

Once configured, your AI tool will automatically make use of the MCP to interact with Pinecone. You may be prompted for permission before a tool can be used.

### Example prompts

Here are some prompts you can try with your AI assistant:

- "Search the Pinecone docs for information about metadata filtering"
- "List all my Pinecone indexes and describe their configurations"
- "Create a new index called 'my-docs' using the multilingual-e5-large model"
- "Upsert these documents into my index: [paste your documents]"
- "Search my index for records related to 'authentication best practices'"
- "What namespaces exist in my index, and how many records are in each?"

### Tools

Pinecone Developer MCP Server provides the following tools for AI assistants to use:
- `search-docs`: Search the official Pinecone documentation.
- `list-indexes`: Lists all Pinecone indexes.
- `describe-index`: Describes the configuration of an index.
- `describe-index-stats`: Provides statistics about the data in the index, including the  number of records and available namespaces.
- `create-index-for-model`: Creates a new index that uses an integrated inference model to embed text as vectors.
- `upsert-records`: Inserts or updates records in an index with integrated inference.
- `search-records`: Searches for records in an index based on a text query, using integrated inference for embedding. Has options for metadata filtering and reranking.
- `cascading-search`: Searches for records across multiple indexes, deduplicating and reranking the results.
- `rerank-documents`: Reranks a collection of records or text documents using a specialized reranking model.

### Limitations

Only indexes with integrated inference are supported. Assistants, indexes without integrated inference, standalone embeddings, and vector search are not supported.

## Examples

Learn how to use the Pinecone MCP server with comprehensive tutorials and workflow guides:

### Quickstart Tutorials
- [Creating Your First Index](./examples/quickstart/create-index.md) - Set up a Pinecone index with integrated inference
- [Upserting Records and Basic Search](./examples/quickstart/upsert-search.md) - Add data and perform semantic searches
- [Using Reranking](./examples/quickstart/reranking.md) - Improve search relevance with reranking models

### Advanced Patterns
- [Cascading Search](./examples/advanced/cascading-search.md) - Search across multiple indexes with deduplication
- [Analytics Tracking](./examples/advanced/analytics-tracking.md) - Monitor usage with llm_provider and llm_model parameters
- [Error Handling](./examples/advanced/error-handling.md) - Build resilient applications with proper error handling

### Integration Workflows
- [Cursor Workflow](./examples/integrations/cursor-workflow.md) - Complete setup and usage in Cursor IDE
- [Claude Desktop Workflow](./examples/integrations/claude-desktop-workflow.md) - End-to-end workflow in Claude Desktop
- [Gemini CLI Workflow](./examples/integrations/gemini-cli-workflow.md) - Command-line usage with Gemini CLI

Each tutorial includes step-by-step instructions, expected outputs, troubleshooting tips, and real-world examples.

## Troubleshooting

### MCP server not appearing in your AI tool

**Symptoms:**
- MCP tools not available in your AI assistant
- No Pinecone option when checking connected servers

**Solutions:**
- Ensure Node.js v18 or later is installed: `node --version`
- Verify `npx` is available in your PATH: `which npx` (Unix) or `where npx` (Windows)
- Check that your configuration file is in the correct location and has valid JSON syntax
- Validate JSON syntax using [JSONLint](https://jsonlint.com)
- Restart your AI tool completely after making configuration changes
- Check logs for detailed error messages:
  - **Cursor**: Settings > MCP > View Logs
  - **Claude Desktop**: Check log files in `~/Library/Logs/Claude/` (macOS) or `%APPDATA%\Claude\logs\` (Windows)

### "Invalid API key" or authentication errors

**Symptoms:**
- Authentication failed messages
- "Invalid API key" errors when attempting operations

**Solutions:**
- Verify your API key is correct in the [Pinecone console](https://app.pinecone.io)
- Check that the `PINECONE_API_KEY` environment variable is set correctly in your MCP configuration
- Ensure there are no extra spaces or quotes around the API key value
- Try regenerating your API key in the Pinecone console
- Verify the API key has the necessary permissions for your operations

### Tools not working as expected

**Symptoms:**
- Operations failing on certain indexes
- Unexpected errors during upsert or search

**Solutions:**
- The MCP server only supports indexes with integrated inference. If you're trying to use a serverless index without integrated inference, you'll need to create a new index with an embedding model
- Check the MCP server logs for error messages. In Cursor, view logs in **Cursor Settings > MCP**
- Verify the index exists: prompt your assistant to "List all my Pinecone indexes"
- Check that you're using correct index and namespace names (case-sensitive)

### Connection issues

**Symptoms:**
- Timeout errors when connecting to Pinecone
- DNS resolution failures
- Network unreachable errors

**Solutions:**
- Check your internet connection
- If using a corporate network, ensure your firewall allows connections to `api.pinecone.io`
- Verify there are no proxy configuration issues
- Check Pinecone service status at [status.pinecone.io](https://status.pinecone.io)
- Try running the server manually to see detailed error output: `PINECONE_API_KEY=<your-key> npx @pinecone-database/mcp`

### Validation errors

**Symptoms:**
- "Validation failed" errors
- Missing required fields errors
- Type mismatch errors

**Common causes and solutions:**
- **Missing text field**: Ensure all records include the required `text` field when upserting
- **Invalid metadata**: Check that metadata values are the correct type (string, number, boolean)
- **Malformed filters**: Verify filter syntax when searching with metadata filters
- **Dimension mismatch**: Ensure you're using the correct embedding model for your index

### Performance issues

**Symptoms:**
- Slow query responses
- Timeouts during operations
- High latency

**Solutions:**
- Check your internet connection speed
- Verify you're not hitting rate limits (see Pinecone console for usage)
- For large batch operations, split into smaller chunks
- Consider using metadata filters to reduce result set size
- Check if reranking large result sets is causing slowdowns
- Verify index is in the optimal region for your location

### Rate limit errors

**Symptoms:**
- "429 Too Many Requests" errors
- "Rate limit exceeded" messages

**Solutions:**
- Implement exponential backoff in retry logic
- Batch operations instead of individual requests
- Add delays between bulk operations
- Check your plan limits in the Pinecone console
- Consider upgrading your Pinecone plan for higher limits
- Monitor API usage to identify bottlenecks

### Quota exceeded errors

**Symptoms:**
- "Storage quota exceeded" errors
- "Maximum number of indexes reached" errors

**Solutions:**
- Review your usage in the Pinecone console
- Delete unused indexes or old data
- Upgrade your Pinecone plan if needed
- Optimize data storage by removing duplicates or unnecessary metadata
- Check if you're approaching vector count limits for your index

For more detailed troubleshooting guidance, see the [Error Handling tutorial](./examples/advanced/error-handling.md).

## Contributing

We welcome your collaboration in improving the developer MCP experience. Please submit issues in the [GitHub issue tracker](https://github.com/pinecone-io/pinecone-mcp/issues). Information about contributing can be found in [CONTRIBUTING.md](CONTRIBUTING.md).
