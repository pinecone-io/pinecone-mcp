import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addSearchDocsTool, resetDocsClient} from './search-docs.js';

// Mock the MCP SDK client modules
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [{type: 'text', text: 'Documentation result'}],
    }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

describe('search-docs tool', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    mockServer = createMockServer();
    resetDocsClient();
    vi.clearAllMocks();
  });

  it('registers with the correct name', () => {
    addSearchDocsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'search-docs',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({query: expect.anything()}),
      }),
      expect.any(Function),
    );
  });

  it('calls the docs MCP server and returns results', async () => {
    addSearchDocsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-docs');
    const result = await tool!.handler({query: 'how to create index'});

    expect(result).toEqual({
      content: [{type: 'text', text: 'Documentation result'}],
    });
  });

  it('reuses the client connection across multiple calls', async () => {
    const {Client} = await import('@modelcontextprotocol/sdk/client/index.js');

    addSearchDocsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('search-docs');

    await tool!.handler({query: 'first query'});
    await tool!.handler({query: 'second query'});

    // Client should only be instantiated once
    expect(Client).toHaveBeenCalledTimes(1);
  });
});
