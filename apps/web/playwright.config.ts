import { defineConfig, devices } from '@playwright/test';

/** The dev server port these tests drive. Overridable to avoid collisions. */
const PORT = Number.parseInt(process.env.E2E_PORT ?? '4823', 10);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Playwright configuration.
 *
 * Two projects: `e2e` runs the critical-flow assertions, `screenshots`
 * captures the README imagery. They are separate because the screenshot run
 * needs a deterministic viewport and no test failures interrupting it, while
 * the E2E run wants retries and parallelism.
 */
export default defineConfig({
  testDir: './e2e',
  // Serial, not parallel. Every test drives the same dev server, which
  // compiles routes on demand — running four workers against it produces
  // timeouts that look like product bugs but are just contention.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  // Generous by E2E standards, because these run against a dev server that
  // compiles routes on first request. Playwright's 5s default produces
  // failures that look like product bugs and are really just a cold route.
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testIgnore: /screenshots\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'screenshots',
      testMatch: /screenshots\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],

  // Reuse an already-running dev server locally; start one in CI.
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});
