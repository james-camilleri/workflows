import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs/promises'

function rebasePath(path: string) {
  return './.test-repository/' + path.replace(/\.?\/?/, '')
}

const REPOSITORY_DIR =
  process.env.TEST_REPOSITORY_DIR ?
    process.env.TEST_REPOSITORY_DIR.endsWith('/') ?
      process.env.TEST_REPOSITORY_DIR
    : process.env.TEST_REPOSITORY_DIR + '/'
  : './'

console.log(`Using working directory '${REPOSITORY_DIR}'.`)

const TEST_STYLES_PATH = process.env.TEST_STYLES_PATH || `${REPOSITORY_DIR}/tests/setup/styles.css`
const hasTestStyles = await fs
  .access(rebasePath(TEST_STYLES_PATH))
  .then(() => true)
  .catch(() => false)

if (hasTestStyles) {
  console.log(`Using test styles from '${TEST_STYLES_PATH}'.`)
} else {
  console.log(`No test styles found at '${TEST_STYLES_PATH}'.`)
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // Fail fast, we don't have time for multiple retries.
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['line'], ...(process.env.CI ? ([['github']] as const) : [])],

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  snapshotPathTemplate:
    process.env.SCREENSHOT_DIRECTORY ?
      rebasePath(process.env.SCREENSHOT_DIRECTORY)
    : `${rebasePath(REPOSITORY_DIR)}/.smoke-tests/{projectName}/{arg}{ext}`,

  expect: {
    toHaveScreenshot: {
      stylePath: hasTestStyles ? rebasePath(TEST_STYLES_PATH) : undefined,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'crawler',
      testMatch: '**/crawl.ts',
    },

    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/smoke-tests.ts',
    },

    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/smoke-tests.ts',
    },

    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/smoke-tests.ts',
    },

    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/smoke-tests.ts',
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: '**/smoke-tests.ts',
    },
  ],
})
