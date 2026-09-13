import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import { createProfileRequirementPayload } from './profileRequirements.mjs'
import {
  InsufficientGoinBalanceError,
  getUserEconomyBalanceState,
  mapEconomyEvent,
  recordUserEconomyEventInTransaction as recordUserEconomyEventInTransactionCore,
} from './economyCore.mjs'

export { InsufficientGoinBalanceError }

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
const DEFAULT_ISSUANCE_RULE_VERSION = 1
const GOIN_ISSUANCE_RULE_VERSION_KEY = 'goin_issuance_rule_version'
const GOIN_ISSUANCE_SETTINGS = Object.freeze({
  accountCreated: Object.freeze({ settingKey: 'goin_issue_account_created', defaultValue: 10 }),
  profileEmailAdded: Object.freeze({ settingKey: 'goin_issue_profile_email_added', defaultValue: 10 }),
  referralJoined: Object.freeze({ settingKey: 'goin_issue_referral_joined', defaultValue: 10 }),
  referralReward: Object.freeze({ settingKey: 'goin_issue_referral_reward', defaultValue: 20 }),
  draftCreated: Object.freeze({ settingKey: 'goin_issue_draft_created', defaultValue: 0 }),
})
const PROMPT_ARCHIVE_RESOURCE_TYPE = 'prompt_archive_item'
const MAX_HISTORY_LIMIT = 100

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

async function getGoinIssuancePolicy(executor = queryDatabase) {
  const values = await Promise.all([
    getIntegerSetting(
      GOIN_ISSUANCE_RULE_VERSION_KEY,
      DEFAULT_ISSUANCE_RULE_VERSION,
      executor,
    ),
    ...Object.values(GOIN_ISSUANCE_SETTINGS).map(definition => getIntegerSetting(
      definition.settingKey,
      definition.defaultValue,
      executor,
    )),
  ])

  const [rawRuleVersion, ...rawAmounts] = values
  const policy = {
    ruleVersion: Number.isSafeInteger(rawRuleVersion) && rawRuleVersion > 0
      ? rawRuleVersion
      : DEFAULT_ISSUANCE_RULE_VERSION,
  }

  Object.keys(GOIN_ISSUANCE_SETTINGS).forEach((key, index) => {
    const definition = GOIN_ISSUANCE_SETTINGS[key]
    const value = rawAmounts[index]
    policy[key] = Number.isSafeInteger(value) && value >= 0
      ? value
      : definition.defaultValue
  })

  return policy
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

function decorateEconomyState(state, referenceValueToman) {
  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueToman,
      referenceValueKind: 'simulation_reference',
    },
    ...state,
  }
}

export async function getUserEconomyState(
  userId,
  executor = queryDatabase,
  options = {},
) {
  const state = await getUserEconomyBalanceState(userId, executor, options)
  const referenceValueToman = await getReferenceValueToman(executor)
  return decorateEconomyState(state, referenceValueToman)
}

export async function recordUserEconomyEventInTransaction(
  client,
  input,
  options = {},
) {
  const result = await recordUserEconomyEventInTransactionCore(client, input, options)
  const execute = client.query.bind(client)
  const referenceValueToman = await getReferenceValueToman(execute)
  return {
    ...result,
    economy: decorateEconomyState(result.economy, referenceValueToman),
  }
}

export async function recordUserEconomyEvent(input) {
  return withDatabaseTransaction(
    client => recordUserEconomyEventInTransaction(client, input),
  )
}

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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
        expires_at AS "expiresAt",
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
    let economyEventId = null

    if (policy.costGoin > 0) {
      const debit = await recordUserEconomyEventInTransaction(client, {
        userId,
        eventType: 'prompt_archive_unlock',
        unitDelta: -policy.costGoin,
        sourceType: PROMPT_ARCHIVE_RESOURCE_TYPE,
        sourceId: String(publicId),
        idempotencyKey: `prompt_archive_unlock:v1:${publicId}`,
        metadata: {
          ruleVersion: policy.ruleVersion,
          policyKey: ECONOMY_SETTING_KEYS.GOIN_PROMPT_ARCHIVE_UNLOCK_COST,
          publicId,
          accessKind: 'copy_unlock',
        },
      })
      economyEventId = debit.event.id
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
      const [economy, configuration] = await Promise.all([
        getUserEconomyState(user.id),
        getEconomyConfiguration(),
      ])

      sendJson(response, 200, {
        ok: true,
        economy,
        policy: {
          referenceValueToman: configuration.unit.referenceValueToman,
          referenceValueKind: configuration.unit.referenceValueKind,
          issuance: configuration.issuance,
          sinks: configuration.sinks,
        },
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
  const [referenceValueToman, issuance, promptArchiveUnlock] = await Promise.all([
    getReferenceValueToman(),
    getGoinIssuancePolicy(),
    getPromptArchiveUnlockPolicy(),
  ])

  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueToman,
      referenceValueKind: 'simulation_reference',
    },
    issuance,
    sinks: {
      ruleVersion: promptArchiveUnlock.ruleVersion,
      promptArchiveUnlock: {
        costGoin: promptArchiveUnlock.costGoin,
      },
    },
  }
}
