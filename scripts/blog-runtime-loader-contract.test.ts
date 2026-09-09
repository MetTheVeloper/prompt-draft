import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Blog repository content is bundled into Nitro server assets for Docker runtime', async () => {
  const [nuxtConfig, loader, dockerfile] = await Promise.all([
    readFile('nuxt.config.ts', 'utf8'),
    readFile('server/utils/blogRepository.ts', 'utf8'),
    readFile('Dockerfile', 'utf8'),
  ])

  assert.match(nuxtConfig, /serverAssets\s*:\s*\[/)
  assert.match(nuxtConfig, /baseName:\s*["']blog["']/)
  assert.match(nuxtConfig, /dir:\s*["']\.\/content\/blog["']/)
  assert.match(loader, /useStorage\(["']assets:blog["']\)/)
  assert.match(loader, /assertValidBlogRepositoryAssets/)

  assert.match(dockerfile, /COPY --from=builder \/app\/\.output \.\/\.output/)
  assert.doesNotMatch(loader, /github\.com/i)
  assert.doesNotMatch(loader, /api\.github/i)
  assert.doesNotMatch(loader, /fetch\s*\(/)
})

test('Blog runtime public helpers consume derived locale eligibility rather than fallback content', async () => {
  const loader = await readFile('server/utils/blogRepository.ts', 'utf8')
  assert.match(loader, /isBlogLocalePublic\(article, locale\)/)
  assert.match(loader, /article\.slug === slug/)
  assert.doesNotMatch(loader, /fallback/i)
})
