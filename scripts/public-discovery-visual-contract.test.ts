import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Discovery hero is a semantic el-flex section with SSR media and client cinema enhancement', async () => {
  const source = await read('app/pages/discover/[slug].vue')

  const heroOpenTag = source.match(/<el-flex[\s\S]*?class="public-discovery-page__hero[^\"]*"[\s\S]*?>/)?.[0] ?? ''
  assert.ok(heroOpenTag)
  assert.match(heroOpenTag, /type="section"/)
  assert.match(heroOpenTag, /rules="csc"/)

  assert.match(source, /v-if="heroSources\[0\]"/)
  assert.match(source, /class="public-discovery-page__hero-image pen"/)
  assert.match(source, /<ClientOnly>[\s\S]*<visual-slider/)
  assert.ok(
    source.indexOf('public-discovery-page__hero-image') < source.indexOf('<ClientOnly>'),
    'SSR first-image fallback must be emitted before client-only slider enhancement',
  )

  assert.match(source, /:sources="heroSources"/)
  assert.match(source, /:random="false"/)
  assert.match(source, /:start-index="1"/)
  assert.match(source, /item\.coverImage\?\.fullUrl \|\| item\.coverImage\?\.thumbnailUrl/)

  assert.match(source, /\.public-discovery-page__hero :deep\(\.canvas-slider-bg\)\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/)
  assert.match(source, /--public-discovery-hero-height/)
  assert.match(source, /dimension\(\)\.header\.height/)
})

test('Discovery heading flexes use the requested ccs alignment', async () => {
  const source = await read('app/pages/discover/[slug].vue')

  assert.match(source, /<el-flex rules="ccs" class="w100" :gap="8">/)
  assert.match(source, /<el-flex rules="ccs" :gap="4" class="fg100">/)
})

test('Discovery preserves public routing, SEO, curated cards, and protected-data boundaries', async () => {
  const source = await read('app/pages/discover/[slug].vue')

  assert.match(source, /usePublicDiscovery\(\)/)
  assert.match(source, /canonicalPath:\s*`\/discover\/\$\{slug\.value\}`/)
  assert.match(source, /<PublicDiscoveryCard/)
  assert.match(source, /:to="`\/discover\/\$\{related\.slug\}`"/)

  for (const forbidden of [
    'usePromptArchive()',
    'usePromptArchiveUnlock',
    '/api/archive/',
    'item.prompt',
    'variants',
    'balance',
    'permissions',
  ]) {
    assert.equal(source.includes(forbidden), false, `Discovery crossed a protected boundary: ${forbidden}`)
  }
})
