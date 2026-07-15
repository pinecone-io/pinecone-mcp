import {vi} from 'vitest';

type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

interface RegisteredTool {
  instructions: string;
  schema: Record<string, unknown>;
  title?: string;
  annotations?: Record<string, unknown>;
  handler: ToolHandler;
}

interface ToolConfig {
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

export function createMockServer() {
  const tools = new Map<string, RegisteredTool>();

  return {
    registerTool: vi.fn((name: string, config: ToolConfig, handler: ToolHandler) => {
      tools.set(name, {
        instructions: config.description,
        schema: config.inputSchema,
        title: config.title,
        annotations: config.annotations,
        handler,
      });
    }),
    getRegisteredTool: (name: string) => tools.get(name),
    getRegisteredToolNames: () => Array.from(tools.keys()),
  };
}

export type MockServer = ReturnType<typeof createMockServer>;
