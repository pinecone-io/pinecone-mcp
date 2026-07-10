import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {IntegratedRecord} from '@pinecone-database/pinecone';
import {z} from 'zod';
import {formatError} from './common/format-error.js';
import {registerDatabaseTool} from './common/register-tool.js';

const INSTRUCTIONS = `Insert or update records in an integrated Pinecone index.
Text in the field named by the index's "fieldMap" is embedded automatically —
call describe-index first to confirm that field name. Records with an existing
"id" are overwritten. Newly upserted records can take a few seconds to become
visible to search-records and describe-index-stats.`;

export const FIELD_VALUE_SCHEMA = z
  .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  .describe('A field value. Must be a string, number, boolean, or array of strings.');

export const RECORD_SCHEMA = z
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

type UpsertArgs = {
  name: string;
  namespace: string;
  records: IntegratedRecord[];
};

export function addUpsertRecordsTool(server: McpServer) {
  registerDatabaseTool(
    server,
    'upsert-records',
    {
      title: 'Upsert Records',
      description: INSTRUCTIONS,
      inputSchema: SCHEMA,
      annotations: {readOnlyHint: false, destructiveHint: true, idempotentHint: true},
    },
    async (args, pc) => {
      const {name, namespace, records} = args as UpsertArgs;
      try {
        const ns = pc.index(name).namespace(namespace);
        await ns.upsertRecords(records);
        return {
          content: [
            {
              type: 'text' as const,
              text:
                `Upserted ${records.length} record(s) successfully. ` +
                'Newly upserted records can take a few seconds to be indexed; if a ' +
                'search does not reflect them yet, wait briefly and retry.',
            },
          ],
        };
      } catch (e) {
        return {isError: true, content: [{type: 'text' as const, text: formatError(e)}]};
      }
    },
  );
}
