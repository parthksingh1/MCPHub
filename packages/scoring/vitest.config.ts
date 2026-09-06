import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts'],
      reporter: ['text', 'lcov'],
      // The Trust Score is the credibility-critical part of MCPHub.
      // If someone is going to argue with the number, every branch that
      // produced it must be covered.
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
