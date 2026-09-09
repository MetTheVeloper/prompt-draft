import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const isWindows = process.platform === 'win32'
const siteBase = 'https://example.test'
const apiBase = String(process.env.PHASE4D_STATIC_API_BASE || 'http://127.0.0.1:4000').replace(/\/+$/, '')

const discoverySlugs = [
  'portrait-photography',
  '3d-sculpture',
  'illustration-animation',
  'posters-editorial',
  'product-fashion',
  'cinematic-game-art',
]

const forbiddenPrivateKeys = [
  '"email":',
  '"birthday":',
  '"role":',
  '"sourceDraftId":',
  '"sourceUserId":',
  '"source_draft_id":',
  '"source_user_id":',
  '"storageKey":',
  '"storage_key":',
  '"variants":',
  '"balance":',
  '"permissions":',
  '"sessions":',
  '"viewer":',
]

function assertNoPrivateKeys(body, label) {
  for (const key of forbiddenPrivateKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoLegacyDetailRoutes(body, label) {
  assert.equal(body.includes('/prompts?id='), false, `${label} contains legacy Prompt detail route`)
  assert.equal(body.includes('/user?un='), false, `${label} contains legacy Creator detail route`)
}

function runPnpmGenerate(env) {
  if (isWindows) {
    return spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'pnpm generate'],
      { stdio: 'inherit', env },
    )
  }

  return spawnSync('pnpm', ['generate'], { stdio: 'inherit', env })
}

async function getInventory() {
  const response = await fetch(`${apiBase}/api/public/inventory`)
  assert.equal(
    response.status,
    200,
    `Local public inventory API must be available before static verification (${response.status})`,
  )

  const payload = await response.json()
  assert.equal(payload?.ok, true)
  assert.ok(Array.isArray(payload?.inventory?.prompts))
  assert.ok(Array.isArray(payload?.inventory?.creators))
  return payload.inventory
}

function countExpectedInventoryUrls(inventory) {
  const validLocales = new Set(['en', 'fa'])
  const countLocales = value => Array.isArray(value)
    ? new Set(value.filter(locale => validLocales.has(locale))).size
    : 0

  const promptUrls = inventory.prompts.reduce(
    (sum, prompt) => sum + countLocales(prompt.availableLocales),
    0,
  )

  const creatorUrls = inventory.creators.reduce((sum, creator) => {
    if (creator?.policy?.indexable !== true) return sum
    return sum + countLocales(creator.availableLocales)
  }, 0)

  const staticUrls = 2 * 2
  const discoveryUrls = discoverySlugs.length * 2
  return staticUrls + discoveryUrls + promptUrls + creatorUrls
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/example\.test[^<]+)<\/loc>/g)].map(match => match[1])
}

function llmsUrls(markdown) {
  return [...markdown.matchAll(/^- \[[^\]]+\]\((https:\/\/example\.test[^)]+)\)$/gm)].map(match => match[1])
}

const inventory = await getInventory()
const expectedUrlCount = countExpectedInventoryUrls(inventory)
assert.ok(expectedUrlCount > 16, 'Expected dynamic Prompt/Creator URLs in production-like inventory')

console.log(`[phase4d-static] Local public inventory available; expected canonical URL count: ${expectedUrlCount}`)
console.log('[phase4d-static] Running one fresh legacy static generation with isolated production-like env overrides.')
console.log('[phase4d-static] Parent shell environment is not modified.')

const env = {
  ...process.env,
  NUXT_PUBLIC_SITE_URL: siteBase,
  NUXT_PUBLIC_API_BASE: apiBase,
  NUXT_API_BASE_INTERNAL: apiBase,
  NUXT_PUBLIC_NOINDEX: 'false',
}

const generate = runPnpmGenerate(env)
if (generate.error) {
  console.error('[phase4d-static] Failed to start pnpm generate:', generate.error)
  process.exit(1)
}
if (generate.status !== 0) {
  console.error(`[phase4d-static] FAIL: pnpm generate exited with ${generate.status ?? 'unknown status'}`)
  process.exit(generate.status ?? 1)
}

const publicDir = join(process.cwd(), '.output', 'public')
const [sitemap, llms, robots] = await Promise.all([
  readFile(join(publicDir, 'sitemap.xml'), 'utf8'),
  readFile(join(publicDir, 'llms.txt'), 'utf8'),
  readFile(join(publicDir, 'robots.txt'), 'utf8'),
])

const sitemapSet = [...new Set(sitemapUrls(sitemap))].sort()
const llmsSet = [...new Set(llmsUrls(llms))].sort()

assert.equal(sitemapSet.length, expectedUrlCount, 'Static sitemap canonical URL count mismatch')
assert.equal(llmsSet.length, expectedUrlCount, 'Static llms canonical URL count mismatch')
assert.deepEqual(llmsSet, sitemapSet, 'Static sitemap and llms URL sets must match exactly')
assert.match(robots, /^Sitemap: https:\/\/example\.test\/sitemap\.xml$/m)
assert.doesNotMatch(robots, /^Disallow: \/$/m)
assertNoLegacyDetailRoutes(sitemap, 'static sitemap.xml')
assertNoLegacyDetailRoutes(llms, 'static llms.txt')
assertNoPrivateKeys(sitemap, 'static sitemap.xml')
assertNoPrivateKeys(llms, 'static llms.txt')

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const language = locale === 'fa' ? 'fa-IR' : 'en-US'
  const direction = locale === 'fa' ? 'rtl' : 'ltr'

  for (const slug of discoverySlugs) {
    const filePath = join(
      publicDir,
      ...(locale === 'fa' ? ['fa'] : []),
      'discover',
      slug,
      'index.html',
    )
    const html = await readFile(filePath, 'utf8')
    const canonical = `${siteBase}${prefix}/discover/${slug}`

    assert.ok(html.includes(`lang="${language}"`), `${locale.toUpperCase()} ${slug} lang mismatch`)
    assert.ok(html.includes(`dir="${direction}"`), `${locale.toUpperCase()} ${slug} dir mismatch`)
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${locale.toUpperCase()} ${slug} canonical mismatch`)
    assert.ok(html.includes('hreflang="en-US"'), `${locale.toUpperCase()} ${slug} EN hreflang missing`)
    assert.ok(html.includes('hreflang="fa-IR"'), `${locale.toUpperCase()} ${slug} FA hreflang missing`)
    assert.ok(html.includes('"@type":"CollectionPage"'), `${locale.toUpperCase()} ${slug} CollectionPage JSON-LD missing`)
    assert.ok(html.includes('"@type":"ItemList"'), `${locale.toUpperCase()} ${slug} ItemList JSON-LD missing`)
    assert.equal(html.includes('data-public-seo-snapshot'), false, `${locale.toUpperCase()} ${slug} legacy snapshot marker remains`)
    assert.equal(html.includes('data-public-seo-structured'), false, `${locale.toUpperCase()} ${slug} legacy structured-data marker remains`)
    assert.equal(html.includes('name="robots" content="noindex'), false, `${locale.toUpperCase()} ${slug} must not inherit staging noindex in production-like static generation`)
    assertNoLegacyDetailRoutes(html, `${locale.toUpperCase()} static Discovery ${slug}`)
    assertNoPrivateKeys(html, `${locale.toUpperCase()} static Discovery ${slug}`)
  }
}

console.log(`\n[phase4d-static] sitemap URLs: ${sitemapSet.length}`)
console.log(`[phase4d-static] llms URLs: ${llmsSet.length}`)
console.log(`[phase4d-static] native Discovery HTML checked: ${discoverySlugs.length * 2}`)
console.log('[phase4d-static] PASS: production-like static generation, sitemap/llms parity, robots declaration, native EN/FA Discovery prerender and legacy/private exclusion checks passed.')
