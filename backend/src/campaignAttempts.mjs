import { randomUUID } from 'node:crypto'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  appendCampaignEvent,
  asDate,
  deriveCampaignEffectiveStatus,
  loadParticipationByCampaignUser,
  loadParticipationRuntime,
  loadPublishedCampaignBySlug,
  participationAllowsProgress,
} from './campaignRuntimeShared.mjs'
import { prepareCustomGameAttemptContext } from './campaignCustomGame.mjs'

const IDEMPOTENCY_KEY_MAX = 240
const MECHANIC_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const PARTICIPATION_PROGRESS_STATUSES = new Set(['started', 'in_progress'])
const formatterCache = new Map()

function toIso(value) {
  return value?.toISOString?.() ?? value ?? null
}

function normalizeIdempotencyKey(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= IDEMPOTENCY_KEY_MAX ? normalized : null
}

function zonedParts(date, timeZone) {
  let formatter = formatterCache.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    formatterCache.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)]),
  )
  return parts
}

function zonedLocalToUtc(local, timeZone) {
  const desired = Date.UTC(local.year, local.month - 1, local.day, local.hour ?? 0, local.minute ?? 0, local.second ?? 0)
  let guess = desired
  for (let index = 0; index < 4; index += 1) {
    const observed = zonedParts(new Date(guess), timeZone)
    const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second)
    const adjustment = desired - observedAsUtc
    if (adjustment === 0) break
    guess += adjustment
  }
  return new Date(guess)
}

export function getAttemptPeriodDescriptor({ policy, runtime, asOf = new Date(), sessionKey = null }) {
  const effectiveAt = asDate(asOf, new Date())
  if (!policy || !Number.isSafeInteger(policy.maxAttempts) || policy.maxAttempts <= 0) {
    return { ok: false, code: 'CAMPAIGN_ATTEMPT_POLICY_INVALID' }
  }
  if (policy.period === 'campaign') {
    return { ok: true, periodKey: `campaign:${runtime.campaignVersionId}`, nextEligibleAt: null, rollingStartAt: null }
  }
  if (policy.period === 'calendar_day') {
    if (typeof policy.timezone !== 'string' || !policy.timezone.trim()) {
      return { ok: false, code: 'CAMPAIGN_ATTEMPT_POLICY_INVALID' }
    }
    try {
      const parts = zonedParts(effectiveAt, policy.timezone)
      const day = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
      const nextDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1))
      const nextEligibleAt = zonedLocalToUtc({
        year: nextDate.getUTCFullYear(), month: nextDate.getUTCMonth() + 1, day: nextDate.getUTCDate(),
      }, policy.timezone)
      return {
        ok: true,
        periodKey: `calendar:${policy.timezone}:${day}`,
        nextEligibleAt: nextEligibleAt.toISOString(),
        rollingStartAt: null,
      }
    } catch {
      return { ok: false, code: 'CAMPAIGN_ATTEMPT_POLICY_INVALID' }
    }
  }
  if (policy.period === 'rolling_24h') {
    return {
      ok: true,
      periodKey: `rolling:${effectiveAt.toISOString()}:${randomUUID()}`,
      nextEligibleAt: null,
      rollingStartAt: new Date(effectiveAt.getTime() - 24 * 60 * 60 * 1000),
    }
  }
  if (policy.period === 'session') {
    if (!sessionKey) return { ok: false, code: 'CAMPAIGN_SESSION_CONTEXT_REQUIRED' }
    return { ok: true, periodKey: `session:${sessionKey}`, nextEligibleAt: null, rollingStartAt: null }
  }
  return { ok: false, code: 'CAMPAIGN_ATTEMPT_POLICY_INVALID' }
}

export function mapCampaignAttempt(row, policy, nextEligibleAt = null) {
  if (!row) return null
  const publicContext = row.privateContext?.publicContext
  return {
    id: row.id,
    mechanicId: row.mechanicId,
    status: row.status,
    attemptIndex: Number(row.attemptIndex),
    period: { type: policy.period, nextEligibleAt },
    expiresAt: toIso(row.expiresAt),
    publicContext: publicContext && typeof publicContext === 'object' && !Array.isArray(publicContext)
      ? publicContext
      : {},
    ...(row.outcome ? { outcome: row.outcome } : {}),
  }
}

export async function loadCallerCampaignRuntime(execute, { slug, userId, lock = false }) {
  const campaign = await loadPublishedCampaignBySlug(slug, execute)
  if (!campaign) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }
  const participation = await loadParticipationByCampaignUser(campaign.campaignId, userId, execute)
  if (!participation) return { ok: false, code: 'CAMPAIGN_PARTICIPATION_REQUIRED' }
  const runtime = await loadParticipationRuntime(participation.id, execute, { lock })
  return runtime ? { ok: true, runtime } : { ok: false, code: 'CAMPAIGN_PARTICIPATION_REQUIRED' }
}

export function findCampaignMechanic(runtime, mechanicId) {
  return (runtime.definition.mechanics ?? []).find(mechanic => mechanic?.id === mechanicId) ?? null
}

export async function readAttemptUsage(execute, { runtime, mechanicId, policy, descriptor, asOf }) {
  if (policy.period === 'rolling_24h') {
    const result = await execute(
      `SELECT COUNT(*)::int AS count, MIN(created_at) AS "oldestAt"
       FROM campaign_attempts
       WHERE participation_id = $1 AND mechanic_id = $2 AND status <> 'rejected'
         AND created_at > $3 AND created_at <= $4`,
      [runtime.id, mechanicId, descriptor.rollingStartAt.toISOString(), asOf.toISOString()],
    )
    const count = Number(result.rows[0]?.count ?? 0)
    const oldestAt = result.rows[0]?.oldestAt
    return {
      count,
      nextEligibleAt: count >= policy.maxAttempts && oldestAt
        ? new Date(oldestAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null,
    }
  }
  const result = await execute(
    `SELECT COUNT(*)::int AS count FROM campaign_attempts
     WHERE participation_id = $1 AND mechanic_id = $2 AND period_key = $3 AND status <> 'rejected'`,
    [runtime.id, mechanicId, descriptor.periodKey],
  )
  const count = Number(result.rows[0]?.count ?? 0)
  return { count, nextEligibleAt: count >= policy.maxAttempts ? descriptor.nextEligibleAt : null }
}

export async function loadCampaignAttempt(execute, { participationId, mechanicId, attemptId = null, idempotencyKey = null, lock = false }) {
  const filter = attemptId ? 'id = $3' : 'idempotency_key = $3'
  const value = attemptId ?? idempotencyKey
  const result = await execute(
    `SELECT id, mechanic_id AS "mechanicId", status, attempt_index AS "attemptIndex",
            private_context AS "privateContext", outcome, expires_at AS "expiresAt"
     FROM campaign_attempts
     WHERE participation_id = $1 AND mechanic_id = $2 AND ${filter}
     LIMIT 1 ${lock ? 'FOR UPDATE' : ''}`,
    [participationId, mechanicId, value],
  )
  return result.rows[0] ?? null
}

export async function reserveCampaignAttemptInTransaction(client, input) {
  const execute = client.query.bind(client)
  const effectiveAt = asDate(input.asOf, new Date())
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey || !MECHANIC_ID_PATTERN.test(input.mechanicId ?? '')) {
    return { ok: false, code: 'CAMPAIGN_ATTEMPT_INPUT_INVALID' }
  }
  const caller = await loadCallerCampaignRuntime(execute, { slug: input.slug, userId: input.userId, lock: true })
  if (!caller.ok) return caller
  const { runtime } = caller
  const status = deriveCampaignEffectiveStatus(runtime, effectiveAt)
  if (!participationAllowsProgress(runtime, status)) {
    return { ok: false, code: status === 'ended' ? 'CAMPAIGN_PARTICIPATION_CLOSED' : 'CAMPAIGN_NOT_ACTIVE' }
  }
  const mechanic = findCampaignMechanic(runtime, input.mechanicId)
  if (!mechanic) return { ok: false, code: 'CAMPAIGN_MECHANIC_NOT_FOUND' }
  if (!mechanic.attemptPolicy) return { ok: false, code: 'CAMPAIGN_ATTEMPT_POLICY_REQUIRED' }
  const descriptor = getAttemptPeriodDescriptor({ policy: mechanic.attemptPolicy, runtime, asOf: effectiveAt, sessionKey: input.sessionKey })
  if (!descriptor.ok) return descriptor

  const existing = await loadCampaignAttempt(execute, {
    participationId: runtime.id, mechanicId: input.mechanicId, idempotencyKey,
  })
  if (existing) {
    const usage = await readAttemptUsage(execute, { runtime, mechanicId: input.mechanicId, policy: mechanic.attemptPolicy, descriptor, asOf: effectiveAt })
    return { ok: true, duplicate: true, attempt: mapCampaignAttempt(existing, mechanic.attemptPolicy, usage.nextEligibleAt) }
  }

  if (!PARTICIPATION_PROGRESS_STATUSES.has(runtime.status)) {
    return { ok: false, code: 'CAMPAIGN_PARTICIPATION_CLOSED' }
  }

  const usage = await readAttemptUsage(execute, { runtime, mechanicId: input.mechanicId, policy: mechanic.attemptPolicy, descriptor, asOf: effectiveAt })
  if (usage.count >= mechanic.attemptPolicy.maxAttempts) {
    return { ok: false, code: 'CAMPAIGN_ATTEMPT_LIMIT_REACHED', nextEligibleAt: usage.nextEligibleAt }
  }

  const attemptId = randomUUID()
  let privateContext = {}
  if (mechanic.type === 'custom_game') {
    const prepared = prepareCustomGameAttemptContext({ mechanic, attemptId })
    if (!prepared.ok) return prepared
    privateContext = prepared.privateContext
  }

  const result = await execute(
    `INSERT INTO campaign_attempts
       (id, participation_id, mechanic_id, period_key, attempt_index, status, idempotency_key, private_context, created_at)
     VALUES ($1, $2, $3, $4, $5, 'reserved', $6, $7::jsonb, $8)
     RETURNING id, mechanic_id AS "mechanicId", status, attempt_index AS "attemptIndex",
               private_context AS "privateContext", outcome, expires_at AS "expiresAt"`,
    [
      attemptId,
      runtime.id,
      input.mechanicId,
      descriptor.periodKey,
      usage.count + 1,
      idempotencyKey,
      JSON.stringify(privateContext),
      effectiveAt.toISOString(),
    ],
  )
  await appendCampaignEvent(execute, runtime, 'attempt_created', {
    attemptId, attemptIndex: usage.count + 1, period: mechanic.attemptPolicy.period,
  }, input.mechanicId)
  const after = await readAttemptUsage(execute, { runtime, mechanicId: input.mechanicId, policy: mechanic.attemptPolicy, descriptor, asOf: effectiveAt })
  return { ok: true, duplicate: false, attempt: mapCampaignAttempt(result.rows[0], mechanic.attemptPolicy, after.nextEligibleAt) }
}

export function reserveCampaignAttempt(input) {
  return withDatabaseTransaction(client => reserveCampaignAttemptInTransaction(client, input))
}

export async function readCampaignAttemptAvailability({ runtime, sessionKey = null, asOf = new Date(), executor = queryDatabase }) {
  const effectiveAt = asDate(asOf, new Date())
  const campaignStatus = deriveCampaignEffectiveStatus(runtime, effectiveAt)
  const lifecycleOpen = participationAllowsProgress(runtime, campaignStatus)
  const participationOpen = PARTICIPATION_PROGRESS_STATUSES.has(runtime.status)
  const blockedReason = !lifecycleOpen
    ? (campaignStatus === 'ended' ? 'CAMPAIGN_PARTICIPATION_CLOSED' : 'CAMPAIGN_NOT_ACTIVE')
    : !participationOpen
      ? 'CAMPAIGN_PARTICIPATION_CLOSED'
      : null
  const output = []
  for (const mechanic of runtime.definition.mechanics ?? []) {
    if (!mechanic.attemptPolicy) continue
    const descriptor = getAttemptPeriodDescriptor({ policy: mechanic.attemptPolicy, runtime, asOf: effectiveAt, sessionKey })
    if (!descriptor.ok) {
      output.push({ mechanicId: mechanic.id, period: mechanic.attemptPolicy.period, available: false, remainingAttempts: 0, nextEligibleAt: null, reasonCode: descriptor.code })
      continue
    }
    const usage = await readAttemptUsage(executor, { runtime, mechanicId: mechanic.id, policy: mechanic.attemptPolicy, descriptor, asOf: effectiveAt })
    const remaining = blockedReason ? 0 : Math.max(0, mechanic.attemptPolicy.maxAttempts - usage.count)
    output.push({
      mechanicId: mechanic.id,
      period: mechanic.attemptPolicy.period,
      maxAttempts: mechanic.attemptPolicy.maxAttempts,
      usedAttempts: usage.count,
      remainingAttempts: remaining,
      available: !blockedReason && remaining > 0,
      nextEligibleAt: blockedReason ? null : usage.nextEligibleAt,
      ...(blockedReason ? { reasonCode: blockedReason } : {}),
    })
  }
  return output
}
