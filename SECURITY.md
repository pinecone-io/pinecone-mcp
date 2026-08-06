# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, report them privately to the Pinecone security team at
**security@pinecone.io**, or via the ["Report a vulnerability"](https://github.com/pinecone-io/pinecone-mcp/security/advisories/new)
button on this repository's Security tab.

Include as much of the following as you can to help us triage quickly:

- The affected version (`@pinecone-database/mcp`) and environment.
- A description of the issue and its potential impact.
- Steps to reproduce, or a proof of concept.

We will acknowledge your report, keep you informed of our progress, and
coordinate disclosure once a fix is available.

## Supported versions

Security fixes are released against the latest published version of
`@pinecone-database/mcp`. Please upgrade to the latest release before
reporting an issue.

## Handling credentials

This server authenticates to Pinecone using the `PINECONE_API_KEY`
environment variable. Never commit API keys to source control or paste them
into issues, pull requests, or logs. Rotate any key that may have been
exposed via the [Pinecone console](https://app.pinecone.io).
