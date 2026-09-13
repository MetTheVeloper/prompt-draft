import { randomUUID } from 'node:crypto'
import { recordUserEconomyEventInTransaction } from './economyCore.mjs'
import { appendCampaignEvent } from './campaignRuntimeShared.mjs'

function rewardExpiry(reward, asOf) {
  if (!Number.isSafeInteger(reward.expiresAfterSeconds) || reward.expiresAfterSeconds <= 0) {
    return null
  }
  return new Date(asOf.getTime() + reward.expiresAfterSeconds * 1000).toISOString()
}

export async function settleCompletionRewards({ client, execute, runtime, asOf }) {
  const rewards = (runtime.definition.rewards ?? [])
    .filter(reward => reward?.trigger?.type === 'campaign_completion')
  if (rewards.length === 0) {
    return { results: [], economy: null }
  }

  await execute('SELECT id FROM users WHERE id = $1 FOR UPDATE', [runtime.userId])

  const results = []
  let latestEconomy = null

  for (const reward of rewards) {
    const existingResult = await execute(
      `
        SELECT
          id,
          status,
          amount,
          economy_event_id AS "economyEventId",
          failure_code AS "failureCode",
          granted_at AS "grantedAt"
        FROM campaign_reward_grants
        WHERE participation_id = $1
          AND reward_definition_id = $2
        LIMIT 1
      `,
      [runtime.id, reward.id],
    )
    const existing = existingResult.rows[0]
    if (existing) {
      results.push({
        rewardId: reward.id,
        grantId: existing.id,
        status: existing.status,
        amount: Number(existing.amount),
        economyEventId: existing.economyEventId ?? null,
        failureCode: existing.failureCode ?? null,
        duplicate: true,
      })
      continue
    }

    let budget = null
    if (reward.budget) {
      const budgetResult = await execute(
        `
          SELECT
            max_amount AS "maxAmount",
            committed_amount AS "committedAmount",
            granted_amount AS "grantedAmount",
            grant_count AS "grantCount"
          FROM campaign_reward_budgets
          WHERE campaign_version_id = $1
            AND reward_definition_id = $2
          FOR UPDATE
        `,
        [runtime.campaignVersionId, reward.id],
      )
      budget = budgetResult.rows[0]
      if (!budget) {
        throw new Error(`Campaign reward budget missing for ${reward.id}`)
      }

      if (Number(budget.committedAmount) + reward.amount > Number(budget.maxAmount)) {
        const grantId = randomUUID()
        await execute(
          `
            INSERT INTO campaign_reward_grants (
              id,
              campaign_id,
              campaign_version_id,
              participation_id,
              user_id,
              reward_definition_id,
              status,
              amount,
              idempotency_key,
              failure_code,
              failed_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7, $8, 'CAMPAIGN_REWARD_EXHAUSTED', $9)
          `,
          [
            grantId,
            runtime.campaignId,
            runtime.campaignVersionId,
            runtime.id,
            runtime.userId,
            reward.id,
            reward.amount,
            `campaign:grant:v1:${runtime.campaignVersionId}:${runtime.id}:${reward.id}:campaign_completion`,
            asOf.toISOString(),
          ],
        )
        await appendCampaignEvent(
          execute,
          runtime,
          'reward_failed',
          { rewardDefinitionId: reward.id, failureCode: 'CAMPAIGN_REWARD_EXHAUSTED' },
        )
        results.push({
          rewardId: reward.id,
          grantId,
          status: 'failed',
          amount: reward.amount,
          economyEventId: null,
          failureCode: 'CAMPAIGN_REWARD_EXHAUSTED',
          duplicate: false,
        })
        continue
      }
    }

    const grantId = randomUUID()
    const grantIdempotencyKey = `campaign:grant:v1:${runtime.campaignVersionId}:${runtime.id}:${reward.id}:campaign_completion`
    await execute(
      `
        INSERT INTO campaign_reward_grants (
          id,
          campaign_id,
          campaign_version_id,
          participation_id,
          user_id,
          reward_definition_id,
          status,
          amount,
          idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      `,
      [
        grantId,
        runtime.campaignId,
        runtime.campaignVersionId,
        runtime.id,
        runtime.userId,
        reward.id,
        reward.amount,
        grantIdempotencyKey,
      ],
    )

    if (budget) {
      await execute(
        `
          UPDATE campaign_reward_budgets
          SET committed_amount = committed_amount + $3,
              updated_at = NOW()
          WHERE campaign_version_id = $1
            AND reward_definition_id = $2
        `,
        [runtime.campaignVersionId, reward.id, reward.amount],
      )
    }

    const expiresAt = rewardExpiry(reward, asOf)
    const economyResult = await recordUserEconomyEventInTransaction(
      client,
      {
        userId: runtime.userId,
        eventType: 'campaign_reward_issued',
        unitDelta: reward.amount,
        sourceType: 'campaign_reward',
        sourceId: grantId,
        idempotencyKey: `campaign:reward:v1:${runtime.campaignVersionId}:${runtime.id}:${reward.id}:campaign_completion`,
        metadata: {
          campaignId: runtime.campaignId,
          campaignVersionId: runtime.campaignVersionId,
          participationId: runtime.id,
          rewardDefinitionId: reward.id,
          qualificationKey: 'campaign_completion',
        },
        expiresAt,
      },
      { asOf },
    )
    latestEconomy = economyResult.economy

    await execute(
      `
        UPDATE campaign_reward_grants
        SET status = 'granted',
            economy_event_id = $2,
            failure_code = NULL,
            granted_at = $3,
            updated_at = $3
        WHERE id = $1
      `,
      [grantId, economyResult.event.id, asOf.toISOString()],
    )

    if (budget) {
      await execute(
        `
          UPDATE campaign_reward_budgets
          SET granted_amount = granted_amount + $3,
              grant_count = grant_count + 1,
              updated_at = NOW()
          WHERE campaign_version_id = $1
            AND reward_definition_id = $2
        `,
        [runtime.campaignVersionId, reward.id, reward.amount],
      )
    }

    await appendCampaignEvent(
      execute,
      runtime,
      'reward_granted',
      {
        rewardDefinitionId: reward.id,
        amount: reward.amount,
        grantId,
        economyEventId: economyResult.event.id,
        expiresAt,
      },
    )

    results.push({
      rewardId: reward.id,
      grantId,
      status: 'granted',
      amount: reward.amount,
      economyEventId: economyResult.event.id,
      failureCode: null,
      expiresAt,
      duplicate: false,
    })
  }

  return { results, economy: latestEconomy }
}
