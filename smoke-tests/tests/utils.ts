import { type Page, test } from '@playwright/test'

async function crawl(page: Page, url = '/', visited = new Set<string>()) {
  if (visited.has(url)) {
    return
  }

  console.log('🕷️ Crawling:', url)
  visited.add(url)

  await page.goto(url, { waitUntil: 'commit' })
  // Do we need this?
  // await page.waitForLoadState()

  const links = await getLinks(page)
  links.forEach((link) => {
    if (visited.has(link)) return
    console.log('  - ', link)
  })
  console.log('')

  for (const url of links) {
    await crawl(page, url, visited)
  }

  return visited
}

async function getLinks(page: Page) {
  const urls: (string | null)[] = []

  for (const link of await page.getByRole('link').all()) {
    urls.push(await link.getAttribute('href'))
  }

  // Only keep valid local urls.
  const filteredUrls = urls.filter((url): url is string => url != null && url.startsWith('/'))

  return [...new Set(filteredUrls)]
}

export async function generateVisualTestParams(page: Page) {
  let urls: string[] = []
  await test.step('Crawl Pages', async () => {
    urls = [...((await crawl(page)) ?? [])]
  })

  console.log('🕷️ URLs found:', urls)

  return urls.map((url) => {
    let name = url.slice(1).replace('/', '--')
    if (name === '') {
      name = 'home'
    }

    return { name, url }
  })
}

export async function goToAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState()
}
