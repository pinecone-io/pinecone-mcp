# Using llm_provider and llm_model for Analytics Tracking

## Objective

Learn how to use the `llm_provider` and `llm_model` parameters to track which AI models and providers are querying your Pinecone indexes, enabling better analytics, cost optimization, and usage monitoring.

## Prerequisites

- Pinecone MCP server configured with your API key
- One or more indexes with integrated inference
- AI assistant connected to the MCP server
- Access to Pinecone console for viewing analytics

## What is Analytics Tracking?

When AI applications query Pinecone, you can tag each request with:
- **llm_provider**: The AI service making the request (e.g., "openai", "anthropic", "google")
- **llm_model**: The specific model being used (e.g., "gpt-4", "claude-3-opus", "gemini-pro")

This metadata enables:
- Usage analytics by model and provider
- Cost attribution and optimization
- Performance comparison across models
- Debugging and troubleshooting
- Compliance and audit trails

## Why Track Analytics?

### Business Benefits
- **Cost Management**: Understand which models drive the most queries
- **Performance Optimization**: Compare latency and quality across providers
- **Capacity Planning**: Forecast infrastructure needs based on usage patterns
- **ROI Analysis**: Connect model costs to business outcomes

### Technical Benefits
- **Debugging**: Trace issues to specific model versions
- **A/B Testing**: Compare model performance objectively
- **Rate Limit Management**: Monitor per-provider API usage
- **Caching Strategies**: Identify high-volume model/query combinations

## How It Works

### Automatic Tracking with MCP

When using the Pinecone MCP server, analytics parameters can be included automatically based on your AI assistant's configuration:

```
Search my 'knowledge-base' index for "deployment best practices"
```

Behind the scenes, the MCP server may automatically include:
```json
{
  "llm_provider": "anthropic",
  "llm_model": "claude-3-sonnet-20240229"
}
```

### Viewing Analytics

Analytics are visible in the Pinecone console:

1. Navigate to your index in the [Pinecone console](https://app.pinecone.io)
2. Go to the "Analytics" or "Metrics" tab
3. View breakdowns by `llm_provider` and `llm_model`

## Step-by-Step Instructions

### Step 1: Enable Analytics Tracking

Most MCP clients automatically include provider/model information. To verify:

```
Search my 'test-index' index for "test query" and confirm analytics parameters are being sent
```

Ask your assistant to confirm what provider/model information is being tracked.

### Step 2: Generate Trackable Usage

Perform various operations to generate analytics:

```
# Search operation
Search my 'docs' index for "API authentication"

# Upsert operation  
Upsert these documents into my 'docs' index: [...]

# Reranking operation
Search my 'docs' index for "security" and rerank the results
```

### Step 3: Review Analytics in Console

1. Log into [app.pinecone.io](https://app.pinecone.io)
2. Select your index
3. Navigate to analytics/metrics section
4. Filter by `llm_provider` and `llm_model`

### Step 4: Analyze Usage Patterns

Look for insights:
- Which models query most frequently?
- What's the query volume by provider?
- Are there cost optimization opportunities?
- Which model/provider combinations perform best?

## Real-World Examples

### Example 1: Multi-Model Application

**Scenario**: Application uses different models for different tasks.

```
# GPT-4 for complex reasoning
Use GPT-4 to analyze these search results from my 'research' index and synthesize insights

# Claude for content generation  
Use Claude to generate summaries of documents from my 'articles' index

# Gemini for code analysis
Use Gemini to search my 'codebase' index for security vulnerabilities
```

**Analytics View**:
```
Provider    Model                 Queries   Avg Latency   Cost
anthropic   claude-3-opus         1,243     145ms        $45.20
openai      gpt-4-turbo           856       223ms        $67.30
google      gemini-pro            492       178ms        $12.40
```

### Example 2: A/B Testing Models

**Scenario**: Testing which model provides better search results.

```
# Run comparison tests
Test variant A: Use GPT-4 to search my 'support-kb' for user questions
Test variant B: Use Claude to search my 'support-kb' for the same questions
```

**Analytics**: Track success metrics (user satisfaction, response quality) alongside model usage to determine the better option.

### Example 3: Cost Optimization

**Scenario**: Reduce costs by routing simple queries to cheaper models.

```
Analysis from Pinecone console:
- 60% of queries are simple factual lookups
- Currently using gpt-4 for all queries ($0.08/query)
- Could use gpt-3.5-turbo for simple queries ($0.01/query)

Potential savings: ~$5,000/month
```

**Implementation**:
```
# Route simple queries to cheaper model
For straightforward queries, use GPT-3.5 to search my indexes

# Keep premium model for complex queries  
For complex analysis and reasoning, use GPT-4 to search my indexes
```

### Example 4: Provider Redundancy

**Scenario**: Multi-provider setup for reliability.

```
Primary: Use Anthropic (Claude) for all index queries
Fallback: If Anthropic is unavailable, use OpenAI (GPT-4)
Backup: If both unavailable, use Google (Gemini)
```

**Analytics**: Track failover frequency and provider reliability.

## Advanced Analytics Patterns

### Pattern 1: User Segmentation

Tag queries by user tier or segment:

```
Enterprise customers → GPT-4 (highest quality)
Pro customers → Claude-3 Sonnet (balanced)
Free customers → GPT-3.5 (cost-effective)
```

**Analytics**: Compare usage, costs, and satisfaction across segments.

### Pattern 2: Query Type Classification

Route queries based on complexity:

```
Simple factual queries → Fast, cheap models
Complex reasoning → Premium models with better performance
Code generation → Models optimized for code
```

**Analytics**: Validate that routing logic improves cost/performance balance.

### Pattern 3: Geographic Distribution

Track provider performance by region:

```
US West: Provider A (lowest latency)
US East: Provider B (regional availability)
EU: Provider C (data residency requirements)
```

**Analytics**: Monitor latency, availability, and compliance by region.

### Pattern 4: Time-Based Analysis

Understand usage patterns over time:

```
Peak hours (9am-5pm): Higher volume, use faster models
Off-peak (nights/weekends): Lower volume, acceptable to use slower/cheaper models
```

**Analytics**: Optimize costs while maintaining user experience.

## Custom Analytics Implementation

### Correlating with Application Metrics

Combine Pinecone analytics with your application data:

```python
# Example: Application-side tracking
{
  "query_id": "unique-id",
  "user_id": "user-123",
  "llm_provider": "anthropic",
  "llm_model": "claude-3-opus",
  "pinecone_latency": 145,
  "total_latency": 890,
  "user_satisfaction": 4.5,
  "cost": 0.023
}
```

### Building Custom Dashboards

Export analytics to your monitoring system:
- Pinecone API for query logs
- Custom dashboard (Grafana, Datadog, etc.)
- Combine with billing data for ROI analysis

### Alerting on Anomalies

Set up alerts for unusual patterns:
- Sudden spike in queries from specific model
- Abnormal error rates for a provider
- Cost threshold exceeded
- Performance degradation

## Common Issues and Troubleshooting

### Issue: Analytics not appearing in console

**Problem**: Queries not showing provider/model breakdown.

**Solutions**:
1. Verify MCP server version supports analytics parameters
2. Check that your AI assistant is sending provider/model info
3. Wait a few minutes for analytics to populate (not real-time)
4. Confirm you're looking at the correct index and time range

### Issue: Incorrect provider/model labels

**Problem**: Analytics show wrong or generic labels.

**Cause**: MCP configuration may not be passing correct metadata.

**Solution**:
```
# Verify current configuration
Ask your assistant: "What LLM provider and model are you currently using?"

# Check MCP logs for what's being sent
Review MCP server logs in your AI assistant settings
```

### Issue: Missing historical data

**Problem**: Can't see analytics from past weeks/months.

**Solutions**:
1. Check data retention settings in Pinecone console
2. Export analytics regularly for long-term storage
3. Verify index wasn't recreated (analytics reset on new indexes)

### Issue: Analytics don't match billing

**Problem**: Query counts in analytics differ from billing statements.

**Possible causes**:
- Different time zones for analytics vs. billing
- Billable operations include background processes
- Failed/retried queries counted differently
- Multiple components (embedding, search, rerank) billed separately

**Solution**: Contact Pinecone support for detailed usage breakdown.

## Best Practices

### 1. Consistent Naming Conventions

Use standardized provider and model names:

```
# Good - consistent
llm_provider: "anthropic"
llm_model: "claude-3-opus-20240229"

# Avoid - inconsistent
llm_provider: "Anthropic", "anthropic", "claude"
llm_model: "opus", "Claude 3 Opus", "claude-3-opus"
```

### 2. Include Version Information

Track model versions for debugging:

```
llm_model: "gpt-4-turbo-2024-04-09"  # Good - includes date
llm_model: "gpt-4"                    # Less specific
```

### 3. Regular Analytics Review

Schedule regular reviews:
- Weekly: Check for anomalies and unexpected patterns
- Monthly: Analyze trends and optimization opportunities
- Quarterly: Review overall strategy and model selection

### 4. Correlate with Business Metrics

Connect technical metrics to business outcomes:
- Query volume → User engagement
- Model costs → Customer LTV
- Latency → User satisfaction
- Error rates → Churn risk

### 5. Document Model Changes

Maintain a log of model changes:

```
2024-02-01: Migrated search from GPT-3.5 to Claude-3-Sonnet
2024-02-15: A/B test started - 50% GPT-4, 50% Gemini-Pro
2024-03-01: Rolled out Gemini-Pro to 100% based on results
```

## Cost Optimization Strategies

### Strategy 1: Tiered Model Usage

```
Tier 1 (Free users): Use GPT-3.5 or Gemini-Flash
- Queries per month: 100
- Cost per query: $0.01
- Monthly cost: $1.00

Tier 2 (Pro users): Use Claude-3-Haiku
- Queries per month: 1,000  
- Cost per query: $0.025
- Monthly cost: $25.00

Tier 3 (Enterprise): Use GPT-4 or Claude-3-Opus
- Queries per month: 10,000
- Cost per query: $0.08
- Monthly cost: $800.00
```

### Strategy 2: Query Complexity Routing

```
Simple queries (70% of volume):
- Use GPT-3.5 @ $0.01/query
- Cost: $700/month

Complex queries (30% of volume):
- Use GPT-4 @ $0.08/query  
- Cost: $2,400/month

Total: $3,100/month
Previous (all GPT-4): $8,000/month
Savings: $4,900/month (61% reduction)
```

### Strategy 3: Caching High-Volume Queries

```
# Identify repetitive queries from analytics
Top queries (accounting for 40% of volume):
- "What is your return policy?"
- "How do I reset my password?"
- "What payment methods do you accept?"

# Implement caching
- Cache results for 24 hours
- Reduce 40% of LLM API calls
- Savings: ~$3,200/month
```

## Security and Privacy Considerations

### PII and Sensitive Data

Be cautious with analytics that might expose sensitive information:

```
# Avoid including PII in searchable metadata
❌ Bad: llm_model: "gpt-4-user-john-doe@email.com"
✅ Good: llm_model: "gpt-4-turbo-2024-04-09"
```

### Access Controls

Restrict analytics access based on roles:
- Engineers: Full access to technical metrics
- Finance: Access to cost data
- Executives: High-level dashboards
- Third parties: No access to usage patterns

### Compliance

Consider regulatory requirements:
- GDPR: Don't track user queries in analytics
- HIPAA: Ensure analytics don't include PHI
- SOC 2: Maintain audit logs of analytics access

## Next Steps

- [Error Handling](./error-handling.md) - Handle failures gracefully with proper analytics
- [Cascading Search](./cascading-search.md) - Track analytics across multiple indexes
- [Integration Workflows](../integrations/) - Implement analytics tracking in your environment

## Related Documentation

- [Pinecone Analytics Documentation](https://docs.pinecone.io/guides/operations/analytics)
- [Usage Monitoring Best Practices](https://docs.pinecone.io/guides/operations/monitoring)
- [Cost Optimization Guide](https://docs.pinecone.io/guides/operations/cost-optimization)
- [API Rate Limits](https://docs.pinecone.io/reference/rate-limits)
