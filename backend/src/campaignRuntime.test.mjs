import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import { publishCampaign } from './campaigns.mjs'
import {
  buildPublicCampaignProjection,
  deriveCampaignEffectiveStatus,
  refreshCampaignParticipationInTransaction,
} from './campaignRuntime.mjs'
import { validateCampaignRuntimeDefinition } from './campaignRuntimeDefinition.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_RUNTIME_TEST_ROLLBACK'

function definitionFor({ slug, startsAt, endsAt, amount = 7, budget = 7, expiresAfterSeconds = 3600 } = {}) {
  return {
    schemaVersion: 'campaign.v1',
    identity: { slug, internalName: `${slug}-runtime-test` },
    objective: { type: 'engagement', primaryKpi: 'runtime-test' },
    lifecycle: {
      startsAt,
      endsAt,
      timezone: 'UTC',
      participationAfterEnd: 'allow_existing_only',
      rewardSettlement: 'immediate',
    },
    eligibility: { authenticated: true },
    experience: {
      renderer: { kind: 'builtin', key: 'campaign-default-v1' },
      locales: ['en'],
      defaultLocale: 'en',
      content: { en: { title: 'Runtime test' } },
      seo: { indexing: 'noindex' },
    },
    promotions: [],
    mechanics: [],
    completion: {
      type: 'condition',
      condition: {
        source: 'metric',
        metricKey: 'prompts.unlocked.count',
        operator: 'gte',
        value: 1,
        window: 'lifetime',
      },
    },
    rewards: [{
      id: 'completion-goin',
      type: 'goin',
      amount,
      trigger: { type: 'campaign_completion' },
      perUserLimit: 1,
      ...(budget == null ? {} : { budget: { maxAmount: budget } }),
      ...(expiresAfterSeconds == null ? {} : { expiresAfterSeconds }),
    }],
    limits: {},
    analytics: {},
  }
}

async function insertUser(execute) {
  const userId = randomUUID()
  await execute(
    `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'test-only')`,
    [userId, `campaign-runtime-${userId}@example.test`],
  )
  await execute('DELETE FROM user_economy_events WHERE user_id = $1', [userId])
  await execute('DELETE FROM user_score_events WHERE user_id = $1', [userId])
  return userId
}

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      const execute = client.query.bind(client)
      await work({ client, execute })
      const rollback = new Error('rollback campaign runtime fixture')
      rollback.code = ROLLBACK_CODE
      throw rollback
    })
  } catch (error) {
    if (error?.code === ROLLBACK_CODE) return
    throw error
  }
}

async function insertCampaignVersion({ execute, actorUserId, definition, versionNumber = 1, campaignId = randomUUID() }) {
  const versionId = randomUUID()
  if (versionNumber === 1) {
    await execute(
      `
        INSERT INTO campaigns (
          id, slug, internal_name, draft_definition, draft_revision, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4::jsonb, 1, $5, $5)
      `,
      [
        campaignId,
        definition.identity.slug,
        definition.identity.internalName,
        JSON.stringify(definition),
        actorUserId,
      ],
    )
  }

  await execute(
    `
      INSERT INTO campaign_versions (
        id,
        campaign_id,
        version_number,
        schema_version,
        definition,
        definition_hash,
        publish_idempotency_key,
        published_by
      )
      VALUES ($1, $2, $3, 'campaign.v1', $4::jsonb, $5, $6, $7)
    `,
    [
      versionId,
      campaignId,
      versionNumber,
      JSON.stringify(definition),
      (versionNumber === 1 ? 'a' : 'b').repeat(64),
      `runtime-test-publish-${versionNumber}-${versionId}`,
      actorUserId,
    ],
  )

  if (definition.rewards[0]?.budget) {
    await execute(
      `
        INSERT INTO campaign_reward_budgets (
          campaign_version_id, reward_definition_id, max_amount
        )
        VALUES ($1, $2, $3)
      `,
      [versionId, definition.rewards[0].id, definition.rewards[0].budget.maxAmount],
    )
  }

  await execute(
    `UPDATE campaigns SET current_published_version_id = $2 WHERE id = $1`,
    [campaignId, versionId],
  )

  return { campaignId, versionId }
}

async function insertParticipation({ execute, campaignId, versionId, userId, startedAt }) {
  const participationId = randomUUID()
  await execute(
    `
      INSERT INTO campaign_participations (
        id, campaign_id, campaign_version_id, user_id, status, started_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'started', $5, $5)
    `,
    [participationId, campaignId, versionId, userId, startedAt],
  )
  return participationId
}

async function insertPromptUnlock(execute, userId, unlockedAt) {
  await execute(
    `
      INSERT INTO user_content_unlocks (
        id,
        user_id,
        resource_type,
        resource_id,
        price_goin,
        pricing_rule_version,
        unlocked_at
      )
      VALUES ($1, $2, 'prompt_archive_item', $3, 0, 1, $4)
    `,
    [randomUUID(), userId, `runtime-test-${randomUUID()}`, unlockedAt],
  )
}

test('effective lifecycle derives scheduled/active/paused/ended/archive without cron state', () => {
  const base = new Date('2026-09-13T10:00:00.000Z')
  const definition = {
    lifecycle: {
      startsAt: '2026-09-13T09:00:00.000Z',
      endsAt: '2026-09-13T11:00:00.000Z',
    },
  }
  assert.equal(deriveCampaignEffectiveStatus({ definition }, base), 'active')
  assert.equal(deriveCampaignEffectiveStatus({ definition }, new Date('2026-09-13T08:00:00Z')), 'scheduled')
  assert.equal(deriveCampaignEffectiveStatus({ definition }, new Date('2026-09-13T12:00:00Z')), 'ended')
  assert.equal(deriveCampaignEffectiveStatus({ definition, pausedAt: base }, base), 'paused')
  assert.equal(deriveCampaignEffectiveStatus({ definition, manuallyEndedAt: base }, base), 'ended')
  assert.equal(deriveCampaignEffectiveStatus({ definition, archivedAt: base }, base), 'archived')
})

test('public projection strips private mechanic config, objective metadata, and reward budget', () => {
  const definition = definitionFor({
    slug: 'projection-test',
    startsAt: '2026-09-13T09:00:00Z',
    endsAt: '2026-09-14T09:00:00Z',
  })
  definition.objective.internalNotes = 'never public'
  definition.mechanics = [{
    id: 'goal',
    type: 'metric_goal',
    config: {
      public: { label: 'Visible' },
      private: { secret: 'hidden' },
    },
  }]

  const projection = buildPublicCampaignProjection({
    campaignId: randomUUID(),
    slug: definition.identity.slug,
    versionNumber: 1,
    schemaVersion: 'campaign.v1',
    definition,
    status: 'active',
  })

  assert.deepEqual(projection.mechanics[0].config, { public: { label: 'Visible' } })
  assert.equal('private' in projection.mechanics[0].config, false)
  assert.equal('objective' in projection, false)
  assert.equal('budget' in projection.rewards[0], false)
  assert.equal(projection.rewards[0].expiresAfterSeconds, 3600)
})

test('runtime reward validation allows unrelated client-reported UI but rejects client-reported reward authority', () => {
  const base = definitionFor({
    slug: 'trust-test',
    startsAt: '2026-09-13T09:00:00Z',
    endsAt: '2026-09-14T09:00:00Z',
  })
  base.mechanics = [{
    id: 'decorative-client-step',
    type: 'custom',
    config: { public: {} },
  }]
  assert.deepEqual(validateCampaignRuntimeDefinition(base).errors, [])

  base.completion = {
    type: 'condition',
    condition: {
      source: 'mechanic_outcome',
      mechanicId: 'decorative-client-step',
      outcome: 'done',
    },
  }
  assert.ok(
    validateCampaignRuntimeDefinition(base).errors
      .some(error => error.code === 'CAMPAIGN_CLIENT_REPORTED_REWARD_FORBIDDEN'),
  )
})

test('publish seeds reward budget in the same transaction', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const actorUserId = await insertUser(execute)
    const campaignId = randomUUID()
    const base = new Date()
    const definition = definitionFor({
      slug: `publish-budget-${campaignId}`.slice(0, 80),
      startsAt: new Date(base.getTime() - 60_000).toISOString(),
      endsAt: new Date(base.getTime() + 3_600_000).toISOString(),
      amount: 9,
      budget: 90,
    })

    await execute(
      `
        INSERT INTO campaigns (
          id, slug, internal_name, draft_definition, draft_revision, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4::jsonb, 1, $5, $5)
      `,
      [campaignId, definition.identity.slug, definition.identity.internalName, JSON.stringify(definition), actorUserId],
    )

    const published = await publishCampaign({
      id: campaignId,
      expectedDraftRevision: 1,
      idempotencyKey: `runtime-publish:${campaignId}`,
      actorUserId,
    }, {
      transactionRunner: work => work(client),
    })

    assert.equal(published.ok, true)
    assert.equal(published.duplicate, false)

    const budget = await execute(
      `
        SELECT max_amount AS "maxAmount", committed_amount AS "committedAmount"
        FROM campaign_reward_budgets
        WHERE campaign_version_id = $1
          AND reward_definition_id = 'completion-goin'
      `,
      [published.version.id],
    )
    assert.equal(Number(budget.rows[0].maxAmount), 90)
    assert.equal(Number(budget.rows[0].committedAmount), 0)
  })
})

test('metric completion grants one expiring Goin reward, locks to original version, and retry is idempotent', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const base = new Date()
    const actorUserId = await insertUser(execute)
    const userId = await insertUser(execute)
    const v1 = definitionFor({
      slug: `runtime-reward-${randomUUID()}`.slice(0, 80),
      startsAt: new Date(base.getTime() - 3_600_000).toISOString(),
      endsAt: new Date(base.getTime() + 3_600_000).toISOString(),
      amount: 7,
      budget: 7,
      expiresAfterSeconds: 3600,
    })
    const first = await insertCampaignVersion({ execute, actorUserId, definition: v1 })
    const participationId = await insertParticipation({
      execute,
      campaignId: first.campaignId,
      versionId: first.versionId,
      userId,
      startedAt: base.toISOString(),
    })
    await insertPromptUnlock(execute, userId, base.toISOString())

    const v2 = definitionFor({
      slug: v1.identity.slug,
      startsAt: v1.lifecycle.startsAt,
      endsAt: v1.lifecycle.endsAt,
      amount: 100,
      budget: 1000,
      expiresAfterSeconds: null,
    })
    await insertCampaignVersion({
      execute,
      actorUserId,
      definition: v2,
      versionNumber: 2,
      campaignId: first.campaignId,
    })

    const firstRefresh = await refreshCampaignParticipationInTransaction(client, {
      participationId,
      asOf: base,
    })
    assert.equal(firstRefresh.participation.status, 'rewarded')
    assert.equal(firstRefresh.campaign.version, 1)
    assert.equal(firstRefresh.effects.filter(effect => effect.type === 'reward_granted').length, 1)
    assert.equal(firstRefresh.effects.find(effect => effect.type === 'reward_granted').reward.amount, 7)

    const ledger = await execute(
      `
        SELECT id, unit_delta AS "unitDelta", expires_at AS "expiresAt"
        FROM user_economy_events
        WHERE user_id = $1
          AND event_type = 'campaign_reward_issued'
      `,
      [userId],
    )
    assert.equal(ledger.rows.length, 1)
    assert.equal(Number(ledger.rows[0].unitDelta), 7)
    assert.ok(ledger.rows[0].expiresAt instanceof Date)
    assert.ok(ledger.rows[0].expiresAt.getTime() >= base.getTime() + 3_599_000)

    const grant = await execute(
      `
        SELECT status, amount, economy_event_id AS "economyEventId"
        FROM campaign_reward_grants
        WHERE participation_id = $1
      `,
      [participationId],
    )
    assert.equal(grant.rows.length, 1)
    assert.equal(grant.rows[0].status, 'granted')
    assert.equal(Number(grant.rows[0].amount), 7)
    assert.equal(grant.rows[0].economyEventId, ledger.rows[0].id)

    const budget = await execute(
      `
        SELECT committed_amount AS "committedAmount", granted_amount AS "grantedAmount", grant_count AS "grantCount"
        FROM campaign_reward_budgets
        WHERE campaign_version_id = $1
          AND reward_definition_id = 'completion-goin'
      `,
      [first.versionId],
    )
    assert.equal(Number(budget.rows[0].committedAmount), 7)
    assert.equal(Number(budget.rows[0].grantedAmount), 7)
    assert.equal(Number(budget.rows[0].grantCount), 1)

    const retry = await refreshCampaignParticipationInTransaction(client, {
      participationId,
      asOf: new Date(base.getTime() + 1000),
    })
    assert.equal(retry.participation.status, 'rewarded')
    assert.deepEqual(retry.effects, [])

    const counts = await execute(
      `
        SELECT
          (SELECT COUNT(*) FROM campaign_reward_grants WHERE participation_id = $1)::int AS grants,
          (SELECT COUNT(*) FROM user_economy_events WHERE user_id = $2 AND event_type = 'campaign_reward_issued')::int AS economy_events,
          (SELECT COUNT(*) FROM campaign_events WHERE participation_id = $1 AND event_name = 'reward_granted')::int AS reward_events
      `,
      [participationId, userId],
    )
    assert.deepEqual(counts.rows[0], { grants: 1, economy_events: 1, reward_events: 1 })
  })
})

test('global reward budget exhaustion fails a later grant without issuing Goin', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const base = new Date()
    const actorUserId = await insertUser(execute)
    const definition = definitionFor({
      slug: `budget-exhaustion-${randomUUID()}`.slice(0, 80),
      startsAt: new Date(base.getTime() - 3_600_000).toISOString(),
      endsAt: new Date(base.getTime() + 3_600_000).toISOString(),
      amount: 5,
      budget: 5,
      expiresAfterSeconds: null,
    })
    const campaign = await insertCampaignVersion({ execute, actorUserId, definition })

    const firstUser = await insertUser(execute)
    const firstParticipation = await insertParticipation({
      execute,
      campaignId: campaign.campaignId,
      versionId: campaign.versionId,
      userId: firstUser,
      startedAt: base.toISOString(),
    })
    await insertPromptUnlock(execute, firstUser, base.toISOString())
    const first = await refreshCampaignParticipationInTransaction(client, {
      participationId: firstParticipation,
      asOf: base,
    })
    assert.equal(first.participation.status, 'rewarded')

    const secondUser = await insertUser(execute)
    const secondParticipation = await insertParticipation({
      execute,
      campaignId: campaign.campaignId,
      versionId: campaign.versionId,
      userId: secondUser,
      startedAt: base.toISOString(),
    })
    await insertPromptUnlock(execute, secondUser, base.toISOString())
    const second = await refreshCampaignParticipationInTransaction(client, {
      participationId: secondParticipation,
      asOf: base,
    })
    assert.equal(second.participation.status, 'reward_failed')
    assert.equal(
      second.effects.find(effect => effect.type === 'reward_failed').reward.failureCode,
      'CAMPAIGN_REWARD_EXHAUSTED',
    )

    const secondLedger = await execute(
      `
        SELECT COUNT(*)::int AS count
        FROM user_economy_events
        WHERE user_id = $1
          AND event_type = 'campaign_reward_issued'
      `,
      [secondUser],
    )
    assert.equal(secondLedger.rows[0].count, 0)
  })
})
