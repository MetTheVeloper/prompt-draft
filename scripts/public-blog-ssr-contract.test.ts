import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('public Blog index owns native SSR SEO and localized canonical links', async () => {
  const source = await readFile('app/pages/blog/index.vue', 'utf8')
  assert.match(source, /useAsyncData/)
  assert.match(source, /publicBlog\.list\(activeLocale\.value\)/)
  assert.match(source, /usePublicSeo\(/)
  assert.match(source, /PUBLIC_ROUTE_PATHS\.blog/)
  assert.match(source, /alternateLocales:\s*\['en',\s*'fa'\]/)
  assert.match(source, /buildPublicBlogIndexStructuredData/)
  assert.match(source, /publicBlogPostPath\(article\.slug\)/)
  assert.doesNotMatch(source, /github\.com|api\.github/i)
})

test('public Blog detail enforces locale-aware 404, canonical redirect, shared article presentation and BlogPosting SEO', async () => {
  const source = await readFile('app/pages/blog/[slug].vue', 'utf8')
  const presentation = await readFile('app/components/blog/BlogArticlePresentation.vue', 'utf8')

  assert.match(source, /normalizePublicBlogSlug\(rawSlugValue\)/)
  assert.match(source, /publicBlog\.load\(canonicalSlug, activeLocale\.value\)/)
  assert.match(source, /statusCode:\s*404/)
  assert.match(source, /redirectCode:\s*301/)
  assert.match(source, /BlogArticlePresentation/)
  assert.match(source, /:markdown="article\.body"/)
  assert.match(source, /BlogZoomableImage/)
  assert.doesNotMatch(source, /v-html=/)
  assert.match(presentation, /renderPublicBlogMarkdown/)
  assert.match(presentation, /v-html="renderedBody"/)
  assert.match(source, /contentType:\s*'article'/)
  assert.match(source, /buildPublicBlogPostingStructuredData/)
  assert.match(source, /article:published_time/)
  assert.match(source, /article:modified_time/)
  assert.doesNotMatch(source, /github\.com|api\.github/i)
})

test('public Blog Nitro APIs consume only repository public eligibility', async () => {
  const [listRoute, detailRoute, repository] = await Promise.all([
    readFile('server/api/public/blog/index.get.ts', 'utf8'),
    readFile('server/api/public/blog/[slug].get.ts', 'utf8'),
    readFile('server/utils/blogRepository.ts', 'utf8'),
  ])

  assert.match(listRoute, /listPublishedBlogArticles\(locale\)/)
  assert.match(listRoute, /projectPublicBlogSummary/)
  assert.match(detailRoute, /getPublishedBlogArticleBySlug\(slug, locale\)/)
  assert.match(detailRoute, /projectPublicBlogArticle/)
  assert.match(repository, /isBlogLocalePublic\(article, locale\)/)
  assert.doesNotMatch(`${listRoute}\n${detailRoute}\n${repository}`, /fallback/i)
  assert.doesNotMatch(`${listRoute}\n${detailRoute}\n${repository}`, /github\.com|api\.github/i)
})

test('Blog localization is registered for both accepted locales', async () => {
  const config = await readFile('i18n/i18n.config.ts', 'utf8')
  const [en, fa] = await Promise.all([
    readFile('i18n/locales/blog.en.ts', 'utf8'),
    readFile('i18n/locales/blog.fa.ts', 'utf8'),
  ])
  assert.match(config, /blogEn/)
  assert.match(config, /blogFa/)
  assert.match(en, /title:\s*'Blog'/)
  assert.match(fa, /title:\s*'بلاگ'/)
  assert.match(en, /imagePreview/)
  assert.match(fa, /imagePreview/)
})
