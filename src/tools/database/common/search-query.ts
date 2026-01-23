import {z} from 'zod';

export const SEARCH_QUERY_SCHEMA = z
  .object({
    topK: z.number().describe('The number of results to return.'),
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
        contain the fields that you are filtering on.`,
      ),
  })
  .describe('A query to search for records.');
