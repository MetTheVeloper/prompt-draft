import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'

const AUDIT_PATH = '/api/admin/blog/publication-audit'
const MAX_BODY_BYTES = 64 * 1024
const ACTIONS = new Set(['create', 'update', 'publish', 'unpublish'])
const STATUSES = new Set(['draft', 'published'])
const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const COMMIT_SHA_PATTERN = /^[a-f0-9]{40}$/

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value, keys) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

async function readJsonBody(request) {
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function validateBlogPublicationAuditPayload(body) {
  const keys = ['action', 'articleId', 'slug', 'status', 'commitSha', 'branch']
  if (!isPlainObject(body) || !hasExactKeys(body, keys)) return false
  if (!ACTIONS.has(body.action)) return false
  if (typeof body.articleId !== 'string' || !ARTICLE_ID_PATTERN.test(body.articleId)) return false
  if (typeof body.slug !== 'string' || !SLUG_PATTERN.test(body.slug)) return false
  if (!STATUSES.has(body.status)) return false
  if (typeof body.commitSha !== 'string' || !COMMIT_SHA_PATTERN.test(body.commitSha)) return false
  if (
    typeof body.branch !== 'string' ||
    !body.branch ||
    body.branch.length > 255 ||
    body.branch.includes('..') ||
    /[\s~^:?*\\[\]]/.test(body.branch)
  ) return false
  return true
}

async function getAuthenticatedBlogAdmin(request) {
  const { getAuthenticatedUser } = await import('./auth.mjs')
  return getAuthenticatedUser(request)
}

async function insertPublicationAudit(user, body) {
  const { queryDatabase } = await import('./database.mjs')
  await queryDatabase(
    `
      INSERT INTO admin_audit_log
        (id, actor_user_id, target_user_id, action, metadata)
      VALUES
        ($1, $2, NULL, $3, $4::jsonb)
    `,
    [
      randomUUID(),
      user.id,
      `blog.article.${body.action}`,
      JSON.stringify({
        articleId: body.articleId,
        slug: body.slug,
        status: body.status,
        commitSha: body.commitSha,
        branch: body.branch,
      }),
    ],
  )
}

export async function handleAdminBlogPublicationAuditRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== AUDIT_PATH) return false

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
    return true
  }

  let user
  try {
    user = await getAuthenticatedBlogAdmin(request)
  } catch (error) {
    console.error('[Prompt Draft API] Blog publication audit auth failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (!hasPermission(user, PERMISSIONS.BLOG_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  let body
  try {
    body = await readJsonBody(request)
  } catch {
    sendJson(response, 400, { ok: false, message: 'Request body must contain valid JSON' }, corsHeaders)
    return true
  }

  if (!validateBlogPublicationAuditPayload(body)) {
    sendJson(response, 400, { ok: false, message: 'Invalid Blog publication audit payload' }, corsHeaders)
    return true
  }

  try {
    await insertPublicationAudit(user, body)
    sendJson(response, 200, { ok: true }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] Blog publication audit insert failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to record Blog publication audit' }, corsHeaders)
  }

  return true
}
