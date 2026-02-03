# Upserting Records and Basic Search

## Objective

Learn how to add data to your Pinecone index and perform semantic searches using natural language queries.

## Prerequisites

- Pinecone MCP server configured with your API key
- An existing index with integrated inference (see [Creating Your First Index](./create-index.md))
- AI assistant connected to the MCP server

## What is Upserting?

"Upsert" means inserting new records or updating existing ones. When you upsert text to a Pinecone index with integrated inference, Pinecone automatically:
1. Converts your text to vectors using the configured embedding model
2. Stores the vectors along with the original text and any metadata
3. Makes the data immediately searchable

## Step-by-Step Instructions

### Step 1: Prepare Your Data

Organize the data you want to store. Each record should have:
- **ID**: A unique identifier (required)
- **Text**: The content to embed and search (required)
- **Metadata**: Additional fields for filtering (optional)

### Step 2: Upsert Records

Prompt your AI assistant with data to insert:

```
Upsert the following documents into my 'my-documents' index:

1. "Pinecone is a vector database designed for machine learning applications. It provides fast similarity search at scale."

2. "Vector embeddings convert text into numerical representations that capture semantic meaning."

3. "Retrieval Augmented Generation (RAG) combines document retrieval with language models to produce more accurate responses."
```

### Step 3: Expected Output

You should see confirmation that records were upserted:

```
Successfully upserted 3 records to index 'my-documents':
- Record IDs: doc-1, doc-2, doc-3
- Namespace: default
```

### Step 4: Perform a Basic Search

Now search for information using natural language:

```
Search my 'my-documents' index for information about vector databases
```

### Step 5: Review Search Results

The AI assistant will show relevant matches:

```
Found 3 results:

1. Score: 0.89
   ID: doc-1
   Text: "Pinecone is a vector database designed for machine learning applications..."

2. Score: 0.72
   ID: doc-2
   Text: "Vector embeddings convert text into numerical representations..."

3. Score: 0.58
   ID: doc-3
   Text: "Retrieval Augmented Generation (RAG) combines document retrieval..."
```

Higher scores indicate better matches (typically 0-1 range).

## Advanced Upserting with Metadata

### Using Metadata for Filtering

Add metadata to enable filtering during search:

```
Upsert these articles into my 'my-documents' index:

1. Title: "Getting Started with Pinecone"
   Text: "This guide covers the basics of setting up your first Pinecone index."
   Category: "tutorial"
   Difficulty: "beginner"

2. Title: "Advanced Indexing Strategies"
   Text: "Learn how to optimize your indexes for production workloads."
   Category: "tutorial"
   Difficulty: "advanced"

3. Title: "Pinecone Pricing FAQ"
   Text: "Common questions about Pinecone pricing and billing."
   Category: "faq"
   Difficulty: "beginner"
```

### Search with Metadata Filtering

Filter results by metadata:

```
Search my 'my-documents' index for tutorials, but only show beginner-level content
```

Or more specifically:

```
Search my 'my-documents' index for "indexing strategies" where category equals "tutorial" and difficulty equals "advanced"
```

## Working with Namespaces

Namespaces let you partition data within the same index.

### Upsert to a Specific Namespace

```
Upsert these user questions into the 'support-tickets' namespace of my 'my-documents' index:

1. "How do I reset my password?"
2. "What payment methods do you accept?"
3. "Can I upgrade my plan mid-month?"
```

### Search Within a Namespace

```
Search the 'support-tickets' namespace in my 'my-documents' index for information about payments
```

## Batch Operations

### Upserting Many Records

For larger datasets, provide structured data:

```
Upsert the following 10 product descriptions into my 'product-catalog' index:

Product 1: "Wireless Bluetooth Headphones - Premium sound quality with active noise cancellation"
Product 2: "USB-C Fast Charging Cable - 6ft braided nylon, supports 60W power delivery"
...
```

## Example Use Cases

### Knowledge Base

```
Upsert our company's help articles into the 'help-center' index so we can provide better customer support
```

### Code Search

```
Upsert all Python functions from the utils.py file into my 'code-search' index with metadata including file path and function name
```

### Document Q&A

```
Upsert the contents of our employee handbook into the 'hr-docs' index, splitting by section
```

## Common Issues and Troubleshooting

### Issue: Records not appearing in search

**Problem:** Just upserted data but searches return no results.

**Solutions:**
1. Wait a few seconds for indexing to complete (usually < 1 second)
2. Verify the index name is correct
3. Check if you're searching in the correct namespace

### Issue: Upsert fails with validation error

**Error message:**
```
Validation error: text field is required for all records
```

**Solution:** Ensure every record includes text content:
```
# Incorrect - missing text
{"id": "doc-1"}

# Correct
{"id": "doc-1", "text": "Content goes here"}
```

### Issue: Metadata not filtering correctly

**Problem:** Metadata filters not returning expected results.

**Solutions:**
1. Verify metadata field names match exactly (case-sensitive)
2. Ensure metadata values are the correct type (string, number, boolean)
3. Check the metadata was included during upsert

### Issue: Index not found

**Error message:**
```
Index 'my-documents' does not exist
```

**Solution:** Create the index first (see [Creating Your First Index](./create-index.md)) or verify the index name:
```
List all my Pinecone indexes
```

## Performance Tips

1. **Batch upserts**: Upload multiple records at once for better throughput
2. **Use meaningful IDs**: Makes debugging and updates easier
3. **Structure metadata carefully**: Plan your filtering needs upfront
4. **Keep text focused**: Shorter, focused chunks often perform better than long documents

## Next Steps

- [Using Reranking](./reranking.md) - Improve search result relevance
- [Cascading Search](../advanced/cascading-search.md) - Search across multiple indexes
- [Analytics Tracking](../advanced/analytics-tracking.md) - Track model usage

## Related Documentation

- [Upsert Records API Documentation](https://docs.pinecone.io/guides/data/upsert-data)
- [Metadata Filtering Guide](https://docs.pinecone.io/guides/data/filter-with-metadata)
- [Understanding Namespaces](https://docs.pinecone.io/guides/indexes/use-namespaces)
- [Search Records API Documentation](https://docs.pinecone.io/guides/data/query-data)
