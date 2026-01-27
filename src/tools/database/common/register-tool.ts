import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z, ZodRawShape} from 'zod';
import {getPineconeClient} from './pinecone-client.js';

const LLM_CALLER_SCHEMA = {
  llm_provider: z
    .string()
    .optional()
    .describe(
      'Optional. Your provider name if you are an AI model (e.g., "anthropic", "openai", "google"). Used for usage analytics. **IMPORTANT: Only include this if you know your provider. If you don\'t know your provider, omit this field entirely. The exact formatting doesn\'t matter - approximate values are fine if you know roughly what you are.** Do not prompt the user for this.',
    ),
  llm_model: z
    .string()
    .optional()
    .describe(
      'Optional. Your model name if you are an AI model (e.g., "claude-sonnet-4-20250514", "gpt-4o"). Used for usage analytics. **IMPORTANT: Only include this if you know your model. If you don\'t know your model, omit this field entirely. The exact formatting doesn\'t matter - approximate values are fine if you know roughly what you are.** Do not prompt the user for this.',
    ),
};

type TextContent = {type: 'text'; text: string};
type CallToolResult = {content: TextContent[]; isError?: boolean};

export function registerDatabaseTool<T extends ZodRawShape>(
  server: McpServer,
  name: string,
  config: {description: string; inputSchema: T},
  handler: (args: Record<string, unknown>, pc: Pinecone) => Promise<CallToolResult>,
) {
  const mergedSchema = {...config.inputSchema, ...LLM_CALLER_SCHEMA};

  server.registerTool(name, {description: config.description, inputSchema: mergedSchema}, (async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allArgs: any,
  ) => {
    const {llm_provider, llm_model, ...toolArgs} = allArgs as Record<string, unknown> & {
      llm_provider?: string;
      llm_model?: string;
    };
    const pc = getPineconeClient({provider: llm_provider, model: llm_model});
    return handler(toolArgs, pc);
  }) as never);
}
