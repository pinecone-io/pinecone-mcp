import {z} from 'zod';

const RecordValue = z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]).describe(
  `The value of a record field. Field values should be strings, numbers,
    booleans, or arrays of strings. Objects are not permitted as field values.`,
);

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
    `A record to upsert into the index. A record is a JSON object with a set of
    key-value pairs. Field values should be strings, numbers, booleans, or
    arrays of strings. Objects are not permitted as field values.

    The field specified in the index's \`fieldMap\` will be embedded, so make
    sure to include that field name in the record. The value of this field
    should be a string, consisting of the text content of the document. If you
    don't know what field name to use, describe the index and look at the value
    of \`fieldMap\`.

    A record must contain an identifier (either \`id\` or \`_id\`), which is a
    string that uniquely identifies the record.

    The record may contain any number of other fields. Extra fields are
    considered to be "metadata" and can be used to filter results. All fields
    should be included in the root of the record and not as subfields.

    Records within a namespace should use a consistent schema. Each record
    should have the same set of fields with the same types of data.`,
  );

export const UpsertRecordsRequest = {
  name: z.string().describe('The name of the index to upsert into.'),
  namespace: z.string().describe('The namespace to upsert into.'),
  records: z.array(Record).describe('A set of records to upsert into the index.'),
};
