import { randomUUID } from 'node:crypto'
import { queryDatabase } from './database.mjs'
import { evaluateRuleExpression } from './campaignRules.mjs'
import { listRuleMetricReferences, resolveCampaignMetric } from './campaignMetrics.mjs'

export function asDate(value, fallback = null) {
  if (value == null) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function toIso(value) {
  return value?.toISOString?.() ?? value ?? null
}

export function normalizeAttribution(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

export function deriveCampaignEffectiveStatus(
  { definition, pausedAt = null, manuallyEndedAt = null, archivedAt = null },
  asOf = new Date(),
) {
  if (!definition) return 'draft'
  if (archivedAt) return 'archived'
  if (manuallyEndedAt) return 'ended'
  if (pausedAt) return 'paused'

  const now = asDate(asOf, new Date())
  const startsAt = asDate(definition.lifecycle?.startsAt)
  const endsAt = asDate(definition.lifecycle?.endsAt)

  if (startsAt && now.getTime() < startsAt.getTime()) return 'scheduled'
  if (endsAt && now.getTime() >= endsAt.getTime()) return 'ended'
  return 'active'
}

export function mapParticipation(row) {
  if (!row) return null
  return {
    id: row.id,
    campaignId: row.campaignId,
    campaignVersionId: row.campaignVersionId,
    campaignVersion: Number(row.campaignVersion),
    userId: row.userId,
    status: row.status,
    attribution: row.attribution ?? {},
    state: row.state ?? {},
    startedAt: toIso(row.startedAt),
    lastProgressAt: toIso(row.lastProgressAt),
    completedAt: toIso(row.completedAt),
    qualifiedAt: toIso(row.qualifiedAt),
    rewardedAt: toIso(row.rewardedAt),
    disqualifiedAt: toIso(row.disqualifiedAt),
    expiredAt: toIso(row.expiredAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function safeRewardProjection(reward) {
  const projected = {
    id: reward.id,
    type: reward.type,
    amount: reward.amount,
    trigger: reward.trigger,
  }
  if (reward.perUserLimit !== undefined) projected.perUserLimit = reward.perUserLimit
  if (reward.expiresAfterSeconds !== undefined) {
    projected.expiresAfterSeconds = reward.expiresAfterSeconds
  }
  return projected
}

export function buildPublicCampaignProjection(record) {
  const definition = record.definition
  return {
    id: record.campaignId,
    slug: record.slug,
    version: Number(record.versionNumber),
    schemaVersion: record.schemaVersion,
    status: record.status,
    lifecycle: {
      startsAt: definition.lifecycle?.startsAt ?? null,
      endsAt: definition.lifecycle?.endsAt ?? null,
      timezone: definition.lifecycle?.timezone ?? null,
      participationAfterEnd: definition.lifecycle?.participationAfterEnd ?? 'deny',
    },
    experience: {
      renderer: definition.experience?.renderer ?? null,
      locales: Array.isArray(definition.experience?.locales)
        ? [...definition.experience.locales]
        : [],
      defaultLocale: definition.experience?.defaultLocale ?? null,
      content: definition.experience?.content ?? {},
      seo: definition.experience?.seo ?? { indexing: 'noindex' },
    },
    mechanics: (definition.mechanics ?? []).map(mechanic => ({
      id: mechanic.id,
      type: mechanic.type,
      ...(mechanic.renderer ? { renderer: mechanic.renderer } : {}),
      config: { public: mechanic.config?.public ?? {} },
      ...(mechanic.attemptPolicy ? { attemptPolicy: mechanic.attemptPolicy } : {}),
    })),
    completion: definition.completion ?? null,
    rewards: (definition.rewards ?? []).map(safeRewardProjection),
  }
}

export async function loadPublishedCampaignBySlug(
  slug,
  executor = queryDatabase,
  { lock = null } = {},
) {
  const lockClause = lock === 'share'
    ? 'FOR SHARE OF campaign'
    : lock === 'update'
      ? 'FOR UPDATE OF campaign'
      : ''

  const result = await executor(
    `
      SELECT
        campaign.id AS "campaignId",
        campaign.slug,
        campaign.paused_at AS "pausedAt",
        campaign.manually_ended_at AS "manuallyEndedAt",
        campaign.archived_at AS "archivedAt",
        version.id AS "versionId",
        version.version_number AS "versionNumber",
        version.schema_version AS "schemaVersion",
        version.definition,
        version.published_at AS "publishedAt"
      FROM campaigns AS campaign
      INNER JOIN campaign_versions AS version
        ON version.id = campaign.current_published_version_id
      WHERE campaign.slug = $1
      LIMIT 1
      ${lockClause}
    `,
    [slug],
  )

  const row = result.rows[0]
  if (!row) return null
  return {
    ...row,
    status: deriveCampaignEffectiveStatus(row),
  }
}

export async function loadParticipationByCampaignUser(campaignId, userId, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        participation.id,
        participation.campaign_id AS "campaignId",
        participation.campaign_version_id AS "campaignVersionId",
        version.version_number AS "campaignVersion",
        participation.user_id AS "userId",
        participation.status,
        participation.attribution,
        participation.state,
        participation.started_at AS "startedAt",
        participation.last_progress_at AS "lastProgressAt",
        participation.completed_at AS "completedAt",
        participation.qualified_at AS "qualifiedAt",
        participation.rewarded_at AS "rewardedAt",
        participation.disqualified_at AS "disqualifiedAt",
        participation.expired_at AS "expiredAt",
        participation.updated_at AS "updatedAt"
      FROM campaign_participations AS participation
      INNER JOIN campaign_versions AS version
        ON version.id = participation.campaign_version_id
      WHERE participation.campaign_id = $1
        AND participation.user_id = $2
      LIMIT 1
    `,
    [campaignId, userId],
  )
  return mapParticipation(result.rows[0])
}

export async function loadParticipationRuntime(participationId, executor, { lock = false } = {}) {
  const result = await executor(
    `
      SELECT
        participation.id,
        participation.campaign_id AS "campaignId",
        participation.campaign_version_id AS "campaignVersionId",
        participation.user_id AS "userId",
        participation.status,
        participation.attribution,
        participation.state,
        participation.started_at AS "startedAt",
        participation.last_progress_at AS "lastProgressAt",
        participation.completed_at AS "completedAt",
        participation.qualified_at AS "qualifiedAt",
        participation.rewarded_at AS "rewardedAt",
        participation.disqualified_at AS "disqualifiedAt",
        participation.expired_at AS "expiredAt",
        participation.updated_at AS "updatedAt",
        campaign.slug,
        campaign.paused_at AS "pausedAt",
        campaign.manually_ended_at AS "manuallyEndedAt",
        campaign.archived_at AS "archivedAt",
        version.version_number AS "campaignVersion",
        version.schema_version AS "schemaVersion",
        version.definition
      FROM campaign_participations AS participation
      INNER JOIN campaigns AS campaign
        ON campaign.id = participation.campaign_id
      INNER JOIN campaign_versions AS version
        ON version.id = participation.campaign_version_id
      WHERE participation.id = $1
      LIMIT 1
      ${lock ? 'FOR UPDATE OF participation' : ''}
    `,
    [participationId],
  )
  return result.rows[0] ?? null
}

export async function appendCampaignEvent(execute, runtime, eventName, metadata = {}, mechanicId = null) {
  await execute(
    `
      INSERT INTO campaign_events (
        id,
        campaign_id,
        campaign_version_id,
        participation_id,
        mechanic_id,
        event_name,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      randomUUID(),
      runtime.campaignId,
      runtime.campaignVersionId,
      runtime.id,
      mechanicId,
      eventName,
      JSON.stringify(metadata ?? {}),
    ],
  )
}

async function hasMechanicOutcome(execute, participationId, mechanicId, outcome) {
  const result = await execute(
    `
      SELECT EXISTS (
        SELECT 1
        FROM campaign_attempts
        WHERE participation_id = $1
          AND mechanic_id = $2
          AND status = 'resolved'
          AND outcome->>'key' = $3
        UNION ALL
        SELECT 1
        FROM campaign_events
        WHERE participation_id = $1
          AND mechanic_id = $2
          AND event_name IN ('game_won', 'wheel_resolved', 'attempt_resolved')
          AND metadata->>'outcome' = $3
      ) AS matched
    `,
    [participationId, mechanicId, outcome],
  )
  return Boolean(result.rows[0]?.matched)
}

export async function createRuleEvaluation({
  rule,
  definition,
  userId,
  participation,
  execute,
  asOf,
}) {
  const metricCache = new Map()

  const resolveMetric = async (metricKey, window) => {
    const cacheKey = `${metricKey}:${window}`
    if (!metricCache.has(cacheKey)) {
      metricCache.set(cacheKey, await resolveCampaignMetric({
        metricKey,
        window,
        userId,
        definition,
        participation,
        executor: execute,
        asOf,
      }))
    }
    return metricCache.get(cacheKey)
  }

  const matched = rule
    ? await evaluateRuleExpression(rule, {
      resolveMetric,
      hasMechanicOutcome: (mechanicId, outcome) => participation
        ? hasMechanicOutcome(execute, participation.id, mechanicId, outcome)
        : false,
    })
    : false

  const references = listRuleMetricReferences(rule)
  for (const reference of references.values()) {
    await resolveMetric(reference.metricKey, reference.window)
  }

  return {
    matched,
    progress: {
      metrics: Object.fromEntries(metricCache.entries()),
    },
  }
}

export async function evaluateEligibility({ campaign, userId, participation = null, execute, asOf }) {
  if (campaign.status !== 'active') {
    return { eligible: false, reasonCodes: [`CAMPAIGN_${campaign.status.toUpperCase()}`] }
  }

  const eligibility = campaign.definition.eligibility ?? {}
  if (eligibility.authenticated === true && !userId) {
    return { eligible: false, reasonCodes: ['AUTHENTICATION_REQUIRED'] }
  }

  if (eligibility.rules) {
    if (!userId) return { eligible: false, reasonCodes: ['AUTHENTICATION_REQUIRED'] }
    const evaluation = await createRuleEvaluation({
      rule: eligibility.rules,
      definition: campaign.definition,
      userId,
      participation,
      execute,
      asOf,
    })
    if (!evaluation.matched) {
      return { eligible: false, reasonCodes: ['ELIGIBILITY_RULES_NOT_MET'] }
    }
  }

  return { eligible: true, reasonCodes: [] }
}

export function participationAllowsProgress(runtime, status) {
  if (status === 'active') return true
  return status === 'ended' && runtime.definition.lifecycle?.participationAfterEnd === 'allow_existing_only'
}
