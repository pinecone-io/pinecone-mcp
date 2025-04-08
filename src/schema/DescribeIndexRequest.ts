import {z} from 'zod';

export const DescribeIndexRequest = {
  name: z.string().describe('The name of the index to describe.'),
};
