import {z} from 'zod';

const RecordValue = z
  .union([z.string(), z.boolean(), z.number(), z.array(z.string())])
  .describe('The value of a record field.');

const Record = z
  .record(z.string(), RecordValue)
  .and(
    z
      .union([z.object({_id: z.string()}), z.object({id: z.string()})])
      .describe(
        'Every record must have an identifier. The identifier field may be either `id` or `_id`.',
      ),
  )
  .describe(
    'A record to upsert into the index. Only the field specified in the configured fieldMap will be embedded. The other fields are metadata and can be used to filter results. Records within a namespace should use a consistent schema.',
  );

export const UpsertRecordsRequest = {
  name: z.string().describe('The name of the index to upsert into.'),
  namespace: z.string().describe('The namespace to upsert into.'),
  records: z.array(Record).describe('The records to upsert into the index.'),
};
