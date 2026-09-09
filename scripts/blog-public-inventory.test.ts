import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import type { BlogArticle } from '../shared/blog-article'
import { projectBlogPublicInventory } from '../shared/blog-public-inventory'
import {
  buildPublicUrlInventory,
  renderLlmsTxt,
  renderSitemapXml,
  type PublicApiInventory,
} from './public-url-inventory'

const backendInventory: PublicApiInventory = {
  prompts: [{ id: 42, availableLocales: ['en', 'fa'] }],
  creators: [{
    username: 'grassias',
    availableLocales: ['en', 'fa'],
    policy: { indexable: true, discoverable: true },
  }],
}

function article(input: {
  id: string
  slug: string
  availableLocales: Array<'en' | 'fa'>
}): BlogArticle {
  return {
    id: input.id,
    slug: input.slug,
    status: input.availableLocales.length ? 'published' : 'draft',
    publishedAt: input.availableLocales.length ? '2026-09-09T12:00:00.000Z' : null,
    updatedAt: '2026-09-09T12:00:00.000Z',
    author: { kind: 'editorial', name: 'Prompt Draft', url: '/' },
    hero: null,
    localizations: {
      en: { title: 'English title', description: 'English description' },
      fa: { title: 'عنوان فارسی', description: 'توضیح فارسی' },
    },
    body: {
      en: '# English',
      fa: '# فارسی',
    },
    availableLocales: [...input.availableLocales],
  }
}

const repositoryArticles = [
  article({ id: 'bilingual', slug: 'prompt-anatomy', availableLocales: ['en', 'fa'] }),
  article({ id: 'fa-only', slug: 'persian-workflow', availableLocales: ['fa'] }),
  article({ id: 'draft', slug: 'draft-article', availableLocales: [] }),
]

function sitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
}

function llmsUrls(markdown: string) {
  return [...markdown.matchAll(/^- \[[^\]]+\]\((https?:\/\/[^)]+)\)$/gm)].map(match => match[1])
}

test('Blog repository projection carries only canonical slug plus derived locale availability', () => {
  assert.deepEqual(projectBlogPublicInventory(repositoryArticles), [
    { slug: 'persian-workflow', availableLocales: ['fa'] },
    { slug: 'prompt-anatomy', availableLocales: ['en', 'fa'] },
  ])
})

test('shared public URL inventory includes Blog index and only authoritative Article locales', () => {
  const blogArticles = projectBlogPublicInventory(repositoryArticles)
  const resources = buildPublicUrlInventory({
    dynamicInventory: backendInventory,
    blogArticles,
  })
  const paths = resources.map(resource => resource.canonicalPath)

  for (const expected of [
    '/blog',
    '/fa/blog',
    '/blog/prompt-anatomy',
    '/fa/blog/prompt-anatomy',
    '/fa/blog/persian-workflow',
  ]) {
    assert.ok(paths.includes(expected), `missing ${expected}`)
  }

  assert.equal(paths.includes('/blog/persian-workflow'), false, 'invented EN Blog locale')
  assert.equal(paths.some(path => path.includes('draft-article')), false, 'draft Blog Article leaked')

  const blogResources = resources.filter(resource => resource.kind === 'blog')
  assert.equal(blogResources.length, 5)
})

test('Blog sitemap and llms links are exact projections of the same shared inventory', () => {
  const resources = buildPublicUrlInventory({
    dynamicInventory: backendInventory,
    blogArticles: projectBlogPublicInventory(repositoryArticles),
  })
  const sitemap = renderSitemapXml(resources, 'https://example.test')
  const llms = renderLlmsTxt(resources, 'https://example.test')
  const sitemapSet = [...new Set(sitemapUrls(sitemap))].sort()
  const llmsSet = [...new Set(llmsUrls(llms))].sort()

  assert.deepEqual(llmsSet, sitemapSet)
  assert.match(llms, /^## Blog$/m)
  assert.match(llms, /https:\/\/example\.test\/blog\/prompt-anatomy/)
  assert.match(llms, /https:\/\/example\.test\/fa\/blog\/persian-workflow/)
  assert.doesNotMatch(llms, /https:\/\/example\.test\/blog\/persian-workflow/)
  assert.doesNotMatch(llms, /draft-article/)
  assert.doesNotMatch(sitemap, /draft-article/)
})

test('global noindex still suppresses Blog and all other public inventory', () => {
  assert.deepEqual(buildPublicUrlInventory({
    dynamicInventory: backendInventory,
    blogArticles: projectBlogPublicInventory(repositoryArticles),
    indexingEnabled: false,
  }), [])
})

test('runtime and static delivery consume the same Blog repository projection', async () => {
  const [runtimeInventory, sitemapRoute, llmsRoute, generator, nuxtConfig] = await Promise.all([
    readFile('server/utils/public-seo-inventory.ts', 'utf8'),
    readFile('server/routes/sitemap.xml.ts', 'utf8'),
    readFile('server/routes/llms.txt.ts', 'utf8'),
    readFile('scripts/generate-public-seo.ts', 'utf8'),
    readFile('nuxt.config.ts', 'utf8'),
  ])

  assert.match(runtimeInventory, /loadBlogRepository/)
  assert.match(runtimeInventory, /projectBlogPublicInventory/)
  assert.match(sitemapRoute, /loadRuntimeBlogPublicInventory/)
  assert.match(sitemapRoute, /blogArticles/)
  assert.match(llmsRoute, /loadRuntimeBlogPublicInventory/)
  assert.match(llmsRoute, /blogArticles/)
  assert.match(generator, /readBlogRepositoryDirectory/)
  assert.match(generator, /projectBlogPublicInventory/)
  assert.match(generator, /blogArticles/)

  assert.match(nuxtConfig, /PUBLIC_ROUTE_PATHS/)
  assert.match(nuxtConfig, /publicBlogRoutes/)
  assert.match(nuxtConfig, /\.\.\.publicBlogRoutes/)
})
