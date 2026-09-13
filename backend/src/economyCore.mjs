import { randomUUID } from 'node:crypto'
import { queryDatabase } from './database.mjs'

const MAX_EVENT_TYPE_LENGTH = 100
const MAX_IDEMPOTENCY_KEY_LENGTH = 240
const MAX_SOURCE_TYPE_LENGTH = 100
const MAX_SOURCE_ID_LENGTH = 240

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

function normalizeAsOf(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now())
  if (Number.isNaN(date.getTime())) throw new Error('Economy asOf must be a valid date')
  return date
}

function normalizeExpiresAt(value, { unitDelta, asOf }) {
  if (value == null) return null
  if (unitDelta <= 0) {
    throw new Error('Economy expiresAt is allowed only for positive Goin credits')
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Economy expiresAt must be a valid date')
  }
  if (date.getTime() <= asOf.getTime()) {
    throw new Error('Economy expiresAt must be in the future')
  }
  return date.toISOString()
}

export function mapEconomyEvent(row) {
  return {
    id: row.id,
    eventType: row.eventType,
    unitDelta: Number(row.unitDelta),
    sourceType: row.sourceType ?? null,
    sourceId: row.sourceId ?? null,
    sourceScoreEventId: row.sourceScoreEventId ?? null,
    idempotencyKey: row.idempotencyKey,
    metadata: row.metadata ?? {},
    expiresAt: row.expiresAt?.toISOString?.() ?? row.expiresAt ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function planExpiringCreditAllocations(lots, requestedAmount) {
  if (!Number.isSafeInteger(requestedAmount) || requestedAmount < 0) {
    throw new Error('requestedAmount must be a non-negative safe integer')
  }

  let remaining = requestedAmount
  const allocations = []

  for (const lot of lots) {
    if (remaining <= 0) break
    const available = Number(lot.remaining)
    if (!Number.isSafeInteger(available) || available <= 0) continue

    const unitAmount = Math.min(available, remaining)
    allocations.push({
      creditEventId: lot.id,
      unitAmount,
      expiresAt: lot.expiresAt,
    })
    remaining -= unitAmount
  }

  return {
    allocations,
    expiringAllocated: requestedAmount - remaining,
    permanentRequired: remaining,
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

export async function getUserEconomyBalanceState(
  userId,
  executor = queryDatabase,
  { asOf = new Date() } = {},
) {
  const effectiveAt = normalizeAsOf(asOf)
  const result = await executor(
    `
      WITH allocation_totals AS (
        SELECT
          allocation.credit_event_id,
          COALESCE(SUM(allocation.unit_amount), 0)::bigint AS allocated
        FROM user_economy_expiring_credit_allocations AS allocation
        JOIN user_economy_events AS credit
          ON credit.id = allocation.credit_event_id
        WHERE credit.user_id = $1
        GROUP BY allocation.credit_event_id
      ),
      expiring_credits AS (
        SELECT
          event.id,
          event.expires_at,
          GREATEST(
            event.unit_delta - COALESCE(allocation_totals.allocated, 0),
            0
          )::bigint AS remaining
        FROM user_economy_events AS event
        LEFT JOIN allocation_totals
          ON allocation_totals.credit_event_id = event.id
        WHERE event.user_id = $1
          AND event.unit_delta > 0
          AND event.expires_at IS NOT NULL
      ),
      ledger AS (
        SELECT
          COALESCE(SUM(unit_delta), 0)::bigint AS "rawBalance",
          COALESCE(SUM(unit_delta) FILTER (WHERE unit_delta > 0), 0)::bigint AS "lifetimeIssued",
          COALESCE(-SUM(unit_delta) FILTER (WHERE unit_delta < 0), 0)::bigint AS "lifetimeSpent",
          COUNT(*)::int AS "transactionCount"
        FROM user_economy_events
        WHERE user_id = $1
      ),
      expiry AS (
        SELECT
          COALESCE(SUM(remaining) FILTER (WHERE expires_at > $2::timestamptz), 0)::bigint AS "expiringBalance",
          COALESCE(SUM(remaining) FILTER (WHERE expires_at <= $2::timestamptz), 0)::bigint AS "lifetimeExpired",
          MIN(expires_at) FILTER (
            WHERE expires_at > $2::timestamptz
              AND remaining > 0
          ) AS "nextExpiryAt"
        FROM expiring_credits
      )
      SELECT
        (ledger."rawBalance" - expiry."lifetimeExpired")::bigint AS balance,
        expiry."expiringBalance",
        (
          ledger."rawBalance"
          - expiry."lifetimeExpired"
          - expiry."expiringBalance"
        )::bigint AS "permanentBalance",
        ledger."lifetimeIssued",
        ledger."lifetimeSpent",
        expiry."lifetimeExpired",
        ledger."transactionCount",
        expiry."nextExpiryAt"
      FROM ledger
      CROSS JOIN expiry
    `,
    [userId, effectiveAt.toISOString()],
  )

  const row = result.rows[0] ?? {}
  return {
    balance: Number(row.balance ?? 0),
    permanentBalance: Number(row.permanentBalance ?? 0),
    expiringBalance: Number(row.expiringBalance ?? 0),
    lifetimeIssued: Number(row.lifetimeIssued ?? 0),
    lifetimeSpent: Number(row.lifetimeSpent ?? 0),
    lifetimeExpired: Number(row.lifetimeExpired ?? 0),
    transactionCount: Number(row.transactionCount ?? 0),
    nextExpiryAt: row.nextExpiryAt?.toISOString?.() ?? row.nextExpiryAt ?? null,
  }
}

async function listActiveExpiringCredits(userId, execute, asOf) {
  const result = await execute(
    `
      WITH allocation_totals AS (
        SELECT
          credit_event_id,
          COALESCE(SUM(unit_amount), 0)::bigint AS allocated
        FROM user_economy_expiring_credit_allocations
        GROUP BY credit_event_id
      )
      SELECT
        event.id,
        event.expires_at AS "expiresAt",
        GREATEST(
          event.unit_delta - COALESCE(allocation_totals.allocated, 0),
          0
        )::bigint AS remaining
      FROM user_economy_events AS event
      LEFT JOIN allocation_totals
        ON allocation_totals.credit_event_id = event.id
      WHERE event.user_id = $1
        AND event.unit_delta > 0
        AND event.expires_at > $2::timestamptz
        AND (
          event.unit_delta - COALESCE(allocation_totals.allocated, 0)
        ) > 0
      ORDER BY event.expires_at ASC, event.created_at ASC, event.id ASC
    `,
    [userId, asOf.toISOString()],
  )

  return result.rows
}

export async function recordUserEconomyEventInTransaction(
  client,
  {
    userId,
    eventType,
    unitDelta,
    idempotencyKey,
    sourceType = null,
    sourceId = null,
    sourceScoreEventId = null,
    metadata = {},
    expiresAt = null,
  },
  { asOf = new Date() } = {},
) {
  validateEconomyEventInput({
    userId,
    eventType,
    unitDelta,
    idempotencyKey,
    sourceType,
    sourceId,
    sourceScoreEventId,
  })

  const effectiveAt = normalizeAsOf(asOf)
  const normalizedExpiresAt = normalizeExpiresAt(expiresAt, {
    unitDelta,
    asOf: effectiveAt,
  })
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
        expires_at AS "expiresAt",
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
      economy: await getUserEconomyBalanceState(userId, execute, { asOf: effectiveAt }),
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

  const before = await getUserEconomyBalanceState(userId, execute, { asOf: effectiveAt })
  const required = unitDelta < 0 ? Math.abs(unitDelta) : 0
  if (required > before.balance) {
    throw new InsufficientGoinBalanceError({
      balance: before.balance,
      required,
    })
  }

  const eventId = randomUUID()
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
        metadata,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz)
      RETURNING
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
    `,
    [
      eventId,
      userId,
      eventType.trim(),
      unitDelta,
      sourceType?.trim() ?? null,
      sourceId?.trim() ?? null,
      sourceScoreEventId,
      idempotencyKey.trim(),
      JSON.stringify(normalizeMetadata(metadata)),
      normalizedExpiresAt,
    ],
  )

  if (unitDelta < 0) {
    const lots = await listActiveExpiringCredits(userId, execute, effectiveAt)
    const plan = planExpiringCreditAllocations(lots, required)

    for (const allocation of plan.allocations) {
      await execute(
        `
          INSERT INTO user_economy_expiring_credit_allocations (
            user_id,
            debit_event_id,
            credit_event_id,
            unit_amount
          )
          VALUES ($1, $2, $3, $4)
        `,
        [userId, eventId, allocation.creditEventId, allocation.unitAmount],
      )
    }
  }

  return {
    duplicate: false,
    event: mapEconomyEvent(insertedResult.rows[0]),
    economy: await getUserEconomyBalanceState(userId, execute, { asOf: effectiveAt }),
  }
}
