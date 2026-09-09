import assert from 'node:assert/strict'
import test from 'node:test'

import { validateBlogArticlePackage } from '../shared/blog-article'
import {
  projectPublicBlogArticle,
  projectPublicBlogSummary,
  readPublicBlogLocale,
} from '../server/utils/publicBlogProjection'

function validArticle() {
  const result = validateBlogArticlePackage({
    directoryId: 'prompt-anatomy',
    metadata: {
      id: 'prompt-anatomy',
      slug: 'prompt-anatomy',
      status: 'published',
      publishedAt: '2026-09-09T10:00:00Z',
      updatedAt: '2026-09-09T12:00:00Z',
      author: { kind: 'editorial', name: 'Prompt Draft Editorial', url: '/' },
      hero: null,
      localizations: {
        en: { title: 'Prompt Anatomy', description: 'A practical guide.' },
        fa: { title: 'آناتومی پرامپت', description: 'یک راهنمای کاربردی.' },
      },
    },
    body: {
      en: '# Structure\n\nEnglish body',
      fa: '# ساختار\n\nمتن فارسی',
    },
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('fixture invalid')
  return result.article
}

test('public Blog projection emits only public localized fields', () => {
  const article = validArticle()
  const summary = projectPublicBlogSummary(article, 'fa')
  const detail = projectPublicBlogArticle(article, 'fa')

  assert.equal(summary.slug, 'prompt-anatomy')
  assert.equal(summary.title, 'آناتومی پرامپت')
  assert.equal(summary.description, 'یک راهنمای کاربردی.')
  assert.deepEqual(summary.availableLocales, ['en', 'fa'])
  assert.equal(detail.body.includes('متن فارسی'), true)

  const serialized = JSON.stringify(detail)
  for (const forbidden of ['kind', 'id', 'email', 'permissions', 'balance', 'source_user_id', 'source_draft_id']) {
    assert.equal(Object.prototype.hasOwnProperty.call(detail, forbidden), false)
    assert.equal(serialized.includes(`"${forbidden}"`), false)
  }
})

test('public Blog locale parser is strict', () => {
  assert.equal(readPublicBlogLocale('en'), 'en')
  assert.equal(readPublicBlogLocale('fa'), 'fa')
  assert.equal(readPublicBlogLocale('EN'), null)
  assert.equal(readPublicBlogLocale('de'), null)
  assert.equal(readPublicBlogLocale(undefined), null)
})
