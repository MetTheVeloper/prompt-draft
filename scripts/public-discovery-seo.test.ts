import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PUBLIC_DISCOVERY_INTERESTS, PUBLIC_DISCOVERY_ROUTES } from '../shared/public-discovery'
import {
  buildPublicDiscoveryStructuredData,
  toDiscoveryAbsoluteUrl,
} from '../app/utils/publicDiscoverySeo'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const sampleItem = {
  id: 42,
  title: {
    en: 'Editorial portrait prompt',
    fa: 'پرامپت پرتره ادیتوریال',
  },
  publishedAt: '2026-09-09T12:00:00.000Z',
  telegramUrl: null,
  tags: ['portrait', 'editorial'],
  imageCount: 1,
  coverImage: {
    fullUrl: 'https://cdn.example.test/prompt-42.webp',
    thumbnailUrl: 'https://cdn.example.test/prompt-42-thumb.webp',
  },
  creator: {
    username: 'grassias',
    avatarUrl: null,
  },
}

test('Discovery catalog is one deterministic shared definition', () => {
  assert.equal(PUBLIC_DISCOVERY_INTERESTS.length, 6)
  assert.equal(new Set(PUBLIC_DISCOVERY_INTERESTS.map(item => item.key)).size, 6)
  assert.equal(new Set(PUBLIC_DISCOVERY_INTERESTS.map(item => item.slug)).size, 6)
  assert.deepEqual(
    PUBLIC_DISCOVERY_ROUTES,
    PUBLIC_DISCOVERY_INTERESTS.map(item => `/discover/${item.slug}`),
  )
  assert.ok(PUBLIC_DISCOVERY_INTERESTS.every(item => item.tags.length > 0))
})

test('native Discovery structured data uses localized canonical Prompt and Creator routes', () => {
  const siteUrl = 'https://example.test'
  const toCanonicalUrl = (basePath: string) => {
    const localizedPath = basePath === '/' ? '/fa' : `/fa${basePath}`
    return toDiscoveryAbsoluteUrl(siteUrl, localizedPath)
  }

  const structured = buildPublicDiscoveryStructuredData({
    items: [sampleItem],
    locale: 'fa',
    title: 'پرتره و عکاسی',
    description: 'مجموعه‌ای از پرامپت‌های عمومی پرتره و عکاسی.',
    canonicalUrl: 'https://example.test/fa/discover/portrait-photography',
    toCanonicalUrl,
    toAbsoluteUrl: value => toDiscoveryAbsoluteUrl(siteUrl, value),
  })

  assert.equal(structured['@type'], 'CollectionPage')
  assert.equal(structured.inLanguage, 'fa-IR')
  assert.equal(structured.mainEntity['@type'], 'ItemList')
  assert.equal(structured.mainEntity.numberOfItems, 1)

  const creativeWork = structured.mainEntity.itemListElement[0]?.item
  assert.ok(creativeWork)
  assert.equal(creativeWork?.['@type'], 'CreativeWork')
  assert.equal(creativeWork?.name, sampleItem.title.fa)
  assert.equal(creativeWork?.url, 'https://example.test/fa/prompt/42')
  assert.equal(creativeWork?.author?.url, 'https://example.test/fa/creator/grassias')
  assert.equal(creativeWork?.image, sampleItem.coverImage.fullUrl)
  assert.deepEqual(creativeWork?.keywords, sampleItem.tags)

  const serialized = JSON.stringify(structured)
  for (const forbidden of [
    '/prompts?id=',
    '/user?un=',
    '/manage',
    'source_user_id',
    'source_draft_id',
    'variants',
    'balance',
    'permissions',
    'storage_key',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden)
  }
})

test('Discovery consumers reuse the shared catalog and native SSR owns SEO projection', async () => {
  const [preferences, inventory, nuxtConfig, page, seoUtility, generator] = await Promise.all([
    read('app/composables/useDiscoveryPreferences.ts'),
    read('scripts/public-url-inventory.ts'),
    read('nuxt.config.ts'),
    read('app/pages/discover/[slug].vue'),
    read('app/utils/publicDiscoverySeo.ts'),
    read('scripts/generate-public-seo.ts'),
  ])

  assert.match(preferences, /shared\/public-discovery/)
  assert.match(inventory, /PUBLIC_DISCOVERY_INTERESTS/)
  assert.match(nuxtConfig, /PUBLIC_DISCOVERY_ROUTES/)
  assert.match(nuxtConfig, /`\/fa\$\{route\}`/)

  assert.match(page, /buildPublicDiscoveryStructuredData/)
  assert.match(page, /structuredData,/)
  assert.match(page, /imageUrl:\s*computed\(\(\) => heroSources\.value\[0\]/)
  assert.match(page, /publicDiscoveryPath\(definition\.value\.slug\)/)
  assert.match(seoUtility, /publicPromptPath\(item\.id\)/)
  assert.match(seoUtility, /publicCreatorPath\(item\.creator\.username\)/)

  assert.doesNotMatch(generator, /fetchDiscoveryItems/)
  assert.doesNotMatch(generator, /\/api\/discover/)
  assert.doesNotMatch(generator, /renderStaticSnapshot/)
  assert.doesNotMatch(generator, /setRouteHead/)
  assert.doesNotMatch(generator, /\/prompts\?id=/)
  assert.doesNotMatch(generator, /\/user\?un=/)
  assert.match(generator, /cleanupLegacyDiscoveryArtifacts/)
  assert.match(generator, /data-public-seo-snapshot/)
  assert.match(generator, /data-public-seo-structured/)
})
