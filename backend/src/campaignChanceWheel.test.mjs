import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCampaignDefinition } from './campaignDefinition.mjs'
import {
  selectChanceWheelOutcome,
  validateChanceWheelDefinition,
} from './campaignChanceWheel.mjs'
import { buildPublicCampaignProjection } from './campaignRuntimeShared.mjs'

function mechanic() {
  return {
    id: 'daily-wheel',
    type: 'chance_wheel',
    config: {
      public: {
        segments: [
          { key: 'goin_5', label: { en: '5 Goin', fa: '۵ گوین' } },
          { key: 'no_reward', label: { en: 'Try again tomorrow', fa: 'فردا دوباره امتحان کن' } },
        ],
      },
      private: {
        weights: {
          goin_5: 1,
          no_reward: 3,
        },
      },
    },
    attemptPolicy: {
      maxAttempts: 1,
      period: 'calendar_day',
      timezone: 'Asia/Tehran',
    },
  }
}

function definition() {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug: 'ce43-wheel', internalName: 'CE4.3 wheel test' },
    objective: { type: 'engagement', primaryKpi: 'wheel-spin' },
    lifecycle: {
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-10-01T00:00:00.000Z',
      timezone: 'Asia/Tehran',
      participationAfterEnd: 'deny',
      rewardSettlement: 'immediate',
    },
    eligibility: { authenticated: true },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      locales: ['en', 'fa'],
      defaultLocale: 'en',
      content: {
        en: { title: 'Daily wheel' },
        fa: { title: 'گردونه روزانه' },
      },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [mechanic()],
    completion: null,
    rewards: [{
      id: 'wheel-goin-5',
      type: 'goin',
      amount: 5,
      trigger: {
        type: 'mechanic_outcome',
        mechanicId: 'daily-wheel',
        outcome: 'goin_5',
      },
      budget: { maxAmount: 500 },
      expiresAfterSeconds: 86400,
    }],
    limits: {},
    analytics: {},
  }
}

test('chance wheel definition requires public segments and private positive weights', () => {
  assert.deepEqual(validateChanceWheelDefinition(mechanic()), [])

  const missing = structuredClone(mechanic())
  delete missing.config.private.weights.goin_5
  assert.ok(validateChanceWheelDefinition(missing).some(error => error.code === 'CAMPAIGN_WHEEL_WEIGHT_INVALID'))

  const extra = structuredClone(mechanic())
  extra.config.private.weights.secret = 1
  assert.ok(validateChanceWheelDefinition(extra).some(error => error.code === 'CAMPAIGN_WHEEL_WEIGHT_UNKNOWN_SEGMENT'))
})

test('chance wheel publish contract rejects weight-like data on the public side', () => {
  const publicWeights = structuredClone(mechanic())
  publicWeights.config.public.weights = { goin_5: 1 }
  assert.ok(validateChanceWheelDefinition(publicWeights).some(error => error.code === 'CAMPAIGN_WHEEL_PUBLIC_CONFIG_FIELD_UNSUPPORTED'))

  const segmentWeight = structuredClone(mechanic())
  segmentWeight.config.public.segments[0].weight = 1
  assert.ok(validateChanceWheelDefinition(segmentWeight).some(error => error.code === 'CAMPAIGN_WHEEL_SEGMENT_FIELD_UNSUPPORTED'))
})

test('chance wheel selection uses only server private weights', () => {
  const wheel = mechanic()
  assert.deepEqual(selectChanceWheelOutcome(wheel, () => 0), { ok: true, outcome: 'goin_5' })
  assert.deepEqual(selectChanceWheelOutcome(wheel, () => 1), { ok: true, outcome: 'no_reward' })
  assert.deepEqual(selectChanceWheelOutcome(wheel, () => 3), { ok: true, outcome: 'no_reward' })
})

test('publish validation rejects reward outcomes that are not public wheel segments', () => {
  const valid = validateCampaignDefinition(definition(), { headSlug: 'ce43-wheel' })
  assert.equal(valid.publishable, true)

  const broken = definition()
  broken.rewards[0].trigger.outcome = 'private-only-outcome'
  const result = validateCampaignDefinition(broken, { headSlug: 'ce43-wheel' })
  assert.equal(result.publishable, false)
  assert.ok(result.errors.some(error => error.code === 'CAMPAIGN_WHEEL_REWARD_OUTCOME_UNKNOWN'))
})

test('public Campaign projection exposes wheel segments but never private weights', () => {
  const source = definition()
  const projection = buildPublicCampaignProjection({
    campaignId: '00000000-0000-4000-8000-000000000001',
    slug: source.identity.slug,
    versionNumber: 1,
    schemaVersion: 'campaign.v1',
    status: 'active',
    definition: source,
  })

  assert.deepEqual(projection.mechanics[0].config.public.segments, source.mechanics[0].config.public.segments)
  assert.equal('private' in projection.mechanics[0].config, false)
  assert.equal(JSON.stringify(projection).includes('weights'), false)
})
