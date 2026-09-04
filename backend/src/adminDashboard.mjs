import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { queryDatabase } from './database.mjs'

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export async function handleAdminDashboardRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  if (url.pathname !== '/api/admin/dashboard/summary') return false

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      corsHeaders,
    )
    return true
  }

  if (!hasPermission(user, PERMISSIONS.SYSTEM_METRICS_VIEW)) {
    sendJson(
      response,
      403,
      { ok: false, message: 'Forbidden' },
      corsHeaders,
    )
    return true
  }

  try {
    const result = await queryDatabase(`
      WITH bounds AS (
        SELECT
          (date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') AS day_start_utc,
          NOW() AS generated_at
      ),
      account_metrics AS (
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended,
          COUNT(*) FILTER (
            WHERE created_at >= (SELECT day_start_utc FROM bounds)
          )::int AS new_today
        FROM users
      ),
      session_metrics AS (
        SELECT COUNT(*)::int AS active
        FROM auth_sessions
        INNER JOIN users ON users.id = auth_sessions.user_id
        WHERE auth_sessions.expires_at > NOW()
          AND users.status = 'active'
      ),
      draft_metrics AS (
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE server_updated_at >= (SELECT day_start_utc FROM bounds)
          )::int AS updated_today
        FROM prompt_drafts
      ),
      audit_metrics AS (
        SELECT COUNT(*)::int AS today
        FROM admin_audit_log
        WHERE created_at >= (SELECT day_start_utc FROM bounds)
      )
      SELECT
        account_metrics.total AS "totalUsers",
        account_metrics.active AS "activeAccounts",
        account_metrics.suspended AS "suspendedAccounts",
        account_metrics.new_today AS "newUsersToday",
        session_metrics.active AS "activeSessions",
        draft_metrics.total AS "totalCloudDrafts",
        draft_metrics.updated_today AS "cloudDraftsUpdatedToday",
        audit_metrics.today AS "adminActionsToday",
        bounds.day_start_utc AS "dayStartUtc",
        bounds.generated_at AS "generatedAt"
      FROM account_metrics
      CROSS JOIN session_metrics
      CROSS JOIN draft_metrics
      CROSS JOIN audit_metrics
      CROSS JOIN bounds
    `)

    const row = result.rows[0] ?? {}

    sendJson(
      response,
      200,
      {
        ok: true,
        summary: {
          accounts: {
            total: toNumber(row.totalUsers),
            active: toNumber(row.activeAccounts),
            suspended: toNumber(row.suspendedAccounts),
            newToday: toNumber(row.newUsersToday),
          },
          sessions: {
            active: toNumber(row.activeSessions),
          },
          cloudDrafts: {
            total: toNumber(row.totalCloudDrafts),
            updatedToday: toNumber(row.cloudDraftsUpdatedToday),
          },
          adminActions: {
            today: toNumber(row.adminActionsToday),
          },
        },
        period: {
          dayStartUtc: row.dayStartUtc?.toISOString?.() ?? null,
          generatedAt: row.generatedAt?.toISOString?.() ?? new Date().toISOString(),
        },
      },
      corsHeaders,
    )
  } catch (error) {
    console.error('[Prompt Draft API] admin dashboard summary failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to load dashboard summary' },
      corsHeaders,
    )
  }

  return true
}
