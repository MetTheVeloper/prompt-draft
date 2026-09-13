import { queryDatabase } from './database.mjs'
import { getCampaignMetric } from './campaignRegistry.mjs'

function normalizeDate(value, label) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`)
  return date
}

function minDate(first, second) {
  return first.getTime() <= second.getTime() ? first : second
}

export function getCampaignMetricWindow({
  window,
  definition,
  participation = null,
  asOf = new Date(),
}) {
  const end = normalizeDate(asOf, 'Campaign metric asOf')
  if (window === 'lifetime') return { startAt: null, endAt: end }

  if (window === 'campaign') {
    const startsAt = normalizeDate(definition.lifecycle.startsAt, 'Campaign lifecycle startsAt')
    const configuredEnd = definition.lifecycle.endsAt
      ? normalizeDate(definition.lifecycle.endsAt, 'Campaign lifecycle endsAt')
      : end
    return { startAt: startsAt, endAt: minDate(configuredEnd, end) }
  }

  if (window === 'since_participation') {
    if (!participation?.startedAt) return { startAt: end, endAt: end, empty: true }
    return {
      startAt: normalizeDate(participation.startedAt, 'Campaign participation startedAt'),
      endAt: end,
    }
  }

  throw new Error(`Unsupported Campaign metric window: ${window}`)
}

async function countInWindow(executor, sql, values, { startAt, endAt, empty }) {
  if (empty || (startAt && startAt.getTime() > endAt.getTime())) return 0
  const result = await executor(sql, [
    ...values,
    startAt?.toISOString?.() ?? null,
    endAt.toISOString(),
  ])
  return Number(result.rows[0]?.count ?? 0)
}

export async function resolveCampaignMetric({
  metricKey,
  window,
  userId,
  definition,
  participation = null,
  executor = queryDatabase,
  asOf = new Date(),
}) {
  const registry = getCampaignMetric(metricKey)
  if (!registry) throw new Error(`Unknown Campaign metric: ${metricKey}`)
  if (!registry.supportedWindows.includes(window)) {
    throw new Error(`Unsupported window ${window} for Campaign metric ${metricKey}`)
  }

  const bounds = getCampaignMetricWindow({ window, definition, participation, asOf })

  if (metricKey === 'referrals.completed.count') {
    return countInWindow(
      executor,
      `
        SELECT COUNT(*)::int AS count
        FROM referrals
        WHERE referrer_user_id = $1
          AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
          AND created_at <= $3::timestamptz
      `,
      [userId],
      bounds,
    )
  }

  if (metricKey === 'prompts.unlocked.count') {
    return countInWindow(
      executor,
      `
        SELECT COUNT(*)::int AS count
        FROM user_content_unlocks
        WHERE user_id = $1
          AND resource_type = 'prompt_archive_item'
          AND ($2::timestamptz IS NULL OR unlocked_at >= $2::timestamptz)
          AND unlocked_at <= $3::timestamptz
      `,
      [userId],
      bounds,
    )
  }

  if (metricKey === 'drafts.public.count') {
    return countInWindow(
      executor,
      `
        SELECT COUNT(*)::int AS count
        FROM prompt_drafts
        WHERE user_id = $1
          AND visibility = 'public'
          AND deleted_at IS NULL
          AND published_at IS NOT NULL
          AND ($2::timestamptz IS NULL OR published_at >= $2::timestamptz)
          AND published_at <= $3::timestamptz
      `,
      [userId],
      bounds,
    )
  }

  if (metricKey === 'prompts.created.count') {
    return countInWindow(
      executor,
      `
        SELECT COUNT(*)::int AS count
        FROM prompt_drafts
        WHERE user_id = $1
          AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
          AND created_at <= $3::timestamptz
      `,
      [userId],
      bounds,
    )
  }

  throw new Error(`Campaign metric resolver is not implemented: ${metricKey}`)
}

export function listRuleMetricReferences(rule, output = new Map()) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return output
  if (rule.type === 'all' || rule.type === 'any') {
    for (const child of rule.rules ?? []) listRuleMetricReferences(child, output)
    return output
  }
  if (rule.type === 'not') return listRuleMetricReferences(rule.rule, output)
  if (rule.type === 'condition' && rule.condition?.source === 'metric') {
    const key = `${rule.condition.metricKey}:${rule.condition.window}`
    output.set(key, {
      metricKey: rule.condition.metricKey,
      window: rule.condition.window,
    })
  }
  return output
}
