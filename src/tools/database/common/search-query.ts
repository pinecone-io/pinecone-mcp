import {z} from 'zod';

export const SEARCH_QUERY_SCHEMA = z
  .object({
    topK: z.number().describe(
      `The number of results to return. 10 is a reasonable default; use a
      larger value (e.g. 50) when reranking, so the reranker has more
      candidates to choose from. Very large values increase latency and
      response size.`,
    ),
    inputs: z.object({
      text: z.string().describe('The text to search for.'),
    }),
    filter: z
      .looseObject({})
      .optional()
      .describe(
        `A filter can be used to narrow down results. Use the syntax of
        MongoDB's query and projection operators: $eq, $ne, $gt, $gte, $lt,
        $lte, $in, $nin, $exists, $and, $or. Make sure the records in the index
        contain the fields that you are filtering on. To discover which fields
        exist, run a search without a filter and inspect the "fields" of the
        returned hits. Filtering on a field that records do not contain
        returns no results.`,
      ),
  })
  .describe('A query to search for records.');
