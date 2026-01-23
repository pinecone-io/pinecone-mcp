import {describe, it, expect, beforeEach} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';
import {addUpsertRecordsTool} from './upsert-records.js';

describe('upsert-records tool handler', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
  });

  it('registers with the correct name', () => {
    addUpsertRecordsTool(mockServer as never, mockPc as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'upsert-records',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({
          name: expect.anything(),
          namespace: expect.anything(),
          records: expect.anything(),
        }),
      }),
      expect.any(Function),
    );
  });

  it('upserts records successfully', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockResolvedValue(undefined);

    addUpsertRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const records = [
      {id: 'rec-1', content: 'Hello world'},
      {id: 'rec-2', content: 'Goodbye world'},
    ];
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records,
    });

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(mockPc._mockIndex.namespace).toHaveBeenCalledWith('test-ns');
    expect(mockPc._mockIndex._mockNamespace.upsertRecords).toHaveBeenCalledWith(records);
    expect(result).toEqual({
      content: [{type: 'text', text: 'Data upserted successfully'}],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockRejectedValue(new Error('API error'));

    addUpsertRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records: [{id: 'rec-1', content: 'Hello'}],
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });

  it('handles records with _id field', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockResolvedValue(undefined);

    addUpsertRecordsTool(mockServer as never, mockPc as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const records = [{_id: 'rec-1', content: 'Hello world'}];
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records,
    });

    expect(mockPc._mockIndex._mockNamespace.upsertRecords).toHaveBeenCalledWith(records);
    expect(result).toEqual({
      content: [{type: 'text', text: 'Data upserted successfully'}],
    });
  });
});
