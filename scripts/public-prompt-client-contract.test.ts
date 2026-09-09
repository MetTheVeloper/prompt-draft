import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePublicPrompt } from '../app/composables/usePublicPrompt'

const PUBLIC_PROMPT = {
  id: 511,
  title: {
    en: 'Natural LinkedIn Portrait',
    fa: 'پرتره طبیعی LinkedIn',
  },
  description: {
    en: 'Turn a reference portrait into a natural professional LinkedIn photo with restrained studio polish.',
    fa: 'پرتره مرجع را به یک عکس حرفه‌ای و طبیعی برای LinkedIn با پرداخت استودیویی کنترل‌شده تبدیل کنید.',
  },
  availableLocales: ['en', 'fa'],
  publishedAt: '2026-08-12T08:03:35.000Z',
  telegramMessageId: 511,
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
  creator: {
    username: 'grassias',
    avatarUrl: 'https://cdn.example.com/avatar.webp',
    email: 'PRIVATE_CREATOR_EMAIL',
    id: 'PRIVATE_CREATOR_UUID',
  },
  prompt: 'PROTECTED_PROMPT_SENTINEL',
  variants: [{ prompt: 'PROTECTED_VARIANT_SENTINEL' }],
  balance: 500,
  permissions: ['all'],
}

test('normalizes the exact public prompt browser/SSR contract including minimal Creator attribution', () => {
  const prompt = normalizePublicPrompt(PUBLIC_PROMPT)
  assert.ok(prompt)
  assert.deepEqual(prompt, {
    id: 511,
    title: {
      en: 'Natural LinkedIn Portrait',
      fa: 'پرتره طبیعی LinkedIn',
    },
    description: {
      en: 'Turn a reference portrait into a natural professional LinkedIn photo with restrained studio polish.',
      fa: 'پرتره مرجع را به یک عکس حرفه‌ای و طبیعی برای LinkedIn با پرداخت استودیویی کنترل‌شده تبدیل کنید.',
    },
    availableLocales: ['en', 'fa'],
    publishedAt: '2026-08-12T08:03:35.000Z',
    telegramMessageId: 511,
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
    creator: {
      username: 'grassias',
      avatarUrl: 'https://cdn.example.com/avatar.webp',
    },
  })

  const serialized = JSON.stringify(prompt)
  assert.equal(serialized.includes('PROTECTED_PROMPT_SENTINEL'), false)
  assert.equal(serialized.includes('PROTECTED_VARIANT_SENTINEL'), false)
  assert.equal(serialized.includes('PRIVATE_STORAGE_KEY'), false)
  assert.equal(serialized.includes('PRIVATE_CREATOR_EMAIL'), false)
  assert.equal(serialized.includes('PRIVATE_CREATOR_UUID'), false)
  assert.equal(serialized.includes('permissions'), false)
  assert.equal(serialized.includes('balance'), false)
})

test('accepts null Creator attribution and rejects malformed or unsafe Creator attribution', () => {
  const unattributed = normalizePublicPrompt({ ...PUBLIC_PROMPT, creator: null })
  assert.ok(unattributed)
  assert.equal(unattributed.creator, null)

  assert.equal(normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    creator: { username: 'GrassiaS', avatarUrl: null },
  }), null)

  assert.equal(normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    creator: { username: 'grassias', avatarUrl: 'javascript:alert(1)' },
  }), null)
})

test('accepts null Telegram metadata and rejects invalid Telegram message ids', () => {
  const withoutTelegram = normalizePublicPrompt({ ...PUBLIC_PROMPT, telegramMessageId: null })
  assert.ok(withoutTelegram)
  assert.equal(withoutTelegram.telegramMessageId, null)

  assert.equal(normalizePublicPrompt({ ...PUBLIC_PROMPT, telegramMessageId: 0 }), null)
  assert.equal(normalizePublicPrompt({ ...PUBLIC_PROMPT, telegramMessageId: 'invalid' }), null)
})

test('rejects locale availability without a matching authoritative description', () => {
  assert.equal(normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    description: { en: PUBLIC_PROMPT.description.en },
    availableLocales: ['en', 'fa'],
  }), null)
})

test('rejects unadvertised title or description localization', () => {
  assert.equal(normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    availableLocales: ['en'],
  }), null)
})

test('accepts a single complete authoritative localization without fallback content', () => {
  const prompt = normalizePublicPrompt({
    ...PUBLIC_PROMPT,
    title: { fa: 'فقط فارسی' },
    description: { fa: 'توضیح عمومی فقط به فارسی' },
    availableLocales: ['fa'],
  })

  assert.ok(prompt)
  assert.deepEqual(prompt.title, { fa: 'فقط فارسی' })
  assert.deepEqual(prompt.description, { fa: 'توضیح عمومی فقط به فارسی' })
  assert.deepEqual(prompt.availableLocales, ['fa'])
  assert.equal(prompt.title.en, undefined)
  assert.equal(prompt.description.en, undefined)
})

test('rejects protected-detail shaped payloads that do not satisfy public contract', () => {
  assert.equal(normalizePublicPrompt({
    id: 511,
    title: { en: 'Title', fa: 'عنوان' },
    prompt: 'protected body',
    variants: [],
  }), null)
})
