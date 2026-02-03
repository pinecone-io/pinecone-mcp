# Multi-Index Cascading Search with Deduplication

## Objective

Learn how to perform searches across multiple Pinecone indexes simultaneously, automatically deduplicating and reranking results to surface the most relevant content from your entire knowledge base.

## Prerequisites

- Pinecone MCP server configured with your API key
- Multiple indexes with integrated inference containing related data
- AI assistant connected to the MCP server

## What is Cascading Search?

Cascading search enables you to:
1. Query multiple indexes in parallel
2. Combine results from all indexes
3. Remove duplicate records
4. Rerank the combined results for optimal relevance
5. Return a unified result set

This is particularly useful when you have data organized across multiple indexes (e.g., separate indexes for documentation, code, support tickets, and blog posts).

## Why Use Cascading Search?

### Benefits
- **Comprehensive Results**: Search across your entire knowledge base at once
- **Automatic Deduplication**: Eliminates redundant results across indexes
- **Intelligent Ranking**: Reranks combined results for best relevance
- **Organizational Flexibility**: Keep data logically separated while searching holistically
- **Performance**: Parallel searches are faster than sequential queries

### Common Use Cases
- Multi-source RAG applications
- Enterprise knowledge management
- Customer support systems with multiple data sources
- Research and discovery tools
- Content recommendation engines

## Step-by-Step Instructions

### Step 1: Understand Your Index Structure

First, review your available indexes:

```
List all my Pinecone indexes and describe what data each one contains
```

Example response:
```
You have 4 indexes:
1. 'docs' - Product documentation
2. 'support-tickets' - Historical customer support conversations
3. 'blog-posts' - Company blog articles
4. 'code-examples' - Code snippets and tutorials
```

### Step 2: Perform a Basic Cascading Search

Search across multiple indexes with a single query:

```
Search across my 'docs', 'support-tickets', and 'blog-posts' indexes for information about "authentication workflows"
```

### Step 3: Expected Output

You'll receive unified, deduplicated results:

```
Cascading search across 3 indexes returned 8 unique results:

1. Score: 0.92 | Index: docs | ID: auth-guide-001
   Text: "OAuth 2.0 authentication workflow begins with the client requesting authorization..."

2. Score: 0.89 | Index: support-tickets | ID: ticket-4521
   Text: "Customer issue resolved: JWT token authentication was failing due to clock skew..."

3. Score: 0.85 | Index: blog-posts | ID: blog-2024-03-15
   Text: "Best practices for implementing secure authentication in modern web applications..."

[... additional results ...]

Note: 3 duplicate records were removed during deduplication
```

### Step 4: Advanced Cascading with Options

Control search behavior with additional parameters:

```
Search across my 'docs', 'code-examples', and 'blog-posts' indexes for "error handling patterns", retrieve 50 results from each index, deduplicate, rerank, and show me the top 10 most relevant results
```

## Advanced Usage Patterns

### Weighted Index Priority

Give priority to specific indexes:

```
Search for "pricing information" across my indexes, but prioritize results from the 'docs' index over 'blog-posts'
```

The assistant may adjust how results are presented based on this guidance.

### Namespace-Aware Cascading Search

Search specific namespaces within each index:

```
Search the 'v2' namespace in my 'docs' index and the 'latest' namespace in 'code-examples' for "migration guide"
```

### Filtered Cascading Search

Apply metadata filters across all indexes:

```
Search across all my indexes for "machine learning" where language equals "python" and date is after "2024-01-01"
```

### Time-Bounded Searches

Prioritize recent content:

```
Search my 'support-tickets', 'docs', and 'blog-posts' indexes for "performance issues", focusing on content from the last 6 months
```

## Real-World Examples

### Example 1: Comprehensive Documentation Search

**Scenario**: Developer searching for API information across all resources.

```
I need to understand how to use the batch insert API. Search across my 'api-docs', 'code-examples', 'tutorials', and 'support-tickets' indexes to find comprehensive information.
```

**Result**: Combined insights from official docs, working code examples, step-by-step tutorials, and real troubleshooting conversations.

### Example 2: Customer Support Agent

**Scenario**: Support agent helping customer with a complex issue.

```
Customer is reporting "connection timeout errors during peak hours". Search across 'support-tickets', 'internal-kb', and 'docs' indexes to find relevant solutions and known issues.
```

**Result**: Historical tickets with resolutions, internal troubleshooting guides, and official documentation.

### Example 3: Research and Discovery

**Scenario**: Researcher exploring a topic across multiple content types.

```
Search across 'research-papers', 'blog-posts', 'news-articles', and 'conference-talks' indexes for "sustainable energy storage solutions"
```

**Result**: Academic papers, industry blog posts, news coverage, and conference presentations all ranked by relevance.

### Example 4: Code Migration

**Scenario**: Developer migrating from v1 to v2 of an API.

```
Search across 'v1-docs', 'v2-docs', 'migration-guides', and 'code-examples' for information about authentication changes between versions
```

**Result**: Side-by-side comparison with upgrade paths, migration guides, and updated code examples.

## Deduplication Details

### How Deduplication Works

The MCP server identifies duplicates by comparing:
1. **ID matching**: Same record ID across indexes
2. **Content similarity**: Nearly identical text content
3. **Metadata correlation**: Same source URL or document reference

### Controlling Deduplication

By default, deduplication is automatic. You can influence behavior:

```
# Strict deduplication (removes similar content)
Search across my indexes for "pricing" with strict deduplication enabled

# Permissive deduplication (only removes exact matches)
Search across my indexes for "pricing" and keep similar but distinct results
```

### Understanding Deduplication Reports

Pay attention to deduplication feedback:

```
Results found: 47
Unique results after deduplication: 35
Duplicates removed: 12

Top duplicate patterns:
- 8 records appeared in both 'docs' and 'blog-posts'
- 4 records appeared across all 3 indexes
```

## Performance Optimization

### Optimize Index Selection

Don't include irrelevant indexes:

```
# Less efficient - searches unnecessary indexes
Search across all 6 of my indexes for "Python syntax"

# More efficient - targeted search
Search my 'code-examples' and 'tutorials' indexes for "Python syntax"
```

### Balance Result Set Size

Retrieve appropriate amounts from each index:

```
# Good balance for 3 indexes
Retrieve 30 results from each of my 3 indexes (90 total), then deduplicate and rerank to show top 10

# Too many results may slow down reranking
Retrieve 500 results from each index... (avoid unless necessary)
```

### Use Metadata Filters Early

Apply filters before search to reduce processing:

```
# Efficient - filters during search
Search for "tutorial" where difficulty equals "beginner" across my indexes

# Less efficient - filters after retrieval
Search for "tutorial" across my indexes, then filter results to only beginner content
```

## Common Issues and Troubleshooting

### Issue: Too many duplicate results

**Problem**: Deduplication isn't removing expected duplicates.

**Solutions**:
1. Check if content is stored with different IDs in each index
2. Verify metadata that could help identify duplicates
3. Consider if content is similar but intentionally distinct

```
# Investigate duplication
Show me the metadata for records that appear in multiple indexes for the query "authentication"
```

### Issue: Important results missing

**Problem**: Expected results from a specific index aren't appearing.

**Solutions**:
1. Verify the index contains relevant data:
```
Search only my 'docs' index for "authentication" to verify data exists
```

2. Check if results are ranked lower due to relevance scores
3. Increase the number of results retrieved per index

### Issue: Cascading search is slow

**Problem**: Queries across multiple indexes take too long.

**Solutions**:
1. Reduce the number of indexes searched
2. Decrease results retrieved per index
3. Apply metadata filters to narrow search scope
4. Consider if all indexes are necessary for the query

**Benchmark**:
- 3 indexes, 30 results each: ~200-300ms
- 5 indexes, 50 results each: ~400-600ms
- 10 indexes, 100 results each: ~1-2 seconds

### Issue: Inconsistent result quality across indexes

**Problem**: Results from one index are consistently ranked lower.

**Investigation**:
```
# Compare index configurations
Describe my 'docs' index and my 'blog-posts' index configurations
```

**Common causes**:
- Different embedding models used
- Data quality variations
- Inconsistent metadata structure

**Solutions**:
- Ensure all indexes use the same embedding model
- Standardize metadata across indexes
- Consider reprocessing lower-quality data

### Issue: Metadata filtering not working across all indexes

**Problem**: Metadata filter works on some indexes but not others.

**Cause**: Inconsistent metadata schema across indexes.

**Solution**:
```
# Check metadata schema for each index
Describe the stats and metadata for my 'docs' index
Describe the stats and metadata for my 'blog-posts' index

# Standardize metadata fields
```

## Architecture Patterns

### Pattern 1: Layer-Based Search

Organize indexes by data type:

```
Primary search layers:
1. 'official-docs' - Authoritative documentation
2. 'community-content' - User-contributed guides
3. 'historical-tickets' - Support conversations

Search priority: official-docs → community-content → historical-tickets
```

### Pattern 2: Time-Based Indexing

Separate indexes by time period:

```
Indexes:
- 'current-quarter' - Last 3 months
- 'previous-year' - Last year
- 'archive' - Historical data

Search current-quarter first, expand to other indexes if needed
```

### Pattern 3: Domain-Specific Indexes

Organize by subject matter:

```
Indexes by domain:
- 'engineering-kb'
- 'sales-kb'
- 'support-kb'
- 'product-kb'

Cascading search based on user role and query context
```

## Best Practices

### 1. Consistent Embedding Models

Use the same embedding model across related indexes:

```
# Good - consistent models
docs: multilingual-e5-large
blog-posts: multilingual-e5-large
code-examples: multilingual-e5-large

# Problematic - mixed models
docs: multilingual-e5-large
blog-posts: text-embedding-ada-002  # Different model!
```

### 2. Standardize Metadata Schema

Define common metadata fields:

```json
{
  "source": "docs|blog|support|code",
  "date": "ISO-8601 timestamp",
  "category": "string",
  "tags": ["array", "of", "strings"],
  "language": "en|es|fr|etc"
}
```

### 3. Design for Deduplication

Include deduplication-friendly metadata:

```json
{
  "source_url": "https://example.com/article",
  "content_hash": "sha256-hash",
  "canonical_id": "unique-identifier"
}
```

### 4. Monitor Search Performance

Track metrics across indexes:
- Query latency per index
- Result count distribution
- Deduplication rate
- User engagement with results

### 5. Regular Index Maintenance

- Remove outdated content
- Update embeddings when models change
- Reprocess data with poor search performance
- Monitor index growth and splitting strategy

## Next Steps

- [Analytics Tracking](./analytics-tracking.md) - Monitor cascading search usage and effectiveness
- [Error Handling](./error-handling.md) - Handle failures gracefully across multiple indexes
- [Integration Workflows](../integrations/) - Implement cascading search in your development environment

## Related Documentation

- [Cascading Search API Documentation](https://docs.pinecone.io/reference/cascading-search)
- [Index Organization Best Practices](https://docs.pinecone.io/guides/indexes/organize-indexes)
- [Deduplication Strategies](https://docs.pinecone.io/guides/search/deduplication)
- [Multi-Index RAG Patterns](https://docs.pinecone.io/guides/rag/multi-index-rag)
