import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

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

test('robots delivery is runtime-aware and static export uses the same renderer', () => {
  const runtimeRobots = source('server/routes/robots.txt.ts')
  const generator = source('scripts/generate-public-seo.ts')

  assert.equal(existsSync('public/robots.txt'), false)
  assert.match(runtimeRobots, /renderPublicRobotsTxt/)
  assert.match(runtimeRobots, /config\.public\.noindex/)
  assert.match(generator, /renderPublicRobotsTxt/)
  assert.doesNotMatch(generator, /public\/robots\.txt/)
  assert.doesNotMatch(generator, /sourceRobotsPath/)
})

test('Nitro sitemap route consumes the accepted shared inventory and internal API origin', () => {
  const sitemapRoute = source('server/routes/sitemap.xml.ts')

  assert.match(sitemapRoute, /buildPublicUrlInventory/)
  assert.match(sitemapRoute, /isPublicApiInventory/)
  assert.match(sitemapRoute, /renderSitemapXml/)
  assert.match(sitemapRoute, /apiBaseInternal/)
  assert.match(sitemapRoute, /\/api\/public\/inventory/)
  assert.match(sitemapRoute, /if \(!indexingEnabled\)/)
  assert.match(sitemapRoute, /renderSitemapXml\(\[\], siteUrl\)/)
})
