# Creating Your First Index with Integrated Inference

## Objective

Learn how to create a Pinecone index that uses integrated inference to automatically embed your text data without managing separate embedding models.

## Prerequisites

- Pinecone MCP server configured with your API key
- AI assistant (Cursor, Claude Desktop, or Gemini CLI) connected to the MCP server

## What is Integrated Inference?

Integrated inference means Pinecone handles the embedding process for you. You provide text, and Pinecone automatically converts it to vectors using the model you specify. This eliminates the need to manage embedding models separately.

## Step-by-Step Instructions

### 1. Choose an Embedding Model

Pinecone supports various embedding models. For general-purpose use, we recommend:
- `multilingual-e5-large` - Good for multilingual content
- `text-embedding-ada-002` - OpenAI's embedding model
- `embed-english-v3.0` - Cohere's English model

### 2. Prompt Your AI Assistant

Use a prompt like this in your AI assistant:

```
Create a new Pinecone index called 'my-documents' using the multilingual-e5-large model
```

### 3. What Happens Behind the Scenes

Your AI assistant will:
1. Use the `create-index-for-model` MCP tool
2. Automatically configure the index with the correct dimensions for your chosen model
3. Set up integrated inference so you can upsert text directly

### 4. Expected Output

You should see a confirmation message similar to:

```
Successfully created index 'my-documents' with the following configuration:
- Model: multilingual-e5-large
- Dimension: 1024
- Metric: cosine
- Cloud: aws
- Region: us-east-1
```

### 5. Verify Your Index

You can verify the index was created by asking:

```
List all my Pinecone indexes and their configurations
```

Or:

```
Describe the configuration of my 'my-documents' index
```

## Example Variations

### Create an Index for a Specific Use Case

**For code search:**
```
Create an index called 'code-snippets' optimized for searching code using the text-embedding-ada-002 model
```

**For multilingual documentation:**
```
Create an index called 'help-docs' for multilingual content using the multilingual-e5-large model
```

**For e-commerce products:**
```
Create an index called 'product-catalog' using embed-english-v3.0 for semantic product search
```

## Common Issues and Troubleshooting

### Issue: Index already exists

**Error message:**
```
Index with name 'my-documents' already exists
```

**Solution:** Choose a different name or delete the existing index first:
```
Delete my 'my-documents' index, then create a new one with the multilingual-e5-large model
```

### Issue: Invalid model name

**Error message:**
```
Model 'invalid-model' is not supported
```

**Solution:** Verify the model name is correct. Ask your assistant:
```
What embedding models are available for Pinecone integrated inference?
```

### Issue: API key not set

**Error message:**
```
Authentication failed: API key is required
```

**Solution:** Verify your `PINECONE_API_KEY` is configured in your MCP settings. See the [Setup Guide](../../README.md#setup).

## Next Steps

- [Upsert Records and Basic Search](./upsert-search.md) - Add data to your index and perform searches
- [Using Reranking](./reranking.md) - Improve search relevance with reranking

## Related Documentation

- [Official Pinecone Indexes Documentation](https://docs.pinecone.io/guides/indexes/create-an-index)
- [Integrated Inference Guide](https://docs.pinecone.io/guides/inference/understanding-inference)
- [Available Embedding Models](https://docs.pinecone.io/guides/inference/models)
