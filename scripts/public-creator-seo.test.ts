import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import type { PublicCreator } from '../app/composables/usePublicCreator'
import {
  buildPublicCreatorStructuredData,
  publicCreatorSeoImage,
} from '../app/utils/publicCreatorSeo'

const pageUrl = new URL('../app/pages/creator/[username].vue', import.meta.url)
const creatorSeoUrl = new URL('../app/utils/publicCreatorSeo.ts', import.meta.url)

const CREATOR: PublicCreator = {
  identity: {
    username: 'grassias',
    screenName: {
      en: 'GrassiaS',
      fa: 'گراسیَس',
    },
    bio: {
      en: 'Creator at Grassic',
      fa: 'کریتور در گرسیک',
    },
    article: {
      en: '# Building Prompt Draft',
      fa: '# ساختن Prompt Draft',
    },
    avatarUrl: 'https://cdn.example.com/avatar.webp',
    cover: {
      fullUrl: 'https://cdn.example.com/cover.webp',
      thumbnailUrl: 'https://cdn.example.com/cover-thumb.webp',
      width: 1600,
      height: 900,
      thumbnailWidth: 800,
      thumbnailHeight: 450,
    },
    skills: [{
      slug: 'prompt-engineering',
      categorySlug: 'ai-prompting',
      title: {
        en: 'Prompt Engineering',
        fa: 'مهندسی پرامپت',
      },
    }],
    links: [{
      type: 'website',
      url: 'https://grassic.ir/creator/grassias',
      label: null,
    }],
    location: { text: 'The Mars' },
  },
  publications: [],
  policy: {
    indexable: true,
    discoverable: true,
  },
}

test('Creator SEO image prefers cover, then avatar, then the site fallback', () => {
  assert.equal(publicCreatorSeoImage(CREATOR), 'https://cdn.example.com/cover.webp')
  assert.equal(publicCreatorSeoImage({
    ...CREATOR,
    identity: { ...CREATOR.identity, cover: null },
  }), 'https://cdn.example.com/avatar.webp')
  assert.equal(publicCreatorSeoImage({
    ...CREATOR,
    identity: { ...CREATOR.identity, cover: null, avatarUrl: null },
  }), '/pwa-512x512.png')
})

test('Creator SEO keeps shared URL helpers owned by publicPromptSeo only', async () => {
  const [creatorSeoSource, pageSource] = await Promise.all([
    readFile(creatorSeoUrl, 'utf8'),
    readFile(pageUrl, 'utf8'),
  ])

  assert.match(creatorSeoSource, /from '\.\/publicPromptSeo'/)
  assert.doesNotMatch(creatorSeoSource, /export\s*\{[^}]*normalizePublicSiteUrl[^}]*\}/s)
  assert.doesNotMatch(creatorSeoSource, /export\s*\{[^}]*toAbsolutePublicUrl[^}]*\}/s)
  assert.match(pageSource, /from '~\/utils\/publicPromptSeo'/)
})

test('builds localized EN ProfilePage + Person JSON-LD from the public allowlist', () => {
  const value = buildPublicCreatorStructuredData({
    creator: CREATOR,
    locale: 'en',
    localizedName: CREATOR.identity.screenName.en,
    description: CREATOR.identity.bio.en,
    canonicalUrl: 'https://grassic.ir/creator/grassias',
    imageUrl: 'https://cdn.example.com/cover.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.deepEqual(value, {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: 'GrassiaS',
    url: 'https://grassic.ir/creator/grassias',
    inLanguage: 'en-US',
    description: 'Creator at Grassic',
    image: 'https://cdn.example.com/cover.webp',
    mainEntity: {
      '@type': 'Person',
      name: 'GrassiaS',
      alternateName: '@grassias',
      url: 'https://grassic.ir/creator/grassias',
      description: 'Creator at Grassic',
      image: 'https://cdn.example.com/avatar.webp',
      sameAs: ['https://grassic.ir/creator/grassias'],
      knowsAbout: ['Prompt Engineering'],
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Prompt Draft',
      url: 'https://grassic.ir',
    },
  })
})

test('builds Persian ProfilePage + Person projection with localized authored fields', () => {
  const value = buildPublicCreatorStructuredData({
    creator: CREATOR,
    locale: 'fa',
    localizedName: CREATOR.identity.screenName.fa,
    description: CREATOR.identity.bio.fa,
    canonicalUrl: 'https://grassic.ir/fa/creator/grassias',
    imageUrl: 'https://cdn.example.com/cover.webp',
    siteUrl: 'https://grassic.ir',
  })

  assert.equal(value.inLanguage, 'fa-IR')
  assert.equal(value.name, 'گراسیَس')
  assert.equal(value.description, 'کریتور در گرسیک')
  assert.equal(value.mainEntity.name, 'گراسیَس')
  assert.deepEqual(value.mainEntity.knowsAbout, ['مهندسی پرامپت'])
})

test('Creator structured data never serializes private account fields', () => {
  const creatorWithPrivateSentinels = {
    ...CREATOR,
    email: 'PRIVATE_EMAIL_SENTINEL',
    birthday: 'PRIVATE_BIRTHDAY_SENTINEL',
    role: 'PRIVATE_ROLE_SENTINEL',
    balance: 'PRIVATE_BALANCE_SENTINEL',
    reviewNote: 'PRIVATE_REVIEW_SENTINEL',
    userId: 'PRIVATE_UUID_SENTINEL',
  } as PublicCreator

  const serialized = JSON.stringify(buildPublicCreatorStructuredData({
    creator: creatorWithPrivateSentinels,
    locale: 'en',
    localizedName: CREATOR.identity.screenName.en,
    description: CREATOR.identity.bio.en,
    canonicalUrl: 'https://grassic.ir/creator/grassias',
    imageUrl: 'https://cdn.example.com/cover.webp',
    siteUrl: 'https://grassic.ir',
  }))

  for (const forbidden of [
    'PRIVATE_EMAIL_SENTINEL',
    'PRIVATE_BIRTHDAY_SENTINEL',
    'PRIVATE_ROLE_SENTINEL',
    'PRIVATE_BALANCE_SENTINEL',
    'PRIVATE_REVIEW_SENTINEL',
    'PRIVATE_UUID_SENTINEL',
    'email',
    'birthday',
    'reviewNote',
    'userId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} leaked into Creator JSON-LD`)
  }
})

test('public Creator page wires localized SEO, reciprocal locales and policy-driven noindex', async () => {
  const source = await readFile(pageUrl, 'utf8')

  assert.match(source, /usePublicSeo\(\{/)
  assert.match(source, /title:\s*localizedName/)
  assert.match(source, /description:\s*localizedBio/)
  assert.match(source, /canonicalPath/)
  assert.match(source, /alternateLocales:\s*\['en',\s*'fa'\]/)
  assert.match(source, /noindex:\s*creatorNoindex/)
  assert.match(source, /!creator\.value!\.policy\.indexable/)
  assert.match(source, /buildPublicCreatorStructuredData\(/)
  assert.match(source, /publicCreatorSeoImage\(creator\.value!\)/)
})
