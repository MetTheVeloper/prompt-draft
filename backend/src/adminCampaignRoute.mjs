import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import {
  hashCampaignDefinition,
  validateCampaignDefinition,
  validateCampaignHeadInput,
} from './campaignDefinition.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import { deriveCampaignEffectiveStatus } from './campaignRuntimeShared.mjs'

const PREFIX = '/api/admin/campaigns'
const MAX_BODY_BYTES = 512 * 1024
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STATUSES = new Set(['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'])

class CampaignAdminError extends Error {
  constructor(code, message, status = 400, details = {}) {
    super(message)
    this.name = 'CampaignAdminError'
    this.code = code
    this.status = status
    Object.assign(this, details)
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isJsonRequest(request) {
  return String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new CampaignAdminError(
      'CAMPAIGN_BODY_TOO_LARGE',
      'Campaign admin request body is too large',
      413,
    )
  }

  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      throw new CampaignAdminError(
        'CAMPAIGN_BODY_TOO_LARGE',
        'Campaign admin request body is too large',
        413,
      )
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new CampaignAdminError(
      'CAMPAIGN_INVALID_JSON',
      'Request body must contain valid JSON',
      400,
    )
  }
}

function assertAllowedFields(body, allowed) {
  if (!isObject(body)) {
    throw new CampaignAdminError(
      'CAMPAIGN_DEFINITION_INVALID',
      'JSON body must be an object',
      400,
    )
  }
  const unknown = Object.keys(body).find(key => !allowed.has(key))
  if (unknown) {
    throw new CampaignAdminError(
      'CAMPAIGN_DEFINITION_INVALID',
      `Unsupported Campaign admin field: ${unknown}`,
      400,
    )
  }
}

function requirePositiveRevision(value, field = 'expectedRevision') {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new CampaignAdminError(
      'CAMPAIGN_DEFINITION_INVALID',
      `${field} must be a positive integer`,
      400,
    )
  }
  return value
}

function encodeCursor(row) {
  return Buffer.from(JSON.stringify({
    updatedAt: row.cursorUpdatedAt,
    id: row.id,
  }), 'utf8').toString('base64url')
}

function decodeCursor(value) {
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (
      !isObject(cursor) ||
      typeof cursor.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(cursor.updatedAt)) ||
      typeof cursor.id !== 'string' ||
      !UUID_PATTERN.test(cursor.id)
    ) return null
    return cursor
  } catch {
    return null
  }
}

function parseListQuery(url) {
  const allowed = new Set(['status', 'limit', 'cursor'])
  if ([...url.searchParams.keys()].some(key => !allowed.has(key))) {
    throw new CampaignAdminError(
      'CAMPAIGN_QUERY_INVALID',
      'Invalid Campaign list query',
      400,
    )
  }

  const rawLimit = url.searchParams.get('limit')
  const limit = rawLimit === null ? 30 : Number(rawLimit)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new CampaignAdminError(
      'CAMPAIGN_QUERY_INVALID',
      'limit must be an integer between 1 and 100',
      400,
    )
  }

  const status = url.searchParams.get('status') || null
  if (status && !STATUSES.has(status)) {
    throw new CampaignAdminError(
      'CAMPAIGN_QUERY_INVALID',
      'status is invalid',
      400,
    )
  }

  const rawCursor = url.searchParams.get('cursor')
  const cursor = rawCursor ? decodeCursor(rawCursor) : null
  if (rawCursor && !cursor) {
    throw new CampaignAdminError(
      'CAMPAIGN_QUERY_INVALID',
      'cursor is invalid',
      400,
    )
  }

  return { limit, status, cursor }
}

function asIso(value) {
  return value?.toISOString?.() ?? value ?? null
}

function mapCampaignRow(row) {
  const definition = row.publishedDefinition ?? null
  const status = deriveCampaignEffectiveStatus({
    definition,
    pausedAt: row.pausedAt,
    manuallyEndedAt: row.manuallyEndedAt,
    archivedAt: row.archivedAt,
  })

  return {
    id: row.id,
    slug: row.slug,
    internalName: row.internalName,
    status,
    currentVersion: row.currentVersion == null ? null : Number(row.currentVersion),
    draftRevision: Number(row.draftRevision),
    startsAt: definition?.lifecycle?.startsAt ?? null,
    endsAt: definition?.lifecycle?.endsAt ?? null,
    participants: Number(row.participants ?? 0),
    completed: Number(row.completed ?? 0),
    goinGranted: Number(row.goinGranted ?? 0),
    rewardBudgetRemaining: row.rewardBudgetRemaining == null
      ? null
      : Number(row.rewardBudgetRemaining),
    updatedAt: asIso(row.updatedAt),
  }
}

async function auditCampaignMutation(client, actor, action, metadata) {
  await client.query(
    `
      INSERT INTO admin_audit_log (id, actor_user_id, target_user_id, action, metadata)
      VALUES ($1, $2, NULL, $3, $4::jsonb)
    `,
    [randomUUID(), actor.id, action, JSON.stringify(metadata)],
  )
}

async function listCampaigns(params) {
  const values = []
  const filters = []

  if (params.cursor) {
    values.push(params.cursor.updatedAt, params.cursor.id)
    filters.push(`(rows."updatedAt", rows.id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`)
  }
  if (params.status) {
    values.push(params.status)
    filters.push(`rows.status = $${values.length}`)
  }

  values.push(params.limit + 1)
  const limitParameter = values.length
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const result = await queryDatabase(
    `
      WITH rows AS (
        SELECT
          c.id,
          c.slug,
          c.internal_name AS "internalName",
          c.draft_revision AS "draftRevision",
          c.paused_at AS "pausedAt",
          c.manually_ended_at AS "manuallyEndedAt",
          c.archived_at AS "archivedAt",
          c.updated_at AS "updatedAt",
          to_char(c.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "cursorUpdatedAt",
          cv.version_number AS "currentVersion",
          cv.definition AS "publishedDefinition",
          CASE
            WHEN c.current_published_version_id IS NULL THEN 'draft'
            WHEN c.archived_at IS NOT NULL THEN 'archived'
            WHEN c.manually_ended_at IS NOT NULL THEN 'ended'
            WHEN NULLIF(cv.definition #>> '{lifecycle,endsAt}', '') IS NOT NULL
              AND (cv.definition #>> '{lifecycle,endsAt}')::timestamptz <= NOW() THEN 'ended'
            WHEN c.paused_at IS NOT NULL THEN 'paused'
            WHEN NULLIF(cv.definition #>> '{lifecycle,startsAt}', '') IS NOT NULL
              AND (cv.definition #>> '{lifecycle,startsAt}')::timestamptz > NOW() THEN 'scheduled'
            ELSE 'active'
          END AS status,
          (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id) AS participants,
          (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id AND p.completed_at IS NOT NULL) AS completed,
          (SELECT COALESCE(SUM(g.amount), 0) FROM campaign_reward_grants g WHERE g.campaign_id = c.id AND g.status = 'granted') AS "goinGranted",
          (
            SELECT CASE
              WHEN COUNT(*) = 0 THEN NULL
              ELSE SUM(b.max_amount - b.committed_amount)
            END
            FROM campaign_reward_budgets b
            WHERE b.campaign_version_id = c.current_published_version_id
          ) AS "rewardBudgetRemaining"
        FROM campaigns c
        LEFT JOIN campaign_versions cv ON cv.id = c.current_published_version_id
      )
      SELECT *
      FROM rows
      ${whereClause}
      ORDER BY "updatedAt" DESC, id DESC
      LIMIT $${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > params.limit
  const pageRows = result.rows.slice(0, params.limit)
  const last = pageRows.at(-1)
  return {
    campaigns: pageRows.map(mapCampaignRow),
    pageInfo: {
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last) : null,
    },
  }
}

async function getCampaignDetail(id, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        c.id,
        c.slug,
        c.internal_name AS "internalName",
        c.draft_definition AS "draftDefinition",
        c.draft_revision AS "draftRevision",
        c.paused_at AS "pausedAt",
        c.manually_ended_at AS "manuallyEndedAt",
        c.archived_at AS "archivedAt",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        cv.id AS "publishedVersionId",
        cv.version_number AS "currentVersion",
        cv.schema_version AS "publishedSchemaVersion",
        cv.definition AS "publishedDefinition",
        cv.definition_hash AS "publishedDefinitionHash",
        cv.published_at AS "publishedAt",
        (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id) AS participants,
        (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id AND p.completed_at IS NOT NULL) AS completed,
        (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id AND p.qualified_at IS NOT NULL) AS qualified,
        (SELECT COUNT(*) FROM campaign_participations p WHERE p.campaign_id = c.id AND p.rewarded_at IS NOT NULL) AS rewarded,
        (SELECT COALESCE(SUM(g.amount), 0) FROM campaign_reward_grants g WHERE g.campaign_id = c.id AND g.status = 'granted') AS "goinGranted"
      FROM campaigns c
      LEFT JOIN campaign_versions cv ON cv.id = c.current_published_version_id
      WHERE c.id = $1
      LIMIT 1
    `,
    [id],
  )
  const row = result.rows[0]
  if (!row) return null

  const draftValidation = validateCampaignDefinition(row.draftDefinition, {
    mode: 'publish',
    headSlug: row.slug,
  })
  const status = deriveCampaignEffectiveStatus({
    definition: row.publishedDefinition,
    pausedAt: row.pausedAt,
    manuallyEndedAt: row.manuallyEndedAt,
    archivedAt: row.archivedAt,
  })

  return {
    id: row.id,
    slug: row.slug,
    internalName: row.internalName,
    status,
    draftDefinition: row.draftDefinition,
    draftRevision: Number(row.draftRevision),
    validation: draftValidation,
    publishedVersion: row.publishedVersionId
      ? {
          id: row.publishedVersionId,
          version: Number(row.currentVersion),
          schemaVersion: row.publishedSchemaVersion,
          definition: row.publishedDefinition,
          definitionHash: row.publishedDefinitionHash,
          publishedAt: asIso(row.publishedAt),
        }
      : null,
    lifecycleOverrides: {
      pausedAt: asIso(row.pausedAt),
      manuallyEndedAt: asIso(row.manuallyEndedAt),
      archivedAt: asIso(row.archivedAt),
    },
    summary: {
      participants: Number(row.participants ?? 0),
      completed: Number(row.completed ?? 0),
      qualified: Number(row.qualified ?? 0),
      rewarded: Number(row.rewarded ?? 0),
      goinGranted: Number(row.goinGranted ?? 0),
    },
    createdAt: asIso(row.createdAt),
    updatedAt: asIso(row.updatedAt),
  }
}

async function createCampaign(actor, body) {
  assertAllowedFields(body, new Set(['slug', 'internalName', 'definition']))
  const headErrors = validateCampaignHeadInput({
    slug: body.slug,
    internalName: body.internalName,
  })
  const definition = body.definition ?? {}
  const draftValidation = validateCampaignDefinition(definition, {
    mode: 'draft',
    headSlug: body.slug,
  })
  const errors = [...headErrors, ...draftValidation.errors]
  if (errors.length) {
    throw new CampaignAdminError(
      'CAMPAIGN_DEFINITION_INVALID',
      'Campaign draft is structurally invalid',
      400,
      { errors },
    )
  }

  const id = randomUUID()
  try {
    await withDatabaseTransaction(async client => {
      await client.query(
        `
          INSERT INTO campaigns (
            id, slug, internal_name, draft_definition, draft_revision,
            created_by, updated_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4::jsonb, 1, $5, $5, NOW(), NOW())
        `,
        [id, body.slug, body.internalName.trim(), JSON.stringify(definition), actor.id],
      )
      await auditCampaignMutation(client, actor, 'marketing.campaign_created', {
        campaignId: id,
        slug: body.slug,
        draftRevision: 1,
      })
    })
  } catch (error) {
    if (error?.code === '23505') {
      throw new CampaignAdminError(
        'CAMPAIGN_SLUG_CONFLICT',
        'Campaign slug already exists',
        409,
      )
    }
    throw error
  }

  return getCampaignDetail(id)
}

async function updateDraft(actor, id, body) {
  assertAllowedFields(body, new Set(['expectedRevision', 'definition']))
  const expectedRevision = requirePositiveRevision(body.expectedRevision)
  if (!isObject(body.definition)) {
    throw new CampaignAdminError(
      'CAMPAIGN_DEFINITION_INVALID',
      'definition must be an object',
      400,
    )
  }

  return withDatabaseTransaction(async client => {
    const result = await client.query(
      `
        SELECT id, slug, draft_definition AS "draftDefinition", draft_revision AS "draftRevision"
        FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const campaign = result.rows[0]
    if (!campaign) {
      throw new CampaignAdminError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404)
    }
    if (Number(campaign.draftRevision) !== expectedRevision) {
      throw new CampaignAdminError(
        'CAMPAIGN_DRAFT_REVISION_CONFLICT',
        'Campaign draft revision is stale',
        409,
        { currentRevision: Number(campaign.draftRevision) },
      )
    }

    const draftValidation = validateCampaignDefinition(body.definition, {
      mode: 'draft',
      headSlug: campaign.slug,
    })
    if (draftValidation.errors.length) {
      throw new CampaignAdminError(
        'CAMPAIGN_DEFINITION_INVALID',
        'Campaign draft is structurally invalid',
        400,
        { errors: draftValidation.errors },
      )
    }

    const changed = hashCampaignDefinition(campaign.draftDefinition) !== hashCampaignDefinition(body.definition)
    if (!changed) {
      const publishValidation = validateCampaignDefinition(body.definition, {
        mode: 'publish',
        headSlug: campaign.slug,
      })
      return {
        changed: false,
        draftRevision: Number(campaign.draftRevision),
        validation: publishValidation,
      }
    }

    const nextRevision = Number(campaign.draftRevision) + 1
    await client.query(
      `
        UPDATE campaigns
        SET draft_definition = $2::jsonb,
            draft_revision = $3,
            updated_by = $4,
            updated_at = NOW()
        WHERE id = $1
      `,
      [id, JSON.stringify(body.definition), nextRevision, actor.id],
    )
    await auditCampaignMutation(client, actor, 'marketing.campaign_draft_updated', {
      campaignId: id,
      fromRevision: Number(campaign.draftRevision),
      toRevision: nextRevision,
    })

    const publishValidation = validateCampaignDefinition(body.definition, {
      mode: 'publish',
      headSlug: campaign.slug,
    })
    return { changed: true, draftRevision: nextRevision, validation: publishValidation }
  })
}

async function validateDraft(id, body) {
  assertAllowedFields(body, new Set(['expectedRevision']))
  const expectedRevision = requirePositiveRevision(body.expectedRevision)
  const result = await queryDatabase(
    `
      SELECT slug, draft_definition AS "draftDefinition", draft_revision AS "draftRevision"
      FROM campaigns
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )
  const campaign = result.rows[0]
  if (!campaign) throw new CampaignAdminError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404)
  if (Number(campaign.draftRevision) !== expectedRevision) {
    throw new CampaignAdminError(
      'CAMPAIGN_DRAFT_REVISION_CONFLICT',
      'Campaign draft revision is stale',
      409,
      { currentRevision: Number(campaign.draftRevision) },
    )
  }
  return validateCampaignDefinition(campaign.draftDefinition, {
    mode: 'publish',
    headSlug: campaign.slug,
  })
}

async function publishCampaign(actor, id, body) {
  assertAllowedFields(body, new Set(['expectedDraftRevision', 'idempotencyKey']))
  const expectedRevision = requirePositiveRevision(
    body.expectedDraftRevision,
    'expectedDraftRevision',
  )
  if (
    typeof body.idempotencyKey !== 'string' ||
    !body.idempotencyKey.trim() ||
    body.idempotencyKey.trim().length > 240
  ) {
    throw new CampaignAdminError(
      'CAMPAIGN_PUBLISH_CONFLICT',
      'idempotencyKey must be 1-240 characters',
      400,
    )
  }
  const idempotencyKey = body.idempotencyKey.trim()

  const published = await withDatabaseTransaction(async client => {
    const result = await client.query(
      `
        SELECT
          id, slug, draft_definition AS "draftDefinition",
          draft_revision AS "draftRevision"
        FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const campaign = result.rows[0]
    if (!campaign) throw new CampaignAdminError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404)
    if (Number(campaign.draftRevision) !== expectedRevision) {
      throw new CampaignAdminError(
        'CAMPAIGN_DRAFT_REVISION_CONFLICT',
        'Campaign draft revision is stale',
        409,
        { currentRevision: Number(campaign.draftRevision) },
      )
    }

    const validation = validateCampaignDefinition(campaign.draftDefinition, {
      mode: 'publish',
      headSlug: campaign.slug,
    })
    if (!validation.publishable) {
      throw new CampaignAdminError(
        'CAMPAIGN_DEFINITION_INVALID',
        'Campaign definition is not publishable',
        400,
        { errors: validation.errors, warnings: validation.warnings },
      )
    }

    const definitionHash = hashCampaignDefinition(campaign.draftDefinition)
    const existingResult = await client.query(
      `
        SELECT id, version_number AS "versionNumber", definition_hash AS "definitionHash"
        FROM campaign_versions
        WHERE campaign_id = $1 AND publish_idempotency_key = $2
        LIMIT 1
      `,
      [id, idempotencyKey],
    )
    const existing = existingResult.rows[0]
    if (existing) {
      if (existing.definitionHash !== definitionHash) {
        throw new CampaignAdminError(
          'CAMPAIGN_PUBLISH_CONFLICT',
          'Publish idempotency key conflicts with a different definition',
          409,
        )
      }
      return { duplicate: true, versionId: existing.id, version: Number(existing.versionNumber) }
    }

    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version_number), 0)::integer + 1 AS "nextVersion" FROM campaign_versions WHERE campaign_id = $1`,
      [id],
    )
    const version = Number(versionResult.rows[0].nextVersion)
    const versionId = randomUUID()

    await client.query(
      `
        INSERT INTO campaign_versions (
          id, campaign_id, version_number, schema_version, definition,
          definition_hash, publish_idempotency_key, published_by, published_at, created_at
        )
        VALUES ($1, $2, $3, 'campaign.v1', $4::jsonb, $5, $6, $7, NOW(), NOW())
      `,
      [
        versionId,
        id,
        version,
        JSON.stringify(campaign.draftDefinition),
        definitionHash,
        idempotencyKey,
        actor.id,
      ],
    )

    for (const reward of campaign.draftDefinition.rewards ?? []) {
      if (!reward?.budget || !Number.isSafeInteger(reward.budget.maxAmount)) continue
      await client.query(
        `
          INSERT INTO campaign_reward_budgets (
            campaign_version_id, reward_definition_id, max_amount,
            committed_amount, granted_amount, grant_count, updated_at
          )
          VALUES ($1, $2, $3, 0, 0, 0, NOW())
        `,
        [versionId, reward.id, reward.budget.maxAmount],
      )
    }

    await client.query(
      `
        UPDATE campaigns
        SET current_published_version_id = $2,
            paused_at = NULL,
            manually_ended_at = NULL,
            archived_at = NULL,
            updated_by = $3,
            updated_at = NOW()
        WHERE id = $1
      `,
      [id, versionId, actor.id],
    )
    await auditCampaignMutation(client, actor, 'marketing.campaign_published', {
      campaignId: id,
      campaignVersionId: versionId,
      version,
      draftRevision: Number(campaign.draftRevision),
      definitionHash,
    })

    return { duplicate: false, versionId, version }
  })

  const detail = await getCampaignDetail(id)
  return {
    duplicate: published.duplicate,
    campaign: {
      id: detail.id,
      slug: detail.slug,
      version: published.version,
      status: detail.status,
    },
  }
}

async function mutateLifecycle(actor, id, action) {
  await withDatabaseTransaction(async client => {
    const result = await client.query(
      `
        SELECT
          c.id,
          c.paused_at AS "pausedAt",
          c.manually_ended_at AS "manuallyEndedAt",
          c.archived_at AS "archivedAt",
          cv.definition AS "publishedDefinition"
        FROM campaigns c
        LEFT JOIN campaign_versions cv ON cv.id = c.current_published_version_id
        WHERE c.id = $1
        FOR UPDATE OF c
      `,
      [id],
    )
    const campaign = result.rows[0]
    if (!campaign) throw new CampaignAdminError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404)
    if (!campaign.publishedDefinition) {
      throw new CampaignAdminError(
        'CAMPAIGN_PUBLISH_CONFLICT',
        'Campaign must be published before lifecycle operations',
        409,
      )
    }

    const currentStatus = deriveCampaignEffectiveStatus({
      definition: campaign.publishedDefinition,
      pausedAt: campaign.pausedAt,
      manuallyEndedAt: campaign.manuallyEndedAt,
      archivedAt: campaign.archivedAt,
    })

    if (action === 'pause') {
      if (!['active', 'scheduled'].includes(currentStatus)) {
        throw new CampaignAdminError('CAMPAIGN_PUBLISH_CONFLICT', 'Campaign cannot be paused from its current status', 409)
      }
      await client.query(`UPDATE campaigns SET paused_at = NOW(), updated_by = $2, updated_at = NOW() WHERE id = $1`, [id, actor.id])
    } else if (action === 'resume') {
      if (currentStatus !== 'paused') {
        throw new CampaignAdminError('CAMPAIGN_PUBLISH_CONFLICT', 'Only a paused Campaign can be resumed', 409)
      }
      await client.query(`UPDATE campaigns SET paused_at = NULL, updated_by = $2, updated_at = NOW() WHERE id = $1`, [id, actor.id])
    } else if (action === 'end') {
      if (currentStatus === 'archived') {
        throw new CampaignAdminError('CAMPAIGN_PUBLISH_CONFLICT', 'Archived Campaign cannot be ended', 409)
      }
      if (currentStatus !== 'ended') {
        await client.query(`UPDATE campaigns SET manually_ended_at = NOW(), paused_at = NULL, updated_by = $2, updated_at = NOW() WHERE id = $1`, [id, actor.id])
      }
    } else if (action === 'archive') {
      if (currentStatus !== 'archived') {
        await client.query(`UPDATE campaigns SET archived_at = NOW(), paused_at = NULL, updated_by = $2, updated_at = NOW() WHERE id = $1`, [id, actor.id])
      }
    }

    await auditCampaignMutation(client, actor, `marketing.campaign_${action}d`, {
      campaignId: id,
      fromStatus: currentStatus,
    })
  })
  return getCampaignDetail(id)
}

function permissionForRoute(route, method) {
  if (route.kind === 'collection' && method === 'GET') return PERMISSIONS.MARKETING_CAMPAIGNS_VIEW
  if (route.kind === 'collection' && method === 'POST') return PERMISSIONS.MARKETING_CAMPAIGNS_MANAGE
  if (route.kind === 'detail' && method === 'GET') return PERMISSIONS.MARKETING_CAMPAIGNS_VIEW
  if (route.kind === 'draft' || route.kind === 'validate') return PERMISSIONS.MARKETING_CAMPAIGNS_MANAGE
  if (['publish', 'pause', 'resume', 'end', 'archive'].includes(route.kind)) return PERMISSIONS.MARKETING_CAMPAIGNS_PUBLISH
  return null
}

function parseRoute(pathname) {
  if (pathname === PREFIX) return { kind: 'collection', id: null }
  const match = pathname.match(/^\/api\/admin\/campaigns\/([0-9a-f-]{36})(?:\/(draft|validate|publish|pause|resume|end|archive))?$/i)
  if (!match || !UUID_PATTERN.test(match[1])) return null
  return { kind: match[2] ?? 'detail', id: match[1] }
}

function expectedMethod(route) {
  if (route.kind === 'collection') return 'GET, POST'
  if (route.kind === 'detail') return 'GET'
  if (route.kind === 'draft') return 'PUT'
  return 'POST'
}

function methodAllowed(route, method) {
  if (route.kind === 'collection') return method === 'GET' || method === 'POST'
  if (route.kind === 'detail') return method === 'GET'
  if (route.kind === 'draft') return method === 'PUT'
  return method === 'POST'
}

function sendError(error, response, sendJson, corsHeaders) {
  if (error instanceof CampaignAdminError) {
    sendJson(response, error.status, {
      ok: false,
      code: error.code,
      message: error.message,
      ...(Array.isArray(error.errors) ? { errors: error.errors } : {}),
      ...(Array.isArray(error.warnings) ? { warnings: error.warnings } : {}),
      ...(Number.isSafeInteger(error.currentRevision)
        ? { currentRevision: error.currentRevision }
        : {}),
    }, corsHeaders)
    return
  }
  console.error('[Prompt Draft API] Campaign admin request failed', error)
  sendJson(response, 500, { ok: false, message: 'Failed to process Campaign admin request' }, corsHeaders)
}

export async function handleAdminCampaignRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return false

  const route = parseRoute(url.pathname)
  if (!route) {
    sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
    return true
  }
  if (!methodAllowed(route, request.method)) {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: expectedMethod(route) },
    )
    return true
  }

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] Campaign admin auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }
  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  const permission = permissionForRoute(route, request.method)
  if (!permission || !hasPermission(user, permission)) {
    sendJson(response, 403, { ok: false, code: 'CAMPAIGN_PERMISSION_DENIED', message: 'Forbidden' }, corsHeaders)
    return true
  }

  try {
    if (route.kind === 'collection' && request.method === 'GET') {
      const params = parseListQuery(url)
      sendJson(response, 200, { ok: true, ...(await listCampaigns(params)) }, corsHeaders)
      return true
    }

    if (route.kind === 'detail') {
      const campaign = await getCampaignDetail(route.id)
      sendJson(
        response,
        campaign ? 200 : 404,
        campaign
          ? { ok: true, campaign }
          : { ok: false, code: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found' },
        corsHeaders,
      )
      return true
    }

    if (!isJsonRequest(request)) {
      sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
      return true
    }
    const body = await readJsonBody(request)

    if (route.kind === 'collection') {
      const campaign = await createCampaign(user, body)
      sendJson(response, 201, { ok: true, campaign }, corsHeaders)
      return true
    }
    if (route.kind === 'draft') {
      sendJson(response, 200, { ok: true, ...(await updateDraft(user, route.id, body)) }, corsHeaders)
      return true
    }
    if (route.kind === 'validate') {
      const validation = await validateDraft(route.id, body)
      sendJson(response, 200, { ok: true, ...validation }, corsHeaders)
      return true
    }
    if (route.kind === 'publish') {
      sendJson(response, 200, { ok: true, published: true, ...(await publishCampaign(user, route.id, body)) }, corsHeaders)
      return true
    }

    assertAllowedFields(body, new Set())
    const campaign = await mutateLifecycle(user, route.id, route.kind)
    sendJson(response, 200, { ok: true, campaign }, corsHeaders)
    return true
  } catch (error) {
    sendError(error, response, sendJson, corsHeaders)
    return true
  }
}
