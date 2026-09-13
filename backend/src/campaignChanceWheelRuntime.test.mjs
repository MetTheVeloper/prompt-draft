import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import { reserveCampaignAttemptInTransaction } from './campaignAttempts.mjs'
import { submitCampaignActionInTransaction } from './campaignActions.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_CE43_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      const execute = client.query.bind(client)
      await work({ client, execute })
      const error = new Error('rollback CE4.3 fixture')
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
    `INSERT INTO users (id,email,password_hash) VALUES ($1,$2,'test-only')`,
    [id, `campaign-ce43-${id}@example.test`],
  )
  return id
}

function wheelDefinition(slug, {
  maxAttempts = 2,
  period = 'campaign',
  timezone = undefined,
  rewardBudget = 5,
  reward = true,
} = {}) {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug, internalName: `${slug}-ce43` },
    objective: { type: 'engagement', primaryKpi: 'ce43-test' },
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
      locales: ['en'],
      defaultLocale: 'en',
      content: { en: { title: 'CE4.3 wheel runtime test' } },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [{
      id: 'wheel',
      type: 'chance_wheel',
      config: {
        public: {
          segments: [{ key: 'goin_5', label: { en: '5 Goin' } }],
        },
        private: {
          weights: { goin_5: 1 },
        },
      },
      attemptPolicy: {
        maxAttempts,
        period,
        ...(timezone ? { timezone } : {}),
      },
    }],
    completion: null,
    rewards: reward ? [{
      id: 'wheel-goin-5',
      type: 'goin',
      amount: 5,
      trigger: { type: 'mechanic_outcome', mechanicId: 'wheel', outcome: 'goin_5' },
      budget: { maxAmount: rewardBudget },
      expiresAfterSeconds: 3600,
    }] : [],
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
       (id,slug,internal_name,draft_definition,draft_revision,created_by,updated_by)
     VALUES ($1,$2,$3,$4::jsonb,1,$5,$5)`,
    [campaignId, definition.identity.slug, definition.identity.internalName, JSON.stringify(definition), actorUserId],
  )
  await execute(
    `INSERT INTO campaign_versions
       (id,campaign_id,version_number,schema_version,definition,definition_hash,publish_idempotency_key,published_by)
     VALUES ($1,$2,1,'campaign.v1',$3::jsonb,$4,$5,$6)`,
    [versionId, campaignId, JSON.stringify(definition), 'f'.repeat(64), `ce43:${versionId}`, actorUserId],
  )
  await execute(`UPDATE campaigns SET current_published_version_id=$2 WHERE id=$1`, [campaignId, versionId])
  await execute(
    `INSERT INTO campaign_participations
       (id,campaign_id,campaign_version_id,user_id,status,started_at,updated_at)
     VALUES ($1,$2,$3,$4,'started','2026-09-13T00:00:00.000Z','2026-09-13T00:00:00.000Z')`,
    [participationId, campaignId, versionId, userId],
  )

  for (const reward of definition.rewards) {
    if (!reward.budget) continue
    await execute(
      `INSERT INTO campaign_reward_budgets
         (campaign_version_id,reward_definition_id,max_amount,committed_amount,granted_amount,grant_count)
       VALUES ($1,$2,$3,0,0,0)`,
      [versionId, reward.id, reward.budget.maxAmount],
    )
  }

  return { userId, campaignId, versionId, participationId }
}

test('server resolves wheel outcome, persists it, grants matching Goin once, and keeps retry idempotent', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const now = new Date()
    const definition = wheelDefinition(`ce43-spin-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)

    const reserved = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      idempotencyKey: 'wheel:attempt:one',
      asOf: now,
    })
    assert.equal(reserved.ok, true)
    assert.equal(reserved.attempt.status, 'reserved')

    const input = {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      action: 'spin_requested',
      idempotencyKey: 'wheel:spin:one',
      payload: {},
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(now.getTime() + 1000),
    }
    const spun = await submitCampaignActionInTransaction(client, input)
    assert.equal(spun.ok, true)
    assert.equal(spun.result.attempt.status, 'resolved')
    assert.deepEqual(spun.result.attempt.outcome, { key: 'goin_5' })
    assert.equal(spun.result.participation.status, 'in_progress')
    assert.ok(spun.result.effects.some(effect => effect.type === 'wheel_resolved'))
    assert.ok(spun.result.effects.some(effect => effect.type === 'reward_granted'))

    const retry = await submitCampaignActionInTransaction(client, input)
    assert.equal(retry.ok, true)
    assert.equal(retry.duplicate, true)
    assert.deepEqual(retry.result.attempt.outcome, { key: 'goin_5' })
    assert.deepEqual(retry.result.effects, [])

    const counts = await execute(
      `SELECT
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id=$1 AND event_name='wheel_resolved')::int AS wheels,
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id=$1 AND event_name='reward_granted')::int AS reward_events,
         (SELECT COUNT(*) FROM campaign_reward_grants WHERE participation_id=$1 AND status='granted')::int AS grants,
         (SELECT COUNT(*) FROM user_economy_events WHERE user_id=$2 AND event_type='campaign_reward_issued')::int AS economy`,
      [fixture.participationId, fixture.userId],
    )
    assert.deepEqual(counts.rows[0], { wheels: 1, reward_events: 1, grants: 1, economy: 1 })

    const grant = await execute(
      `SELECT qualification_key AS "qualificationKey", qualification
       FROM campaign_reward_grants
       WHERE participation_id=$1 LIMIT 1`,
      [fixture.participationId],
    )
    assert.equal(grant.rows[0].qualificationKey, `mechanic_outcome:wheel:${reserved.attempt.id}`)
    assert.deepEqual(grant.rows[0].qualification, {
      trigger: 'mechanic_outcome',
      mechanicId: 'wheel',
      outcome: 'goin_5',
      attemptId: reserved.attempt.id,
    })

    const credit = await execute(
      `SELECT expires_at AS "expiresAt" FROM user_economy_events
       WHERE user_id=$1 AND event_type='campaign_reward_issued' LIMIT 1`,
      [fixture.userId],
    )
    assert.ok(credit.rows[0].expiresAt)
  })
})

test('browser cannot choose wheel outcome and a resolved attempt cannot be spun through a new action', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const now = new Date('2026-09-13T10:00:00.000Z')
    const definition = wheelDefinition(`ce43-authority-${randomUUID()}`.slice(0, 80), { reward: false })
    const fixture = await insertRuntimeFixture(execute, definition)
    const reserved = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      idempotencyKey: 'wheel:attempt:authority',
      asOf: now,
    })

    const forged = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      action: 'spin_requested',
      idempotencyKey: 'wheel:spin:forged',
      payload: { outcome: 'goin_5' },
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(now.getTime() + 1000),
    })
    assert.deepEqual(forged, { ok: false, code: 'CAMPAIGN_ACTION_SCHEMA_INVALID', duplicate: false })

    const storedBefore = await execute(`SELECT status, outcome FROM campaign_attempts WHERE id=$1`, [reserved.attempt.id])
    assert.equal(storedBefore.rows[0].status, 'reserved')
    assert.equal(storedBefore.rows[0].outcome, null)

    const valid = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      action: 'spin_requested',
      idempotencyKey: 'wheel:spin:valid',
      payload: {},
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(now.getTime() + 2000),
    })
    assert.equal(valid.ok, true)

    const replayWithNewIdentity = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      action: 'spin_requested',
      idempotencyKey: 'wheel:spin:new-key',
      payload: {},
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(now.getTime() + 3000),
    })
    assert.deepEqual(replayWithNewIdentity, { ok: false, code: 'CAMPAIGN_ATTEMPT_STATE_INVALID', duplicate: false })
  })
})

test('budget exhaustion records a failed qualification without a second Economy credit', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const now = new Date()
    const definition = wheelDefinition(`ce43-budget-${randomUUID()}`.slice(0, 80), {
      maxAttempts: 2,
      rewardBudget: 5,
    })
    const fixture = await insertRuntimeFixture(execute, definition)

    for (let index = 1; index <= 2; index += 1) {
      const reserved = await reserveCampaignAttemptInTransaction(client, {
        slug: definition.identity.slug,
        userId: fixture.userId,
        mechanicId: 'wheel',
        idempotencyKey: `wheel:attempt:budget:${index}`,
        asOf: new Date(now.getTime() + index * 1000),
      })
      assert.equal(reserved.ok, true)
      const spun = await submitCampaignActionInTransaction(client, {
        slug: definition.identity.slug,
        userId: fixture.userId,
        mechanicId: 'wheel',
        action: 'spin_requested',
        idempotencyKey: `wheel:spin:budget:${index}`,
        payload: {},
        evidence: { attemptId: reserved.attempt.id },
        asOf: new Date(now.getTime() + index * 1000 + 500),
      })
      assert.equal(spun.ok, true)
      if (index === 1) assert.ok(spun.result.effects.some(effect => effect.type === 'reward_granted'))
      else assert.ok(spun.result.effects.some(effect => effect.type === 'reward_failed'))
    }

    const grants = await execute(
      `SELECT status, failure_code AS "failureCode", qualification_key AS "qualificationKey"
       FROM campaign_reward_grants
       WHERE participation_id=$1
       ORDER BY created_at ASC`,
      [fixture.participationId],
    )
    assert.equal(grants.rows.length, 2)
    assert.equal(grants.rows[0].status, 'granted')
    assert.equal(grants.rows[1].status, 'failed')
    assert.equal(grants.rows[1].failureCode, 'CAMPAIGN_REWARD_EXHAUSTED')
    assert.notEqual(grants.rows[0].qualificationKey, grants.rows[1].qualificationKey)

    const economy = await execute(
      `SELECT COUNT(*)::int AS count FROM user_economy_events
       WHERE user_id=$1 AND event_type='campaign_reward_issued'`,
      [fixture.userId],
    )
    assert.equal(economy.rows[0].count, 1)

    const budget = await execute(
      `SELECT committed_amount AS "committedAmount", granted_amount AS "grantedAmount", grant_count AS "grantCount"
       FROM campaign_reward_budgets
       WHERE campaign_version_id=$1 AND reward_definition_id='wheel-goin-5'`,
      [fixture.versionId],
    )
    assert.deepEqual(budget.rows[0], { committedAmount: '5', grantedAmount: '5', grantCount: '1' })
  })
})

test('calendar-day attempt policy blocks a second wheel attempt until the configured next day', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = wheelDefinition(`ce43-daily-${randomUUID()}`.slice(0, 80), {
      maxAttempts: 1,
      period: 'calendar_day',
      timezone: 'Asia/Tehran',
      reward: false,
    })
    const fixture = await insertRuntimeFixture(execute, definition)
    const firstAt = new Date('2026-09-13T10:00:00.000Z')

    const first = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      idempotencyKey: 'wheel:daily:first',
      asOf: firstAt,
    })
    assert.equal(first.ok, true)

    const spun = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      action: 'spin_requested',
      idempotencyKey: 'wheel:daily:spin',
      payload: {},
      evidence: { attemptId: first.attempt.id },
      asOf: new Date('2026-09-13T10:01:00.000Z'),
    })
    assert.equal(spun.ok, true)

    const blocked = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      idempotencyKey: 'wheel:daily:blocked',
      asOf: new Date('2026-09-13T10:02:00.000Z'),
    })
    assert.equal(blocked.ok, false)
    assert.equal(blocked.code, 'CAMPAIGN_ATTEMPT_LIMIT_REACHED')
    assert.ok(blocked.nextEligibleAt)

    const nextDay = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'wheel',
      idempotencyKey: 'wheel:daily:next',
      asOf: new Date('2026-09-14T10:02:00.000Z'),
    })
    assert.equal(nextDay.ok, true)
    assert.equal(nextDay.attempt.attemptIndex, 1)
  })
})
