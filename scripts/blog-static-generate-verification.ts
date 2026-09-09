import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { projectBlogPublicInventory } from '../shared/blog-public-inventory'
import { readBlogRepositoryDirectory } from './blog-repository'
import {
  buildPublicUrlInventory,
  isPublicApiInventory,
  type PublicApiInventory,
} from './public-url-inventory'

const isWindows = process.platform === 'win32'
const siteBase = 'https://example.test'
const apiBase = String(process.env.BLOG_STATIC_API_BASE || 'http://127.0.0.1:4000').replace(/\/+$/, '')

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

function assertNoPrivateKeys(body: string, label: string) {
  for (const key of forbiddenPrivateKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoLegacyDetailRoutes(body: string, label: string) {
  assert.equal(body.includes('/user?un='), false, `${label} contains legacy Creator detail route`)
}

function runPnpmGenerate(env: NodeJS.ProcessEnv) {
  if (isWindows) {
    return spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'pnpm generate'],
      { stdio: 'inherit', env },
    )
  }
  return spawnSync('pnpm', ['generate'], { stdio: 'inherit', env })
}

async function fetchBackendInventory(): Promise<PublicApiInventory> {
  const response = await fetch(`${apiBase}/api/public/inventory`)
  assert.equal(
    response.status,
    200,
    `Local public inventory API must be available before Blog static verification (${response.status})`,
  )
  const payload = await response.json() as { ok?: boolean; inventory?: unknown }
  assert.equal(payload.ok, true)
  assert.equal(isPublicApiInventory(payload.inventory), true)
  return payload.inventory as PublicApiInventory
}

function sitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>(https:\/\/example\.test[^<]+)<\/loc>/g)].map(match => match[1])
}

function llmsUrls(markdown: string) {
  return [...markdown.matchAll(/^- \[[^\]]+\]\((https:\/\/example\.test[^)]+)\)$/gm)].map(match => match[1])
}

function generatedHtmlPath(canonicalPath: string) {
  const segments = canonicalPath.split('/').filter(Boolean)
  return join(process.cwd(), '.output', 'public', ...segments, 'index.html')
}

const [backendInventory, repositoryArticles] = await Promise.all([
  fetchBackendInventory(),
  readBlogRepositoryDirectory(),
])
const blogArticles = projectBlogPublicInventory(repositoryArticles)
const expectedInventory = buildPublicUrlInventory({
  dynamicInventory: backendInventory,
  blogArticles,
  indexingEnabled: true,
})
const expectedUrls = expectedInventory
  .map(resource => new URL(resource.canonicalPath, `${siteBase}/`).toString())
  .sort()

assert.ok(expectedUrls.includes(`${siteBase}/blog`))
assert.ok(expectedUrls.includes(`${siteBase}/fa/blog`))

console.log(`[blog-static] Expected canonical URL count: ${expectedUrls.length}`)
console.log(`[blog-static] Published Blog Article inventory: ${blogArticles.length}`)
console.log('[blog-static] Running one isolated production-like pnpm generate.')

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NUXT_PUBLIC_SITE_URL: siteBase,
  NUXT_PUBLIC_API_BASE: apiBase,
  NUXT_API_BASE_INTERNAL: apiBase,
  NUXT_PUBLIC_NOINDEX: 'false',
}

const generate = runPnpmGenerate(env)
if (generate.error) {
  console.error('[blog-static] Failed to start pnpm generate:', generate.error)
  process.exit(1)
}
if (generate.status !== 0) {
  console.error(`[blog-static] FAIL: pnpm generate exited with ${generate.status ?? 'unknown status'}`)
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
assert.deepEqual(sitemapSet, expectedUrls, 'Static sitemap must equal the shared canonical inventory')
assert.deepEqual(llmsSet, expectedUrls, 'Static llms must equal the shared canonical inventory')
assert.deepEqual(llmsSet, sitemapSet, 'Static sitemap and llms URL sets must match exactly')
assert.match(llms, /^## Blog$/m)
assert.match(llms, /https:\/\/example\.test\/blog/)
assert.match(llms, /https:\/\/example\.test\/fa\/blog/)
assert.match(robots, /^Sitemap: https:\/\/example\.test\/sitemap\.xml$/m)
assert.doesNotMatch(robots, /^Disallow: \/$/m)
assertNoLegacyDetailRoutes(sitemap, 'static sitemap.xml')
assertNoLegacyDetailRoutes(llms, 'static llms.txt')
assertNoPrivateKeys(sitemap, 'static sitemap.xml')
assertNoPrivateKeys(llms, 'static llms.txt')

for (const locale of ['en', 'fa'] as const) {
  const path = locale === 'fa' ? '/fa/blog' : '/blog'
  const html = await readFile(generatedHtmlPath(path), 'utf8')
  const language = locale === 'fa' ? 'fa-IR' : 'en-US'
  const direction = locale === 'fa' ? 'rtl' : 'ltr'
  const canonical = `${siteBase}${path}`

  assert.ok(html.includes(`lang="${language}"`), `${locale} Blog index lang mismatch`)
  assert.ok(html.includes(`dir="${direction}"`), `${locale} Blog index dir mismatch`)
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${locale} Blog index canonical mismatch`)
  assert.ok(html.includes('"@type":"CollectionPage"'), `${locale} Blog index CollectionPage JSON-LD missing`)
  assert.ok(html.includes('"@type":"ItemList"'), `${locale} Blog index ItemList JSON-LD missing`)
  assert.equal(html.includes('name="robots" content="noindex'), false, `${locale} Blog index inherited noindex`)
  assertNoLegacyDetailRoutes(html, `${locale} Blog index`)
  assertNoPrivateKeys(html, `${locale} Blog index`)
}

const articleResources = expectedInventory.filter(resource =>
  resource.kind === 'blog' && resource.canonicalPath !== '/blog' && resource.canonicalPath !== '/fa/blog')

for (const resource of articleResources) {
  const html = await readFile(generatedHtmlPath(resource.canonicalPath), 'utf8')
  const canonical = `${siteBase}${resource.canonicalPath}`
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${resource.canonicalPath} canonical mismatch`)
  assert.ok(html.includes('"@type":"BlogPosting"'), `${resource.canonicalPath} BlogPosting JSON-LD missing`)
  assert.equal(html.includes('name="robots" content="noindex'), false, `${resource.canonicalPath} inherited noindex`)
  assertNoLegacyDetailRoutes(html, resource.canonicalPath)
  assertNoPrivateKeys(html, resource.canonicalPath)
}

console.log(`\n[blog-static] sitemap URLs: ${sitemapSet.length}`)
console.log(`[blog-static] llms URLs: ${llmsSet.length}`)
console.log('[blog-static] Blog index HTML checked: 2')
console.log(`[blog-static] Blog Article HTML checked: ${articleResources.length}`)
console.log('[blog-static] PASS: Blog joins shared sitemap/llms inventory and legacy static generation without fake locale or private leakage.')
