import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PERMISSIONS,
  hasPermission,
  resolvePermissionsForRole,
} from './authorization.mjs'
import {
  evaluateRuleExpression,
  validateRuleExpression,
} from './campaignRules.mjs'
import {
  hashCampaignDefinition,
  validateCampaignDefinition,
} from './campaignDefinition.mjs'

function definition(overrides = {}) {
  return {
    schemaVersion: 'campaign.v1',
    identity: {
      slug: 'payiz',
      internalName: 'autumn-festival-2026',
    },
    objective: {
      type: 'engagement',
      primaryKpi: 'qualified_users',
    },
    lifecycle: {
      startsAt: '2026-09-23T00:00:00.000Z',
      endsAt: '2026-12-21T23:59:59.000Z',
      timezone: 'Asia/Tehran',
      participationAfterEnd: 'deny',
      rewardSettlement: 'immediate',
    },
    eligibility: { authenticated: true },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      defaultLocale: 'fa',
      locales: ['en', 'fa'],
      content: {
        en: { title: 'Autumn' },
        fa: { title: 'پاییز' },
      },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [
      {
        id: 'goals',
        type: 'metric_goal',
        config: { public: {} },
      },
    ],
    completion: {
      type: 'condition',
      condition: {
        source: 'metric',
        metricKey: 'referrals.completed.count',
        operator: 'gte',
        value: 4,
        window: 'campaign',
      },
    },
    rewards: [
      {
        id: 'completion-100',
        type: 'goin',
        amount: 100,
        trigger: { type: 'campaign_completion' },
      },
    ],
    limits: {},
    analytics: {},
    ...overrides,
  }
}

test('admin gets campaign view/metrics but not manage/publish', () => {
  const permissions = resolvePermissionsForRole('admin')
  assert.ok(permissions.includes(PERMISSIONS.MARKETING_CAMPAIGNS_VIEW))
  assert.ok(permissions.includes(PERMISSIONS.MARKETING_METRICS_VIEW))
  assert.equal(
    hasPermission({ role: 'admin' }, PERMISSIONS.MARKETING_CAMPAIGNS_MANAGE),
    false,
  )
  assert.equal(
    hasPermission({ role: 'admin' }, PERMISSIONS.MARKETING_CAMPAIGNS_PUBLISH),
    false,
  )
  assert.equal(
    hasPermission(
      { role: 'super_admin' },
      PERMISSIONS.MARKETING_CAMPAIGNS_PUBLISH,
    ),
    true,
  )
})

test('draft validation permits an intentionally incomplete definition', () => {
  const result = validateCampaignDefinition(
    { schemaVersion: 'campaign.v1' },
    { mode: 'draft', headSlug: 'payiz' },
  )
  assert.deepEqual(result.errors, [])
  assert.equal(result.publishable, false)
})

test('publish validator accepts canonical campaign.v1 definition', () => {
  const result = validateCampaignDefinition(definition(), { headSlug: 'payiz' })
  assert.equal(result.publishable, true)
  assert.deepEqual(result.errors, [])
})

test('validator rejects unknown metrics and missing localized content', () => {
  const value = definition({
    completion: {
      type: 'condition',
      condition: {
        source: 'metric',
        metricKey: 'raw.sql.metric',
        operator: 'gte',
        value: 1,
        window: 'campaign',
      },
    },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      defaultLocale: 'en',
      locales: ['en', 'fa'],
      content: { en: { title: 'Autumn' } },
    },
  })
  const result = validateCampaignDefinition(value, { headSlug: 'payiz' })
  assert.equal(result.publishable, false)
  assert.ok(result.errors.some(item => item.code === 'CAMPAIGN_METRIC_UNKNOWN'))
  assert.ok(result.errors.some(item => item.path === 'experience.content.fa.title'))
})

test('publish validator requires registered renderer references', () => {
  const value = definition({
    experience: {
      renderer: { kind: 'custom', key: 'unregistered-game-page' },
      defaultLocale: 'fa',
      locales: ['fa'],
      content: { fa: { title: 'بازی' } },
    },
  })
  const result = validateCampaignDefinition(value, { headSlug: 'payiz' })
  assert.ok(result.errors.some(item => item.code === 'CAMPAIGN_RENDERER_UNKNOWN'))
})

test('reward-bearing campaigns require authenticated participation', () => {
  const result = validateCampaignDefinition(
    definition({ eligibility: { authenticated: false } }),
    { headSlug: 'payiz' },
  )
  assert.ok(result.errors.some(
    item => item.code === 'CAMPAIGN_AUTHENTICATION_REQUIRED_FOR_REWARD',
  ))
})

test('client_reported mechanics may coexist but cannot authorize Goin', () => {
  const decorative = definition({
    mechanics: [
      {
        id: 'client-step',
        type: 'custom',
        config: { public: {} },
      },
    ],
  })
  const allowed = validateCampaignDefinition(decorative, { headSlug: 'payiz' })
  assert.equal(allowed.publishable, true)

  const authoritative = definition({
    mechanics: decorative.mechanics,
    completion: {
      type: 'condition',
      condition: {
        source: 'mechanic_outcome',
        mechanicId: 'client-step',
        outcome: 'done',
      },
    },
  })
  const rejected = validateCampaignDefinition(authoritative, { headSlug: 'payiz' })
  assert.ok(rejected.errors.some(
    item => item.code === 'CAMPAIGN_CLIENT_REPORTED_REWARD_FORBIDDEN',
  ))
})

test('rule evaluator supports nested all/any/not and trusted resolvers', async () => {
  const rule = {
    type: 'all',
    rules: [
      {
        type: 'condition',
        condition: {
          source: 'metric',
          metricKey: 'referrals.completed.count',
          operator: 'gte',
          value: 4,
          window: 'campaign',
        },
      },
      {
        type: 'not',
        rule: {
          type: 'condition',
          condition: {
            source: 'mechanic_outcome',
            mechanicId: 'game',
            outcome: 'lost',
          },
        },
      },
    ],
  }

  assert.deepEqual(validateRuleExpression(rule), [])
  const result = await evaluateRuleExpression(rule, {
    resolveMetric: async () => 5,
    hasMechanicOutcome: async (_id, outcome) => outcome === 'won',
  })
  assert.equal(result, true)
})

test('definition hashing is deterministic across object key order', () => {
  const a = definition()
  const b = Object.fromEntries(Object.entries(a).reverse())
  assert.equal(hashCampaignDefinition(a), hashCampaignDefinition(b))
  assert.match(hashCampaignDefinition(a), /^[0-9a-f]{64}$/)
})
