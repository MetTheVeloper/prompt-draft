import { createHash, randomUUID } from 'node:crypto'
import { recordUserEconomyEventInTransaction } from './economyCore.mjs'
import { appendCampaignEvent } from './campaignRuntimeShared.mjs'

function rewardExpiry(reward, asOf) {
  if (!Number.isSafeInteger(reward.expiresAfterSeconds) || reward.expiresAfterSeconds <= 0) return null
  return new Date(asOf.getTime() + reward.expiresAfterSeconds * 1000).toISOString()
}

function qualificationToken(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24)
}

function mapExisting(existing, rewardId) {
  return {
    rewardId,
    grantId: existing.id,
    status: existing.status,
    amount: Number(existing.amount),
    economyEventId: existing.economyEventId ?? null,
    failureCode: existing.failureCode ?? null,
    duplicate: true,
  }
}

async function readGrant(execute, participationId, rewardId, qualificationKey) {
  const result = await execute(
    `SELECT id, status, amount,
            economy_event_id AS "economyEventId",
            failure_code AS "failureCode"
     FROM campaign_reward_grants
     WHERE participation_id=$1
       AND reward_definition_id=$2
       AND qualification_key=$3
     LIMIT 1`,
    [participationId, rewardId, qualificationKey],
  )
  return result.rows[0] ?? null
}

async function readPerUserLimitGrant(execute, participationId, rewardId) {
  const result = await execute(
    `SELECT id, status, amount,
            economy_event_id AS "economyEventId",
            failure_code AS "failureCode"
     FROM campaign_reward_grants
     WHERE participation_id=$1
       AND reward_definition_id=$2
       AND status IN ('pending','granted')
     ORDER BY created_at ASC
     LIMIT 1`,
    [participationId, rewardId],
  )
  return result.rows[0] ?? null
}

export async function settleMechanicOutcomeRewards({
  client,
  execute,
  runtime,
  mechanicId,
  outcome,
  attemptId,
  asOf,
}) {
  const rewards = (runtime.definition.rewards ?? []).filter(reward =>
    reward?.trigger?.type === 'mechanic_outcome' &&
    reward.trigger.mechanicId === mechanicId &&
    reward.trigger.outcome === outcome)

  if (rewards.length === 0) return { results: [], economy: null }

  await execute('SELECT id FROM users WHERE id=$1 FOR UPDATE', [runtime.userId])

  const qualificationKey = `mechanic_outcome:${mechanicId}:${attemptId}`
  const token = qualificationToken(qualificationKey)
  const qualification = {
    trigger: 'mechanic_outcome',
    mechanicId,
    outcome,
    attemptId,
  }
  const results = []
  let latestEconomy = null

  for (const reward of rewards) {
    const existing = await readGrant(execute, runtime.id, reward.id, qualificationKey)
    if (existing) {
      results.push(mapExisting(existing, reward.id))
      continue
    }

    if (reward.perUserLimit === 1) {
      const limited = await readPerUserLimitGrant(execute, runtime.id, reward.id)
      if (limited) {
        results.push(mapExisting(limited, reward.id))
        continue
      }
    }

    const grantIdempotencyKey =
      `campaign:grant:v1:${runtime.campaignVersionId}:${runtime.id}:${reward.id}:${token}`
    const economyIdempotencyKey =
      `campaign:reward:v1:${runtime.campaignVersionId}:${runtime.id}:${reward.id}:${token}`

    let budget = null
    if (reward.budget) {
      const budgetResult = await execute(
        `SELECT max_amount AS "maxAmount",
                committed_amount AS "committedAmount",
                granted_amount AS "grantedAmount"
         FROM campaign_reward_budgets
         WHERE campaign_version_id=$1
           AND reward_definition_id=$2
         FOR UPDATE`,
        [runtime.campaignVersionId, reward.id],
      )
      budget = budgetResult.rows[0]
      if (!budget) throw new Error(`Campaign reward budget missing for ${reward.id}`)

      if (Number(budget.committedAmount) + reward.amount > Number(budget.maxAmount)) {
        const grantId = randomUUID()
        await execute(
          `INSERT INTO campaign_reward_grants (
             id,campaign_id,campaign_version_id,participation_id,user_id,
             reward_definition_id,qualification_key,reward_type,status,amount,
             idempotency_key,qualification,failure_code,failed_at
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,'goin','failed',$8,$9,$10::jsonb,
                   'CAMPAIGN_REWARD_EXHAUSTED',$11)`,
          [
            grantId,
            runtime.campaignId,
            runtime.campaignVersionId,
            runtime.id,
            runtime.userId,
            reward.id,
            qualificationKey,
            reward.amount,
            grantIdempotencyKey,
            JSON.stringify(qualification),
            asOf.toISOString(),
          ],
        )
        await appendCampaignEvent(
          execute,
          runtime,
          'reward_failed',
          {
            rewardDefinitionId: reward.id,
            failureCode: 'CAMPAIGN_REWARD_EXHAUSTED',
            qualificationKey,
          },
          mechanicId,
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
    await execute(
      `INSERT INTO campaign_reward_grants (
         id,campaign_id,campaign_version_id,participation_id,user_id,
         reward_definition_id,qualification_key,reward_type,status,amount,
         idempotency_key,qualification
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'goin','pending',$8,$9,$10::jsonb)`,
      [
        grantId,
        runtime.campaignId,
        runtime.campaignVersionId,
        runtime.id,
        runtime.userId,
        reward.id,
        qualificationKey,
        reward.amount,
        grantIdempotencyKey,
        JSON.stringify(qualification),
      ],
    )

    if (budget) {
      await execute(
        `UPDATE campaign_reward_budgets
         SET committed_amount=committed_amount+$3,
             updated_at=NOW()
         WHERE campaign_version_id=$1
           AND reward_definition_id=$2`,
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
        idempotencyKey: economyIdempotencyKey,
        metadata: {
          campaignId: runtime.campaignId,
          campaignVersionId: runtime.campaignVersionId,
          participationId: runtime.id,
          rewardDefinitionId: reward.id,
          qualificationKey,
        },
        expiresAt,
      },
      { asOf },
    )
    latestEconomy = economyResult.economy

    await execute(
      `UPDATE campaign_reward_grants
       SET status='granted',
           economy_event_id=$2,
           failure_code=NULL,
           failed_at=NULL,
           granted_at=$3,
           updated_at=$3
       WHERE id=$1`,
      [grantId, economyResult.event.id, asOf.toISOString()],
    )

    if (budget) {
      await execute(
        `UPDATE campaign_reward_budgets
         SET granted_amount=granted_amount+$3,
             grant_count=grant_count+1,
             updated_at=NOW()
         WHERE campaign_version_id=$1
           AND reward_definition_id=$2`,
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
        qualificationKey,
      },
      mechanicId,
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
