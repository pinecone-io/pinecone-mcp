import {defineConfig} from 'vitest/config';

// Live integration suite: hits a real Pinecone project. Requires PINECONE_API_KEY.
// Kept separate from the default unit run so normal CI stays offline and fast.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    // Index create + embedding can take minutes; give the suite room.
    testTimeout: 300_000,
    hookTimeout: 120_000,
  },
});
