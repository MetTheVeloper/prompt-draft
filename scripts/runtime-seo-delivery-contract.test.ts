import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  isPublicIndexingEnabledForRequest,
  normalizePublicRequestHostname,
  PUBLIC_INDEXABLE_HOSTNAME,
} from '../shared/public-indexing-policy'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

test('Nuxt and server middleware consume one shared application SEO route policy', () => {
  const nuxtConfig = source('nuxt.config.ts')
  const middleware = source('server/middleware/seo-route-policy.ts')

  assert.match(nuxtConfig, /APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS/)
  assert.match(nuxtConfig, /\.\/shared\/seo-route-policy/)
  assert.doesNotMatch(nuxtConfig, /const clientOnlyRoutes =/)

  assert.match(middleware, /isNoindexApplicationPath/)
  assert.match(middleware, /shared\/seo-route-policy/)
  assert.doesNotMatch(middleware, /NOINDEX_EXACT_PATHS/)
})

test('runtime public indexing is allowed only on the canonical production host', () => {
  assert.equal(PUBLIC_INDEXABLE_HOSTNAME, 'prompt-draft.ir')
  assert.equal(normalizePublicRequestHostname('Prompt-Draft.ir:443'), 'prompt-draft.ir')
  assert.equal(normalizePublicRequestHostname('prompt-draft.ir.'), 'prompt-draft.ir')
  assert.equal(normalizePublicRequestHostname(''), '')

  assert.equal(isPublicIndexingEnabledForRequest(false, 'prompt-draft.ir'), true)
  assert.equal(isPublicIndexingEnabledForRequest('false', 'Prompt-Draft.ir:443'), true)
  assert.equal(isPublicIndexingEnabledForRequest(true, 'prompt-draft.ir'), false)
  assert.equal(isPublicIndexingEnabledForRequest('true', 'prompt-draft.ir'), false)
  assert.equal(isPublicIndexingEnabledForRequest(false, 'grassic.ir'), false)
  assert.equal(isPublicIndexingEnabledForRequest(false, 'www.prompt-draft.ir'), false)
  assert.equal(isPublicIndexingEnabledForRequest(false, 'preview.example.test'), false)
  assert.equal(isPublicIndexingEnabledForRequest(false, ''), false)
})

test('runtime noindex middleware protects every non-production request host', () => {
  const middleware = source('server/middleware/staging-noindex.ts')

  assert.match(middleware, /isPublicIndexingEnabledForRequest/)
  assert.match(middleware, /getRequestHost\(event\)/)
  assert.match(middleware, /config\.public\.noindex/)
  assert.match(middleware, /X-Robots-Tag/)
  assert.doesNotMatch(middleware, /process\.env\.NUXT_PUBLIC_NOINDEX/)
})

test('robots delivery is runtime-aware and static export uses the same renderer', () => {
  const runtimeRobots = source('server/routes/robots.txt.ts')
  const generator = source('scripts/generate-public-seo.ts')

  assert.equal(existsSync('public/robots.txt'), false)
  assert.match(runtimeRobots, /renderPublicRobotsTxt/)
  assert.match(runtimeRobots, /isPublicIndexingEnabledForRequest/)
  assert.match(runtimeRobots, /getRequestHost\(event\)/)
  assert.match(runtimeRobots, /config\.public\.noindex/)
  assert.match(runtimeRobots, /Cache-Control', 'no-store'/)
  assert.match(generator, /renderPublicRobotsTxt/)
  assert.doesNotMatch(generator, /public\/robots\.txt/)
  assert.doesNotMatch(generator, /sourceRobotsPath/)
})

test('Nitro sitemap route consumes the accepted shared inventory and shared runtime fetch', () => {
  const sitemapRoute = source('server/routes/sitemap.xml.ts')
  const runtimeInventory = source('server/utils/public-seo-inventory.ts')

  assert.match(sitemapRoute, /buildPublicUrlInventory/)
  assert.match(sitemapRoute, /renderSitemapXml/)
  assert.match(sitemapRoute, /fetchRuntimePublicInventory/)
  assert.match(sitemapRoute, /isPublicIndexingEnabledForRequest/)
  assert.match(sitemapRoute, /getRequestHost\(event\)/)
  assert.match(sitemapRoute, /apiBaseInternal/)
  assert.match(sitemapRoute, /if \(!indexingEnabled\)/)
  assert.match(sitemapRoute, /renderSitemapXml\(\[\], siteUrl\)/)

  assert.match(runtimeInventory, /isPublicApiInventory/)
  assert.match(runtimeInventory, /\/api\/public\/inventory/)
  assert.match(runtimeInventory, /PUBLIC_INVENTORY_CACHE_TTL_MS/)
})

test('Nitro llms route projects the same accepted shared inventory with staging precedence', () => {
  const llmsRoute = source('server/routes/llms.txt.ts')

  assert.match(llmsRoute, /buildPublicUrlInventory/)
  assert.match(llmsRoute, /renderLlmsTxt/)
  assert.match(llmsRoute, /fetchRuntimePublicInventory/)
  assert.match(llmsRoute, /isPublicIndexingEnabledForRequest/)
  assert.match(llmsRoute, /getRequestHost\(event\)/)
  assert.match(llmsRoute, /apiBaseInternal/)
  assert.match(llmsRoute, /if \(!indexingEnabled\)/)
  assert.match(llmsRoute, /renderLlmsTxt\(\[\], siteUrl\)/)
  assert.doesNotMatch(llmsRoute, /prompts\?id=/)
  assert.doesNotMatch(llmsRoute, /user\?un=/)
})
