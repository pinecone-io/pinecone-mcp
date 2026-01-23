import {vi} from 'vitest';

type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

interface RegisteredTool {
  instructions: string;
  schema: Record<string, unknown>;
  handler: ToolHandler;
}

export function createMockServer() {
  const tools = new Map<string, RegisteredTool>();

  return {
    tool: vi.fn(
      (
        name: string,
        instructions: string,
        schema: Record<string, unknown>,
        handler: ToolHandler,
      ) => {
        tools.set(name, {instructions, schema, handler});
      },
    ),
    getRegisteredTool: (name: string) => tools.get(name),
    getRegisteredToolNames: () => Array.from(tools.keys()),
  };
}

export type MockServer = ReturnType<typeof createMockServer>;
