import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'

const SUMMARY_PATH = '/api/admin/growth/summary'
const ALLOWED_WINDOWS = new Set([7, 30])

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toIso(value) {
  return value?.toISOString?.() ?? null
}

function parseWindowDays(url) {
  const raw = url.searchParams.get('days')
  if (raw === null || raw === '') return 7
  if (!/^\d+$/.test(raw)) return null

  const days = Number(raw)
  return Number.isSafeInteger(days) && ALLOWED_WINDOWS.has(days)
    ? days
    : null
}

async function getSummary(days) {
  const result = await queryDatabase(
    `
      WITH bounds AS (
        SELECT
          (
            date_trunc('day', NOW() AT TIME ZONE 'UTC')
            - (($1::int - 1) * INTERVAL '1 day')
          ) AT TIME ZONE 'UTC' AS start_at,
          NOW() AS generated_at
      ),
      analytics_window AS (
        SELECT *
        FROM product_analytics_events
        WHERE received_at >= (SELECT start_at FROM bounds)
      ),
      analytics_metrics AS (
        SELECT
          COUNT(*)::int AS events,
          COUNT(DISTINCT anonymous_id)::int AS visitors,
          COUNT(DISTINCT session_id)::int AS sessions,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS authenticated_users,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_view'))::int AS prompt_views,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_copy'))::int AS prompt_copies,
          COUNT(DISTINCT session_id) FILTER (
            WHERE event_name = 'prompt_archive_view'
          )::int AS prompt_view_sessions,
          COUNT(DISTINCT session_id) FILTER (
            WHERE event_name = 'prompt_archive_copy'
          )::int AS prompt_copy_sessions,
          (COUNT(*) FILTER (WHERE event_name = 'referral_link_open'))::int AS referral_link_opens
        FROM analytics_window
      ),
      authenticated_days AS (
        SELECT
          user_id,
          COUNT(DISTINCT (received_at AT TIME ZONE 'UTC')::date)::int AS active_days
        FROM analytics_window
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ),
      returning_metrics AS (
        SELECT (COUNT(*) FILTER (WHERE active_days >= 2))::int AS returning_users
        FROM authenticated_days
      ),
      account_metrics AS (
        SELECT COUNT(*)::int AS new_accounts
        FROM users
        WHERE created_at >= (SELECT start_at FROM bounds)
      ),
      referral_metrics AS (
        SELECT COUNT(*)::int AS signups
        FROM referrals
        WHERE created_at >= (SELECT start_at FROM bounds)
      ),
      economy_window AS (
        SELECT *
        FROM user_economy_events
        WHERE created_at >= (SELECT start_at FROM bounds)
      ),
      economy_metrics AS (
        SELECT
          COALESCE(SUM(unit_delta) FILTER (WHERE unit_delta > 0), 0)::bigint AS issued,
          COALESCE(-SUM(unit_delta) FILTER (WHERE unit_delta < 0), 0)::bigint AS spent,
          COUNT(DISTINCT user_id) FILTER (WHERE unit_delta < 0)::int AS active_spenders
        FROM economy_window
      ),
      balance_metrics AS (
        SELECT
          COALESCE(SUM(balance), 0)::bigint AS outstanding,
          (COUNT(*) FILTER (WHERE balance > 0))::int AS holders
        FROM (
          SELECT user_id, SUM(unit_delta)::bigint AS balance
          FROM user_economy_events
          GROUP BY user_id
        ) balances
      ),
      unlock_metrics AS (
        SELECT COUNT(*)::int AS unlocks
        FROM user_content_unlocks
        WHERE resource_type = 'prompt_archive_item'
          AND unlocked_at >= (SELECT start_at FROM bounds)
      )
      SELECT
        analytics_metrics.events AS "trackedEvents",
        analytics_metrics.visitors AS "trackedVisitors",
        analytics_metrics.sessions AS "trackedSessions",
        analytics_metrics.authenticated_users AS "trackedAuthenticatedUsers",
        returning_metrics.returning_users AS "returningAuthenticatedUsers",
        account_metrics.new_accounts AS "newAccounts",
        analytics_metrics.prompt_views AS "promptViews",
        analytics_metrics.prompt_copies AS "promptCopies",
        analytics_metrics.prompt_view_sessions AS "promptViewSessions",
        analytics_metrics.prompt_copy_sessions AS "promptCopySessions",
        analytics_metrics.referral_link_opens AS "referralLinkOpens",
        referral_metrics.signups AS "referralSignups",
        economy_metrics.issued AS "goinIssued",
        economy_metrics.spent AS "goinSpent",
        economy_metrics.active_spenders AS "activeSpenders",
        balance_metrics.outstanding AS "goinOutstanding",
        balance_metrics.holders AS "goinHolders",
        unlock_metrics.unlocks AS "promptUnlocks",
        bounds.start_at AS "startAt",
        bounds.generated_at AS "generatedAt"
      FROM analytics_metrics
      CROSS JOIN returning_metrics
      CROSS JOIN account_metrics
      CROSS JOIN referral_metrics
      CROSS JOIN economy_metrics
      CROSS JOIN balance_metrics
      CROSS JOIN unlock_metrics
      CROSS JOIN bounds
    `,
    [days],
  )

  const row = result.rows[0] ?? {}
  const promptViewSessions = toNumber(row.promptViewSessions)
  const promptCopySessions = toNumber(row.promptCopySessions)
  const newAccounts = toNumber(row.newAccounts)
  const referralSignups = toNumber(row.referralSignups)
  const referralLinkOpens = toNumber(row.referralLinkOpens)

  return {
    audience: {
      trackedVisitors: toNumber(row.trackedVisitors),
      trackedSessions: toNumber(row.trackedSessions),
      trackedAuthenticatedUsers: toNumber(row.trackedAuthenticatedUsers),
      returningAuthenticatedUsers: toNumber(row.returningAuthenticatedUsers),
      newAccounts,
    },
    prompts: {
      views: toNumber(row.promptViews),
      copies: toNumber(row.promptCopies),
      viewSessions: promptViewSessions,
      copySessions: promptCopySessions,
      copySessionRate: promptViewSessions > 0
        ? Math.round((promptCopySessions / promptViewSessions) * 1000) / 10
        : 0,
      unlocks: toNumber(row.promptUnlocks),
    },
    referrals: {
      linkOpens: referralLinkOpens,
      signups: referralSignups,
      shareOfNewAccounts: newAccounts > 0
        ? Math.round((referralSignups / newAccounts) * 1000) / 10
        : 0,
      openToSignupRatio: referralLinkOpens > 0
        ? Math.round((referralSignups / referralLinkOpens) * 1000) / 10
        : 0,
    },
    economy: {
      issued: toNumber(row.goinIssued),
      spent: toNumber(row.goinSpent),
      netFlow: toNumber(row.goinIssued) - toNumber(row.goinSpent),
      outstanding: toNumber(row.goinOutstanding),
      holders: toNumber(row.goinHolders),
      activeSpenders: toNumber(row.activeSpenders),
    },
    trackedEvents: toNumber(row.trackedEvents),
    period: {
      days,
      startAt: toIso(row.startAt),
      generatedAt: toIso(row.generatedAt) ?? new Date().toISOString(),
    },
  }
}

async function getDailySeries(days) {
  const result = await queryDatabase(
    `
      WITH bounds AS (
        SELECT (
          date_trunc('day', NOW() AT TIME ZONE 'UTC')
          - (($1::int - 1) * INTERVAL '1 day')
        )::date AS start_day
      ),
      days AS (
        SELECT generate_series(
          (SELECT start_day FROM bounds),
          (NOW() AT TIME ZONE 'UTC')::date,
          INTERVAL '1 day'
        )::date AS day
      ),
      analytics AS (
        SELECT
          (received_at AT TIME ZONE 'UTC')::date AS day,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_view'))::int AS views,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_copy'))::int AS copies,
          (COUNT(*) FILTER (WHERE event_name = 'referral_link_open'))::int AS referral_opens
        FROM product_analytics_events
        WHERE (received_at AT TIME ZONE 'UTC')::date >= (SELECT start_day FROM bounds)
        GROUP BY 1
      ),
      referral_signups AS (
        SELECT
          (created_at AT TIME ZONE 'UTC')::date AS day,
          COUNT(*)::int AS signups
        FROM referrals
        WHERE (created_at AT TIME ZONE 'UTC')::date >= (SELECT start_day FROM bounds)
        GROUP BY 1
      ),
      economy AS (
        SELECT
          (created_at AT TIME ZONE 'UTC')::date AS day,
          COALESCE(SUM(unit_delta) FILTER (WHERE unit_delta > 0), 0)::bigint AS issued,
          COALESCE(-SUM(unit_delta) FILTER (WHERE unit_delta < 0), 0)::bigint AS spent
        FROM user_economy_events
        WHERE (created_at AT TIME ZONE 'UTC')::date >= (SELECT start_day FROM bounds)
        GROUP BY 1
      ),
      unlocks AS (
        SELECT
          (unlocked_at AT TIME ZONE 'UTC')::date AS day,
          COUNT(*)::int AS unlocks
        FROM user_content_unlocks
        WHERE resource_type = 'prompt_archive_item'
          AND (unlocked_at AT TIME ZONE 'UTC')::date >= (SELECT start_day FROM bounds)
        GROUP BY 1
      )
      SELECT
        days.day,
        COALESCE(analytics.views, 0)::int AS views,
        COALESCE(analytics.copies, 0)::int AS copies,
        COALESCE(analytics.referral_opens, 0)::int AS "referralOpens",
        COALESCE(referral_signups.signups, 0)::int AS "referralSignups",
        COALESCE(economy.issued, 0)::bigint AS issued,
        COALESCE(economy.spent, 0)::bigint AS spent,
        COALESCE(unlocks.unlocks, 0)::int AS unlocks
      FROM days
      LEFT JOIN analytics USING (day)
      LEFT JOIN referral_signups USING (day)
      LEFT JOIN economy USING (day)
      LEFT JOIN unlocks USING (day)
      ORDER BY days.day ASC
    `,
    [days],
  )

  return result.rows.map(row => ({
    day: row.day instanceof Date
      ? row.day.toISOString().slice(0, 10)
      : String(row.day).slice(0, 10),
    promptViews: toNumber(row.views),
    promptCopies: toNumber(row.copies),
    referralOpens: toNumber(row.referralOpens),
    referralSignups: toNumber(row.referralSignups),
    goinIssued: toNumber(row.issued),
    goinSpent: toNumber(row.spent),
    promptUnlocks: toNumber(row.unlocks),
  }))
}

async function getTopTags(days) {
  const result = await queryDatabase(
    `
      WITH bounds AS (
        SELECT (
          date_trunc('day', NOW() AT TIME ZONE 'UTC')
          - (($1::int - 1) * INTERVAL '1 day')
        ) AT TIME ZONE 'UTC' AS start_at
      ),
      prompt_activity AS (
        SELECT
          resource_id::integer AS public_id,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_view'))::int AS views,
          (COUNT(*) FILTER (WHERE event_name = 'prompt_archive_copy'))::int AS copies
        FROM product_analytics_events
        WHERE received_at >= (SELECT start_at FROM bounds)
          AND resource_type = 'prompt_archive_item'
          AND event_name IN ('prompt_archive_view', 'prompt_archive_copy')
          AND resource_id ~ '^[1-9][0-9]*$'
        GROUP BY resource_id::integer
      )
      SELECT
        tag.slug,
        COALESCE(SUM(prompt_activity.views), 0)::bigint AS views,
        COALESCE(SUM(prompt_activity.copies), 0)::bigint AS copies
      FROM prompt_activity
      INNER JOIN prompt_archive_items AS item
        ON item.public_id = prompt_activity.public_id
      INNER JOIN prompt_archive_item_tags AS item_tag
        ON item_tag.archive_item_id = item.id
      INNER JOIN prompt_archive_tags AS tag
        ON tag.id = item_tag.tag_id
      GROUP BY tag.slug
      ORDER BY copies DESC, views DESC, tag.slug ASC
      LIMIT 8
    `,
    [days],
  )

  return result.rows.map(row => ({
    slug: row.slug,
    views: toNumber(row.views),
    copies: toNumber(row.copies),
  }))
}

export async function handleAdminGrowthRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== SUMMARY_PATH) return false

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] growth metrics auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: 'GET' },
    )
    return true
  }

  if (!hasPermission(user, PERMISSIONS.SYSTEM_METRICS_VIEW)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  const days = parseWindowDays(url)
  if (!days) {
    sendJson(
      response,
      400,
      {
        ok: false,
        code: 'GROWTH_WINDOW_INVALID',
        message: 'days must be 7 or 30',
      },
      corsHeaders,
    )
    return true
  }

  try {
    const [summary, series, topTags] = await Promise.all([
      getSummary(days),
      getDailySeries(days),
      getTopTags(days),
    ])

    sendJson(
      response,
      200,
      {
        ok: true,
        summary,
        series,
        topTags,
        measurement: {
          scope: 'instrumented_growth_surfaces',
          analyticsEvents: [
            'prompt_archive_view',
            'prompt_archive_copy',
            'referral_link_open',
          ],
          note: 'Audience activity is based on currently instrumented growth surfaces, not whole-product DAU/MAU.',
        },
      },
      corsHeaders,
    )
  } catch (error) {
    console.error('[Prompt Draft API] growth metrics summary failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to load growth metrics' }, corsHeaders)
  }

  return true
}
