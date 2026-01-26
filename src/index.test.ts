import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

// Mock the server module
const mockServer = {
  connect: vi.fn().mockResolvedValue(undefined),
};

vi.mock('./server.js', () => ({
  default: vi.fn().mockResolvedValue(mockServer),
}));

// Mock the stdio transport using class syntax for vitest 4.x compatibility
const mockTransport = {mockTransport: true};
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class MockStdioServerTransport {
    constructor() {
      Object.assign(this, mockTransport);
    }
  },
}));

describe('index (main entry point)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.resetModules();
  });

  it('sets up server and connects transport on successful start', async () => {
    const {default: setupServer} = await import('./server.js');

    await import('./index.js');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(setupServer).toHaveBeenCalled();
    expect(mockServer.connect).toHaveBeenCalledWith(expect.objectContaining({mockTransport: true}));
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
