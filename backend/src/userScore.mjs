import { randomUUID } from 'node:crypto'
import { queryDatabase } from './database.mjs'

export const USER_SCORE_RULES = Object.freeze({
  ACCOUNT_CREATED: Object.freeze({
    eventType: 'account_created',
    points: 1000,
    idempotencyKey: 'account_created:v1',
    sourceType: 'account',
    sourceId: null,
  }),
  PROFILE_EMAIL_ADDED: Object.freeze({
    eventType: 'profile_email_added',
    points: 1000,
    idempotencyKey: 'profile_email_added:v1',
    sourceType: 'profile_field',
    sourceId: 'email',
  }),
})

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {}
  }

  return metadata
}

export async function awardUserScoreEvent({
  userId,
  eventType,
  points,
  idempotencyKey,
  sourceType = null,
  sourceId = null,
  metadata = {},
}) {
  if (!userId || !eventType || !idempotencyKey) {
    throw new Error('User score event requires userId, eventType, and idempotencyKey')
  }

  if (!Number.isInteger(points) || points === 0) {
    throw new Error('User score event points must be a non-zero integer')
  }

  const result = await queryDatabase(
    `
      INSERT INTO user_score_events (
        id,
        user_id,
        event_type,
        points,
        source_type,
        source_id,
        idempotency_key,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      ON CONFLICT (user_id, idempotency_key)
      DO NOTHING
      RETURNING
        id,
        event_type AS "eventType",
        points,
        source_type AS "sourceType",
        source_id AS "sourceId",
        idempotency_key AS "idempotencyKey",
        metadata,
        created_at AS "createdAt"
    `,
    [
      randomUUID(),
      userId,
      eventType,
      points,
      sourceType,
      sourceId,
      idempotencyKey,
      JSON.stringify(normalizeMetadata(metadata)),
    ],
  )

  const event = result.rows[0]

  return {
    awarded: Boolean(event),
    event: event
      ? {
          ...event,
          points: Number(event.points),
          createdAt: event.createdAt.toISOString(),
        }
      : null,
  }
}

async function ensureRule(userId, rule, metadata = {}) {
  return awardUserScoreEvent({
    userId,
    eventType: rule.eventType,
    points: rule.points,
    idempotencyKey: rule.idempotencyKey,
    sourceType: rule.sourceType,
    sourceId: rule.sourceId ?? userId,
    metadata: {
      ruleVersion: 1,
      ...metadata,
    },
  })
}

export async function ensureUserScoreMilestones(user) {
  if (!user?.id) {
    throw new Error('User is required to ensure score milestones')
  }

  await ensureRule(user.id, USER_SCORE_RULES.ACCOUNT_CREATED)

  if (user.email) {
    await ensureRule(user.id, USER_SCORE_RULES.PROFILE_EMAIL_ADDED)
  }
}

export async function getUserScoreState(userId) {
  const result = await queryDatabase(
    `
      SELECT
        COALESCE(SUM(points), 0)::bigint AS "totalXp",
        COUNT(*)::int AS "eventCount"
      FROM user_score_events
      WHERE user_id = $1
    `,
    [userId],
  )

  const row = result.rows[0] ?? { totalXp: 0, eventCount: 0 }

  return {
    totalXp: Number(row.totalXp),
    eventCount: Number(row.eventCount),
  }
}

export async function createUserScoreState(user) {
  await ensureUserScoreMilestones(user)
  return getUserScoreState(user.id)
}
