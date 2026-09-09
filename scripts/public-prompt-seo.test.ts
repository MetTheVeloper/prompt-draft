import assert from 'node:assert/strict'
import test from 'node:test'

import type { PublicPrompt } from '../app/composables/usePublicPrompt'
import {
  buildPublicPromptStructuredData,
  normalizePublicSiteUrl,
  publicPromptSeoImage,
  toAbsolutePublicUrl,
} from '../app/utils/publicPromptSeo'

const PROMPT: PublicPrompt = {
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
  tags: ['portrait', 'photography'],
  model: {
    previewGeneratedWith: 'gpt-image-1',
    optimizedFor: ['gpt-image-1'],
  },
  images: [{
    position: 0,
    fullUrl: 'https://cdn.example.com/511/full.webp',
    thumbnailUrl: 'https://cdn.example.com/511/thumb.webp',
  }],
  creator: null,
  telegramMessageId: null,
}

test('normalizes public site URLs and resolves relative public URLs', () => {
  assert.equal(normalizePublicSiteUrl('https://grassic.ir///'), 'https://grassic.ir')
  assert.equal(normalizePublicSiteUrl('not a url'), '')
  assert.equal(toAbsolutePublicUrl('https://grassic.ir', '/prompt/511'), 'https://grassic.ir/prompt/511')
  assert.equal(toAbsolutePublicUrl('https://grassic.ir', 'https://cdn.example.com/image.webp'), 'https://cdn.example.com/image.webp')
})

test('uses first public preview image and a site fallback when media is absent', () => {
  assert.equal(publicPromptSeoImage(PROMPT), 'https://cdn.example.com/511/full.webp')
  assert.equal(publicPromptSeoImage({ ...PROMPT, images: [] }), '/pwa-512x512.png')
})

test('builds EN CreativeWork from sanitized public fields and authored description', () => {
  const promptWithPrivateSentinels = {
    ...PROMPT,
    prompt: 'PROTECTED_PROMPT_SENTINEL',
    variants: ['PROTECTED_VARIANT_SENTINEL'],
    sourceDraftId: 'PRIVATE_DRAFT_SENTINEL',
    storageKey: 'PRIVATE_STORAGE_SENTINEL',
    balance: 999,
  } as PublicPrompt

  const value = buildPublicPromptStructuredData({
    prompt: promptWithPrivateSentinels,
    locale: 'en',
    localizedTitle: PROMPT.title.en!,
    description: PROMPT.description.en!,
    canonicalUrl: 'https://grassic.ir/prompt/511',
    imageUrl: 'https://cdn.example.com/511/full.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.deepEqual(value, {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'Natural LinkedIn Portrait',
    url: 'https://grassic.ir/prompt/511',
    description: PROMPT.description.en,
    datePublished: '2026-08-12T08:03:35.000Z',
    inLanguage: 'en-US',
    image: 'https://cdn.example.com/511/full.webp',
    keywords: ['portrait', 'photography'],
    isPartOf: {
      '@type': 'WebSite',
      name: 'Prompt Draft',
      url: 'https://grassic.ir',
    },
  })

  const serialized = JSON.stringify(value)
  for (const forbidden of [
    'PROTECTED_PROMPT_SENTINEL',
    'PROTECTED_VARIANT_SENTINEL',
    'PRIVATE_DRAFT_SENTINEL',
    'PRIVATE_STORAGE_SENTINEL',
    'balance',
    'variants',
    'sourceDraftId',
    'storageKey',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} leaked into JSON-LD`)
  }
})

test('builds FA CreativeWork with the authored Persian description and fa-IR language', () => {
  const value = buildPublicPromptStructuredData({
    prompt: { ...PROMPT, tags: [] },
    locale: 'fa',
    localizedTitle: PROMPT.title.fa!,
    description: PROMPT.description.fa!,
    canonicalUrl: 'https://grassic.ir/fa/prompt/511',
    imageUrl: 'https://cdn.example.com/511/full.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.equal(value.inLanguage, 'fa-IR')
  assert.equal(value.url, 'https://grassic.ir/fa/prompt/511')
  assert.equal(value.description, PROMPT.description.fa)
  assert.equal('keywords' in value, false)
})
