import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePublicPrompt } from '../app/composables/usePublicPrompt'

const PUBLIC_PROMPT = {
  id: 9003,
  title: {
    en: 'From Grassias',
    fa: 'از گراسیاس',
  },
  availableLocales: ['en', 'fa'],
  publishedAt: '2026-09-05T14:43:00.000Z',
  tags: ['portrait'],
  model: {
    previewGeneratedWith: 'gpt-image-1',
    optimizedFor: ['gpt-image-1'],
  },
  images: [
    {
      position: 0,
      fullUrl: 'https://cdn.example.com/full.webp',
      thumbnailUrl: 'https://cdn.example.com/thumb.webp',
      storageKey: 'PRIVATE_STORAGE_KEY',
    },
  ],
  prompt: 'PROTECTED_PROMPT_SENTINEL',
  variants: [{ prompt: 'PROTECTED_VARIANT_SENTINEL' }],
  balance: 500,
  permissions: ['all'],
}

test('normalizes the exact public prompt browser/SSR contract', () => {
  const prompt = normalizePublicPrompt(PUBLIC_PROMPT)
  assert.ok(prompt)
  assert.deepEqual(prompt, {
    id: 9003,
    title: {
      en: 'From Grassias',
      fa: 'از گراسیاس',
    },
    availableLocales: ['en', 'fa'],
    publishedAt: '2026-09-05T14:43:00.000Z',
    tags: ['portrait'],
    model: {
      previewGeneratedWith: 'gpt-image-1',
      optimizedFor: ['gpt-image-1'],
    },
    images: [
      {
        position: 0,
        fullUrl: 'https://cdn.example.com/full.webp',
        thumbnailUrl: 'https://cdn.example.com/thumb.webp',
      },
    ],
  })

  const serialized = JSON.stringify(prompt)
  assert.equal(serialized.includes('PROTECTED_PROMPT_SENTINEL'), false)
  assert.equal(serialized.includes('PROTECTED_VARIANT_SENTINEL'), false)
  assert.equal(serialized.includes('PRIVATE_STORAGE_KEY'), false)
  assert.equal(serialized.includes('permissions'), false)
  assert.equal(serialized.includes('balance'), false)
})

test('rejects locale availability that does not match authoritative titles', () => {
  assert.equal(normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    title: { en: 'English only' },
    availableLocales: ['en', 'fa'],
  }), null)
})

test('accepts a single authoritative localization without adding fallback content', () => {
  const prompt = normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    title: { fa: 'فقط فارسی' },
    availableLocales: ['fa'],
  })

  assert.ok(prompt)
  assert.deepEqual(prompt.title, { fa: 'فقط فارسی' })
  assert.deepEqual(prompt.availableLocales, ['fa'])
  assert.equal(prompt.title.en, undefined)
})

test('rejects protected-detail shaped payloads that do not satisfy public contract', () => {
  assert.equal(normalizePublicPrompt({
    id: 9003,
    title: { en: 'Title', fa: 'عنوان' },
    prompt: 'protected body',
    variants: [],
  }), null)
})
