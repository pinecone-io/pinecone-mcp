import {describe, it, expect, beforeEach, vi} from 'vitest';
import {createMockPinecone, MockPinecone} from '../../test-utils/mock-pinecone.js';
import {createMockServer, MockServer} from '../../test-utils/mock-server.js';

// Mock the pinecone-client module
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

import {getPineconeClient} from './common/pinecone-client.js';
import {addDescribeIndexTool} from './describe-index.js';

describe('describe-index tool', () => {
  let mockPc: MockPinecone;
  let mockServer: MockServer;

  beforeEach(() => {
    mockPc = createMockPinecone();
    mockServer = createMockServer();
    vi.mocked(getPineconeClient).mockReturnValue(mockPc as never);
  });

  it('registers with the correct name', () => {
    addDescribeIndexTool(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'describe-index',
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.any(Object),
      }),
      expect.any(Function),
    );
  });

  it('returns index info on success', async () => {
    const mockIndexInfo = {
      name: 'test-index',
      dimension: 1536,
      metric: 'cosine',
      host: 'test-host.pinecone.io',
    };
    mockPc.describeIndex.mockResolvedValue(mockIndexInfo);

    addDescribeIndexTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('describe-index');
    const result = await tool!.handler({name: 'test-index'});

    expect(mockPc.describeIndex).toHaveBeenCalledWith('test-index');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockIndexInfo, null, 2),
        },
      ],
    });
  });

  it('returns error response when index not found', async () => {
    mockPc.describeIndex.mockRejectedValue(new Error('Index not found'));

    addDescribeIndexTool(mockServer as never);
    const tool = mockServer.getRegisteredTool('describe-index');
    const result = await tool!.handler({name: 'nonexistent-index'});

    expect(result).toEqual({
      isError: true,
      content: [{type: 'text', text: 'Error: Index not found'}],
    });
  });
});
