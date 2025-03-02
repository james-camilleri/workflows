import { expect, test } from '@playwright/test'

import testParams from './test-params.json' with { type: 'json' }
import { goToAndWait } from './utils'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime('2025-01-19')
})

test.describe('Smoke Tests', () => {
  testParams.forEach(({ name, url }) => {
    test(name, async ({ page }) => {
      await test.step(`Navigate to "${name}"`, async () => {
        await goToAndWait(page, url)
      })

      await test.step(`Screenshot "${name}"`, async () => {
        await expect(page).toHaveScreenshot(`${name}.png`, {
          animations: 'disabled',
          // TODO: Why is this failing with a short timeout?
          timeout: 5000 * 10,
          // TODO: This is not working with the scrollable grid container.
          // fullPage: true,
        })
      })
    })
  })
})
