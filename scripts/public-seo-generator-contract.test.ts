import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const generatorSource = await readFile(
  new URL('./generate-public-seo.ts', import.meta.url),
  'utf8',
)

test('public SEO generator projects sitemap and llms from shared inventory', () => {
  assert.match(generatorSource, /buildPublicUrlInventory/)
  assert.match(generatorSource, /renderSitemapXml/)
  assert.match(generatorSource, /renderLlmsTxt/)
  assert.match(generatorSource, /\/api\/public\/inventory/)
  assert.match(generatorSource, /NUXT_PUBLIC_NOINDEX/)
  assert.match(generatorSource, /llms\.txt/)
  assert.equal(generatorSource.includes('STATIC_PUBLIC_ROUTES'), false)
})

test('sitemap and llms share one public inventory projection', () => {
  assert.match(generatorSource, /const sitemap = renderSitemapXml\(publicInventory, siteUrl\)/)
  assert.match(generatorSource, /const llms = renderLlmsTxt\(publicInventory, siteUrl\)/)
  assert.doesNotMatch(generatorSource, /LLMS_PUBLIC_ROUTES/)
  assert.doesNotMatch(generatorSource, /LLMS_PROMPT/)
  assert.doesNotMatch(generatorSource, /LLMS_CREATOR/)
})
