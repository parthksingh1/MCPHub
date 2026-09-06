import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the web app.
 *
 * `e2e/` is excluded explicitly: those specs import from `@playwright/test`,
 * which Vitest cannot run. Without this the unit-test task fails on files that
 * were never meant for it — and does so in CI, where it looks like a real
 * regression.
 */
export default defineConfig({
  test: {
    include: ['{app,components,lib}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
});
