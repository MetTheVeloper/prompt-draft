import { queryDatabase } from './database.mjs'
import { deriveCampaignEffectiveStatus } from './campaignRuntimeShared.mjs'

function asNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function asNullableNumber(value) {
  if (value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function mapCampaignMeasurementRow(row) {
  if (!row) return null

  const version = row.versionNumber == null ? null : Number(row.versionNumber)
  const status = deriveCampaignEffectiveStatus({
    definition: row.definition ?? null,
    pausedAt: row.pausedAt,
    manuallyEndedAt: row.manuallyEndedAt,
    archivedAt: row.archivedAt,
  })

  const budgetMax = asNullableNumber(row.budgetMax)
  const budgetCommitted = asNullableNumber(row.budgetCommitted)
  const budgetGranted = asNullableNumber(row.budgetGranted)
  const budgetRemaining = budgetMax == null || budgetCommitted == null
    ? null
    : budgetMax - budgetCommitted

  return {
    campaign: {
      id: row.id,
      slug: row.slug,
      version,
      status,
    },
    scope: {
      kind: 'current_published_version',
      campaignVersionId: row.versionId ?? null,
    },
    funnel: {
      // A Campaign landing-page view event does not exist yet. Keep this null
      // rather than mislabelling promotion impressions as landing views.
      landingViews: null,
      participants: asNumber(row.participants),
      completed: asNumber(row.completed),
      qualified: asNumber(row.qualified),
      rewarded: asNumber(row.rewarded),
    },
    rewards: {
      goinGranted: asNumber(row.goinGranted),
      grantCount: asNumber(row.grantCount),
      failedGrantCount: asNumber(row.failedGrantCount),
      budgetMax,
      budgetCommitted,
      budgetGranted,
      budgetRemaining,
    },
    analytics: {
      authority: 'observational',
      promotionImpressions: asNumber(row.promotionImpressions),
      promotionClicks: asNumber(row.promotionClicks),
      landingViewsInstrumented: false,
    },
  }
}

export async function getCampaignMeasurementSummary(
  campaignId,
  executor = queryDatabase,
) {
  const result = await executor(
    `
      SELECT
        c.id,
        c.slug,
        c.paused_at AS "pausedAt",
        c.manually_ended_at AS "manuallyEndedAt",
        c.archived_at AS "archivedAt",
        cv.id AS "versionId",
        cv.version_number AS "versionNumber",
        cv.definition,
        (
          SELECT COUNT(*)
          FROM campaign_participations p
          WHERE p.campaign_id = c.id
            AND p.campaign_version_id = cv.id
        ) AS participants,
        (
          SELECT COUNT(*)
          FROM campaign_participations p
          WHERE p.campaign_id = c.id
            AND p.campaign_version_id = cv.id
            AND p.completed_at IS NOT NULL
        ) AS completed,
        (
          SELECT COUNT(*)
          FROM campaign_participations p
          WHERE p.campaign_id = c.id
            AND p.campaign_version_id = cv.id
            AND p.qualified_at IS NOT NULL
        ) AS qualified,
        (
          SELECT COUNT(*)
          FROM campaign_participations p
          WHERE p.campaign_id = c.id
            AND p.campaign_version_id = cv.id
            AND p.rewarded_at IS NOT NULL
        ) AS rewarded,
        (
          SELECT COALESCE(SUM(g.amount) FILTER (WHERE g.status = 'granted'), 0)
          FROM campaign_reward_grants g
          WHERE g.campaign_id = c.id
            AND g.campaign_version_id = cv.id
        ) AS "goinGranted",
        (
          SELECT COUNT(*) FILTER (WHERE g.status = 'granted')
          FROM campaign_reward_grants g
          WHERE g.campaign_id = c.id
            AND g.campaign_version_id = cv.id
        ) AS "grantCount",
        (
          SELECT COUNT(*) FILTER (WHERE g.status = 'failed')
          FROM campaign_reward_grants g
          WHERE g.campaign_id = c.id
            AND g.campaign_version_id = cv.id
        ) AS "failedGrantCount",
        (
          SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE SUM(b.max_amount) END
          FROM campaign_reward_budgets b
          WHERE b.campaign_version_id = cv.id
        ) AS "budgetMax",
        (
          SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE SUM(b.committed_amount) END
          FROM campaign_reward_budgets b
          WHERE b.campaign_version_id = cv.id
        ) AS "budgetCommitted",
        (
          SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE SUM(b.granted_amount) END
          FROM campaign_reward_budgets b
          WHERE b.campaign_version_id = cv.id
        ) AS "budgetGranted",
        (
          SELECT COUNT(*) FILTER (WHERE a.event_name = 'campaign_promotion_impression')
          FROM product_analytics_events a
          WHERE a.resource_type = 'campaign_promotion'
            AND a.resource_id = c.slug
            AND a.metadata ->> 'campaignVersion' = cv.version_number::text
        ) AS "promotionImpressions",
        (
          SELECT COUNT(*) FILTER (WHERE a.event_name = 'campaign_promotion_click')
          FROM product_analytics_events a
          WHERE a.resource_type = 'campaign_promotion'
            AND a.resource_id = c.slug
            AND a.metadata ->> 'campaignVersion' = cv.version_number::text
        ) AS "promotionClicks"
      FROM campaigns c
      LEFT JOIN campaign_versions cv
        ON cv.id = c.current_published_version_id
      WHERE c.id = $1
      LIMIT 1
    `,
    [campaignId],
  )

  return mapCampaignMeasurementRow(result.rows[0] ?? null)
}
