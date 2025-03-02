import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs/promises'

const TEST_DIR =
  process.env.TEST_REPOSITORY_DIR ?
    process.env.TEST_REPOSITORY_DIR.endsWith('/') ?
      process.env.TEST_REPOSITORY_DIR
    : process.env.TEST_REPOSITORY_DIR + '/'
  : ''

const TEST_STYLES_PATH = process.env.TEST_STYLES_PATH || `${TEST_DIR}/tests/test-styles.css`
const hasTestStyles = await fs
  .access(TEST_STYLES_PATH)
  .then(() => true)
  .catch(() => false)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // Fail fast, we don't have time for multiple retries.
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], process.env.CI ? ['github'] : ['line']],

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: {
      stylePath: hasTestStyles ? TEST_STYLES_PATH : undefined,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Crawler',
      testMatch: '**/crawl.ts',
    },

    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/smoke-tests.ts',
    },

    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/smoke-tests.ts',
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/smoke-tests.ts',
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/smoke-tests.ts',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
      testMatch: '**/smoke-tests.ts',
    },
  ],
})
