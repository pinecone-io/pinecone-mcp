import {z} from 'zod';

export const SearchDocsRequest = {
  query: z.string().describe('The query to search for'),
};
