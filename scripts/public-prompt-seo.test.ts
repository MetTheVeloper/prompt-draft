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
  id: 9003,
  title: {
    en: 'From Grassias',
    fa: 'از گراسیاس',
  },
  availableLocales: ['en', 'fa'],
  publishedAt: '2026-09-05T14:43:00.000Z',
  tags: ['portrait', 'macro'],
  model: {
    previewGeneratedWith: 'gpt-image-1',
    optimizedFor: ['gpt-image-1'],
  },
  images: [{
    position: 0,
    fullUrl: 'https://cdn.example.com/9003/full.webp',
    thumbnailUrl: 'https://cdn.example.com/9003/thumb.webp',
  }],
}

test('normalizes public site URLs and resolves relative public URLs', () => {
  assert.equal(normalizePublicSiteUrl('https://grassic.ir///'), 'https://grassic.ir')
  assert.equal(normalizePublicSiteUrl('not a url'), '')
  assert.equal(toAbsolutePublicUrl('https://grassic.ir', '/prompt/9003'), 'https://grassic.ir/prompt/9003')
  assert.equal(toAbsolutePublicUrl('https://grassic.ir', 'https://cdn.example.com/image.webp'), 'https://cdn.example.com/image.webp')
})

test('uses first public preview image and a site fallback when media is absent', () => {
  assert.equal(publicPromptSeoImage(PROMPT), 'https://cdn.example.com/9003/full.webp')
  assert.equal(publicPromptSeoImage({ ...PROMPT, images: [] }), '/pwa-512x512.png')
})

test('builds EN CreativeWork from sanitized public fields only', () => {
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
    localizedTitle: 'From Grassias',
    description: 'Explore the published preview for From Grassias on Prompt Draft.',
    canonicalUrl: 'https://grassic.ir/prompt/9003',
    imageUrl: 'https://cdn.example.com/9003/full.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.deepEqual(value, {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'From Grassias',
    url: 'https://grassic.ir/prompt/9003',
    description: 'Explore the published preview for From Grassias on Prompt Draft.',
    datePublished: '2026-09-05T14:43:00.000Z',
    inLanguage: 'en-US',
    image: 'https://cdn.example.com/9003/full.webp',
    keywords: ['portrait', 'macro'],
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

test('builds FA CreativeWork with fa-IR language', () => {
  const value = buildPublicPromptStructuredData({
    prompt: { ...PROMPT, tags: [] },
    locale: 'fa',
    localizedTitle: 'از گراسیاس',
    description: 'پیش‌نمایش منتشرشده «از گراسیاس» را در Prompt Draft ببینید.',
    canonicalUrl: 'https://grassic.ir/fa/prompt/9003',
    imageUrl: 'https://cdn.example.com/9003/full.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.equal(value.inLanguage, 'fa-IR')
  assert.equal(value.url, 'https://grassic.ir/fa/prompt/9003')
  assert.equal('keywords' in value, false)
})
