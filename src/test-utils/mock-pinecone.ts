import {vi} from 'vitest';

export function createMockNamespace() {
  return {
    searchRecords: vi.fn(),
    upsertRecords: vi.fn(),
  };
}

export function createMockIndex() {
  const mockNamespace = createMockNamespace();
  return {
    describeIndexStats: vi.fn(),
    namespace: vi.fn(() => mockNamespace),
    _mockNamespace: mockNamespace,
  };
}

export function createMockPinecone() {
  const mockIndex = createMockIndex();
  return {
    listIndexes: vi.fn(),
    describeIndex: vi.fn(),
    createIndexForModel: vi.fn(),
    index: vi.fn(() => mockIndex),
    inference: {
      rerank: vi.fn(),
    },
    _mockIndex: mockIndex,
  };
}

export type MockPinecone = ReturnType<typeof createMockPinecone>;
export type MockIndex = ReturnType<typeof createMockIndex>;
export type MockNamespace = ReturnType<typeof createMockNamespace>;
