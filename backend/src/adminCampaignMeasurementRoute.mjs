import { getAuthenticatedUser } from './auth.mjs'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { getCampaignMeasurementSummary } from './campaignMeasurement.mjs'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SUMMARY_ROUTE = /^\/api\/admin\/campaigns\/([0-9a-f-]{36})\/summary$/i

export async function handleAdminCampaignMeasurementRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const match = url.pathname.match(SUMMARY_ROUTE)
  if (!match || !UUID_PATTERN.test(match[1])) return false

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: 'GET' },
    )
    return true
  }

  if ([...url.searchParams.keys()].length > 0) {
    sendJson(
      response,
      400,
      {
        ok: false,
        code: 'CAMPAIGN_QUERY_INVALID',
        message: 'Campaign summary does not accept query parameters',
      },
      corsHeaders,
    )
    return true
  }

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] Campaign measurement auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (!hasPermission(user, PERMISSIONS.MARKETING_METRICS_VIEW)) {
    sendJson(
      response,
      403,
      { ok: false, code: 'CAMPAIGN_PERMISSION_DENIED', message: 'Forbidden' },
      corsHeaders,
    )
    return true
  }

  try {
    const summary = await getCampaignMeasurementSummary(match[1])
    sendJson(
      response,
      summary ? 200 : 404,
      summary
        ? { ok: true, ...summary }
        : { ok: false, code: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found' },
      corsHeaders,
    )
  } catch (error) {
    console.error('[Prompt Draft API] Campaign measurement summary failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to read Campaign measurement summary' },
      corsHeaders,
    )
  }

  return true
}
