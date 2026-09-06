import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { getAuthenticatedUser } from './auth.mjs'
import { ECONOMY_SETTING_KEYS, ECONOMY_UNIT } from './economy.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'

const SETTINGS_PATH = '/api/admin/economy/settings'
const MAX_BODY_BYTES = 4 * 1024
const MIN_REFERENCE_VALUE_TOMAN = 1
const MAX_REFERENCE_VALUE_TOMAN = 1_000_000_000
const MIN_ISSUANCE_AMOUNT = 0
const MAX_ISSUANCE_AMOUNT = 1_000_000_000
const GOIN_ISSUANCE_RULE_VERSION_KEY = 'goin_issuance_rule_version'

const ISSUANCE_SETTINGS = Object.freeze({
  accountCreated: Object.freeze({
    settingKey: 'goin_issue_account_created',
    defaultValue: 10,
  }),
  profileEmailAdded: Object.freeze({
    settingKey: 'goin_issue_profile_email_added',
    defaultValue: 10,
  }),
  referralJoined: Object.freeze({
    settingKey: 'goin_issue_referral_joined',
    defaultValue: 10,
  }),
  referralReward: Object.freeze({
    settingKey: 'goin_issue_referral_reward',
    defaultValue: 20,
  }),
  draftCreated: Object.freeze({
    settingKey: 'goin_issue_draft_created',
    defaultValue: 0,
  }),
})

const ALL_SETTING_KEYS = Object.freeze([
  ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN,
  GOIN_ISSUANCE_RULE_VERSION_KEY,
  ...Object.values(ISSUANCE_SETTINGS).map(definition => definition.settingKey),
])

function isJsonRequest(request) {
  const contentType = String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  return contentType === 'application/json'
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    const error = new Error('Economy settings payload is too large')
    error.code = 'ECONOMY_SETTINGS_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error('Economy settings payload is too large')
      error.code = 'ECONOMY_SETTINGS_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must contain valid JSON')
    error.code = 'ECONOMY_SETTINGS_INVALID_JSON'
    throw error
  }
}

async function readIntegerSettings(executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        setting_key AS "settingKey",
        integer_value AS "integerValue",
        updated_by AS "updatedBy",
        updated_at AS "updatedAt"
      FROM economy_settings
      WHERE setting_key = ANY($1::text[])
    `,
    [ALL_SETTING_KEYS],
  )

  return new Map(result.rows.map(row => [row.settingKey, row]))
}

async function getSettings(executor = queryDatabase) {
  const rows = await readIntegerSettings(executor)
  const referenceRow = rows.get(ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN)
  const ruleVersionRow = rows.get(GOIN_ISSUANCE_RULE_VERSION_KEY)

  const issuance = {
    ruleVersion: Number(ruleVersionRow?.integerValue ?? 1),
  }

  for (const [apiKey, definition] of Object.entries(ISSUANCE_SETTINGS)) {
    issuance[apiKey] = Number(
      rows.get(definition.settingKey)?.integerValue ?? definition.defaultValue,
    )
  }

  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueKind: 'simulation_reference',
    },
    goinReferenceValueToman: Number(referenceRow?.integerValue ?? 250),
    issuance,
    updatedBy: referenceRow?.updatedBy ?? null,
    updatedAt: referenceRow?.updatedAt?.toISOString?.() ?? null,
  }
}

function validateSettingsBody(body) {
  if (!isPlainObject(body)) {
    return { error: 'JSON body must be an object', patch: null }
  }

  const allowedTopLevelKeys = new Set(['goinReferenceValueToman', 'issuance'])
  const unknownTopLevelKey = Object.keys(body).find(key => !allowedTopLevelKeys.has(key))
  if (unknownTopLevelKey) {
    return { error: `Unsupported economy setting: ${unknownTopLevelKey}`, patch: null }
  }

  if (Object.keys(body).length === 0) {
    return { error: 'At least one economy setting is required', patch: null }
  }

  const patch = {
    referenceValueToman: null,
    issuance: {},
  }

  if (Object.prototype.hasOwnProperty.call(body, 'goinReferenceValueToman')) {
    const value = body.goinReferenceValueToman
    if (
      !Number.isSafeInteger(value) ||
      value < MIN_REFERENCE_VALUE_TOMAN ||
      value > MAX_REFERENCE_VALUE_TOMAN
    ) {
      return {
        error: `goinReferenceValueToman must be an integer between ${MIN_REFERENCE_VALUE_TOMAN} and ${MAX_REFERENCE_VALUE_TOMAN}`,
        patch: null,
      }
    }
    patch.referenceValueToman = value
  }

  if (Object.prototype.hasOwnProperty.call(body, 'issuance')) {
    if (!isPlainObject(body.issuance) || Object.keys(body.issuance).length === 0) {
      return { error: 'issuance must be a non-empty object', patch: null }
    }

    const unknownIssuanceKey = Object.keys(body.issuance)
      .find(key => !Object.prototype.hasOwnProperty.call(ISSUANCE_SETTINGS, key))
    if (unknownIssuanceKey) {
      return { error: `Unsupported issuance setting: ${unknownIssuanceKey}`, patch: null }
    }

    for (const [apiKey, value] of Object.entries(body.issuance)) {
      if (
        !Number.isSafeInteger(value) ||
        value < MIN_ISSUANCE_AMOUNT ||
        value > MAX_ISSUANCE_AMOUNT
      ) {
        return {
          error: `${apiKey} must be an integer between ${MIN_ISSUANCE_AMOUNT} and ${MAX_ISSUANCE_AMOUNT}`,
          patch: null,
        }
      }
      patch.issuance[apiKey] = value
    }
  }

  return { error: null, patch }
}

async function lockEconomySettings(execute) {
  await execute(
    `
      SELECT setting_key
      FROM economy_settings
      WHERE setting_key = ANY($1::text[])
      ORDER BY setting_key
      FOR UPDATE
    `,
    [ALL_SETTING_KEYS],
  )
}

async function upsertIntegerSetting(execute, settingKey, value, actorId) {
  await execute(
    `
      INSERT INTO economy_settings (
        setting_key,
        integer_value,
        updated_by,
        updated_at
      )
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET
        integer_value = EXCLUDED.integer_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `,
    [settingKey, value, actorId],
  )
}

async function insertAuditEvent(execute, actorId, action, metadata) {
  await execute(
    `
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      VALUES ($1, $2, NULL, $3, $4::jsonb)
    `,
    [randomUUID(), actorId, action, JSON.stringify(metadata)],
  )
}

async function updateEconomySettings(actor, patch) {
  return withDatabaseTransaction(async (client) => {
    const execute = client.query.bind(client)
    await lockEconomySettings(execute)

    const current = await getSettings(execute)
    const referenceChanged =
      patch.referenceValueToman !== null &&
      patch.referenceValueToman !== current.goinReferenceValueToman

    const changedIssuance = {}
    for (const [apiKey, nextValue] of Object.entries(patch.issuance)) {
      if (nextValue !== current.issuance[apiKey]) {
        changedIssuance[apiKey] = {
          from: current.issuance[apiKey],
          to: nextValue,
        }
      }
    }

    if (!referenceChanged && Object.keys(changedIssuance).length === 0) {
      return { changed: false, settings: current }
    }

    if (referenceChanged) {
      await upsertIntegerSetting(
        execute,
        ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN,
        patch.referenceValueToman,
        actor.id,
      )

      await insertAuditEvent(
        execute,
        actor.id,
        'economy.goin_reference_value_updated',
        {
          fromToman: current.goinReferenceValueToman,
          toToman: patch.referenceValueToman,
          unit: ECONOMY_UNIT.code,
          valueKind: 'simulation_reference',
        },
      )
    }

    if (Object.keys(changedIssuance).length > 0) {
      for (const [apiKey, change] of Object.entries(changedIssuance)) {
        await upsertIntegerSetting(
          execute,
          ISSUANCE_SETTINGS[apiKey].settingKey,
          change.to,
          actor.id,
        )
      }

      const nextRuleVersion = current.issuance.ruleVersion + 1
      await upsertIntegerSetting(
        execute,
        GOIN_ISSUANCE_RULE_VERSION_KEY,
        nextRuleVersion,
        actor.id,
      )

      await insertAuditEvent(
        execute,
        actor.id,
        'economy.goin_issuance_policy_updated',
        {
          fromRuleVersion: current.issuance.ruleVersion,
          toRuleVersion: nextRuleVersion,
          changes: changedIssuance,
          unit: ECONOMY_UNIT.code,
        },
      )
    }

    return {
      changed: true,
      settings: await getSettings(execute),
    }
  })
}

export async function handleAdminEconomyRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== SETTINGS_PATH) return false

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] admin economy auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (!hasPermission(user, PERMISSIONS.SYSTEM_SETTINGS_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  if (request.method === 'GET') {
    try {
      sendJson(response, 200, { ok: true, settings: await getSettings() }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] admin economy settings read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to load economy settings' }, corsHeaders)
    }
    return true
  }

  if (request.method !== 'PUT') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: 'GET, PUT' },
    )
    return true
  }

  if (!isJsonRequest(request)) {
    sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
    return true
  }

  let body
  try {
    body = await readJsonBody(request)
  } catch (error) {
    const status = error?.code === 'ECONOMY_SETTINGS_BODY_TOO_LARGE' ? 413 : 400
    sendJson(response, status, { ok: false, message: error.message }, corsHeaders)
    return true
  }

  const validation = validateSettingsBody(body)
  if (validation.error || !validation.patch) {
    sendJson(response, 400, {
      ok: false,
      code: 'ECONOMY_SETTINGS_VALIDATION',
      message: validation.error,
    }, corsHeaders)
    return true
  }

  try {
    const result = await updateEconomySettings(user, validation.patch)
    sendJson(response, 200, { ok: true, ...result }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] economy settings update failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to update economy settings' }, corsHeaders)
  }

  return true
}
