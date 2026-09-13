import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import {
  getAttemptPeriodDescriptor,
  reserveCampaignAttemptInTransaction,
} from './campaignAttempts.mjs'
import {
  readCampaignMechanicStates,
  submitCampaignActionInTransaction,
} from './campaignActions.mjs'
import { validateCampaignRuntimeDefinition } from './campaignRuntimeDefinition.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_CE22_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      const execute = client.query.bind(client)
      await work({ client, execute })
      const error = new Error('rollback CE2.2 fixture')
      error.code = ROLLBACK_CODE
      throw error
    })
  } catch (error) {
    if (error?.code === ROLLBACK_CODE) return
    throw error
  }
}

async function insertUser(execute) {
  const id = randomUUID()
  await execute(
    `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'test-only')`,
    [id, `campaign-ce22-${id}@example.test`],
  )
  return id
}

function definitionFor(slug, { maxAttempts = 1, period = 'calendar_day', timezone = 'UTC' } = {}) {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug, internalName: `${slug}-ce22` },
    objective: { type: 'engagement', primaryKpi: 'ce22-test' },
    lifecycle: {
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-10-01T00:00:00.000Z',
      timezone: 'UTC',
      participationAfterEnd: 'allow_existing_only',
      rewardSettlement: 'immediate',
    },
    eligibility: { authenticated: true },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      locales: ['en'],
      defaultLocale: 'en',
      content: { en: { title: 'CE2.2 test' } },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [{
      id: 'game',
      type: 'custom_game',
      config: { public: {} },
      attemptPolicy: {
        maxAttempts,
        period,
        ...(period === 'calendar_day' ? { timezone } : {}),
      },
    }],
    completion: null,
    rewards: [],
    limits: {},
    analytics: {},
  }
}

async function insertRuntimeFixture(execute, definition) {
  const actorUserId = await insertUser(execute)
  const userId = await insertUser(execute)
  const campaignId = randomUUID()
  const versionId = randomUUID()
  const participationId = randomUUID()
  await execute(
    `INSERT INTO campaigns
       (id, slug, internal_name, draft_definition, draft_revision, created_by, updated_by)
     VALUES ($1, $2, $3, $4::jsonb, 1, $5, $5)`,
    [campaignId, definition.identity.slug, definition.identity.internalName, JSON.stringify(definition), actorUserId],
  )
  await execute(
    `INSERT INTO campaign_versions
       (id, campaign_id, version_number, schema_version, definition, definition_hash,
        publish_idempotency_key, published_by)
     VALUES ($1, $2, 1, 'campaign.v1', $3::jsonb, $4, $5, $6)`,
    [versionId, campaignId, JSON.stringify(definition), 'c'.repeat(64), `ce22:${versionId}`, actorUserId],
  )
  await execute(`UPDATE campaigns SET current_published_version_id = $2 WHERE id = $1`, [campaignId, versionId])
  await execute(
    `INSERT INTO campaign_participations
       (id, campaign_id, campaign_version_id, user_id, status, started_at, updated_at)
     VALUES ($1, $2, $3, $4, 'started', '2026-09-13T00:00:00.000Z', '2026-09-13T00:00:00.000Z')`,
    [participationId, campaignId, versionId, userId],
  )
  return { userId, campaignId, versionId, participationId }
}

test('calendar-day attempt period is derived in the configured timezone', () => {
  const descriptor = getAttemptPeriodDescriptor({
    policy: { maxAttempts: 1, period: 'calendar_day', timezone: 'Asia/Tehran' },
    runtime: { campaignVersionId: 'version' },
    asOf: new Date('2026-09-13T20:45:00.000Z'),
  })
  assert.equal(descriptor.ok, true)
  assert.equal(descriptor.periodKey, 'calendar:Asia/Tehran:2026-09-14')
  assert.equal(descriptor.nextEligibleAt, '2026-09-14T20:30:00.000Z')
})

test('runtime definition validates attempt limits, periods, timezone, and path-safe mechanic ids', () => {
  const definition = definitionFor('attempt-validation', { maxAttempts: 0, timezone: 'Not/AZone' })
  definition.mechanics[0].id = 'bad mechanic id'
  const result = validateCampaignRuntimeDefinition(definition)
  assert.ok(result.errors.some(item => item.code === 'CAMPAIGN_MECHANIC_ID_INVALID'))
  assert.ok(result.errors.some(item => item.code === 'CAMPAIGN_ATTEMPT_MAX_INVALID'))
  assert.ok(result.errors.some(item => item.code === 'CAMPAIGN_TIMEZONE_INVALID'))
})

test('attempt reservation is idempotent and enforces the server period limit', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = definitionFor(`attempt-limit-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const input = {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:first',
      asOf: new Date('2026-09-13T10:00:00.000Z'),
    }
    const first = await reserveCampaignAttemptInTransaction(client, input)
    assert.equal(first.ok, true)
    assert.equal(first.duplicate, false)
    assert.equal(first.attempt.status, 'reserved')

    const retry = await reserveCampaignAttemptInTransaction(client, input)
    assert.equal(retry.ok, true)
    assert.equal(retry.duplicate, true)
    assert.equal(retry.attempt.id, first.attempt.id)

    const limited = await reserveCampaignAttemptInTransaction(client, {
      ...input,
      idempotencyKey: 'attempt:second',
    })
    assert.equal(limited.ok, false)
    assert.equal(limited.code, 'CAMPAIGN_ATTEMPT_LIMIT_REACHED')
    assert.equal(limited.nextEligibleAt, '2026-09-14T00:00:00.000Z')

    const counts = await execute(
      `SELECT
         (SELECT COUNT(*) FROM campaign_attempts WHERE participation_id = $1)::int AS attempts,
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id = $1 AND event_name = 'attempt_created')::int AS events`,
      [fixture.participationId],
    )
    assert.deepEqual(counts.rows[0], { attempts: 1, events: 1 })
  })
})

test('attempt_started action is audited, state-reduced, event-linked, retry-safe, and conflict-safe', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = definitionFor(`action-start-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const attempt = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:one',
      asOf: new Date('2026-09-13T10:00:00.000Z'),
    })
    const input = {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      action: 'attempt_started',
      idempotencyKey: 'action:start:one',
      payload: {},
      evidence: { attemptId: attempt.attempt.id },
      asOf: new Date('2026-09-13T10:01:00.000Z'),
    }
    const first = await submitCampaignActionInTransaction(client, input)
    assert.equal(first.ok, true)
    assert.equal(first.accepted, true)
    assert.equal(first.duplicate, false)
    assert.equal(first.result.attempt.status, 'started')
    assert.equal(first.result.mechanicState.state.lastAttemptId, attempt.attempt.id)
    assert.ok(first.result.mechanicState.revision >= 2)
    assert.deepEqual(first.result.effects, [{ type: 'attempt_started', attemptId: attempt.attempt.id }])

    const retry = await submitCampaignActionInTransaction(client, input)
    assert.equal(retry.ok, true)
    assert.equal(retry.duplicate, true)
    assert.deepEqual(retry.result.effects, [])

    const conflict = await submitCampaignActionInTransaction(client, { ...input, payload: { changed: true } })
    assert.equal(conflict.ok, false)
    assert.equal(conflict.code, 'CAMPAIGN_IDEMPOTENCY_CONFLICT')

    const states = await readCampaignMechanicStates(execute, {
      id: fixture.participationId,
      definition,
    })
    assert.equal(states[0].state.lastAction, 'attempt_started')

    const counts = await execute(
      `SELECT
         (SELECT COUNT(*) FROM campaign_actions WHERE participation_id = $1 AND accepted = TRUE)::int AS actions,
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id = $1 AND event_name = 'attempt_started')::int AS events`,
      [fixture.participationId],
    )
    assert.deepEqual(counts.rows[0], { actions: 1, events: 1 })
  })
})

test('unsupported client actions are persisted as rejected and produce no trusted success event', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = definitionFor(`action-reject-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const result = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      action: 'game_finished',
      idempotencyKey: 'action:unsafe-finish',
      payload: { won: true, rewardAmount: 9999 },
      evidence: {},
      asOf: new Date('2026-09-13T10:01:00.000Z'),
    })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'CAMPAIGN_ACTION_UNSUPPORTED')

    const audit = await execute(
      `SELECT accepted, rejection_code AS "rejectionCode" FROM campaign_actions
       WHERE participation_id = $1 AND idempotency_key = 'action:unsafe-finish'`,
      [fixture.participationId],
    )
    assert.deepEqual(audit.rows[0], { accepted: false, rejectionCode: 'CAMPAIGN_ACTION_UNSUPPORTED' })
    const successEvents = await execute(
      `SELECT COUNT(*)::int AS count FROM campaign_events
       WHERE participation_id = $1 AND event_name IN ('game_won','attempt_resolved','reward_granted')`,
      [fixture.participationId],
    )
    assert.equal(successEvents.rows[0].count, 0)
  })
})
