import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z} from 'zod';

const INSTRUCTIONS = 'Insert or update records in a Pinecone index';

const FIELD_VALUE_SCHEMA = z
  .any()
  .refine(
    (value) => {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        return false;
      }
      return true;
    },
    {
      message: 'A record must not contain nested objects.',
    },
  )
  .refine(
    (value) => {
      if (value === null) {
        return false;
      }
      return true;
    },
    {
      message: 'A field value must not be null.',
    },
  )
  .refine(
    (value) => {
      if (Array.isArray(value)) {
        return value.every((item) => typeof item === 'string');
      }
      return true;
    },
    {
      message: 'Array field values must contain only strings.',
    },
  )
  .describe(
    `A field value. Must be a string, number, boolean, or array of strings.
    Nested objects are not permitted.`,
  );

const RECORD_SCHEMA = z
  .record(z.string(), FIELD_VALUE_SCHEMA)
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
    `A record to upsert. Must have an "id" or "_id" field and contain text in
    the field specified by the index's "fieldMap".`,
  );

const RECORD_SET_SCHEMA = z.array(RECORD_SCHEMA).describe(
  `A set of records to upsert into the index. Use a consistent schema for all
  records in the index.`,
);

const SCHEMA = {
  name: z.string().describe('The index to upsert into.'),
  namespace: z.string().describe('The namespace to upsert into.'),
  records: RECORD_SET_SCHEMA,
};

export function addUpsertRecordsTool(server: McpServer, pc: Pinecone) {
  server.tool('upsert-records', INSTRUCTIONS, SCHEMA, async ({name, namespace, records}) => {
    try {
      const ns = pc.index(name).namespace(namespace);
      await ns.upsertRecords(records);
      return {
        content: [{type: 'text', text: 'Data upserted successfully'}],
      };
    } catch (e) {
      return {isError: true, content: [{type: 'text', text: String(e)}]};
    }
  });
}
