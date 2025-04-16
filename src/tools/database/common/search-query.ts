import { z } from "zod"

export const SEARCH_QUERY_SCHEMA = z
  .object({
    topK: z.number().describe('The number of results to return.'),
    inputs: z.object({
      text: z.string().describe('The text to search for.'),
    }),
    filter: z
      .any()
      .optional()
      .describe(
        `Optional filter to apply to the search results. Pinecone's filtering
        query language is based on MongoDB's query and projection operators.
        Pinecone currently supports a subset of those selectors: $eq, $ne, $gt,
        $gte, $lt, $lte, $in, $nin, $exists, $and, $or`,
      ),
  })
  .describe('A query to search for records.');
