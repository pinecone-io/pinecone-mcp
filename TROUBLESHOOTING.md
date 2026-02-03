# Troubleshooting Guide

This guide provides solutions to common issues when using the Pinecone MCP server.

## MCP Server Not Appearing in Your AI Tool

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

## "Invalid API Key" or Authentication Errors

**Symptoms:**
- Authentication failed messages
- "Invalid API key" errors when attempting operations

**Solutions:**
- Verify your API key is correct in the [Pinecone console](https://app.pinecone.io)
- Check that the `PINECONE_API_KEY` environment variable is set correctly in your MCP configuration
- Ensure there are no extra spaces or quotes around the API key value
- Try regenerating your API key in the Pinecone console
- Verify the API key has the necessary permissions for your operations

## Tools Not Working as Expected

**Symptoms:**
- Operations failing on certain indexes
- Unexpected errors during upsert or search

**Solutions:**
- The MCP server only supports indexes with integrated inference. If you're trying to use a serverless index without integrated inference, you'll need to create a new index with an embedding model
- Check the MCP server logs for error messages. In Cursor, view logs in **Cursor Settings > MCP**
- Verify the index exists: prompt your assistant to "List all my Pinecone indexes"
- Check that you're using correct index and namespace names (case-sensitive)

## Connection Issues

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

## Validation Errors

**Symptoms:**
- "Validation failed" errors
- Missing required fields errors
- Type mismatch errors

**Common causes and solutions:**
- **Missing text field**: Ensure all records include the required `text` field when upserting
- **Invalid metadata**: Check that metadata values are the correct type (string, number, boolean)
- **Malformed filters**: Verify filter syntax when searching with metadata filters
- **Dimension mismatch**: Ensure you're using the correct embedding model for your index

## Performance Issues

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

## Rate Limit Errors

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

## Quota Exceeded Errors

**Symptoms:**
- "Storage quota exceeded" errors
- "Maximum number of indexes reached" errors

**Solutions:**
- Review your usage in the Pinecone console
- Delete unused indexes or old data
- Upgrade your Pinecone plan if needed
- Optimize data storage by removing duplicates or unnecessary metadata
- Check if you're approaching vector count limits for your index

## Additional Resources

- [Error Handling Tutorial](./examples/advanced/error-handling.md) - Comprehensive guide to error handling patterns
- [Pinecone Documentation](https://docs.pinecone.io) - Official Pinecone documentation
- [GitHub Issues](https://github.com/pinecone-io/pinecone-mcp/issues) - Report bugs or request features
