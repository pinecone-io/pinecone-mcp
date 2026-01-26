# Contributing to Pinecone Developer MCP Server

We welcome community contributions to the Pinecone Developer MCP Server! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/your-username/pinecone-mcp.git`
3. Install dependencies: `npm install`
4. Build the MCP server: `npm run build`

## Testing

Run the test suite to ensure your changes don't break existing functionality:

```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npm run test:watch
```

## Code Quality

Before submitting a pull request, ensure your code passes linting and formatting checks:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors where possible
npm run lint:fix

# Format code with Prettier
npm run format
```

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

1. Create a new branch for your changes (see [Branch naming](#branch-naming) below).
2. Make your changes.
3. Run `npm test` to ensure tests pass.
4. Test your changes with MCP Inspector or an AI tool.
5. Run `npm run format` to format your code.
6. Submit a pull request.

## Branch naming

Use descriptive branch names that include the issue number when applicable:

- `feature/add-new-tool` - for new features
- `fix/handle-empty-response` - for bug fixes
- `docs/update-readme` - for documentation changes
- `username/issue-123-description` - when working on a specific issue

## Commit messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit message should be structured as:

```
<type>(<optional scope>): <description>

[optional body]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build scripts, etc.)

**Examples:**
```
feat(tools): add cascading-search tool
fix: handle empty API response gracefully
docs: add troubleshooting section to README
test: add unit tests for rerank-documents
```

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
