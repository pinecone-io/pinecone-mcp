import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

// Mock the server module
const mockServer = {
  connect: vi.fn().mockResolvedValue(undefined),
};

vi.mock('./server.js', () => ({
  default: vi.fn().mockResolvedValue(mockServer),
}));

// Mock the stdio transport
const mockTransport = {mockTransport: true};
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => mockTransport),
}));

describe('index (main entry point)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.resetModules();
  });

  it('sets up server and connects transport on successful start', async () => {
    const {default: setupServer} = await import('./server.js');
    const {StdioServerTransport} = await import('@modelcontextprotocol/sdk/server/stdio.js');

    await import('./index.js');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(setupServer).toHaveBeenCalled();
    expect(StdioServerTransport).toHaveBeenCalled();
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Pinecone MCP Server running on stdio');
  });

  it('logs error and exits with code 1 on failure', async () => {
    const testError = new Error('Test connection failure');

    vi.resetModules();
    vi.doMock('./server.js', () => ({
      default: vi.fn().mockRejectedValue(testError),
    }));

    await import('./index.js');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Fatal error in main():', testError);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
