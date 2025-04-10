# Pinecone MCP Server

The Model Context Protocol (MCP) is a standard for AI tools to interact with
platforms like Pinecone. The Pinecone MCP server allows you to connect your AI
tool with your Pinecone project.

_Note: This project is still in pre-release. Expect limitations and/or breaking
changes._

## Capabilities
* **Documentation search:** AI tools can search
[Pinecone documentation](https://docs.pinecone.io) to generate better, more
accurate code.
* **Index & data management:** AI tools can manage Pinecone indexes and upsert
data on your behalf.
* **Search data:** AI tools can search your indexes for relevant data.

### Limitations
Only indexes with integrated inference are supported. Indexes without integrated
inference, standalone embeddings, and vector search are not supported.

## Setup

### Prerequisites

To configure the Pinecone MCP to access your project, you will need to generate
an API key using the [Pinecone console](https://app.pinecone.io). Without an API
key, your AI tool will still be able to search Pinecone documentation. However,
it will not be able to manage or query your indexes.

_Currently, the documentation search requires an API key for the `pinecone-docs`
assistant. Before release, this requirement will be removed._

The Pinecone MCP server requires [Node.js](https://nodejs.org). Ensure that
`node` and `npx` are available in your `PATH`.

### Configure your AI tool

#### Claude desktop

Use Claude desktop to locate the `claude_desktop_config.json` file by navigating
to `Settings > Developer > Edit Config`. Add the following configuration:

```
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": [
        "-y", "@pinecone-database/mcp"
      ],
      "env": {
        "PINECONE_API_KEY": "<your pinecone api key>",
        "PINECONE_DOCS_API_KEY": "<api key for pinecone-docs assistant>"
      }
    }
  }
}
```

Restart Claude desktop. On the new chat screen, you should see a hammer (MCP)
icon appear with the new MCP tools available.

#### Cursor

To add the Pinecone MCP server to a project, create a `.cursor/mcp.json` file in
the project root (if it doesn't already exist) and add the following
configuration:

```
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": [
        "-y", "@pinecone-database/mcp"
      ],
      "env": {
        "PINECONE_API_KEY": "<your pinecone api key>",
        "PINECONE_DOCS_API_KEY": "<api key for pinecone-docs assistant>"
      }
    }
  }
}
```

You can check the status of the server in `Cursor Settings > MCP`.

To enable the server globally, add the configuration to the `.cursor/mcp.json`
in your home directory instead.

## Usage
Once configured, your AI tool will automatically make use of the MCP to interact
with Pinecone. You may be prompted for permission before a tool can be used. Try
asking your AI tool to set up an example index, upload sample data, or search
for you!
