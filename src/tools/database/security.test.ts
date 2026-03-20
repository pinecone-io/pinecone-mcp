import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. HOISTED MOCK: This must be at the very top to intercept the tools' imports
vi.mock('./common/pinecone-client.js', () => ({
  getPineconeClient: vi.fn(),
}));

// Now import the tools and utilities
import { createMockServer } from '../../test-utils/mock-server.js';
import { createMockPinecone } from '../../test-utils/mock-pinecone.js';
import { getPineconeClient } from './common/pinecone-client.js';
import { addSearchRecordsTool } from './search-records.js';
import { addUpsertRecordsTool } from './upsert-records.js';

describe('Pinecone MCP Security Hardening', () => {
  let mockServer: any;
  let mockPc: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    mockPc = createMockPinecone();

    // 2. Force the client factory to return our mock for every call
    vi.mocked(getPineconeClient).mockReturnValue(mockPc);

    addSearchRecordsTool(mockServer);
    addUpsertRecordsTool(mockServer);
    
    // Satisfy the initial constant check
    vi.stubEnv('PINECONE_API_KEY', 'test-key');
  });

  describe('Metadata Firewall (search-records)', () => {
    it('should strip unauthorized metadata keys from search results', async () => {
      const mockRecords = {
        records: [{
          id: 'vec-1',
          metadata: { text: 'public', ssn: 'secret-123' }
        }]
      };

      mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue(mockRecords);

      const tool = mockServer.getRegisteredTool('search-records');
      const result = await tool.handler({
        name: 'idx', namespace: 'ns',
        query: { inputs: { text: 'test' }, topK: 1 },
        selectedMetadataKeys: ['text']
      });

      // Helpful debugging: if it fails, show why
      if (result.isError) {
        throw new Error(`Tool returned error: ${result.content[0].text}`);
      }

      const output = JSON.parse(result.content[0].text);
      expect(output.records[0].metadata.ssn).toBeUndefined();
      expect(output.records[0].metadata.text).toBe('public');
    });

    it('should return all metadata if selectedMetadataKeys is omitted', async () => {
      mockPc._mockIndex._mockNamespace.searchRecords.mockResolvedValue({
        records: [{ id: '1', metadata: { secret: 'data' } }]
      });

      const tool = mockServer.getRegisteredTool('search-records');
      const result = await tool.handler({
        name: 'idx', namespace: 'ns',
        query: { inputs: { text: 'test' }, topK: 1 }
      });

      if (result.isError) {
        throw new Error(`Tool returned error: ${result.content[0].text}`);
      }

      const output = JSON.parse(result.content[0].text);
      expect(output.records[0].metadata.secret).toBe('data');
    });
  });

  describe('Upsert Guardrail (upsert-records)', () => {
    it('should block upsert if confirmOverwrite flag is missing', async () => {
      const tool = mockServer.getRegisteredTool('upsert-records');
      const result = await tool.handler({
        name: 'idx', namespace: 'ns',
        records: [{ id: '1', text: 'val' }]
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('confirmOverwrite must be set to true');
    });

    it('should execute upsert when confirmOverwrite is true', async () => {
      mockPc._mockIndex._mockNamespace.upsertRecords.mockResolvedValue(undefined);
      const tool = mockServer.getRegisteredTool('upsert-records');

      const result = await tool.handler({
        name: 'idx', namespace: 'ns',
        records: [{ id: '1', text: 'val' }],
        confirmOverwrite: true
      });

      // Final check: ensure no error was returned
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toBe('Data upserted successfully');
    });
  });
});