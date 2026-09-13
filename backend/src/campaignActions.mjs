import { createHash, randomUUID } from 'node:crypto'
import { withDatabaseTransaction } from './database.mjs'
import {
  asDate,
  deriveCampaignEffectiveStatus,
  mapParticipation,
  participationAllowsProgress,
} from './campaignRuntimeShared.mjs'
import {
  findCampaignMechanic,
  loadCallerCampaignRuntime,
  loadCampaignAttempt,
  mapCampaignAttempt,
} from './campaignAttempts.mjs'

const IDEMPOTENCY_KEY_MAX = 240
const NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (isObject(value)) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
  }
  return value
}

function normalizeIdempotencyKey(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= IDEMPOTENCY_KEY_MAX ? normalized : null
}

export function hashCampaignActionRequest({ mechanicId, action, payload = {}, evidence = {} }) {
  return createHash('sha256')
    .update(JSON.stringify(stableValue({ mechanicId, action, payload, evidence })))
    .digest('hex')
}

async function readMechanicState(execute, participationId, mechanicId) {
  const result = await execute(
    `SELECT mechanic_id AS "mechanicId", state, revision, updated_at AS "updatedAt"
     FROM campaign_mechanic_states
     WHERE participation_id = $1 AND mechanic_id = $2
     LIMIT 1`,
    [participationId, mechanicId],
  )
  const row = result.rows[0]
  return row
    ? { mechanicId: row.mechanicId, state: row.state ?? {}, revision: Number(row.revision), updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt }
    : { mechanicId, state: {}, revision: 0, updatedAt: null }
}

export async function readCampaignMechanicStates(execute, runtime) {
  const output = []
  for (const mechanic of runtime.definition.mechanics ?? []) {
    output.push(await readMechanicState(execute, runtime.id, mechanic.id))
  }
  return output
}

async function persistAction(execute, input) {
  const id = randomUUID()
  await execute(
    `INSERT INTO campaign_actions
       (id, participation_id, mechanic_id, action_name, idempotency_key, request_hash,
        payload, evidence, accepted, rejection_code, received_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)`,
    [
      id,
      input.runtime.id,
      input.mechanicId,
      input.action,
      input.idempotencyKey,
      input.requestHash,
      JSON.stringify(input.payload ?? {}),
      JSON.stringify(input.evidence ?? {}),
      input.accepted,
      input.rejectionCode ?? null,
      input.receivedAt.toISOString(),
    ],
  )
  return id
}

async function loadExistingAction(execute, participationId, idempotencyKey) {
  const result = await execute(
    `SELECT id, mechanic_id AS "mechanicId", action_name AS action,
            request_hash AS "requestHash", accepted, rejection_code AS "rejectionCode", evidence
     FROM campaign_actions
     WHERE participation_id = $1 AND idempotency_key = $2
     LIMIT 1`,
    [participationId, idempotencyKey],
  )
  return result.rows[0] ?? null
}

async function appendActionEvent(execute, runtime, { mechanicId, eventName, actionId, metadata, createdAt }) {
  await execute(
    `INSERT INTO campaign_events
       (id, campaign_id, campaign_version_id, participation_id, mechanic_id,
        event_name, source_action_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
    [
      randomUUID(), runtime.campaignId, runtime.campaignVersionId, runtime.id,
      mechanicId, eventName, actionId, JSON.stringify(metadata ?? {}), createdAt.toISOString(),
    ],
  )
}

async function rejectAction(execute, input, code) {
  await persistAction(execute, { ...input, accepted: false, rejectionCode: code })
  return { ok: false, code, duplicate: false }
}

function validAttemptStarted(payload, evidence) {
  return isObject(payload) && Object.keys(payload).length === 0 &&
    isObject(evidence) && Object.keys(evidence).length === 1 &&
    typeof evidence.attemptId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evidence.attemptId)
}

export async function submitCampaignActionInTransaction(client, input) {
  const execute = client.query.bind(client)
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (
    !idempotencyKey || !NAME_PATTERN.test(input.mechanicId ?? '') || !NAME_PATTERN.test(input.action ?? '') ||
    !isObject(input.payload ?? {}) || !isObject(input.evidence ?? {})
  ) {
    return { ok: false, code: 'CAMPAIGN_ACTION_INPUT_INVALID' }
  }

  const caller = await loadCallerCampaignRuntime(execute, { slug: input.slug, userId: input.userId, lock: true })
  if (!caller.ok) return caller
  const { runtime } = caller
  const effectiveAt = asDate(input.asOf, new Date())
  const requestHash = hashCampaignActionRequest(input)
  const existing = await loadExistingAction(execute, runtime.id, idempotencyKey)
  if (existing) {
    if (existing.requestHash && existing.requestHash !== requestHash) {
      return { ok: false, code: 'CAMPAIGN_IDEMPOTENCY_CONFLICT', duplicate: true }
    }
    if (!existing.accepted) {
      return { ok: false, code: existing.rejectionCode ?? 'CAMPAIGN_ACTION_REJECTED', duplicate: true }
    }
    const mechanic = findCampaignMechanic(runtime, input.mechanicId)
    const mechanicState = await readMechanicState(execute, runtime.id, input.mechanicId)
    const attempt = existing.evidence?.attemptId
      ? await loadCampaignAttempt(execute, { participationId: runtime.id, mechanicId: input.mechanicId, attemptId: existing.evidence.attemptId })
      : null
    return {
      ok: true,
      accepted: true,
      duplicate: true,
      result: {
        participation: mapParticipation(runtime),
        mechanicState,
        attempt: mechanic?.attemptPolicy && attempt ? mapCampaignAttempt(attempt, mechanic.attemptPolicy) : null,
        effects: [],
      },
    }
  }

  const status = deriveCampaignEffectiveStatus(runtime, effectiveAt)
  if (!participationAllowsProgress(runtime, status)) {
    return { ok: false, code: status === 'ended' ? 'CAMPAIGN_PARTICIPATION_CLOSED' : 'CAMPAIGN_NOT_ACTIVE' }
  }

  const common = {
    runtime,
    mechanicId: input.mechanicId,
    action: input.action,
    idempotencyKey,
    requestHash,
    payload: input.payload ?? {},
    evidence: input.evidence ?? {},
    receivedAt: effectiveAt,
  }
  const mechanic = findCampaignMechanic(runtime, input.mechanicId)
  if (!mechanic) return rejectAction(execute, common, 'CAMPAIGN_MECHANIC_NOT_FOUND')
  if (input.action !== 'attempt_started') return rejectAction(execute, common, 'CAMPAIGN_ACTION_UNSUPPORTED')
  if (!mechanic.attemptPolicy || !validAttemptStarted(common.payload, common.evidence)) {
    return rejectAction(execute, common, 'CAMPAIGN_ACTION_SCHEMA_INVALID')
  }

  const attempt = await loadCampaignAttempt(execute, {
    participationId: runtime.id,
    mechanicId: input.mechanicId,
    attemptId: common.evidence.attemptId,
    lock: true,
  })
  if (!attempt) return rejectAction(execute, common, 'CAMPAIGN_ATTEMPT_INVALID')
  if (!['reserved', 'started'].includes(attempt.status)) {
    return rejectAction(execute, common, 'CAMPAIGN_ATTEMPT_STATE_INVALID')
  }

  const actionId = await persistAction(execute, { ...common, accepted: true })
  const effects = []
  if (attempt.status === 'reserved') {
    await execute(
      `UPDATE campaign_attempts SET status = 'started', started_at = COALESCE(started_at, $2) WHERE id = $1`,
      [attempt.id, effectiveAt.toISOString()],
    )
    await execute(
      `INSERT INTO campaign_mechanic_states (participation_id, mechanic_id, state, revision, updated_at)
       VALUES ($1, $2, '{}'::jsonb, 1, $3)
       ON CONFLICT (participation_id, mechanic_id) DO NOTHING`,
      [runtime.id, input.mechanicId, effectiveAt.toISOString()],
    )
    await execute(
      `SELECT participation_id FROM campaign_mechanic_states
       WHERE participation_id = $1 AND mechanic_id = $2 FOR UPDATE`,
      [runtime.id, input.mechanicId],
    )
    await execute(
      `UPDATE campaign_mechanic_states
       SET state = jsonb_build_object(
             'lastAttemptId', $3::text,
             'lastAction', 'attempt_started',
             'lastActionAt', $4::timestamptz
           ),
           revision = revision + 1,
           updated_at = $4::timestamptz
       WHERE participation_id = $1 AND mechanic_id = $2`,
      [runtime.id, input.mechanicId, attempt.id, effectiveAt.toISOString()],
    )
    await appendActionEvent(execute, runtime, {
      mechanicId: input.mechanicId,
      eventName: 'attempt_started',
      actionId,
      metadata: { attemptId: attempt.id },
      createdAt: effectiveAt,
    })
    effects.push({ type: 'attempt_started', attemptId: attempt.id })
  }

  const updatedAttempt = await loadCampaignAttempt(execute, {
    participationId: runtime.id, mechanicId: input.mechanicId, attemptId: attempt.id,
  })
  return {
    ok: true,
    accepted: true,
    duplicate: false,
    result: {
      participation: mapParticipation(runtime),
      mechanicState: await readMechanicState(execute, runtime.id, input.mechanicId),
      attempt: mapCampaignAttempt(updatedAttempt, mechanic.attemptPolicy),
      effects,
    },
  }
}

export function submitCampaignAction(input) {
  return withDatabaseTransaction(client => submitCampaignActionInTransaction(client, input))
}
