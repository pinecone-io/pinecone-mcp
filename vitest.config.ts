import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Live integration tests run via `npm run test:integration`, not the default suite.
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
});
