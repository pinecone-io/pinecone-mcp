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
- [Error Handling](./examples/advanced/error-handling.md) - Build resilient applications with proper error handling

### Integration Workflows
- [Cursor Workflow](./examples/integrations/cursor-workflow.md) - Complete setup and usage in Cursor IDE
- [Claude Desktop Workflow](./examples/integrations/claude-desktop-workflow.md) - End-to-end workflow in Claude Desktop
- [Gemini CLI Workflow](./examples/integrations/gemini-cli-workflow.md) - Command-line usage with Gemini CLI

Each tutorial includes step-by-step instructions, expected outputs, troubleshooting tips, and real-world examples.

## Troubleshooting

If you encounter issues:

- Ensure Node.js v18 or later is installed and `npx` is in your PATH
- Verify your Pinecone API key is correct in the [console](https://app.pinecone.io)
- Check that your MCP configuration file has valid JSON syntax
- Restart your AI tool after making configuration changes
- The MCP server only supports indexes with integrated inference

For detailed troubleshooting steps, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Contributing

We welcome your collaboration in improving the developer MCP experience. Please submit issues in the [GitHub issue tracker](https://github.com/pinecone-io/pinecone-mcp/issues). Information about contributing can be found in [CONTRIBUTING.md](CONTRIBUTING.md).
