import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import {
  readCampaignAttemptAvailability,
  reserveCampaignAttemptInTransaction,
} from './campaignAttempts.mjs'
import { submitCampaignActionInTransaction } from './campaignActions.mjs'
import { loadParticipationRuntime } from './campaignRuntimeShared.mjs'

const ROLLBACK_CODE = 'CAMPAIGN_CE42_TERMINAL_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async client => {
      const execute = client.query.bind(client)
      await work({ client, execute })
      const error = new Error('rollback CE4.2 terminal fixture')
      error.code = ROLLBACK_CODE
      throw error
    })
  } catch (error) {
    if (error?.code === ROLLBACK_CODE) return
    throw error
  }
}

test('rewarded participation exposes no attempts and rejects new mechanic progress', async () => {
  await withRollbackFixture(async ({ client, execute }) => {
    const userId = randomUUID()
    const campaignId = randomUUID()
    const versionId = randomUUID()
    const participationId = randomUUID()
    const slug = `ce42-terminal-${randomUUID()}`.slice(0, 80)
    const definition = {
      schemaVersion: 'campaign.v1',
      identity: { slug, internalName: 'CE4.2 terminal attempt test' },
      lifecycle: {
        startsAt: '2026-09-01T00:00:00.000Z',
        endsAt: '2026-10-01T00:00:00.000Z',
        timezone: 'UTC',
        participationAfterEnd: 'deny',
        rewardSettlement: 'immediate',
      },
      mechanics: [{
        id: 'game',
        type: 'task_list',
        attemptPolicy: { maxAttempts: 2, period: 'campaign' },
      }],
      rewards: [],
    }

    await execute(
      `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'test-only')`,
      [userId, `campaign-ce42-terminal-${userId}@example.test`],
    )
    await execute(
      `INSERT INTO campaigns (id, slug, internal_name) VALUES ($1, $2, $3)`,
      [campaignId, slug, 'CE4.2 terminal attempt test'],
    )
    await execute(
      `INSERT INTO campaign_versions
         (id, campaign_id, version_number, schema_version, definition, definition_hash, publish_idempotency_key)
       VALUES ($1, $2, 1, 'campaign.v1', $3::jsonb, $4, $5)`,
      [versionId, campaignId, JSON.stringify(definition), 'e'.repeat(64), `ce42-terminal:${versionId}`],
    )
    await execute(`UPDATE campaigns SET current_published_version_id = $2 WHERE id = $1`, [campaignId, versionId])
    await execute(
      `INSERT INTO campaign_participations
         (id, campaign_id, campaign_version_id, user_id, status, started_at, completed_at, qualified_at, rewarded_at, updated_at)
       VALUES ($1, $2, $3, $4, 'rewarded', $5, $6, $6, $6, $6)`,
      [participationId, campaignId, versionId, userId, '2026-09-13T09:00:00.000Z', '2026-09-13T10:00:00.000Z'],
    )

    const runtime = await loadParticipationRuntime(participationId, execute)
    const availability = await readCampaignAttemptAvailability({
      runtime,
      asOf: new Date('2026-09-13T10:05:00.000Z'),
      executor: execute,
    })
    assert.equal(availability.length, 1)
    assert.equal(availability[0].available, false)
    assert.equal(availability[0].remainingAttempts, 0)
    assert.equal(availability[0].reasonCode, 'CAMPAIGN_PARTICIPATION_CLOSED')

    const reservation = await reserveCampaignAttemptInTransaction(client, {
      slug,
      userId,
      mechanicId: 'game',
      idempotencyKey: 'attempt:after-reward',
      asOf: new Date('2026-09-13T10:05:00.000Z'),
    })
    assert.deepEqual(reservation, { ok: false, code: 'CAMPAIGN_PARTICIPATION_CLOSED' })

    const attemptId = randomUUID()
    await execute(
      `INSERT INTO campaign_attempts
         (id, participation_id, mechanic_id, period_key, attempt_index, status, idempotency_key, created_at)
       VALUES ($1, $2, 'game', $3, 1, 'reserved', 'seed:reserved-before-completion', $4)`,
      [attemptId, participationId, `campaign:${versionId}`, '2026-09-13T09:30:00.000Z'],
    )
    const action = await submitCampaignActionInTransaction(client, {
      slug,
      userId,
      mechanicId: 'game',
      action: 'attempt_started',
      idempotencyKey: 'action:after-reward',
      payload: {},
      evidence: { attemptId },
      asOf: new Date('2026-09-13T10:05:00.000Z'),
    })
    assert.deepEqual(action, { ok: false, code: 'CAMPAIGN_PARTICIPATION_CLOSED' })
  })
})
