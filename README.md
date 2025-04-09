# Pinecone MCP Server

TODO

## Setup

Build the server:
```
npm run build
```

Configure Claude or Cursor:
```
{
  "mcpServers": {
    "pinecone": {
      "command": "node",
      "args": [
        "/path/to/pinecone-mcp/build/index.js"
      ],
      "env": {
        "PINECONE_API_KEY": "your pinecone api key here"
      }
    }
  }
}
```
