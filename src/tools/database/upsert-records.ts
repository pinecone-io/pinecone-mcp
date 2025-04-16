import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = `Use this tool to insert or update a set of records in a
Pinecone index. The records will be stored in the specified namespace, and the
text content of the records will be embedded and indexed using the index's
integrated embedding model. Follow these rules when upserting data:
- Each record is a JSON object consisting of fields with values. Values may be
strings, numbers, booleans, or arrays of strings. Objects are not permitted as
field values.
- All of the records should use a consistent schema, with the same set of fields
and the same types of data.
- Each record must have a unique identifier. The ID field may be named either
"id" or "_id", and its value must be a string.
- The field specified in the index's "fieldMap" will be embedded, so make sure
to include a field with that name in every record. The value of this field
must be a string, consisting of the text content of the document. If you don't
know what field name to use, describe the index and look at the value of
"embed.fieldMap.text".
- Additional fields may be included, which can be used to filter search results.
If the record includes metadata, do not put it in a subfield. Put all metadata
fields in the root of the record.`;

const RECORD_SCHEMA = z
  .record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]))
  .refine(
    (record) => {
      const hasId = 'id' in record || '_id' in record;
      return hasId;
    },
    {
      message: 'A record must have an "id" or "_id" field.',
    },
  )
  .describe(
    `A record to upsert into the index. Make sure to follow the instructions.
    For example, suppose you had an index set up to search for movies, with a
    "fieldMap" of {"text": "description"}. If you wanted to insert a record for
    the 1999 sci-fi/action movie "The Matrix" into the index, your record might
    look like this:
    {
      "id": "98bf186e-8e4c-40c3-a7f2-2d822ecd0c78",
      "description": "A computer hacker joins a rebellion against the machines that have trapped humanity in a computer simulation.",
      "year": 1999,
      "genre": ["Action", "Sci-Fi"]
    }`,
  );

const SCHEMA = {
  name: z.string().describe('The name of the index to upsert into.'),
  namespace: z.string().describe('The namespace to upsert into.'),
  records: z.array(RECORD_SCHEMA).describe('A set of records to upsert into the index.'),
};

export function addUpsertRecordsTool(server: McpServer, pc: Pinecone) {
  server.tool('upsert-records', INSTRUCTIONS, SCHEMA, async ({name, namespace, records}) => {
    const ns = pc.index(name).namespace(namespace);
    await ns.upsertRecords(records);
    return {
      content: [{type: 'text', text: 'Data upserted successfully'}],
    };
  });
}
