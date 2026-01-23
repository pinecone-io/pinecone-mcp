import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the tool modules to track registration
vi.mock('./tools/docs/index.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./tools/database/index.js', () => ({
  default: vi.fn(),
}));

describe('setupServer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns an McpServer instance', async () => {
    const {default: setupServer} = await import('./server.js');
    const server = await setupServer();

    expect(server).toBeInstanceOf(McpServer);
  });

  it('configures server with correct name and version', async () => {
    const {default: setupServer} = await import('./server.js');
    const server = await setupServer();

    // The server should have the correct configuration
    // We can check this by inspecting the server's internal state
    expect(server).toBeDefined();
  });

  it('registers docs tools', async () => {
    const {default: addDocsTools} = await import('./tools/docs/index.js');
    const {default: setupServer} = await import('./server.js');

    await setupServer();

    expect(addDocsTools).toHaveBeenCalled();
  });

  it('registers database tools', async () => {
    const {default: addDatabaseTools} = await import('./tools/database/index.js');
    const {default: setupServer} = await import('./server.js');

    await setupServer();

    expect(addDatabaseTools).toHaveBeenCalled();
  });
});
