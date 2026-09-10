import assert from 'node:assert/strict'
import test from 'node:test'

import type { BlogArticle } from '../shared/blog-article'
import {
  BLOG_SYSTEM_AUTHOR,
  blogArticleToManageDraft,
  createEmptyManageBlogDraft,
  deriveManageBlogDraftId,
  manageBlogDraftToPackage,
  validateManageBlogDraft,
} from '../app/utils/manageBlogDraft'

function validEnglishDraft() {
  const draft = createEmptyManageBlogDraft()
  draft.id = 'prompt-anatomy'
  draft.slug = 'anatomy-of-a-visual-prompt'
  draft.enTitle = 'Anatomy of a visual prompt'
  draft.enDescription = 'A practical guide to structuring visual prompts.'
  draft.enBody = '## Start here\n\nBuild the prompt in layers.'
  return draft
}

test('new Blog authoring state starts draft-first with system-owned identity metadata', () => {
  const draft = createEmptyManageBlogDraft()
  assert.equal(draft.status, 'draft')
  assert.equal(draft.id, '')
  assert.equal('authorName' in draft, false)
  assert.equal('authorUrl' in draft, false)
  assert.equal(validateManageBlogDraft(draft).ok, false)
})

test('new Article validation derives a deterministic provisional id from slug', () => {
  const draft = createEmptyManageBlogDraft()
  draft.slug = 'new-article-slug'
  assert.equal(deriveManageBlogDraftId(draft), 'new-article-slug')

  draft.id = 'canonical-existing-id'
  assert.equal(deriveManageBlogDraftId(draft), 'canonical-existing-id')
})

test('authoring adapter produces canonical package shape with system-owned editorial author', () => {
  const draft = validEnglishDraft()
  const pkg = manageBlogDraftToPackage(draft)

  assert.deepEqual(Object.keys(pkg.metadata).sort(), [
    'author',
    'hero',
    'id',
    'localizations',
    'publishedAt',
    'slug',
    'status',
    'updatedAt',
  ])
  assert.deepEqual(pkg.metadata.author, BLOG_SYSTEM_AUTHOR)
  assert.deepEqual(pkg.metadata.localizations, {
    en: {
      title: draft.enTitle,
      description: draft.enDescription,
    },
  })
  assert.equal(pkg.body.en, draft.enBody)
  assert.equal(pkg.metadata.hero, null)
})

test('draft can validate while remaining non-public', () => {
  const result = validateManageBlogDraft(validEnglishDraft())
  assert.equal(result.ok, true)
  assert.deepEqual(result.article?.availableLocales, [])
})

test('published validation receives a system-owned first-publish timestamp candidate', () => {
  const draft = validEnglishDraft()
  draft.status = 'published'
  draft.publishedAt = ''
  draft.updatedAt = '2026-09-10T00:00:00.000Z'

  const result = validateManageBlogDraft(draft)
  assert.equal(result.ok, true)
  assert.equal(result.article?.publishedAt, draft.updatedAt)
  assert.deepEqual(result.article?.availableLocales, ['en'])
  assert.equal(draft.publishedAt, '')
})

test('unsafe Markdown and incomplete localization fail through the accepted 4E.1 validator', () => {
  const unsafe = validEnglishDraft()
  unsafe.enBody = '[bad](javascript:alert(1))'
  const unsafeResult = validateManageBlogDraft(unsafe)
  assert.equal(unsafeResult.ok, false)
  assert.equal(
    unsafeResult.issues.some(issue => issue.path === 'body.en' && issue.message.includes('unsafe')),
    true,
  )

  const incomplete = validEnglishDraft()
  incomplete.faBody = '## فقط بدنه'
  const incompleteResult = validateManageBlogDraft(incomplete)
  assert.equal(incompleteResult.ok, false)
  assert.equal(incompleteResult.issues.some(issue => issue.path === 'localizations.fa.title'), true)
})

test('repository Article loads into editable state without losing immutable/system fields', () => {
  const article: BlogArticle = {
    id: 'existing-article',
    slug: 'existing-article-slug',
    status: 'published',
    publishedAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T01:00:00.000Z',
    author: { kind: 'editorial', name: 'Prompt Draft', url: '/' },
    hero: {
      fullUrl: '/media/hero.webp',
      thumbnailUrl: '/media/hero-thumb.webp',
      width: 1600,
      height: 900,
      alt: { en: 'Hero', fa: 'تصویر اصلی' },
    },
    localizations: {
      en: { title: 'Existing', description: 'Existing description' },
      fa: { title: 'موجود', description: 'توضیح موجود' },
    },
    body: { en: '## Existing', fa: '## موجود' },
    availableLocales: ['en', 'fa'],
  }

  const draft = blogArticleToManageDraft(article)
  assert.equal(draft.id, article.id)
  assert.equal(draft.slug, article.slug)
  assert.equal(draft.publishedAt, article.publishedAt)
  assert.equal(draft.updatedAt, article.updatedAt)
  assert.equal(draft.enBody, article.body.en)
  assert.equal(draft.faBody, article.body.fa)
  assert.equal(draft.heroWidth, '1600')
  assert.equal(draft.heroHeight, '900')
})
