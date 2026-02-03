# Error Handling Patterns and Best Practices

## Objective

Learn how to handle errors gracefully when using the Pinecone MCP server, implement retry logic, and build resilient AI applications that provide good user experience even when things go wrong.

## Prerequisites

- Pinecone MCP server configured
- Basic understanding of Pinecone operations
- AI assistant connected to the MCP server

## Understanding Pinecone MCP Errors

### Common Error Categories

1. **Authentication Errors**: Invalid or missing API key
2. **Validation Errors**: Invalid parameters or data format
3. **Resource Errors**: Index doesn't exist, quota exceeded
4. **Network Errors**: Connection timeouts, DNS failures
5. **Rate Limit Errors**: Too many requests
6. **Server Errors**: Temporary Pinecone service issues

## Error Types and Handling Strategies

### 1. Authentication Errors

#### Error Example
```
Error: Authentication failed - Invalid API key
```

#### When It Occurs
- API key is incorrect or expired
- Environment variable not set
- Permissions insufficient for operation

#### Handling Strategy

**Prevention:**
```
# Before operations, verify API key is set
Check that my Pinecone MCP server is properly configured with a valid API key
```

**Resolution:**
```
1. Verify API key in Pinecone console (app.pinecone.io)
2. Update MCP configuration with correct key
3. Restart AI assistant to reload configuration
4. Test with a simple operation:
   "List all my Pinecone indexes"
```

**Recovery Pattern:**
```
IF authentication error:
  1. Log the error (don't expose API key in logs)
  2. Return helpful message to user
  3. Don't retry automatically
  4. Provide link to configuration docs
```

### 2. Validation Errors

#### Error Example
```
Error: Validation failed - 'text' field is required for all records
Error: Invalid filter expression: field 'category' does not exist
Error: Dimension mismatch: expected 1536, got 768
```

#### When It Occurs
- Malformed input data
- Missing required fields
- Type mismatches
- Invalid filter syntax
- Incorrect metadata structure

#### Handling Strategy

**Prevention:**
```
# Validate data before upserting
Ask assistant to validate data format:
"Before upserting, verify these records have all required fields: [data]"
```

**Resolution:**
```
IF validation error:
  1. Parse error message to identify specific issue
  2. Fix the problematic data
  3. Retry with corrected data
  4. Consider input validation in application layer
```

**Example Recovery:**
```
# Original attempt (fails)
Upsert this record: {"id": "doc-1"}

# Error: text field required

# Corrected attempt
Upsert this record: {"id": "doc-1", "text": "Document content here"}
```

### 3. Resource Not Found Errors

#### Error Example
```
Error: Index 'my-docs' does not exist
Error: Namespace 'archived' not found in index 'my-index'
```

#### When It Occurs
- Index name typo
- Index was deleted
- Namespace doesn't exist
- Wrong project/environment

#### Handling Strategy

**Prevention:**
```
# Verify resources exist before operations
List all my Pinecone indexes

# Check specific index
Describe my 'my-docs' index
```

**Resolution:**
```
IF resource not found:
  1. List available resources
  2. Check for typos in names
  3. Create resource if needed
  4. Update application configuration
```

**Graceful Degradation:**
```
# Attempt operation
Search my 'primary-docs' index for "query"

# If index not found, try fallback
IF error:
  Search my 'backup-docs' index for "query"
  
# If all fail, inform user clearly
IF still error:
  Return: "Documentation indexes are currently unavailable. Please try again later."
```

### 4. Rate Limit Errors

#### Error Example
```
Error: Rate limit exceeded - 429 Too Many Requests
Error: Request throttled - retry after 5 seconds
```

#### When It Occurs
- Too many requests in short time period
- Burst traffic exceeding limits
- Shared API key across multiple services
- Free tier limitations

#### Handling Strategy

**Prevention:**
```
# Implement request throttling
Batch operations where possible
Add delays between bulk operations
Monitor API usage in Pinecone console
```

**Retry with Exponential Backoff:**
```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Attempt 5: Wait 8 seconds
Max attempts: 5

IF all attempts fail:
  Return user-friendly error message
```

**Smart Batching:**
```
# Instead of 100 individual upserts
For each document in large_dataset:
  Upsert document  # Could hit rate limits

# Batch into groups
Split large_dataset into batches of 10
For each batch:
  Upsert batch (single operation)
  Wait 100ms between batches
```

### 5. Network Errors

#### Error Example
```
Error: Connection timeout - Unable to reach api.pinecone.io
Error: DNS resolution failed
Error: Network unreachable
```

#### When It Occurs
- Internet connectivity issues
- Firewall blocking requests
- Pinecone service outage
- Corporate proxy configuration

#### Handling Strategy

**Detection:**
```
# Network errors typically have specific patterns
Connection timeout
Connection refused
DNS resolution failed
SSL certificate error
```

**Retry Strategy:**
```
IF network error:
  1. Wait briefly (5 seconds)
  2. Retry up to 3 times
  3. Increase wait time each attempt
  4. After retries exhausted:
     - Check Pinecone status page
     - Verify network connectivity
     - Check firewall/proxy settings
```

**Fallback Options:**
```
# Primary: Search Pinecone index
Search my 'docs' index for "query"

# Fallback 1: Try cached results
IF network error AND query was recent:
  Return cached results with notice

# Fallback 2: Degraded functionality
IF persistent network error:
  Return: "Search is temporarily unavailable. Here are recent popular articles: [...]"
```

### 6. Server Errors (5xx)

#### Error Example
```
Error: 500 Internal Server Error
Error: 503 Service Temporarily Unavailable
Error: 504 Gateway Timeout
```

#### When It Occurs
- Temporary Pinecone infrastructure issues
- Index maintenance operations
- Overloaded servers
- Deployment in progress

#### Handling Strategy

**Retry Logic:**
```
IF server error (5xx):
  1. Log the error with timestamp
  2. Wait 10 seconds
  3. Retry once
  4. If still fails, inform user
  5. Monitor Pinecone status page
```

**User Communication:**
```
# Good error message
"Search is experiencing temporary issues. Please try again in a moment."

# Avoid technical jargon
❌ "500 Internal Server Error occurred during vector search operation"
```

### 7. Quota and Capacity Errors

#### Error Example
```
Error: Storage quota exceeded - upgrade your plan
Error: Maximum number of indexes reached (5)
Error: Vector count limit exceeded for index
```

#### When It Occurs
- Free/starter tier limits reached
- Index storage full
- Too many indexes created
- Burst capacity exceeded

#### Handling Strategy

**Prevention:**
```
# Monitor usage
Describe the stats for my 'production' index
How many indexes do I have, and what is my plan limit?
```

**Resolution:**
```
IF quota exceeded:
  1. Review usage in Pinecone console
  2. Delete unused indexes or data
  3. Upgrade plan if needed
  4. Optimize data storage (remove duplicates, compress metadata)
```

## Comprehensive Error Handling Pattern

### Pattern 1: Try-Catch-Retry-Fallback

```
# Pseudocode pattern
function searchWithErrorHandling(query):
  max_retries = 3
  retry_count = 0
  
  while retry_count < max_retries:
    try:
      # Attempt operation
      results = search_pinecone(query)
      return results
      
    catch AuthenticationError:
      # Don't retry auth errors
      log_error("Authentication failed")
      return error_response("Please check API key configuration")
      
    catch ValidationError as e:
      # Don't retry validation errors
      log_error("Validation failed", e)
      return error_response("Invalid query format: " + e.message)
      
    catch RateLimitError:
      # Retry with backoff
      retry_count += 1
      wait_seconds = 2 ^ retry_count
      sleep(wait_seconds)
      continue
      
    catch NetworkError:
      # Retry with backoff
      retry_count += 1
      sleep(5)
      continue
      
    catch ServerError:
      # Retry once for server errors
      if retry_count == 0:
        retry_count += 1
        sleep(10)
        continue
      else:
        log_error("Server error persists")
        return error_response("Service temporarily unavailable")
        
    catch ResourceNotFoundError:
      # Try fallback index
      if fallback_index_available:
        results = search_pinecone(query, fallback_index)
        return results
      else:
        return error_response("Index not found")
        
  # All retries exhausted
  return error_response("Operation failed after multiple attempts")
```

### Pattern 2: Circuit Breaker

Prevent cascading failures by temporarily stopping requests after repeated errors:

```
# Circuit breaker states
CLOSED: Normal operation
OPEN: Temporarily stop requests
HALF_OPEN: Test if service recovered

# Implementation
circuit_state = CLOSED
failure_count = 0
failure_threshold = 5
cooldown_period = 60 seconds

function searchWithCircuitBreaker(query):
  if circuit_state == OPEN:
    if time_since_open > cooldown_period:
      circuit_state = HALF_OPEN
    else:
      return cached_or_degraded_response()
  
  try:
    results = search_pinecone(query)
    
    if circuit_state == HALF_OPEN:
      circuit_state = CLOSED
      failure_count = 0
      
    return results
    
  catch Error:
    failure_count += 1
    
    if failure_count >= failure_threshold:
      circuit_state = OPEN
      start_cooldown_timer()
      
    if circuit_state == HALF_OPEN:
      circuit_state = OPEN
      start_cooldown_timer()
      
    return cached_or_degraded_response()
```

### Pattern 3: Timeout Management

Prevent indefinite waiting:

```
# Set appropriate timeouts
connection_timeout = 5 seconds   # Time to establish connection
read_timeout = 30 seconds        # Time to receive response

function searchWithTimeout(query):
  try:
    results = search_pinecone(
      query,
      connection_timeout=5,
      read_timeout=30
    )
    return results
    
  catch TimeoutError:
    # Timeout occurred
    log_warning("Search timeout", query)
    return error_response("Search is taking longer than expected. Please try a more specific query.")
```

## Real-World Examples

### Example 1: Production Search System

```
User asks: "Search for authentication documentation"

Application logic:
1. Validate query (not empty, reasonable length)
2. Check circuit breaker state
3. Attempt search with retry logic
4. If search fails:
   a. Try fallback index
   b. Return cached results if available
   c. Suggest popular articles as alternative
5. Log all errors for monitoring
6. Return user-friendly error messages
```

### Example 2: Batch Data Upload

```
User asks: "Upload 10,000 documents to my index"

Safe implementation:
1. Validate all documents before starting
2. Split into batches of 100
3. For each batch:
   a. Attempt upsert
   b. If rate limited: wait and retry
   c. If validation error: log bad records, continue with others
   d. If network error: retry batch up to 3 times
   e. Track progress and successful/failed records
4. Return summary: "Successfully uploaded 9,847 documents. 153 failed - see log for details."
```

### Example 3: Multi-Step Operation

```
User asks: "Create a new index and populate it with data"

Robust implementation:
1. Try to create index
   - If exists: Ask user if they want to use existing or create new with different name
   - If quota exceeded: Inform user and suggest upgrade or cleanup
   - If created: Proceed to step 2
   
2. Wait for index to be ready (may take a few seconds)
   - Poll index status
   - Timeout after 5 minutes
   
3. Upsert data with error handling
   - Batch operations
   - Handle rate limits
   - Track failures
   
4. Verify data was uploaded
   - Check index stats
   - Confirm record count
   
5. Return comprehensive status to user
```

## Monitoring and Observability

### Key Metrics to Track

```
Error metrics:
- Error rate by type
- Error rate by operation
- P95/P99 latency including retries
- Retry success rate
- Circuit breaker state changes

User impact metrics:
- Failed operations / total operations
- Average time to resolve errors
- User error reports
- Customer satisfaction correlation
```

### Logging Best Practices

```
# Good error log
{
  "timestamp": "2024-02-03T10:30:45Z",
  "error_type": "RateLimitError",
  "operation": "search",
  "index": "docs",
  "retry_count": 3,
  "resolved": true,
  "latency_ms": 5230,
  "user_id": "hashed-user-id"
}

# Avoid logging sensitive data
❌ "api_key": "pc-abc123..."
❌ "query": "search for john.doe@company.com"
✅ "api_key": "[REDACTED]"
✅ "query_hash": "sha256-hash"
```

### Alerting Strategy

```
Critical alerts (immediate action):
- Authentication failures > 10% of requests
- Service unavailable > 5 minutes
- Circuit breaker open on production

Warning alerts (investigate soon):
- Error rate > 5%
- P95 latency > 2 seconds
- Retry rate > 20%

Info alerts (track trends):
- New error types appearing
- Rate limit approaching
- Quota usage > 80%
```

## Testing Error Scenarios

### Unit Testing Errors

```
Test cases to implement:
1. Mock authentication failure
2. Mock rate limit response
3. Mock network timeout
4. Mock server error (500)
5. Mock resource not found (404)
6. Verify retry logic executes
7. Verify fallback triggers correctly
8. Verify user messages are friendly
```

### Integration Testing

```
Test scenarios:
1. Create index with invalid name
2. Upsert with missing required fields
3. Search non-existent index
4. Apply invalid metadata filter
5. Exceed rate limits intentionally
6. Test with expired API key
7. Simulate network interruption
```

## Common Issues and Troubleshooting

### Issue: Errors not being caught properly

**Problem**: Application crashes instead of handling errors gracefully.

**Solution**:
```
# Implement comprehensive error handling
Try broad error catch first, then refine:

try:
  operation()
catch Error as e:
  log_error(e)
  return user_friendly_message()
```

### Issue: Retry logic causing infinite loops

**Problem**: Retries never stop, application hangs.

**Solution**:
```
# Always set maximum retry count
max_retries = 3
retry_count = 0

while retry_count < max_retries:
  try:
    result = operation()
    break  # Success - exit loop
  catch:
    retry_count += 1
    if retry_count >= max_retries:
      raise FinalError()
```

### Issue: Error messages confusing users

**Problem**: Technical error messages shown to end users.

**Solution**:
```
# Map technical errors to user-friendly messages

technical_error = "Authentication failed: Invalid API key format"

user_message = "We're having trouble connecting to the search service. Please try again in a moment."

# Log technical details for debugging
# Show friendly message to user
```

## Best Practices Summary

1. **Always handle errors explicitly** - Don't assume operations will succeed
2. **Use exponential backoff for retries** - Avoid overwhelming systems
3. **Implement circuit breakers** - Prevent cascading failures
4. **Set appropriate timeouts** - Don't wait forever
5. **Provide user-friendly messages** - Hide technical details from users
6. **Log errors comprehensively** - But never log sensitive data
7. **Monitor error rates** - Catch issues before users report them
8. **Test error scenarios** - Don't wait for production to find issues
9. **Have fallback strategies** - Degraded functionality > no functionality
10. **Document error handling** - Help future developers understand your logic

## Next Steps

- [Cascading Search](./cascading-search.md) - Handle errors across multiple indexes
- [Integration Workflows](../integrations/) - Implement error handling in your environment

## Related Documentation

- [Pinecone API Error Codes](https://docs.pinecone.io/reference/error-codes)
- [Rate Limits Documentation](https://docs.pinecone.io/reference/rate-limits)
- [Troubleshooting Guide](https://docs.pinecone.io/troubleshooting)
- [Best Practices for Production](https://docs.pinecone.io/guides/operations/production-best-practices)
