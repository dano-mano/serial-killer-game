import { defineConfig, devices } from 'playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Chromium-only for the scaffold. The webServer config starts the Next.js dev
 * server automatically before tests run, or reuses an existing server if one
 * is already running on port 3000.
 *
 * E2E tests live in apps/web/e2e/ and use the .spec.ts suffix to keep them
 * separate from Vitest unit tests (Constitution Principle XXVI).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
