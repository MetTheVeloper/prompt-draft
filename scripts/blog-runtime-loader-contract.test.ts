import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Blog repository content is bundled into Nitro server assets for Docker runtime', async () => {
  const [nuxtConfig, loader, dockerfile, dockerignore] = await Promise.all([
    readFile('nuxt.config.ts', 'utf8'),
    readFile('server/utils/blogRepository.ts', 'utf8'),
    readFile('Dockerfile', 'utf8'),
    readFile('.dockerignore', 'utf8'),
  ])

  assert.match(nuxtConfig, /serverAssets\s*:\s*\[/)
  assert.match(nuxtConfig, /baseName:\s*["']blog["']/)
  assert.match(nuxtConfig, /dir:\s*["']\.\/content\/blog["']/)
  assert.match(loader, /useStorage\(["']assets:blog["']\)/)
  assert.match(loader, /readBundledBlogAssets\(\)\.then\(assertValidBlogRepositoryAssets\)/)

  assert.match(dockerfile, /COPY \. \./)
  assert.match(dockerfile, /COPY --from=builder \/app\/\.output \.\/\.output/)
  assert.doesNotMatch(dockerignore, /^content(?:\/|$)/m)
  assert.doesNotMatch(dockerignore, /^content\/blog(?:\/|$)/m)
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

test('legacy static generation reads the same validated build-workspace Blog snapshot', async () => {
  const [loader, filesystemAdapter, scriptAdapter] = await Promise.all([
    readFile('server/utils/blogRepository.ts', 'utf8'),
    readFile('server/utils/blogRepositoryFilesystem.ts', 'utf8'),
    readFile('scripts/blog-repository.ts', 'utf8'),
  ])

  assert.match(loader, /NUXT_LEGACY_STATIC_GENERATE\s*===\s*["']true["']/)
  assert.match(loader, /return readBlogRepositoryDirectory\(\)/)
  assert.match(filesystemAdapter, /assertValidBlogRepositoryAssets\(assets\)/)
  assert.match(scriptAdapter, /blogRepositoryFilesystem/)
})

test('legacy static generation explicitly prerenders authoritative Blog Article routes', async () => {
  const [nuxtConfig, filesystemAdapter] = await Promise.all([
    readFile('nuxt.config.ts', 'utf8'),
    readFile('server/utils/blogRepositoryFilesystem.ts', 'utf8'),
  ])

  assert.match(filesystemAdapter, /readBlogRepositoryDirectorySync/)
  assert.match(filesystemAdapter, /assertValidBlogRepositoryAssets\(assets\)/)
  assert.match(nuxtConfig, /projectBlogPublicInventory\(readBlogRepositoryDirectorySync\(\)\)/)
  assert.match(nuxtConfig, /publicBlogPostPath\(article\.slug\)/)
  assert.match(nuxtConfig, /article\.availableLocales\.includes\(["']en["']\)/)
  assert.match(nuxtConfig, /article\.availableLocales\.includes\(["']fa["']\)/)
  assert.match(nuxtConfig, /\.\.\.publicBlogRoutes/)
})
