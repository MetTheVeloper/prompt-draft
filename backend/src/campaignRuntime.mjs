import { randomUUID } from 'node:crypto'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  asDate,
  normalizeAttribution,
  deriveCampaignEffectiveStatus,
  mapParticipation,
  buildPublicCampaignProjection,
  loadPublishedCampaignBySlug,
  loadParticipationByCampaignUser,
  loadParticipationRuntime,
  appendCampaignEvent,
  createRuleEvaluation,
  evaluateEligibility,
  participationAllowsProgress,
} from './campaignRuntimeShared.mjs'
import { settleCompletionRewards } from './campaignRuntimeRewards.mjs'

export async function refreshCampaignParticipationInTransaction(
  client,
  { participationId, asOf = new Date() },
) {
  const execute = client.query.bind(client)
  const effectiveAt = asDate(asOf, new Date())
  const runtime = await loadParticipationRuntime(participationId, execute, { lock: true })
  if (!runtime) return null

  const effectiveStatus = deriveCampaignEffectiveStatus(runtime, effectiveAt)
  const participation = mapParticipation(runtime)
  if (!participationAllowsProgress(runtime, effectiveStatus)) {
    return {
      campaign: {
        id: runtime.campaignId,
        slug: runtime.slug,
        version: Number(runtime.campaignVersion),
        status: effectiveStatus,
      },
      participation,
      effects: [],
      economy: null,
    }
  }

  const completion = await createRuleEvaluation({
    rule: runtime.definition.completion,
    definition: runtime.definition,
    userId: runtime.userId,
    participation,
    execute,
    asOf: effectiveAt,
  })

  const nextState = {
    ...(runtime.state ?? {}),
    progress: completion.progress,
  }
  const effects = []

  if (!completion.matched) {
    const nextStatus = runtime.status === 'started' ? 'in_progress' : runtime.status
    const result = await execute(
      `
        UPDATE campaign_participations
        SET status = $2,
            state = $3::jsonb,
            last_progress_at = $4,
            updated_at = $4
        WHERE id = $1
        RETURNING
          id,
          campaign_id AS "campaignId",
          campaign_version_id AS "campaignVersionId",
          user_id AS "userId",
          status,
          attribution,
          state,
          started_at AS "startedAt",
          last_progress_at AS "lastProgressAt",
          completed_at AS "completedAt",
          qualified_at AS "qualifiedAt",
          rewarded_at AS "rewardedAt",
          disqualified_at AS "disqualifiedAt",
          expired_at AS "expiredAt",
          updated_at AS "updatedAt"
      `,
      [runtime.id, nextStatus, JSON.stringify(nextState), effectiveAt.toISOString()],
    )
    return {
      campaign: {
        id: runtime.campaignId,
        slug: runtime.slug,
        version: Number(runtime.campaignVersion),
        status: effectiveStatus,
      },
      participation: {
        ...mapParticipation({ ...result.rows[0], campaignVersion: runtime.campaignVersion }),
      },
      effects,
      economy: null,
    }
  }

  const firstCompletion = !runtime.completedAt
  const firstQualification = !runtime.qualifiedAt
  if (firstCompletion) effects.push({ type: 'campaign_completed' })
  if (firstQualification) effects.push({ type: 'campaign_qualified' })

  if (firstCompletion) await appendCampaignEvent(execute, runtime, 'campaign_completed')
  if (firstQualification) await appendCampaignEvent(execute, runtime, 'campaign_qualified')

  const immediate = runtime.definition.lifecycle?.rewardSettlement !== 'deferred'
  let rewardSettlement = { results: [], economy: null }
  if (immediate) {
    rewardSettlement = await settleCompletionRewards({
      client,
      execute,
      runtime,
      asOf: effectiveAt,
    })
  }

  for (const reward of rewardSettlement.results) {
    if (reward.duplicate) continue
    if (reward.status === 'granted') {
      effects.push({
        type: 'reward_granted',
        reward: {
          id: reward.rewardId,
          type: 'goin',
          amount: reward.amount,
          grantId: reward.grantId,
          economyEventId: reward.economyEventId,
          ...(reward.expiresAt ? { expiresAt: reward.expiresAt } : {}),
        },
      })
    } else if (reward.status === 'failed') {
      effects.push({
        type: 'reward_failed',
        reward: {
          id: reward.rewardId,
          type: 'goin',
          amount: reward.amount,
          grantId: reward.grantId,
          failureCode: reward.failureCode,
        },
      })
    }
  }

  const completionRewards = (runtime.definition.rewards ?? [])
    .filter(reward => reward?.trigger?.type === 'campaign_completion')
  const hasFailedReward = rewardSettlement.results.some(reward => reward.status === 'failed')
  const allCompletionRewardsGranted = completionRewards.length > 0 &&
    rewardSettlement.results.length === completionRewards.length &&
    rewardSettlement.results.every(reward => reward.status === 'granted')

  let nextStatus = 'qualified'
  if (hasFailedReward) nextStatus = 'reward_failed'
  else if (allCompletionRewardsGranted) nextStatus = 'rewarded'
  else if (completionRewards.length === 0) nextStatus = 'completed'

  const result = await execute(
    `
      UPDATE campaign_participations
      SET status = $2,
          state = $3::jsonb,
          last_progress_at = $4,
          completed_at = COALESCE(completed_at, $4),
          qualified_at = COALESCE(qualified_at, $4),
          rewarded_at = CASE WHEN $2 = 'rewarded' THEN COALESCE(rewarded_at, $4) ELSE rewarded_at END,
          updated_at = $4
      WHERE id = $1
      RETURNING
        id,
        campaign_id AS "campaignId",
        campaign_version_id AS "campaignVersionId",
        user_id AS "userId",
        status,
        attribution,
        state,
        started_at AS "startedAt",
        last_progress_at AS "lastProgressAt",
        completed_at AS "completedAt",
        qualified_at AS "qualifiedAt",
        rewarded_at AS "rewardedAt",
        disqualified_at AS "disqualifiedAt",
        expired_at AS "expiredAt",
        updated_at AS "updatedAt"
    `,
    [runtime.id, nextStatus, JSON.stringify(nextState), effectiveAt.toISOString()],
  )

  return {
    campaign: {
      id: runtime.campaignId,
      slug: runtime.slug,
      version: Number(runtime.campaignVersion),
      status: effectiveStatus,
    },
    participation: mapParticipation({ ...result.rows[0], campaignVersion: runtime.campaignVersion }),
    effects,
    economy: rewardSettlement.economy,
  }
}

async function refreshCampaignParticipation(participationId, asOf) {
  return withDatabaseTransaction(client =>
    refreshCampaignParticipationInTransaction(client, { participationId, asOf }))
}

export async function getCampaignCallerState({ slug, userId, asOf = new Date() }) {
  const campaign = await loadPublishedCampaignBySlug(slug)
  if (!campaign) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }

  const existing = await loadParticipationByCampaignUser(campaign.campaignId, userId)
  if (existing) {
    const refreshed = await refreshCampaignParticipation(existing.id, asOf)
    return {
      ok: true,
      campaign: refreshed.campaign,
      eligibility: { eligible: true, reasonCodes: [] },
      participation: refreshed.participation,
      mechanics: [],
      attemptAvailability: [],
      effects: refreshed.effects,
      ...(refreshed.economy ? { economy: refreshed.economy } : {}),
    }
  }

  const eligibility = await evaluateEligibility({
    campaign,
    userId,
    execute: queryDatabase,
    asOf: asDate(asOf, new Date()),
  })
  return {
    ok: true,
    campaign: {
      id: campaign.campaignId,
      slug: campaign.slug,
      version: Number(campaign.versionNumber),
      status: campaign.status,
    },
    eligibility,
    participation: null,
    mechanics: [],
    attemptAvailability: [],
    effects: [],
  }
}

export async function getPublicCampaignRuntime({ slug, userId = null, asOf = new Date() }) {
  const campaign = await loadPublishedCampaignBySlug(slug)
  if (!campaign) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }

  const effectiveAt = asDate(asOf, new Date())
  let viewer
  if (!userId) {
    viewer = {
      authenticated: false,
      eligibility: campaign.definition.eligibility?.authenticated === true
        ? { eligible: false, reasonCodes: ['AUTHENTICATION_REQUIRED'] }
        : await evaluateEligibility({
          campaign,
          userId: null,
          execute: queryDatabase,
          asOf: effectiveAt,
        }),
      participation: null,
    }
  } else {
    const existing = await loadParticipationByCampaignUser(campaign.campaignId, userId)
    if (existing) {
      const refreshed = await refreshCampaignParticipation(existing.id, effectiveAt)
      viewer = {
        authenticated: true,
        eligibility: { eligible: true, reasonCodes: [] },
        participation: refreshed.participation,
        ...(refreshed.effects.length ? { effects: refreshed.effects } : {}),
        ...(refreshed.economy ? { economy: refreshed.economy } : {}),
      }
    } else {
      viewer = {
        authenticated: true,
        eligibility: await evaluateEligibility({
          campaign,
          userId,
          execute: queryDatabase,
          asOf: effectiveAt,
        }),
        participation: null,
      }
    }
  }

  return {
    ok: true,
    campaign: buildPublicCampaignProjection(campaign),
    viewer,
  }
}

export async function startCampaignParticipation({
  slug,
  userId,
  attribution = {},
  asOf = new Date(),
}) {
  return withDatabaseTransaction(async client => {
    const execute = client.query.bind(client)
    const effectiveAt = asDate(asOf, new Date())
    const campaign = await loadPublishedCampaignBySlug(slug, execute, { lock: 'share' })
    if (!campaign) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }

    let existing = await loadParticipationByCampaignUser(campaign.campaignId, userId, execute)
    if (existing) {
      const refreshed = await refreshCampaignParticipationInTransaction(client, {
        participationId: existing.id,
        asOf: effectiveAt,
      })
      return {
        ok: true,
        duplicate: true,
        participation: refreshed.participation,
        effects: refreshed.effects,
        ...(refreshed.economy ? { economy: refreshed.economy } : {}),
      }
    }

    const userResult = await execute('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId])
    if (!userResult.rows[0]) return { ok: false, code: 'CAMPAIGN_NOT_ELIGIBLE' }

    // A parallel start may have committed while this request waited for the user
    // lock. Re-check after acquiring the canonical per-user serialization lock.
    existing = await loadParticipationByCampaignUser(campaign.campaignId, userId, execute)
    if (existing) {
      // Do not re-enter the participation -> user reward lock order while this
      // path already holds the user lock. Returning the established logical
      // participation is sufficient for idempotent start semantics.
      return {
        ok: true,
        duplicate: true,
        participation: existing,
        effects: [],
      }
    }

    if (campaign.status !== 'active') {
      return {
        ok: false,
        code: campaign.status === 'ended'
          ? 'CAMPAIGN_PARTICIPATION_CLOSED'
          : 'CAMPAIGN_NOT_ACTIVE',
      }
    }

    const eligibility = await evaluateEligibility({
      campaign,
      userId,
      execute,
      asOf: effectiveAt,
    })
    if (!eligibility.eligible) {
      return { ok: false, code: 'CAMPAIGN_NOT_ELIGIBLE', eligibility }
    }

    const participationId = randomUUID()
    await execute(
      `
        INSERT INTO campaign_participations (
          id,
          campaign_id,
          campaign_version_id,
          user_id,
          status,
          attribution,
          state,
          started_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'started', $5::jsonb, '{}'::jsonb, $6, $6)
      `,
      [
        participationId,
        campaign.campaignId,
        campaign.versionId,
        userId,
        JSON.stringify(normalizeAttribution(attribution)),
        effectiveAt.toISOString(),
      ],
    )

    const runtime = {
      id: participationId,
      campaignId: campaign.campaignId,
      campaignVersionId: campaign.versionId,
    }
    await appendCampaignEvent(
      execute,
      runtime,
      'participation_started',
      { attribution: normalizeAttribution(attribution) },
    )

    const refreshed = await refreshCampaignParticipationInTransaction(client, {
      participationId,
      asOf: effectiveAt,
    })

    return {
      ok: true,
      duplicate: false,
      participation: refreshed.participation,
      effects: refreshed.effects,
      ...(refreshed.economy ? { economy: refreshed.economy } : {}),
    }
  })
}
