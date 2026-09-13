import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import { reserveCampaignAttemptInTransaction } from './campaignAttempts.mjs'
import { submitCampaignActionInTransaction } from './campaignActions.mjs'
import { validateCustomGameDefinition } from './campaignCustomGame.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_CE42_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      const execute = client.query.bind(client)
      await work({ client, execute })
      const error = new Error('rollback CE4.2 fixture')
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
    [id, `campaign-ce42-${id}@example.test`],
  )
  return id
}

function definitionFor(slug) {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug, internalName: `${slug}-ce42` },
    objective: { type: 'engagement', primaryKpi: 'ce42-test' },
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
      content: { en: { title: 'CE4.2 test' } },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [{
      id: 'game',
      type: 'custom_game',
      config: {
        public: {},
        private: {
          verifier: {
            key: 'exact_answer_v1',
            caseSensitive: false,
            trim: true,
            challenges: [{
              id: 'orbit',
              prompt: { en: 'Type ORBIT' },
              acceptedAnswers: ['orbit'],
            }],
          },
        },
      },
      attemptPolicy: { maxAttempts: 1, period: 'campaign' },
    }],
    completion: {
      type: 'condition',
      condition: { source: 'mechanic_outcome', mechanicId: 'game', outcome: 'win' },
    },
    rewards: [{
      id: 'game-win-5',
      type: 'goin',
      amount: 5,
      trigger: { type: 'campaign_completion' },
      perUserLimit: 1,
      expiresAfterSeconds: 3600,
    }],
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
     VALUES ($1,$2,$3,$4::jsonb,1,$5,$5)`,
    [campaignId, definition.identity.slug, definition.identity.internalName, JSON.stringify(definition), actorUserId],
  )
  await execute(
    `INSERT INTO campaign_versions
       (id,campaign_id,version_number,schema_version,definition,definition_hash,publish_idempotency_key,published_by)
     VALUES ($1,$2,1,'campaign.v1',$3::jsonb,$4,$5,$6)`,
    [versionId, campaignId, JSON.stringify(definition), 'd'.repeat(64), `ce42:${versionId}`, actorUserId],
  )
  await execute(`UPDATE campaigns SET current_published_version_id=$2 WHERE id=$1`, [campaignId, versionId])
  await execute(
    `INSERT INTO campaign_participations
       (id,campaign_id,campaign_version_id,user_id,status,started_at,updated_at)
     VALUES ($1,$2,$3,$4,'started','2026-09-13T00:00:00.000Z','2026-09-13T00:00:00.000Z')`,
    [participationId, campaignId, versionId, userId],
  )
  return { userId, campaignId, versionId, participationId }
}

test('custom game definition requires a private registered verifier contract', () => {
  const mechanic = definitionFor('ce42-validation').mechanics[0]
  assert.deepEqual(validateCustomGameDefinition(mechanic), [])
  const broken = structuredClone(mechanic)
  delete broken.config.private.verifier.challenges[0].acceptedAnswers
  assert.ok(validateCustomGameDefinition(broken).some(item => item.code === 'CAMPAIGN_CUSTOM_GAME_ANSWERS_INVALID'))
})

test('custom game attempt exposes only public challenge context', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = definitionFor(`ce42-context-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const result = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:game:one',
      asOf: new Date('2026-09-13T10:00:00.000Z'),
    })
    assert.equal(result.ok, true)
    assert.equal(result.attempt.publicContext.kind, 'exact_answer_v1')
    assert.equal(result.attempt.publicContext.challenge.id, 'orbit')
    assert.equal(result.attempt.publicContext.challenge.prompt.en, 'Type ORBIT')
    assert.equal('acceptedAnswers' in result.attempt.publicContext.challenge, false)

    const stored = await execute(`SELECT private_context AS "privateContext" FROM campaign_attempts WHERE id=$1`, [result.attempt.id])
    assert.ok(Array.isArray(stored.rows[0].privateContext.verifier.acceptedAnswerHashes))
    assert.equal(stored.rows[0].privateContext.verifier.acceptedAnswers, undefined)
  })
})

test('server verifies custom game win, persists trusted outcome, completes campaign, and grants Goin once', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const base = new Date()
    const definition = definitionFor(`ce42-win-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const reserved = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:win',
      asOf: base,
    })
    const started = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      action: 'attempt_started',
      idempotencyKey: 'action:start:win',
      payload: {},
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(base.getTime() + 1000),
    })
    assert.equal(started.result.attempt.status, 'started')

    const input = {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      action: 'game_finished',
      idempotencyKey: 'action:finish:win',
      payload: { answer: ' ORBIT ' },
      evidence: { attemptId: reserved.attempt.id },
      asOf: new Date(base.getTime() + 2000),
    }
    const finished = await submitCampaignActionInTransaction(client, input)
    assert.equal(finished.ok, true)
    assert.equal(finished.result.attempt.status, 'resolved')
    assert.deepEqual(finished.result.attempt.outcome, { key: 'win' })
    assert.ok(finished.result.effects.some(effect => effect.type === 'game_won'))
    assert.ok(finished.result.effects.some(effect => effect.type === 'campaign_completed'))
    assert.ok(finished.result.effects.some(effect => effect.type === 'reward_granted'))

    const retry = await submitCampaignActionInTransaction(client, input)
    assert.equal(retry.ok, true)
    assert.equal(retry.duplicate, true)
    assert.deepEqual(retry.result.effects, [])

    const counts = await execute(
      `SELECT
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id=$1 AND event_name='game_won')::int AS wins,
         (SELECT COUNT(*) FROM campaign_events WHERE participation_id=$1 AND event_name='attempt_resolved')::int AS resolved,
         (SELECT COUNT(*) FROM campaign_reward_grants WHERE participation_id=$1 AND status='granted')::int AS grants,
         (SELECT COUNT(*) FROM user_economy_events WHERE user_id=$2 AND event_type='campaign_reward_issued')::int AS economy`,
      [fixture.participationId, fixture.userId],
    )
    assert.deepEqual(counts.rows[0], { wins: 1, resolved: 1, grants: 1, economy: 1 })
  })
})

test('wrong custom game answer resolves lose and cannot create trusted win/reward', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const definition = definitionFor(`ce42-lose-${randomUUID()}`.slice(0, 80))
    const fixture = await insertRuntimeFixture(execute, definition)
    const reserved = await reserveCampaignAttemptInTransaction(client, {
      slug: definition.identity.slug,
      userId: fixture.userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:lose',
      asOf: new Date('2026-09-13T10:00:00.000Z'),
    })
    await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug, userId: fixture.userId, mechanicId: 'game', action: 'attempt_started',
      idempotencyKey: 'action:start:lose', payload: {}, evidence: { attemptId: reserved.attempt.id },
      asOf: new Date('2026-09-13T10:01:00.000Z'),
    })
    const finished = await submitCampaignActionInTransaction(client, {
      slug: definition.identity.slug, userId: fixture.userId, mechanicId: 'game', action: 'game_finished',
      idempotencyKey: 'action:finish:lose', payload: { answer: 'wrong' }, evidence: { attemptId: reserved.attempt.id },
      asOf: new Date('2026-09-13T10:02:00.000Z'),
    })
    assert.equal(finished.ok, true)
    assert.deepEqual(finished.result.attempt.outcome, { key: 'lose' })
    assert.equal(finished.result.effects.some(effect => effect.type === 'game_won'), false)
    assert.equal(finished.result.effects.some(effect => effect.type === 'reward_granted'), false)
  })
})
