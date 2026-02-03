# Using Reranking to Improve Search Relevance

## Objective

Learn how to use Pinecone's reranking capabilities to improve the quality and relevance of search results by reordering them based on semantic similarity.

## Prerequisites

- Pinecone MCP server configured with your API key
- An index with data already upserted (see [Upserting Records](./upsert-search.md))
- AI assistant connected to the MCP server

## What is Reranking?

Reranking is a two-stage process:

1. **Initial Retrieval**: Fast vector search returns a broader set of candidates (e.g., top 100 results)
2. **Reranking**: A more sophisticated model reorders these candidates to surface the most relevant results

This approach combines speed with accuracy, giving you better search quality without sacrificing performance.

## Why Use Reranking?

- **Improved Relevance**: Reranking models are specifically trained to assess query-document relevance
- **Better Top Results**: The most relevant documents appear at the top
- **Handles Nuance**: Captures subtle semantic relationships that pure vector search might miss
- **Domain Adaptation**: Particularly useful for specialized content (legal, medical, technical)

## Step-by-Step Instructions

### Step 1: Basic Search with Reranking

Ask your AI assistant to search with reranking enabled:

```
Search my 'my-documents' index for "how to optimize vector database performance" and rerank the results
```

### Step 2: Expected Output

You'll see results ordered by relevance score:

```
Found and reranked 5 results:

1. Relevance Score: 0.94
   ID: doc-15
   Text: "Vector database optimization requires careful index tuning, query planning, and resource allocation..."

2. Relevance Score: 0.87
   ID: doc-8
   Text: "Performance bottlenecks in vector search often stem from inefficient filtering or large result sets..."

3. Relevance Score: 0.79
   ID: doc-22
   Text: "To improve database query speed, consider implementing connection pooling and caching strategies..."
```

### Step 3: Compare with Standard Search

Try the same query without reranking to see the difference:

```
Search my 'my-documents' index for "how to optimize vector database performance" without reranking
```

Notice how the order and relevance of results may differ.

## Advanced Reranking Usage

### Controlling the Number of Results to Rerank

Rerank a specific number of initial results:

```
Search my 'my-documents' index for "machine learning deployment", retrieve 50 initial results, then rerank and show me the top 10
```

This fetches 50 candidates but only shows the 10 most relevant after reranking.

### Reranking with Metadata Filters

Combine metadata filtering with reranking:

```
Search my 'knowledge-base' index for "security best practices" where category equals "enterprise" and rerank the results
```

### Using Different Reranking Models

Pinecone supports multiple reranking models:

```
Search my index for "customer feedback analysis" and rerank using the bge-reranker-v2-m3 model
```

Common reranking models:
- `bge-reranker-v2-m3` - Multilingual reranker, good general-purpose choice
- `bge-reranker-large` - Higher accuracy, slightly slower
- `cohere-rerank-english-v3.0` - Optimized for English content

## Reranking Documents Without Search

You can also rerank arbitrary documents against a query:

```
I have these three articles about AI. Which one is most relevant to "ethical considerations in machine learning"?

Article 1: "The Technical Architecture of Neural Networks discusses how layers of neurons process information..."

Article 2: "Ethical AI Development covers bias detection, fairness metrics, and responsible deployment practices..."

Article 3: "Building Scalable ML Pipelines focuses on infrastructure, monitoring, and continuous integration..."
```

The assistant will use the `rerank-documents` tool to score relevance.

## Real-World Use Cases

### Customer Support

```
Search our 'support-articles' index for content related to the customer's question: "I'm having trouble connecting to the VPN", then rerank to find the most helpful article
```

### Research Paper Discovery

```
Search the 'research-papers' index for "quantum computing applications in cryptography", rerank the results, and summarize the top 3 most relevant papers
```

### E-commerce Product Search

```
Search our 'products' index for "wireless earbuds with long battery life under $100", filter by price and in-stock status, then rerank by relevance to show the best matches
```

### Code Search

```
Search the 'codebase' index for "functions that handle authentication errors", rerank the results, and show me the top 5 most relevant code snippets
```

## Reranking Best Practices

### 1. Retrieve More, Show Less

Fetch a larger initial set (50-100) and rerank to show fewer results (5-10):

```
Retrieve 100 results from my index, rerank them, and show me the top 5
```

### 2. Use Reranking for Critical Queries

Reranking adds latency, so use it when result quality matters most:
- User-facing search
- Question answering
- Content recommendations
- Document retrieval for RAG

### 3. Combine with Metadata Filtering

Narrow results with metadata before reranking:

```
Search for "project management tools" where category is "software" and rating > 4.0, then rerank
```

### 4. Monitor Performance

Balance quality vs. speed based on your use case:
- Reranking 100 documents: ~100-200ms
- Reranking 500 documents: ~500ms-1s

## Common Issues and Troubleshooting

### Issue: Reranking not improving results

**Problem:** Reranked results don't seem better than regular search.

**Solutions:**
1. Ensure you're retrieving enough initial candidates (try 50-100)
2. Check if your initial search query is too broad or too specific
3. Verify the reranking model is appropriate for your content type
4. Compare queries side-by-side to assess differences objectively

### Issue: Reranking is slow

**Problem:** Queries with reranking take too long.

**Solutions:**
1. Reduce the number of documents being reranked
2. Use metadata filters to reduce initial result set
3. Consider reranking only for specific query types
4. Try a faster reranking model

### Issue: Reranker returns different number of results

**Problem:** Asked for 10 results but got fewer.

**Explanation:** If your initial search returns fewer documents than requested, reranking will only process what's available.

**Solution:**
```
# Verify your index has enough data
Describe the stats for my 'my-documents' index

# Check namespace if you're using them
How many records are in the 'default' namespace of my index?
```

### Issue: Error with rerank-documents tool

**Error message:**
```
Reranking failed: query and documents are required
```

**Solution:** Ensure you provide both a query and documents to rerank:
```
# Incorrect - missing query or documents
Rerank these documents: [...]

# Correct - includes both
Rerank these documents against the query "AI safety": [...]
```

## Performance Comparison

### Vector Search Only
- **Speed**: Fast (~10-50ms)
- **Accuracy**: Good for broad matches
- **Best for**: High-throughput, latency-sensitive applications

### Vector Search + Reranking
- **Speed**: Moderate (~100-500ms depending on rerank size)
- **Accuracy**: Excellent for precise matches
- **Best for**: User-facing search, Q&A, content discovery

## Cost Considerations

Reranking uses additional compute resources. Each rerank operation counts toward your Pinecone usage:
- Charged per document reranked
- Typically fractions of a cent per query
- Monitor usage in the Pinecone console

Check current pricing at [pinecone.io/pricing](https://www.pinecone.io/pricing)

## Next Steps

- [Cascading Search](../advanced/cascading-search.md) - Search and rerank across multiple indexes
- [Error Handling](../advanced/error-handling.md) - Handle reranking failures gracefully

## Related Documentation

- [Reranking API Documentation](https://docs.pinecone.io/guides/inference/rerank)
- [Understanding Reranking Models](https://docs.pinecone.io/guides/inference/reranking-models)
- [Improving Search Quality](https://docs.pinecone.io/guides/search/improve-search-quality)
- [RAG with Reranking](https://docs.pinecone.io/guides/rag/reranking-in-rag)
