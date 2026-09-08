import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CREATOR_PROFILE_LIMITS,
  evaluateCreatorApplicationReadiness,
  evaluateCreatorProfileContent,
  isCanonicalCreatorUsername,
  normalizeActiveSkillSlugs,
  normalizeCreatorProfile,
} from './creatorProfileRequirements.mjs'

function completeProfile(overrides = {}) {
  return {
    screenName: {
      en: 'Creator Name',
      fa: 'نام کریتور',
      ...(overrides.screenName ?? {}),
    },
    bio: {
      en: 'Creator bio',
      fa: 'بیوگرافی کریتور',
      ...(overrides.bio ?? {}),
    },
    article: {
      en: '# About\nCreator article',
      fa: '# درباره\nمقاله کریتور',
      ...(overrides.article ?? {}),
    },
  }
}

test('ordinary incomplete profile normalizes safely without becoming Creator-ready', () => {
  assert.deepEqual(normalizeCreatorProfile({
    screenName: { en: '  Saved name  ' },
  }), {
    screenName: { en: 'Saved name', fa: null },
    bio: { en: null, fa: null },
    article: { en: null, fa: null },
  })

  const result = evaluateCreatorProfileContent({
    profile: { screenName: { en: 'Saved name' } },
    activeSkillSlugs: [],
  })

  assert.equal(result.complete, false)
  assert.deepEqual(result.missingFields, [
    'screenName.fa',
    'bio.en',
    'bio.fa',
    'article.en',
    'article.fa',
    'skills',
  ])
})

test('Creator application is ready only with active account, canonical username, EN/FA content and an active skill', () => {
  const result = evaluateCreatorApplicationReadiness({
    accountStatus: 'active',
    username: 'creator.one',
    profile: completeProfile(),
    activeSkillSlugs: ['frontend-development'],
  })

  assert.equal(result.ready, true)
  assert.deepEqual(result.missingFields, [])
  assert.deepEqual(result.invalidFields, [])
  assert.equal(result.signals.accountActive, true)
  assert.equal(result.signals.canonicalUsername, true)
  assert.equal(result.signals.hasActiveSkill, true)
})

test('EN and FA Creator requirements are independent and whitespace is missing', () => {
  const result = evaluateCreatorProfileContent({
    profile: completeProfile({
      screenName: { fa: '   ' },
      bio: { en: '' },
      article: { fa: '\n\t' },
    }),
    activeSkillSlugs: ['ai-engineering'],
  })

  assert.equal(result.complete, false)
  assert.deepEqual(result.missingFields, [
    'screenName.fa',
    'bio.en',
    'article.fa',
  ])
})

test('Creator readiness requires at least one active taxonomy skill supplied by the caller', () => {
  const result = evaluateCreatorApplicationReadiness({
    accountStatus: 'active',
    username: 'creator-two',
    profile: completeProfile(),
    activeSkillSlugs: [],
  })

  assert.equal(result.ready, false)
  assert.deepEqual(result.missingFields, ['skills'])
})

test('skill slugs are canonicalized, validated and deduplicated', () => {
  assert.deepEqual(normalizeActiveSkillSlugs([
    ' AI-Engineering ',
    'ai-engineering',
    'frontend-development',
    'not valid!',
    42,
  ]), [
    'ai-engineering',
    'frontend-development',
  ])
})

test('suspended account and noncanonical username cannot request Creator status', () => {
  const result = evaluateCreatorApplicationReadiness({
    accountStatus: 'suspended',
    username: 'Creator.Name',
    profile: completeProfile(),
    activeSkillSlugs: ['product-management'],
  })

  assert.equal(result.ready, false)
  assert.deepEqual(result.missingFields, ['account.status', 'username'])
  assert.equal(result.normalizedUsername, 'creator.name')
  assert.equal(isCanonicalCreatorUsername('creator.name'), true)
  assert.equal(isCanonicalCreatorUsername('Creator.Name'), false)
})

test('technical maximums reject oversized data but do not impose SEO-style minimum lengths', () => {
  const tinyButPresent = evaluateCreatorApplicationReadiness({
    accountStatus: 'active',
    username: 'tiny.creator',
    profile: {
      screenName: { en: 'A', fa: 'ب' },
      bio: { en: 'C', fa: 'د' },
      article: { en: 'E', fa: 'ف' },
    },
    activeSkillSlugs: ['seo'],
  })

  assert.equal(tinyButPresent.ready, true)

  const oversized = evaluateCreatorApplicationReadiness({
    accountStatus: 'active',
    username: 'large.creator',
    profile: completeProfile({
      bio: { en: 'x'.repeat(CREATOR_PROFILE_LIMITS.bio + 1) },
    }),
    activeSkillSlugs: ['seo'],
  })

  assert.equal(oversized.ready, false)
  assert.deepEqual(oversized.invalidFields, ['bio.en'])
  assert.match(oversized.errors[0].message, /at most/)
})
