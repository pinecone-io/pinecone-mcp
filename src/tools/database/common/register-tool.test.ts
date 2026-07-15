import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {z} from 'zod';

// Mock the Pinecone client module
const mockPineconeClient = {mockClient: true};
vi.mock('./pinecone-client.js', () => ({
  getPineconeClient: vi.fn().mockReturnValue(mockPineconeClient),
}));

describe('registerDatabaseTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('registers a tool with merged schema including LLM caller fields', async () => {
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    const inputSchema = {
      indexName: z.string().describe('The index name'),
    };

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'A test tool', inputSchema},
      async () => ({content: [{type: 'text', text: 'ok'}]}),
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
    const [name, config] = mockServer.registerTool.mock.calls[0];

    expect(name).toBe('test-tool');
    expect(config.description).toBe('A test tool');
    expect(config.inputSchema).toHaveProperty('indexName');
    expect(config.inputSchema).toHaveProperty('llm_provider');
    expect(config.inputSchema).toHaveProperty('llm_model');
  });

  it('extracts LLM caller fields and passes remaining args to handler', async () => {
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    const handlerArgs: Record<string, unknown>[] = [];
    const handler = vi.fn().mockImplementation(async (args) => {
      handlerArgs.push(args);
      return {content: [{type: 'text', text: 'ok'}]};
    });

    const inputSchema = {
      indexName: z.string(),
      query: z.string(),
    };

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'Test', inputSchema},
      handler,
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    await registeredHandler({
      indexName: 'my-index',
      query: 'search term',
      llm_provider: 'anthropic',
      llm_model: 'claude-3',
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handlerArgs[0]).toEqual({
      indexName: 'my-index',
      query: 'search term',
    });
    expect(handlerArgs[0]).not.toHaveProperty('llm_provider');
    expect(handlerArgs[0]).not.toHaveProperty('llm_model');
  });

  it('creates Pinecone client with caller info from LLM fields', async () => {
    const {getPineconeClient} = await import('./pinecone-client.js');
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    const handler = vi.fn().mockResolvedValue({content: [{type: 'text', text: 'ok'}]});

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'Test', inputSchema: {indexName: z.string()}},
      handler,
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    await registeredHandler({
      indexName: 'my-index',
      llm_provider: 'openai',
      llm_model: 'gpt-4',
    });

    expect(getPineconeClient).toHaveBeenCalledWith({
      provider: 'openai',
      model: 'gpt-4',
    });
  });

  it('passes title and annotations through to the server', async () => {
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {
        title: 'Test Tool',
        description: 'A test tool',
        inputSchema: {},
        annotations: {readOnlyHint: true},
      },
      async () => ({content: [{type: 'text', text: 'ok'}]}),
    );

    const [, config] = mockServer.registerTool.mock.calls[0];
    expect(config.title).toBe('Test Tool');
    expect(config.annotations).toEqual({readOnlyHint: true});
  });

  it('returns an in-band error result when the Pinecone client cannot be created', async () => {
    const {getPineconeClient} = await import('./pinecone-client.js');
    vi.mocked(getPineconeClient).mockImplementationOnce(() => {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    });

    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    const handler = vi.fn();
    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'Test', inputSchema: {}},
      handler,
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    const result = await registeredHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('PINECONE_API_KEY');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns an in-band error result when the handler throws', async () => {
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'Test', inputSchema: {}},
      async () => {
        throw new Error('unexpected handler failure');
      },
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    const result = await registeredHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('unexpected handler failure');
  });

  it('passes Pinecone client to handler', async () => {
    const {registerDatabaseTool} = await import('./register-tool.js');
    const mockServer = {
      registerTool: vi.fn(),
    };

    let receivedClient: unknown;
    const handler = vi.fn().mockImplementation(async (_args, pc) => {
      receivedClient = pc;
      return {content: [{type: 'text', text: 'ok'}]};
    });

    registerDatabaseTool(
      mockServer as never,
      'test-tool',
      {description: 'Test', inputSchema: {indexName: z.string()}},
      handler,
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    await registeredHandler({indexName: 'my-index'});

    expect(receivedClient).toBe(mockPineconeClient);
  });
});
