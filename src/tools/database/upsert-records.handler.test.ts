import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addUpsertRecordsTool} from './upsert-records.js';

describe('upsert-records tool handler', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addUpsertRecordsTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'upsert-records',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('upserts records successfully', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockResolvedValue(undefined);

    addUpsertRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records: [{id: '1', content: 'test content'}],
    });

    expect(mockPc.index).toHaveBeenCalledWith('test-index');
    expect(mockPc._mockIndex.namespace).toHaveBeenCalledWith('test-ns');
    expect(mockPc._mockIndex._mockNamespace.upsertRecords).toHaveBeenCalledWith([
      {id: '1', content: 'test content'},
    ]);
    expect(result).toEqual({
      content: [{type: 'text', text: 'Data upserted successfully'}],
    });
  });

  it('returns error response on API failure', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockRejectedValue(new Error('API error'));

    addUpsertRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const result = await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records: [{id: '1', content: 'test content'}],
    });

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: API error'}],
    });
  });

  it('handles records with _id field', async () => {
    mockPc._mockIndex._mockNamespace.upsertRecords.mockResolvedValue(undefined);

    addUpsertRecordsTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('upsert-records');
    const result = (await tool!.handler({
      name: 'test-index',
      namespace: 'test-ns',
      records: [{_id: 'alt-1', content: 'test content'}],
    })) as {content: Array<{text: string}>};

    expect(mockPc._mockIndex._mockNamespace.upsertRecords).toHaveBeenCalledWith([
      {_id: 'alt-1', content: 'test content'},
    ]);
    expect(result.content[0].text).toContain('successfully');
  });
});
