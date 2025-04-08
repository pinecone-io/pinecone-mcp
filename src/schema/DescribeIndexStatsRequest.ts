import {z} from 'zod';

export const DescribeIndexStatsRequest = {
  name: z.string().describe('The name of the index whose statistics will be described.'),
};
