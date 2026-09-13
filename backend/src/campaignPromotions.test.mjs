import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import { validateCampaignDefinition } from './campaignDefinition.mjs'
import {
  dismissCampaignPromotionInTransaction,
  listCampaignPromotions,
  resetCampaignPromotionDismissalInTransaction,
} from './campaignPromotions.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_PROMOTIONS_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      await work({ client, execute: client.query.bind(client) })
      const error = new Error('rollback campaign promotion fixture')
      error.code = ROLLBACK_CODE
      throw error
    })
  } catch (error) {
    if (error?.code === ROLLBACK_CODE) return
    throw error
  }
}

function definitionFor(slug, {
  priority = 10,
  promotionStartsAt,
  dismiss = { enabled: true, persistence: 'user', ttlSeconds: 3600 },
} = {}) {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug, internalName: `${slug}-promotion-test` },
    objective: { type: 'acquisition', primaryKpi: 'promotion-test' },
    lifecycle: {
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-10-01T00:00:00.000Z',
      timezone: 'UTC',
      participationAfterEnd: 'deny',
      rewardSettlement: 'immediate',
    },
    eligibility: { authenticated: false },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      locales: ['en', 'fa'],
      defaultLocale: 'en',
      content: {
        en: { title: `Campaign ${slug}`, description: 'Promotion test', ctaLabel: 'Join' },
        fa: { title: `کمپین ${slug}`, description: 'آزمون تبلیغ', ctaLabel: 'شرکت' },
      },
      seo: { indexing: 'noindex' },
    },
    promotions: [{
      id: 'header-main',
      slot: 'site_header',
      renderer: { kind: 'builtin', key: 'header-campaign-cta-v1' },
      ...(promotionStartsAt ? { schedule: { startsAt: promotionStartsAt } } : {}),
      dismiss,
      frequencyCap: { maxImpressions: 3, period: 'session' },
      priority,
    }],
    mechanics: [],
    completion: null,
    rewards: [],
    limits: {},
    analytics: {},
  }
}

async function insertUser(execute) {
  const id = randomUUID()
  await execute(
    `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'test-only')`,
    [id, `campaign-promotion-${id}@example.test`],
  )
  return id
}

async function insertPublishedCampaign(execute, definition) {
  const campaignId = randomUUID()
  const versionId = randomUUID()
  await execute(
    `INSERT INTO campaigns (id, slug, internal_name, draft_definition, draft_revision)
     VALUES ($1, $2, $3, $4::jsonb, 1)`,
    [campaignId, definition.identity.slug, definition.identity.internalName, JSON.stringify(definition)],
  )
  await execute(
    `INSERT INTO campaign_versions (
       id, campaign_id, version_number, schema_version, definition,
       definition_hash, publish_idempotency_key
     )
     VALUES ($1, $2, 1, 'campaign.v1', $3::jsonb, $4, $5)`,
    [versionId, campaignId, JSON.stringify(definition), 'a'.repeat(64), `promotion-test-${versionId}`],
  )
  await execute(
    `UPDATE campaigns SET current_published_version_id = $2 WHERE id = $1`,
    [campaignId, versionId],
  )
  return { campaignId, versionId }
}

test('promotion publish validation enforces slots, renderers, schedule, dismissal, and frequency caps', () => {
  const slug = `promotion-${randomUUID()}`
  const valid = definitionFor(slug)
  const accepted = validateCampaignDefinition(valid, { headSlug: slug })
  assert.equal(accepted.publishable, true)
  assert.deepEqual(accepted.errors, [])

  const invalid = structuredClone(valid)
  invalid.promotions[0].slot = 'telegram'
  invalid.promotions[0].renderer.key = 'missing-renderer'
  invalid.promotions[0].schedule = {
    startsAt: '2026-09-15T00:00:00.000Z',
    endsAt: '2026-09-14T00:00:00.000Z',
  }
  invalid.promotions[0].dismiss = { enabled: true, persistence: 'forever', ttlSeconds: 0 }
  invalid.promotions[0].frequencyCap = { maxImpressions: 0, period: 'hour' }

  const rejected = validateCampaignDefinition(invalid, { headSlug: slug })
  const codes = new Set(rejected.errors.map(error => error.code))
  for (const code of [
    'CAMPAIGN_PROMOTION_SLOT_INVALID',
    'CAMPAIGN_PROMOTION_RENDERER_UNKNOWN',
    'CAMPAIGN_PROMOTION_END_BEFORE_START',
    'CAMPAIGN_PROMOTION_DISMISS_PERSISTENCE_INVALID',
    'CAMPAIGN_PROMOTION_DISMISS_TTL_INVALID',
    'CAMPAIGN_PROMOTION_FREQUENCY_MAX_INVALID',
    'CAMPAIGN_PROMOTION_FREQUENCY_PERIOD_INVALID',
  ]) {
    assert.equal(codes.has(code), true, code)
  }
})

test('promotion selection is deterministic, schedule-aware, and user dismissal is version-scoped', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const userId = await insertUser(execute)
    const highSlug = `promo-high-${randomUUID()}`
    const lowSlug = `promo-low-${randomUUID()}`
    const futureSlug = `promo-future-${randomUUID()}`
    const high = definitionFor(highSlug, { priority: 20 })
    const low = definitionFor(lowSlug, { priority: 10 })
    const future = definitionFor(futureSlug, {
      priority: 100,
      promotionStartsAt: '2026-09-20T00:00:00.000Z',
    })
    await insertPublishedCampaign(execute, high)
    await insertPublishedCampaign(execute, low)
    await insertPublishedCampaign(execute, future)
    const asOf = new Date('2026-09-13T10:00:00.000Z')

    const anonymous = await listCampaignPromotions({
      slot: 'site_header',
      asOf,
      executor: execute,
    })
    assert.equal(anonymous.ok, true)
    assert.deepEqual(
      anonymous.promotions.map(item => item.campaignSlug),
      [highSlug, lowSlug],
    )
    assert.equal(anonymous.promotions[0].content.locales.en.ctaLabel, 'Join')
    assert.equal(anonymous.promotions[0].targetPath, `/campaign/${highSlug}`)

    const dismissed = await dismissCampaignPromotionInTransaction(client, {
      slug: highSlug,
      promotionId: 'header-main',
      userId,
      asOf,
    })
    assert.deepEqual(dismissed, {
      ok: true,
      dismissed: true,
      dismissUntil: '2026-09-13T11:00:00.000Z',
    })

    const personalized = await listCampaignPromotions({
      slot: 'site_header',
      userId,
      asOf: new Date('2026-09-13T10:30:00.000Z'),
      executor: execute,
    })
    assert.deepEqual(personalized.promotions.map(item => item.campaignSlug), [lowSlug])

    const anonymousStillSees = await listCampaignPromotions({
      slot: 'site_header',
      asOf: new Date('2026-09-13T10:30:00.000Z'),
      executor: execute,
    })
    assert.deepEqual(anonymousStillSees.promotions.map(item => item.campaignSlug), [highSlug, lowSlug])

    const reset = await resetCampaignPromotionDismissalInTransaction(client, {
      slug: highSlug,
      promotionId: 'header-main',
      userId,
      asOf: new Date('2026-09-13T10:30:00.000Z'),
    })
    assert.deepEqual(reset, { ok: true, dismissed: false, dismissUntil: null })

    const visibleAgain = await listCampaignPromotions({
      slot: 'site_header',
      userId,
      asOf: new Date('2026-09-13T10:31:00.000Z'),
      executor: execute,
    })
    assert.deepEqual(visibleAgain.promotions.map(item => item.campaignSlug), [highSlug, lowSlug])
  })
})

test('session/device dismissal is intentionally local and cannot create server user state', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const userId = await insertUser(execute)
    const slug = `promo-local-${randomUUID()}`
    const definition = definitionFor(slug, {
      dismiss: { enabled: true, persistence: 'session' },
    })
    await insertPublishedCampaign(execute, definition)

    const result = await dismissCampaignPromotionInTransaction(client, {
      slug,
      promotionId: 'header-main',
      userId,
      asOf: new Date('2026-09-13T10:00:00.000Z'),
    })
    assert.deepEqual(result, { ok: false, code: 'CAMPAIGN_PROMOTION_LOCAL_DISMISSAL' })

    const states = await execute(
      `SELECT COUNT(*)::int AS count FROM campaign_promotion_user_states WHERE user_id = $1`,
      [userId],
    )
    assert.equal(states.rows[0].count, 0)
  })
})
