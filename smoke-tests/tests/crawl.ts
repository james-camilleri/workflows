import fs from 'node:fs/promises'

import test from '@playwright/test'

import { generateVisualTestParams } from './utils'

const BLOCK_RESOURCE_TYPES = [
  'beacon',
  'csp_report',
  'font',
  'image',
  'imageset',
  'media',
  'object',
  'texttrack',
  'stylesheet',
  // 'script',
  // 'xhr',
]

test('Crawl website and generate test parameters', async ({ page }) => {
  test.setTimeout(1000 * 60 * 10)

  page.route('**/*', (route) => {
    if (BLOCK_RESOURCE_TYPES.includes(route.request().resourceType())) {
      return route.abort()
    }

    return route.continue()
  })

  const testParams = await generateVisualTestParams(page)
  await fs.writeFile('tests/test-params.json', JSON.stringify(testParams, null, 2))
})
