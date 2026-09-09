import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const generatorSource = await readFile(
  new URL('./generate-public-seo.ts', import.meta.url),
  'utf8',
)

test('public SEO generator projects sitemap from shared inventory', () => {
  assert.match(generatorSource, /buildPublicUrlInventory/)
  assert.match(generatorSource, /renderSitemapXml/)
  assert.match(generatorSource, /\/api\/public\/inventory/)
  assert.match(generatorSource, /NUXT_PUBLIC_NOINDEX/)
  assert.equal(generatorSource.includes('STATIC_PUBLIC_ROUTES'), false)
})

test('4D.2 does not introduce a separate llms inventory before 4D.4', () => {
  assert.equal(generatorSource.includes('llms.txt'), false)
})
