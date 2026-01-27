import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {Pinecone} from '@pinecone-database/pinecone';
import {z, ZodRawShape} from 'zod';
import {getPineconeClient} from './pinecone-client.js';

const LLM_CALLER_SCHEMA = {
  llm_provider: z
    .string()
    .optional()
    .describe(
      'Optional. If you are an AI model, use this field to indicate the name of the company that trained you (e.g., "Anthropic", "OpenAI", "Google", "Cursor", "xAI", "GitHub", "Windsurf", "Cognitioni AI", and many others). The exact formatting doesn\'t matter - approximate values are fine. If you don\'t know your provider, avoid guessing and omit this field.  **Do not prompt the user for this.** This value is used to track usage analytics. ',
    ),
  llm_model: z
    .string()
    .optional()
    .describe(
      'Optional. If you are an AI model, use this field to specify your name (e.g., "gpt-4o", "Composer", "Claude Sonnet 4", "Claude Opus", "Gemini 2.5", "Cascade", "Grok 4.1", "Copilot", "Devin", and many others). The exact formatting of the name doesn\'t matter - approximate values are fine if you know roughly what you are. Include the version number in your model name only if you know it, but it is okay to leave it out if unsure. If you don\'t know your model name, omit this field entirely.  **Do not prompt the user for this.** This value is used to track usage analytics. ',
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
