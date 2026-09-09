import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPublicBlogIndexStructuredData,
  buildPublicBlogPostingStructuredData,
} from '../app/utils/publicBlogSeo'
import type { PublicBlogArticle, PublicBlogSummary } from '../app/shared/public-blog'

const summary: PublicBlogSummary = {
  slug: 'prompt-anatomy',
  availableLocales: ['en', 'fa'],
  title: 'Prompt Anatomy',
  description: 'A practical guide to structuring visual prompts.',
  publishedAt: '2026-09-09T10:00:00.000Z',
  updatedAt: '2026-09-09T12:00:00.000Z',
  author: { name: 'Prompt Draft Editorial', url: '/' },
  hero: {
    fullUrl: 'https://cdn.example.test/blog/prompt-anatomy/full.webp',
    thumbnailUrl: 'https://cdn.example.test/blog/prompt-anatomy/thumb.webp',
    width: 1600,
    height: 900,
    alt: 'Prompt structure diagram',
  },
}

const article: PublicBlogArticle = {
  ...summary,
  body: '# Structure\n\nBuild from intent to constraints.',
}

test('BlogPosting structured data is localized, canonical and public-only', () => {
  const data = buildPublicBlogPostingStructuredData({
    article,
    locale: 'fa',
    canonicalUrl: 'https://example.test/fa/blog/prompt-anatomy',
    imageUrl: article.hero?.fullUrl,
    siteUrl: 'https://example.test',
  }) as Record<string, any>

  assert.equal(data['@type'], 'BlogPosting')
  assert.equal(data['@id'], 'https://example.test/fa/blog/prompt-anatomy')
  assert.equal(data.mainEntityOfPage, 'https://example.test/fa/blog/prompt-anatomy')
  assert.equal(data.inLanguage, 'fa-IR')
  assert.equal(data.author.name, 'Prompt Draft Editorial')
  assert.equal(data.author.url, 'https://example.test/')
  assert.deepEqual(data.image, [article.hero?.fullUrl])

  const serialized = JSON.stringify(data)
  for (const forbidden of ['email', 'permissions', 'balance', 'source_user_id', 'source_draft_id', 'variants']) {
    assert.equal(serialized.includes(forbidden), false)
  }
})

test('Blog index structured data projects canonical localized article URLs', () => {
  const data = buildPublicBlogIndexStructuredData({
    articles: [summary],
    locale: 'en',
    canonicalUrl: 'https://example.test/blog',
    articleUrl: item => `https://example.test/blog/${item.slug}`,
  }) as Record<string, any>

  assert.equal(data['@type'], 'CollectionPage')
  assert.equal(data.inLanguage, 'en-US')
  assert.equal(data.mainEntity['@type'], 'ItemList')
  assert.equal(data.mainEntity.itemListElement[0].item.url, 'https://example.test/blog/prompt-anatomy')
  assert.equal(data.mainEntity.itemListElement[0].item['@type'], 'BlogPosting')
})
