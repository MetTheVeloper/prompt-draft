import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePublicCreator } from '../app/composables/usePublicCreator'

const PUBLIC_CREATOR = {
  identity: {
    username: 'grassias',
    screenName: { en: 'GrassiaS', fa: 'گراسیَس' },
    bio: { en: 'Creator at Grassic', fa: 'کریتور در گرسیک' },
    article: {
      en: '# Building Prompt Draft\n\nA **public** Creator story.',
      fa: '# ساخت Prompt Draft\n\nیک روایت **عمومی**.',
    },
    avatarUrl: 'https://cdn.example.com/avatar.webp',
    cover: {
      fullUrl: 'https://cdn.example.com/cover.webp',
      thumbnailUrl: 'https://cdn.example.com/cover-thumb.webp',
      width: 1600,
      height: 900,
      thumbnailWidth: 640,
      thumbnailHeight: 360,
      storageKey: 'PRIVATE_COVER_KEY',
    },
    skills: [
      {
        slug: 'prompt-engineering',
        categorySlug: 'ai-prompting',
        title: { en: 'Prompt Engineering', fa: 'مهندسی پرامپت' },
        internalId: 'PRIVATE_SKILL_ID',
      },
    ],
    links: [
      {
        type: 'website',
        url: 'https://grassic.ir/creator/grassias',
        label: null,
        token: 'PRIVATE_LINK_TOKEN',
      },
    ],
    location: {
      text: 'The Mars',
      providerPlaceId: 'PRIVATE_PLACE_ID',
      coordinates: [1, 2],
    },
    email: 'PRIVATE_EMAIL_SENTINEL',
    birthday: '1990-01-01',
    role: 'super_admin',
    userId: 'PRIVATE_UUID_SENTINEL',
  },
  publications: [
    {
      id: 473,
      title: { en: 'Prompt', fa: 'پرامپت' },
      description: { en: 'Published prompt', fa: 'پرامپت منتشرشده' },
      availableLocales: ['en', 'fa'],
      publishedAt: '2026-09-09T08:00:00.000Z',
      coverImage: {
        fullUrl: 'https://cdn.example.com/prompts/473.webp',
        thumbnailUrl: 'https://cdn.example.com/prompts/473-thumb.webp',
        storageKey: 'PRIVATE_PROMPT_STORAGE',
      },
      prompt: 'PROTECTED_PROMPT_SENTINEL',
      sourceUserId: 'PRIVATE_SOURCE_USER',
    },
  ],
  policy: {
    indexable: true,
    discoverable: true,
    reasons: ['PRIVATE_REASON'],
    signals: { creatorApproved: true },
  },
  reviewNote: 'PRIVATE_REVIEW_NOTE',
}

test('normalizes only the explicit public Creator browser/SSR allowlist', () => {
  const creator = normalizePublicCreator(PUBLIC_CREATOR)
  assert.ok(creator)
  assert.deepEqual(creator, {
    identity: {
      username: 'grassias',
      screenName: { en: 'GrassiaS', fa: 'گراسیَس' },
      bio: { en: 'Creator at Grassic', fa: 'کریتور در گرسیک' },
      article: {
        en: '# Building Prompt Draft\n\nA **public** Creator story.',
        fa: '# ساخت Prompt Draft\n\nیک روایت **عمومی**.',
      },
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      cover: {
        fullUrl: 'https://cdn.example.com/cover.webp',
        thumbnailUrl: 'https://cdn.example.com/cover-thumb.webp',
        width: 1600,
        height: 900,
        thumbnailWidth: 640,
        thumbnailHeight: 360,
      },
      skills: [{
        slug: 'prompt-engineering',
        categorySlug: 'ai-prompting',
        title: { en: 'Prompt Engineering', fa: 'مهندسی پرامپت' },
      }],
      links: [{
        type: 'website',
        url: 'https://grassic.ir/creator/grassias',
        label: null,
      }],
      location: { text: 'The Mars' },
    },
    publications: [{
      id: 473,
      title: { en: 'Prompt', fa: 'پرامپت' },
      description: { en: 'Published prompt', fa: 'پرامپت منتشرشده' },
      availableLocales: ['en', 'fa'],
      publishedAt: '2026-09-09T08:00:00.000Z',
      coverImage: {
        fullUrl: 'https://cdn.example.com/prompts/473.webp',
        thumbnailUrl: 'https://cdn.example.com/prompts/473-thumb.webp',
      },
    }],
    policy: { indexable: true, discoverable: true },
  })

  const serialized = JSON.stringify(creator)
  for (const forbidden of [
    'PRIVATE_EMAIL_SENTINEL',
    'PRIVATE_UUID_SENTINEL',
    'PRIVATE_REVIEW_NOTE',
    'PRIVATE_PLACE_ID',
    'PRIVATE_COVER_KEY',
    'PRIVATE_PROMPT_STORAGE',
    'PROTECTED_PROMPT_SENTINEL',
    'PRIVATE_SOURCE_USER',
    'PRIVATE_REASON',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} leaked into normalized Creator`)
  }
})

test('accepts an accessible defensive noindex Creator with empty localized bio/article', () => {
  const creator = normalizePublicCreator({
    ...PUBLIC_CREATOR,
    identity: {
      ...PUBLIC_CREATOR.identity,
      bio: { en: '', fa: '' },
      article: { en: '', fa: '' },
      avatarUrl: null,
      cover: null,
      skills: [],
      links: [],
      location: null,
    },
    publications: [],
    policy: { indexable: false, discoverable: false },
  })

  assert.ok(creator)
  assert.equal(creator.policy.indexable, false)
  assert.equal(creator.identity.article.en, '')
  assert.deepEqual(creator.publications, [])
})

test('rejects noncanonical usernames and unsafe public URLs', () => {
  assert.equal(normalizePublicCreator({
    ...PUBLIC_CREATOR,
    identity: { ...PUBLIC_CREATOR.identity, username: 'Grassias' },
  }), null)

  assert.equal(normalizePublicCreator({
    ...PUBLIC_CREATOR,
    identity: {
      ...PUBLIC_CREATOR.identity,
      links: [{ type: 'website', url: 'javascript:alert(1)', label: null }],
    },
  }), null)
})

test('publication locale inventory must exactly match localized title/description', () => {
  assert.equal(normalizePublicCreator({
    ...PUBLIC_CREATOR,
    publications: [{
      ...PUBLIC_CREATOR.publications[0],
      description: { en: 'English only' },
      availableLocales: ['en', 'fa'],
    }],
  }), null)
})
