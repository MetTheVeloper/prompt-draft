import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const acquisitionFiles = [
  {
    name: 'Public Discovery cards',
    path: 'app/components/discover/PublicDiscoveryCard.vue',
  },
  {
    name: 'Home discovery showcase',
    path: 'app/components/home/HomeDiscoverySection.vue',
  },
] as const

for (const entry of acquisitionFiles) {
  test(`${entry.name} route Prompt detail traffic through the canonical public Prompt path`, async () => {
    const source = await readFile(entry.path, 'utf8')

    assert.match(source, /\bpublicPromptPath\b/)
    assert.match(source, /\buseLocalePath\s*\(/)
    assert.doesNotMatch(source, /\/prompts\?id=/)
  })
}

test('Public Prompt page keeps its full-detail CTA on the protected product route', async () => {
  const source = await readFile('app/pages/prompt/[id].vue', 'utf8')

  assert.match(source, /path:\s*['"]\/prompts['"]/)
  assert.match(source, /query:\s*\{\s*id:\s*String\(publicId\)/s)
})
