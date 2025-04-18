# Contributing to Pinecone Developer MCP Server

We welcome community contributions to the Pinecone Developer MCP Server! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/your-username/pinecone-mcp.git`
3. Install dependencies: `npm install`
4. Build the MCP server: `npm run build`

## Running the MCP server

To enable database features, you will need to generate an API key in the [Pinecone console](https://app.pinecone.io). Replace `<your-api-key>` in the following instructions with the API key value.

Run the server:
```
PINECONE_API_KEY=<your-api-key> npm start
```

Using MCP Inspector:
```
npx @modelcontextprotocol/inspector -e PINECONE_API_KEY=<your-api-key> npm start
```

Test with an AI tool or coding assistant:
```
{
  "mcpServers": {
    "pinecone": {
      "command": "node",
      "args": [
        "/path/to/pinecone-mcp/dist/index.js"
      ],
      "env": {
        "PINECONE_API_KEY": "<your-api-key>",
      }
    }
  }
}
```

## Development process
1. Create a new branch for your changes.
2. Make your changes.
3. Test your changes with MCP Inspector or an AI tool.
4. Run `npm run format` to format your code.
5. Submit a pull request.

## Pull request guidelines
- Follow existing code style.
- Update documentation as needed.
- Keep changes focused.
- Provide a clear description of changes.

## Reporting issues
- Use the [GitHub issue tracker](https://github.com/pinecone-io/pinecone-mcp/issues).
- Search for existing issues before creating a new one.
- Provide clear reproduction steps.

## License
By contributing to this project, you agree that your contributions will be licensed under the [Apache License version 2.0](LICENSE).
