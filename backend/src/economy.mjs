import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import { createProfileRequirementPayload } from './profileRequirements.mjs'

export const ECONOMY_UNIT = Object.freeze({
  code: 'goin',
  name: 'goin',
  decimals: 0,
})

export const ECONOMY_SETTING_KEYS = Object.freeze({
  GOIN_REFERENCE_VALUE_TOMAN: 'goin_reference_value_toman',
  GOIN_PROMPT_ARCHIVE_UNLOCK_COST: 'goin_prompt_archive_unlock_cost',
  GOIN_SINK_RULE_VERSION: 'goin_sink_rule_version',
})

const DEFAULT_GOIN_REFERENCE_VALUE_TOMAN = 250
const DEFAULT_PROMPT_ARCHIVE_UNLOCK_COST = 5
const DEFAULT_SINK_RULE_VERSION = 1
const PROMPT_ARCHIVE_RESOURCE_TYPE = 'prompt_archive_item'
const MAX_EVENT_TYPE_LENGTH = 100
const MAX_IDEMPOTENCY_KEY_LENGTH = 240
const MAX_SOURCE_TYPE_LENGTH = 100
const MAX_SOURCE_ID_LENGTH = 240
const MAX_HISTORY_LIMIT = 100

export class InsufficientGoinBalanceError extends Error {
  constructor({ balance, required }) {
    super('Insufficient goin balance')
    this.name = 'InsufficientGoinBalanceError'
    this.code = 'INSUFFICIENT_GOIN_BALANCE'
    this.balance = balance
    this.required = required
  }
}

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {}
  return metadata
}

function mapEconomyEvent(row) {
  return {
    id: row.id,
    eventType: row.eventType,
    unitDelta: Number(row.unitDelta),
    sourceType: row.sourceType ?? null,
    sourceId: row.sourceId ?? null,
    sourceScoreEventId: row.sourceScoreEventId ?? null,
    idempotencyKey: row.idempotencyKey,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
  }
}

function mapUnlockRow(row) {
  if (!row) return null
  return {
    id: row.id,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    economyEventId: row.economyEventId ?? null,
    priceGoin: Number(row.priceGoin),
    pricingRuleVersion: Number(row.pricingRuleVersion),
    metadata: row.metadata ?? {},
    unlockedAt: row.unlockedAt.toISOString(),
  }
}

async function getIntegerSetting(settingKey, fallback, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT integer_value AS "integerValue"
      FROM economy_settings
      WHERE setting_key = $1
      LIMIT 1
    `,
    [settingKey],
  )

  const value = Number(result.rows[0]?.integerValue ?? fallback)
  return Number.isSafeInteger(value) ? value : fallback
}

async function getReferenceValueToman(executor = queryDatabase) {
  const value = await getIntegerSetting(
    ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN,
    DEFAULT_GOIN_REFERENCE_VALUE_TOMAN,
    executor,
  )

  return value > 0 ? value : DEFAULT_GOIN_REFERENCE_VALUE_TOMAN
}

async function getPromptArchiveUnlockPolicy(executor = queryDatabase) {
  const [costGoin, ruleVersion] = await Promise.all([
    getIntegerSetting(
      ECONOMY_SETTING_KEYS.GOIN_PROMPT_ARCHIVE_UNLOCK_COST,
      DEFAULT_PROMPT_ARCHIVE_UNLOCK_COST,
      executor,
    ),
    getIntegerSetting(
      ECONOMY_SETTING_KEYS.GOIN_SINK_RULE_VERSION,
      DEFAULT_SINK_RULE_VERSION,
      executor,
    ),
  ])

  return {
    costGoin: Number.isSafeInteger(costGoin) && costGoin >= 0
      ? costGoin
      : DEFAULT_PROMPT_ARCHIVE_UNLOCK_COST,
    ruleVersion: Number.isSafeInteger(ruleVersion) && ruleVersion > 0
      ? ruleVersion
      : DEFAULT_SINK_RULE_VERSION,
  }
}

export async function getUserEconomyState(userId, executor = queryDatabase) {
  const [ledgerResult, referenceValueToman] = await Promise.all([
    executor(
      `
        SELECT
          COALESCE(SUM(unit_delta), 0)::bigint AS balance,
          COALESCE(SUM(unit_delta) FILTER (WHERE unit_delta > 0), 0)::bigint AS "lifetimeIssued",
          COALESCE(-SUM(unit_delta) FILTER (WHERE unit_delta < 0), 0)::bigint AS "lifetimeSpent",
          COUNT(*)::int AS "transactionCount"
        FROM user_economy_events
        WHERE user_id = $1
      `,
      [userId],
    ),
    getReferenceValueToman(executor),
  ])

  const row = ledgerResult.rows[0] ?? {}

  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueToman,
      referenceValueKind: 'simulation_reference',
    },
    balance: Number(row.balance ?? 0),
    lifetimeIssued: Number(row.lifetimeIssued ?? 0),
    lifetimeSpent: Number(row.lifetimeSpent ?? 0),
    transactionCount: Number(row.transactionCount ?? 0),
  }
}

function validateEconomyEventInput({
  userId,
  eventType,
  unitDelta,
  idempotencyKey,
  sourceType,
  sourceId,
  sourceScoreEventId,
}) {
  if (!isUuid(userId)) throw new Error('Economy event requires a valid userId')
  if (typeof eventType !== 'string' || !eventType.trim() || eventType.length > MAX_EVENT_TYPE_LENGTH) {
    throw new Error(`Economy eventType must be 1-${MAX_EVENT_TYPE_LENGTH} characters`)
  }
  if (!Number.isSafeInteger(unitDelta) || unitDelta === 0) {
    throw new Error('Economy unitDelta must be a non-zero safe integer')
  }
  if (
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim() ||
    idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    throw new Error(`Economy idempotencyKey must be 1-${MAX_IDEMPOTENCY_KEY_LENGTH} characters`)
  }
  if (sourceType != null && (typeof sourceType !== 'string' || !sourceType.trim() || sourceType.length > MAX_SOURCE_TYPE_LENGTH)) {
    throw new Error(`Economy sourceType must be null or 1-${MAX_SOURCE_TYPE_LENGTH} characters`)
  }
  if (sourceId != null && (typeof sourceId !== 'string' || !sourceId.trim() || sourceId.length > MAX_SOURCE_ID_LENGTH)) {
    throw new Error(`Economy sourceId must be null or 1-${MAX_SOURCE_ID_LENGTH} characters`)
  }
  if (sourceScoreEventId != null && typeof sourceScoreEventId !== 'string') {
    throw new Error('Economy sourceScoreEventId must be null or a score event id')
  }
}

export async function recordUserEconomyEvent({
  userId,
  eventType,
  unitDelta,
  idempotencyKey,
  sourceType = null,
  sourceId = null,
  sourceScoreEventId = null,
  metadata = {},
}) {
  validateEconomyEventInput({
    userId,
    eventType,
    unitDelta,
    idempotencyKey,
    sourceType,
    sourceId,
    sourceScoreEventId,
  })

  return withDatabaseTransaction(async (client) => {
    const execute = client.query.bind(client)

    const userResult = await execute(
      `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    )
    if (!userResult.rows[0]) throw new Error('Economy user not found')

    const existingResult = await execute(
      `
        SELECT
          id,
          event_type AS "eventType",
          unit_delta AS "unitDelta",
          source_type AS "sourceType",
          source_id AS "sourceId",
          source_score_event_id AS "sourceScoreEventId",
          idempotency_key AS "idempotencyKey",
          metadata,
          created_at AS "createdAt"
        FROM user_economy_events
        WHERE user_id = $1
          AND idempotency_key = $2
        LIMIT 1
      `,
      [userId, idempotencyKey.trim()],
    )

    if (existingResult.rows[0]) {
      return {
        duplicate: true,
        event: mapEconomyEvent(existingResult.rows[0]),
        economy: await getUserEconomyState(userId, execute),
      }
    }

    if (sourceScoreEventId != null) {
      const scoreResult = await execute(
        `
          SELECT id
          FROM user_score_events
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [sourceScoreEventId, userId],
      )
      if (!scoreResult.rows[0]) {
        throw new Error('Economy source score event does not belong to user')
      }
    }

    const balanceResult = await execute(
      `
        SELECT COALESCE(SUM(unit_delta), 0)::bigint AS balance
        FROM user_economy_events
        WHERE user_id = $1
      `,
      [userId],
    )
    const balance = Number(balanceResult.rows[0]?.balance ?? 0)
    const balanceAfter = balance + unitDelta

    if (balanceAfter < 0) {
      throw new InsufficientGoinBalanceError({
        balance,
        required: Math.abs(unitDelta),
      })
    }

    const insertedResult = await execute(
      `
        INSERT INTO user_economy_events (
          id,
          user_id,
          event_type,
          unit_delta,
          source_type,
          source_id,
          source_score_event_id,
          idempotency_key,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING
          id,
          event_type AS "eventType",
          unit_delta AS "unitDelta",
          source_type AS "sourceType",
          source_id AS "sourceId",
          source_score_event_id AS "sourceScoreEventId",
          idempotency_key AS "idempotencyKey",
          metadata,
          created_at AS "createdAt"
      `,
      [
        randomUUID(),
        userId,
        eventType.trim(),
        unitDelta,
        sourceType?.trim() ?? null,
        sourceId?.trim() ?? null,
        sourceScoreEventId,
        idempotencyKey.trim(),
        JSON.stringify(normalizeMetadata(metadata)),
      ],
    )

    return {
      duplicate: false,
      event: mapEconomyEvent(insertedResult.rows[0]),
      economy: await getUserEconomyState(userId, execute),
    }
  })
}

function encodeCursor(event) {
  return Buffer.from(JSON.stringify({
    createdAt: event.createdAt,
    id: event.id,
  }), 'utf8').toString('base64url')
}

function decodeCursor(value) {
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.createdAt !== 'string' ||
      Number.isNaN(Date.parse(decoded.createdAt)) ||
      !isUuid(decoded.id)
    ) {
      return null
    }
    return {
      createdAt: new Date(decoded.createdAt).toISOString(),
      id: decoded.id,
    }
  } catch {
    return null
  }
}

function parseHistoryQuery(url) {
  const rawLimit = url.searchParams.get('limit')
  let limit = 20
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) return null
    limit = Number(rawLimit)
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) return null
  }

  const rawCursor = url.searchParams.get('cursor')
  let cursor = null
  if (rawCursor !== null) {
    cursor = rawCursor ? decodeCursor(rawCursor) : null
    if (!cursor) return null
  }

  return { limit, cursor }
}

async function listUserEconomyEvents(userId, { limit, cursor }) {
  const values = [userId]
  let cursorClause = ''

  if (cursor) {
    values.push(cursor.createdAt, cursor.id)
    cursorClause = `AND (created_at, id) < ($2::timestamptz, $3::uuid)`
  }

  values.push(limit + 1)
  const limitParameter = values.length

  const result = await queryDatabase(
    `
      SELECT
        id,
        event_type AS "eventType",
        unit_delta AS "unitDelta",
        source_type AS "sourceType",
        source_id AS "sourceId",
        source_score_event_id AS "sourceScoreEventId",
        idempotency_key AS "idempotencyKey",
        metadata,
        created_at AS "createdAt"
      FROM user_economy_events
      WHERE user_id = $1
        ${cursorClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const events = result.rows.slice(0, limit).map(mapEconomyEvent)
  const lastEvent = events.at(-1) ?? null

  return {
    events,
    pageInfo: {
      hasMore,
      nextCursor: hasMore && lastEvent ? encodeCursor(lastEvent) : null,
    },
  }
}

async function ensurePublishedArchiveItem(publicId, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT public_id AS "publicId"
      FROM prompt_archive_items
      WHERE public_id = $1
        AND status = 'published'
      LIMIT 1
    `,
    [publicId],
  )

  return result.rows[0] ?? null
}

async function getExistingPromptArchiveUnlock(userId, publicId, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        id,
        resource_type AS "resourceType",
        resource_id AS "resourceId",
        economy_event_id AS "economyEventId",
        price_goin AS "priceGoin",
        pricing_rule_version AS "pricingRuleVersion",
        metadata,
        unlocked_at AS "unlockedAt"
      FROM user_content_unlocks
      WHERE user_id = $1
        AND resource_type = $2
        AND resource_id = $3
      LIMIT 1
    `,
    [userId, PROMPT_ARCHIVE_RESOURCE_TYPE, String(publicId)],
  )

  return mapUnlockRow(result.rows[0])
}

async function getPromptArchiveUnlockState(userId, publicId) {
  const item = await ensurePublishedArchiveItem(publicId)
  if (!item) return null

  const [unlock, policy, economy] = await Promise.all([
    getExistingPromptArchiveUnlock(userId, publicId),
    getPromptArchiveUnlockPolicy(),
    getUserEconomyState(userId),
  ])

  return {
    resource: {
      type: PROMPT_ARCHIVE_RESOURCE_TYPE,
      id: String(publicId),
      publicId,
    },
    unlocked: Boolean(unlock),
    unlock,
    policy: {
      costGoin: policy.costGoin,
      ruleVersion: policy.ruleVersion,
    },
    economy,
    canAfford: Boolean(unlock) || economy.balance >= policy.costGoin,
  }
}

async function unlockPromptArchiveItem(userId, publicId) {
  return withDatabaseTransaction(async (client) => {
    const execute = client.query.bind(client)

    const userResult = await execute(
      `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    )
    if (!userResult.rows[0]) throw new Error('Economy user not found')

    const item = await ensurePublishedArchiveItem(publicId, execute)
    if (!item) return { notFound: true }

    const existingUnlock = await getExistingPromptArchiveUnlock(userId, publicId, execute)
    if (existingUnlock) {
      return {
        notFound: false,
        newlyUnlocked: false,
        alreadyUnlocked: true,
        chargedGoin: 0,
        unlock: existingUnlock,
        economy: await getUserEconomyState(userId, execute),
      }
    }

    const policy = await getPromptArchiveUnlockPolicy(execute)

    const balanceResult = await execute(
      `
        SELECT COALESCE(SUM(unit_delta), 0)::bigint AS balance
        FROM user_economy_events
        WHERE user_id = $1
      `,
      [userId],
    )
    const balance = Number(balanceResult.rows[0]?.balance ?? 0)

    if (balance < policy.costGoin) {
      throw new InsufficientGoinBalanceError({
        balance,
        required: policy.costGoin,
      })
    }

    let economyEventId = null

    if (policy.costGoin > 0) {
      economyEventId = randomUUID()
      await execute(
        `
          INSERT INTO user_economy_events (
            id,
            user_id,
            event_type,
            unit_delta,
            source_type,
            source_id,
            source_score_event_id,
            idempotency_key,
            metadata
          )
          VALUES ($1, $2, 'prompt_archive_unlock', $3, $4, $5, NULL, $6, $7::jsonb)
        `,
        [
          economyEventId,
          userId,
          -policy.costGoin,
          PROMPT_ARCHIVE_RESOURCE_TYPE,
          String(publicId),
          `prompt_archive_unlock:v1:${publicId}`,
          JSON.stringify({
            ruleVersion: policy.ruleVersion,
            policyKey: ECONOMY_SETTING_KEYS.GOIN_PROMPT_ARCHIVE_UNLOCK_COST,
            publicId,
            accessKind: 'copy_unlock',
          }),
        ],
      )
    }

    const unlockResult = await execute(
      `
        INSERT INTO user_content_unlocks (
          id,
          user_id,
          resource_type,
          resource_id,
          economy_event_id,
          price_goin,
          pricing_rule_version,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING
          id,
          resource_type AS "resourceType",
          resource_id AS "resourceId",
          economy_event_id AS "economyEventId",
          price_goin AS "priceGoin",
          pricing_rule_version AS "pricingRuleVersion",
          metadata,
          unlocked_at AS "unlockedAt"
      `,
      [
        randomUUID(),
        userId,
        PROMPT_ARCHIVE_RESOURCE_TYPE,
        String(publicId),
        economyEventId,
        policy.costGoin,
        policy.ruleVersion,
        JSON.stringify({
          publicId,
          accessKind: 'copy_unlock',
        }),
      ],
    )

    return {
      notFound: false,
      newlyUnlocked: true,
      alreadyUnlocked: false,
      chargedGoin: policy.costGoin,
      unlock: mapUnlockRow(unlockResult.rows[0]),
      economy: await getUserEconomyState(userId, execute),
    }
  })
}

function parsePromptArchiveUnlockPath(pathname) {
  const match = pathname.match(/^\/api\/economy\/unlocks\/prompt-archive\/(\d+)$/)
  if (!match) return null
  const publicId = Number(match[1])
  if (!Number.isSafeInteger(publicId) || publicId <= 0) return undefined
  return publicId
}

export async function handleEconomyRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const isStatePath = url.pathname === '/api/economy'
  const isEventsPath = url.pathname === '/api/economy/events'
  const promptArchivePublicId = parsePromptArchiveUnlockPath(url.pathname)
  const isUnlockPath = promptArchivePublicId !== null

  if (!isStatePath && !isEventsPath && !isUnlockPath) return false

  if (isUnlockPath && promptArchivePublicId === undefined) {
    sendJson(response, 400, { ok: false, message: 'Invalid Prompt Archive id' }, corsHeaders)
    return true
  }

  const allowedMethods = isUnlockPath ? new Set(['GET', 'POST']) : new Set(['GET'])
  if (!allowedMethods.has(request.method ?? '')) {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: isUnlockPath ? 'GET, POST' : 'GET' },
    )
    return true
  }

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] economy auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (isUnlockPath && !user.email) {
    sendJson(response, 403, createProfileRequirementPayload(user, ['email']), corsHeaders)
    return true
  }

  try {
    if (isStatePath) {
      sendJson(response, 200, {
        ok: true,
        economy: await getUserEconomyState(user.id),
      }, corsHeaders)
      return true
    }

    if (isEventsPath) {
      const query = parseHistoryQuery(url)
      if (!query) {
        sendJson(response, 400, { ok: false, message: 'Invalid economy history query' }, corsHeaders)
        return true
      }

      sendJson(response, 200, {
        ok: true,
        ...(await listUserEconomyEvents(user.id, query)),
      }, corsHeaders)
      return true
    }

    if (request.method === 'GET') {
      const state = await getPromptArchiveUnlockState(user.id, promptArchivePublicId)
      if (!state) {
        sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
        return true
      }

      sendJson(response, 200, { ok: true, ...state }, corsHeaders)
      return true
    }

    const result = await unlockPromptArchiveItem(user.id, promptArchivePublicId)
    if (result.notFound) {
      sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
      return true
    }

    sendJson(response, 200, {
      ok: true,
      newlyUnlocked: result.newlyUnlocked,
      alreadyUnlocked: result.alreadyUnlocked,
      chargedGoin: result.chargedGoin,
      unlock: result.unlock,
      economy: result.economy,
    }, corsHeaders)
  } catch (error) {
    if (error instanceof InsufficientGoinBalanceError) {
      sendJson(response, 409, {
        ok: false,
        code: error.code,
        message: error.message,
        balance: error.balance,
        required: error.required,
      }, corsHeaders)
      return true
    }

    console.error('[Prompt Draft API] economy request failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to process economy request' }, corsHeaders)
  }

  return true
}

export async function getEconomyConfiguration() {
  const [referenceValueToman, promptArchiveUnlock] = await Promise.all([
    getReferenceValueToman(),
    getPromptArchiveUnlockPolicy(),
  ])

  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueToman,
      referenceValueKind: 'simulation_reference',
    },
    sinks: {
      promptArchiveUnlock: {
        costGoin: promptArchiveUnlock.costGoin,
        ruleVersion: promptArchiveUnlock.ruleVersion,
      },
    },
  }
}
