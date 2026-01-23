import {vi} from 'vitest';

type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

interface RegisteredTool {
  instructions: string;
  schema: Record<string, unknown>;
  handler: ToolHandler;
}

interface ToolConfig {
  description: string;
  inputSchema: Record<string, unknown>;
}

export function createMockServer() {
  const tools = new Map<string, RegisteredTool>();

  return {
    registerTool: vi.fn((name: string, config: ToolConfig, handler: ToolHandler) => {
      tools.set(name, {instructions: config.description, schema: config.inputSchema, handler});
    }),
    getRegisteredTool: (name: string) => tools.get(name),
    getRegisteredToolNames: () => Array.from(tools.keys()),
  };
}

export type MockServer = ReturnType<typeof createMockServer>;
