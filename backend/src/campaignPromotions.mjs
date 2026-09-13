import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import { asDate, deriveCampaignEffectiveStatus } from './campaignRuntimeShared.mjs'
import {
  getCampaignPromotionRenderer,
  isCampaignPromotionSlot,
} from './campaignPromotionRegistry.mjs'

const PROMOTION_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toIso(value) {
  return value?.toISOString?.() ?? value ?? null
}

function activeAt(value, asOf) {
  if (!value) return true
  const date = asDate(value)
  return Boolean(date && date.getTime() <= asOf.getTime())
}

function notEndedAt(value, asOf) {
  if (!value) return true
  const date = asDate(value)
  return Boolean(date && date.getTime() > asOf.getTime())
}

function promotionScheduleActive(promotion, asOf) {
  const schedule = promotion?.schedule
  if (schedule === undefined) return true
  if (!isObject(schedule)) return false
  return activeAt(schedule.startsAt, asOf) && notEndedAt(schedule.endsAt, asOf)
}

function dismissalStillActive(row, asOf) {
  if (!row) return false
  if (!row.dismissUntil) return true
  const until = asDate(row.dismissUntil)
  return Boolean(until && until.getTime() > asOf.getTime())
}

function runtimePromotionSafe(promotion) {
  if (!isObject(promotion) || !PROMOTION_ID_PATTERN.test(promotion.id ?? '')) return false
  if (!isCampaignPromotionSlot(promotion.slot)) return false
  if (!isObject(promotion.renderer) || typeof promotion.renderer.key !== 'string') return false
  const renderer = getCampaignPromotionRenderer(promotion.renderer.key)
  return Boolean(
    renderer &&
    renderer.kind === promotion.renderer.kind &&
    renderer.slots.includes(promotion.slot),
  )
}

function projectLocalizedContent(experience) {
  const locales = {}
  for (const locale of experience?.locales ?? []) {
    const source = experience?.content?.[locale]
    if (!isObject(source)) continue
    const projected = {}
    for (const key of ['title', 'subtitle', 'description', 'ctaLabel', 'rewardLabel', 'countdownLabel']) {
      if (typeof source[key] === 'string') projected[key] = source[key]
    }
    locales[locale] = projected
  }
  return {
    defaultLocale: experience?.defaultLocale ?? null,
    locales,
  }
}

function projectDismissConfig(value) {
  if (!isObject(value) || value.enabled !== true) return { enabled: false }
  return {
    enabled: true,
    persistence: value.persistence,
    ...(Number.isSafeInteger(value.ttlSeconds) ? { ttlSeconds: value.ttlSeconds } : {}),
  }
}

function projectFrequencyCap(value) {
  if (!isObject(value)) return null
  if (!Number.isSafeInteger(value.maxImpressions) || value.maxImpressions <= 0) return null
  if (!['session', 'day', 'campaign'].includes(value.period)) return null
  return { maxImpressions: value.maxImpressions, period: value.period }
}

export function buildCampaignPromotionProjection(campaign, promotion) {
  const frequencyCap = projectFrequencyCap(promotion.frequencyCap)
  return {
    campaignSlug: campaign.slug,
    campaignVersion: Number(campaign.versionNumber),
    promotionId: promotion.id,
    slot: promotion.slot,
    renderer: {
      kind: promotion.renderer.kind,
      key: promotion.renderer.key,
    },
    content: projectLocalizedContent(campaign.definition?.experience),
    targetPath: `/campaign/${campaign.slug}`,
    priority: Number.isSafeInteger(promotion.priority) ? promotion.priority : 0,
    dismiss: projectDismissConfig(promotion.dismiss),
    ...(frequencyCap ? { frequencyCap } : {}),
  }
}

async function loadCurrentCampaigns(executor) {
  const result = await executor(`
    SELECT
      campaign.id AS "campaignId",
      campaign.slug,
      campaign.paused_at AS "pausedAt",
      campaign.manually_ended_at AS "manuallyEndedAt",
      campaign.archived_at AS "archivedAt",
      version.id AS "versionId",
      version.version_number AS "versionNumber",
      version.definition
    FROM campaigns AS campaign
    INNER JOIN campaign_versions AS version
      ON version.id = campaign.current_published_version_id
  `)
  return result.rows
}

async function loadUserDismissals(executor, userId, versionIds) {
  if (!userId || versionIds.length === 0) return new Map()
  const result = await executor(
    `SELECT campaign_version_id AS "versionId", promotion_id AS "promotionId",
            dismissed_at AS "dismissedAt", dismiss_until AS "dismissUntil"
     FROM campaign_promotion_user_states
     WHERE user_id = $1 AND campaign_version_id = ANY($2::uuid[])`,
    [userId, versionIds],
  )
  return new Map(result.rows.map(row => [`${row.versionId}:${row.promotionId}`, row]))
}

export async function listCampaignPromotions({
  slot,
  userId = null,
  asOf = new Date(),
  executor = queryDatabase,
}) {
  if (!isCampaignPromotionSlot(slot)) {
    return { ok: false, code: 'CAMPAIGN_PROMOTION_SLOT_INVALID' }
  }

  const effectiveAt = asDate(asOf, new Date())
  const campaigns = await loadCurrentCampaigns(executor)
  const versionIds = campaigns.map(row => row.versionId)
  const dismissals = await loadUserDismissals(executor, userId, versionIds)
  const selected = []

  for (const campaign of campaigns) {
    if (deriveCampaignEffectiveStatus(campaign, effectiveAt) !== 'active') continue
    const promotions = Array.isArray(campaign.definition?.promotions)
      ? campaign.definition.promotions
      : []
    for (const promotion of promotions) {
      if (!runtimePromotionSafe(promotion)) continue
      if (promotion.slot !== slot || !promotionScheduleActive(promotion, effectiveAt)) continue
      if (promotion.dismiss?.enabled === true && promotion.dismiss.persistence === 'user' && userId) {
        const state = dismissals.get(`${campaign.versionId}:${promotion.id}`)
        if (dismissalStillActive(state, effectiveAt)) continue
      }
      selected.push({
        projection: buildCampaignPromotionProjection(campaign, promotion),
        campaignStart: asDate(campaign.definition?.lifecycle?.startsAt)?.getTime() ?? 0,
      })
    }
  }

  selected.sort((left, right) => {
    const priority = right.projection.priority - left.projection.priority
    if (priority !== 0) return priority
    const start = right.campaignStart - left.campaignStart
    if (start !== 0) return start
    const slug = left.projection.campaignSlug.localeCompare(right.projection.campaignSlug)
    if (slug !== 0) return slug
    return left.projection.promotionId.localeCompare(right.projection.promotionId)
  })

  return {
    ok: true,
    slot,
    promotions: selected.map(item => item.projection),
  }
}

async function loadCurrentPromotion(execute, { slug, promotionId, asOf }) {
  const result = await execute(
    `SELECT
       campaign.id AS "campaignId",
       campaign.slug,
       campaign.paused_at AS "pausedAt",
       campaign.manually_ended_at AS "manuallyEndedAt",
       campaign.archived_at AS "archivedAt",
       version.id AS "versionId",
       version.version_number AS "versionNumber",
       version.definition
     FROM campaigns AS campaign
     INNER JOIN campaign_versions AS version
       ON version.id = campaign.current_published_version_id
     WHERE campaign.slug = $1
     LIMIT 1
     FOR SHARE OF campaign`,
    [slug],
  )
  const campaign = result.rows[0]
  if (!campaign || deriveCampaignEffectiveStatus(campaign, asOf) !== 'active') return null
  const promotion = (campaign.definition?.promotions ?? []).find(value => value?.id === promotionId)
  if (!runtimePromotionSafe(promotion) || !promotionScheduleActive(promotion, asOf)) return null
  return { campaign, promotion }
}

export async function dismissCampaignPromotionInTransaction(client, {
  slug,
  promotionId,
  userId,
  asOf = new Date(),
}) {
  const execute = client.query.bind(client)
  const effectiveAt = asDate(asOf, new Date())
  const resolved = await loadCurrentPromotion(execute, { slug, promotionId, asOf: effectiveAt })
  if (!resolved) return { ok: false, code: 'CAMPAIGN_PROMOTION_NOT_FOUND' }
  const dismiss = resolved.promotion.dismiss
  if (!isObject(dismiss) || dismiss.enabled !== true) {
    return { ok: false, code: 'CAMPAIGN_PROMOTION_NOT_DISMISSIBLE' }
  }
  if (dismiss.persistence !== 'user') {
    return { ok: false, code: 'CAMPAIGN_PROMOTION_LOCAL_DISMISSAL' }
  }

  const dismissUntil = Number.isSafeInteger(dismiss.ttlSeconds)
    ? new Date(effectiveAt.getTime() + dismiss.ttlSeconds * 1000)
    : null

  await execute(
    `INSERT INTO campaign_promotion_user_states
       (user_id, campaign_version_id, promotion_id, dismissed_at, dismiss_until, updated_at)
     VALUES ($1, $2, $3, $4, $5, $4)
     ON CONFLICT (user_id, campaign_version_id, promotion_id)
     DO UPDATE SET dismissed_at = EXCLUDED.dismissed_at,
                   dismiss_until = EXCLUDED.dismiss_until,
                   updated_at = EXCLUDED.updated_at`,
    [userId, resolved.campaign.versionId, promotionId, effectiveAt.toISOString(), dismissUntil?.toISOString() ?? null],
  )

  return {
    ok: true,
    dismissed: true,
    dismissUntil: toIso(dismissUntil),
  }
}

export function dismissCampaignPromotion(input) {
  return withDatabaseTransaction(client => dismissCampaignPromotionInTransaction(client, input))
}

export async function resetCampaignPromotionDismissalInTransaction(client, {
  slug,
  promotionId,
  userId,
  asOf = new Date(),
}) {
  const execute = client.query.bind(client)
  const effectiveAt = asDate(asOf, new Date())
  const resolved = await loadCurrentPromotion(execute, { slug, promotionId, asOf: effectiveAt })
  if (!resolved) return { ok: false, code: 'CAMPAIGN_PROMOTION_NOT_FOUND' }
  if (resolved.promotion?.dismiss?.persistence !== 'user') {
    return { ok: false, code: 'CAMPAIGN_PROMOTION_LOCAL_DISMISSAL' }
  }

  await execute(
    `DELETE FROM campaign_promotion_user_states
     WHERE user_id = $1 AND campaign_version_id = $2 AND promotion_id = $3`,
    [userId, resolved.campaign.versionId, promotionId],
  )
  return { ok: true, dismissed: false, dismissUntil: null }
}

export function resetCampaignPromotionDismissal(input) {
  return withDatabaseTransaction(client => resetCampaignPromotionDismissalInTransaction(client, input))
}
