import { randomUUID } from 'node:crypto'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  readTelegramRoutingConfig,
  validateTelegramPublicationInput,
} from './telegramPostContract.mjs'
import { publishTelegramPost } from './telegramPublisher.mjs'

function toIso(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function boundedMessage(value, limit = 500) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text ? text.slice(0, limit) : null
}

export class TelegramPublishingServiceError extends Error {
  constructor(code, message, { status = 400, errors = null } = {}) {
    super(message)
    this.name = 'TelegramPublishingServiceError'
    this.code = code
    this.status = status
    this.errors = errors
  }
}

async function insertAudit(execute, actorId, action, metadata) {
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
    [randomUUID(), actorId, action, JSON.stringify(metadata ?? {})],
  )
}

async function readMessages(publicationId, execute) {
  const result = await execute(
    `
      SELECT
        id,
        attempt_id AS "attemptId",
        ordinal,
        role,
        telegram_chat_id AS "telegramChatId",
        telegram_message_id AS "telegramMessageId",
        telegram_url AS "telegramUrl",
        media_group_id AS "mediaGroupId",
        created_at AS "createdAt"
      FROM telegram_publication_messages
      WHERE publication_id = $1
      ORDER BY ordinal ASC
    `,
    [publicationId],
  )
  return result.rows.map(row => ({
    ...row,
    ordinal: Number(row.ordinal),
    telegramMessageId: Number(row.telegramMessageId),
    createdAt: toIso(row.createdAt),
  }))
}

async function readAttempts(publicationId, execute) {
  const result = await execute(
    `
      SELECT
        id,
        attempt_number AS "attemptNumber",
        actor_user_id AS "actorUserId",
        status,
        http_status AS "httpStatus",
        error_code AS "errorCode",
        error_message AS "errorMessage",
        details,
        started_at AS "startedAt",
        finished_at AS "finishedAt"
      FROM telegram_publication_attempts
      WHERE publication_id = $1
      ORDER BY attempt_number DESC
    `,
    [publicationId],
  )
  return result.rows.map(row => ({
    ...row,
    attemptNumber: Number(row.attemptNumber),
    httpStatus: row.httpStatus == null ? null : Number(row.httpStatus),
    startedAt: toIso(row.startedAt),
    finishedAt: toIso(row.finishedAt),
  }))
}

function mapPublicationRow(row) {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    source: {
      type: row.sourceType,
      id: row.sourceId ?? null,
      version: row.sourceVersion ?? null,
    },
    destinationChatId: row.destinationChatId,
    payload: row.payload,
    payloadHash: row.payloadHash,
    status: row.status,
    attemptCount: Number(row.attemptCount),
    lastErrorCode: row.lastErrorCode ?? null,
    lastErrorMessage: row.lastErrorMessage ?? null,
    lastAttemptAt: toIso(row.lastAttemptAt),
    publishedAt: toIso(row.publishedAt),
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

async function readPublicationRow(id, execute = queryDatabase, { lock = false } = {}) {
  const result = await execute(
    `
      SELECT
        id,
        idempotency_key AS "idempotencyKey",
        source_type AS "sourceType",
        source_id AS "sourceId",
        source_version AS "sourceVersion",
        destination_chat_id AS "destinationChatId",
        payload,
        payload_hash AS "payloadHash",
        status,
        attempt_count AS "attemptCount",
        last_error_code AS "lastErrorCode",
        last_error_message AS "lastErrorMessage",
        last_attempt_at AS "lastAttemptAt",
        published_at AS "publishedAt",
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM telegram_publications
      WHERE id = $1
      LIMIT 1
      ${lock ? 'FOR UPDATE' : ''}
    `,
    [id],
  )
  return result.rows[0] ?? null
}

export async function readTelegramPublication(id, execute = queryDatabase) {
  const row = await readPublicationRow(id, execute)
  if (!row) return null
  const [messages, attempts] = await Promise.all([
    readMessages(id, execute),
    readAttempts(id, execute),
  ])
  return {
    ...mapPublicationRow(row),
    messages,
    attempts,
  }
}

export async function listTelegramPublications({ limit = 20 } = {}, execute = queryDatabase) {
  const safeLimit = Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20
  const result = await execute(
    `
      SELECT
        id,
        idempotency_key AS "idempotencyKey",
        source_type AS "sourceType",
        source_id AS "sourceId",
        source_version AS "sourceVersion",
        destination_chat_id AS "destinationChatId",
        payload,
        payload_hash AS "payloadHash",
        status,
        attempt_count AS "attemptCount",
        last_error_code AS "lastErrorCode",
        last_error_message AS "lastErrorMessage",
        last_attempt_at AS "lastAttemptAt",
        published_at AS "publishedAt",
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM telegram_publications
      ORDER BY created_at DESC, id DESC
      LIMIT $1
    `,
    [safeLimit],
  )
  return result.rows.map(mapPublicationRow)
}

async function createPublicationRecord(actor, prepared, transaction = withDatabaseTransaction) {
  return transaction(async client => {
    const execute = client.query.bind(client)
    const id = randomUUID()
    const inserted = await execute(
      `
        INSERT INTO telegram_publications (
          id,
          idempotency_key,
          source_type,
          source_id,
          source_version,
          destination_chat_id,
          payload,
          payload_hash,
          status,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'created', $9)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id, payload_hash AS "payloadHash", status
      `,
      [
        id,
        prepared.idempotencyKey,
        prepared.normalized.source.type,
        prepared.normalized.source.id,
        prepared.normalized.source.version,
        prepared.normalized.destinationChatId,
        JSON.stringify(prepared.normalized),
        prepared.payloadHash,
        actor.id,
      ],
    )

    if (inserted.rows[0]) {
      await insertAudit(execute, actor.id, 'telegram.publication_created', {
        publicationId: id,
        source: prepared.normalized.source,
        destinationChatId: prepared.normalized.destinationChatId,
        payloadHash: prepared.payloadHash,
      })
      return { id, duplicate: false, status: 'created' }
    }

    const existing = await execute(
      `
        SELECT id, payload_hash AS "payloadHash", status
        FROM telegram_publications
        WHERE idempotency_key = $1
        LIMIT 1
        FOR UPDATE
      `,
      [prepared.idempotencyKey],
    )
    const current = existing.rows[0]
    if (!current) {
      throw new TelegramPublishingServiceError(
        'TELEGRAM_IDEMPOTENCY_STATE_INVALID',
        'Telegram idempotency state could not be resolved',
        { status: 409 },
      )
    }
    if (current.payloadHash !== prepared.payloadHash) {
      throw new TelegramPublishingServiceError(
        'TELEGRAM_IDEMPOTENCY_CONFLICT',
        'Telegram idempotency key was already used for a different publication',
        { status: 409 },
      )
    }
    return { id: current.id, duplicate: true, status: current.status }
  })
}

async function claimAttempt(publicationId, actor, allowedStatuses, transaction = withDatabaseTransaction) {
  return transaction(async client => {
    const execute = client.query.bind(client)
    const row = await readPublicationRow(publicationId, execute, { lock: true })
    if (!row) {
      throw new TelegramPublishingServiceError('TELEGRAM_PUBLICATION_NOT_FOUND', 'Telegram publication not found', { status: 404 })
    }
    if (!allowedStatuses.includes(row.status)) {
      throw new TelegramPublishingServiceError(
        'TELEGRAM_PUBLICATION_NOT_RETRYABLE',
        `Telegram publication in status ${row.status} cannot be delivered again`,
        { status: 409 },
      )
    }

    const attemptNumber = Number(row.attemptCount) + 1
    const attemptId = randomUUID()
    await execute(
      `
        UPDATE telegram_publications
        SET
          status = 'publishing',
          attempt_count = $2,
          last_error_code = NULL,
          last_error_message = NULL,
          last_attempt_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [publicationId, attemptNumber],
    )
    await execute(
      `
        INSERT INTO telegram_publication_attempts (
          id,
          publication_id,
          attempt_number,
          actor_user_id,
          status
        )
        VALUES ($1, $2, $3, $4, 'started')
      `,
      [attemptId, publicationId, attemptNumber, actor.id],
    )
    if (attemptNumber > 1) {
      await insertAudit(execute, actor.id, 'telegram.publication_retry_requested', {
        publicationId,
        attemptNumber,
        priorStatus: row.status,
      })
    }

    return {
      attemptId,
      attemptNumber,
      normalized: row.payload,
    }
  })
}

async function insertMessages(execute, publicationId, attemptId, messages) {
  for (const message of messages ?? []) {
    await execute(
      `
        INSERT INTO telegram_publication_messages (
          id,
          publication_id,
          attempt_id,
          ordinal,
          role,
          telegram_chat_id,
          telegram_message_id,
          telegram_url,
          media_group_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (publication_id, ordinal) DO NOTHING
      `,
      [
        randomUUID(),
        publicationId,
        attemptId,
        message.ordinal,
        message.role,
        message.telegramChatId,
        message.telegramMessageId,
        message.telegramUrl,
        message.mediaGroupId,
      ],
    )
  }
}

async function finalizeSuccess(publicationId, actor, attempt, result, transaction = withDatabaseTransaction) {
  await transaction(async client => {
    const execute = client.query.bind(client)
    await insertMessages(execute, publicationId, attempt.attemptId, result.messages)
    await execute(
      `
        UPDATE telegram_publications
        SET
          status = 'published',
          last_error_code = NULL,
          last_error_message = NULL,
          published_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [publicationId],
    )
    await execute(
      `
        UPDATE telegram_publication_attempts
        SET
          status = 'succeeded',
          http_status = $2,
          details = $3::jsonb,
          finished_at = NOW()
        WHERE id = $1
      `,
      [attempt.attemptId, result.httpStatus, JSON.stringify({ methods: result.methods })],
    )
    await insertAudit(execute, actor.id, 'telegram.publication_published', {
      publicationId,
      attemptNumber: attempt.attemptNumber,
      messageIds: result.messages.map(message => message.telegramMessageId),
    })
  })
}

async function finalizeFailure(publicationId, actor, attempt, error, transaction = withDatabaseTransaction) {
  const status = error?.kind === 'failed' ? 'failed' : 'delivery_unknown'
  const errorCode = boundedMessage(error?.errorCode, 120) || (status === 'failed' ? 'TELEGRAM_PUBLISH_FAILED' : 'TELEGRAM_DELIVERY_UNKNOWN')
  const errorMessage = boundedMessage(error?.message) || 'Telegram publication failed'
  const details = error?.details && typeof error.details === 'object' && !Array.isArray(error.details)
    ? error.details
    : {}
  const partialMessages = Array.isArray(error?.partialMessages) ? error.partialMessages : []

  await transaction(async client => {
    const execute = client.query.bind(client)
    await insertMessages(execute, publicationId, attempt.attemptId, partialMessages)
    await execute(
      `
        UPDATE telegram_publications
        SET
          status = $2,
          last_error_code = $3,
          last_error_message = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [publicationId, status, errorCode, errorMessage],
    )
    await execute(
      `
        UPDATE telegram_publication_attempts
        SET
          status = $2,
          http_status = $3,
          error_code = $4,
          error_message = $5,
          details = $6::jsonb,
          finished_at = NOW()
        WHERE id = $1
      `,
      [
        attempt.attemptId,
        status,
        error?.httpStatus ?? null,
        errorCode,
        errorMessage,
        JSON.stringify(details),
      ],
    )
    await insertAudit(
      execute,
      actor.id,
      status === 'failed'
        ? 'telegram.publication_failed'
        : 'telegram.publication_delivery_unknown',
      {
        publicationId,
        attemptNumber: attempt.attemptNumber,
        errorCode,
        partialMessageIds: partialMessages.map(message => message.telegramMessageId),
      },
    )
  })

  return { status, errorCode, errorMessage }
}

async function deliver(publicationId, actor, allowedStatuses, dependencies = {}) {
  const config = dependencies.config ?? readTelegramRoutingConfig()
  if (!config.configured) {
    throw new TelegramPublishingServiceError(
      'TELEGRAM_NOT_CONFIGURED',
      'Telegram publishing is not configured',
      { status: 503, errors: config.errors },
    )
  }

  const transaction = dependencies.transaction ?? withDatabaseTransaction
  const attempt = await claimAttempt(publicationId, actor, allowedStatuses, transaction)

  try {
    const result = await (dependencies.publisher ?? publishTelegramPost)(
      attempt.normalized,
      config,
      dependencies.publisherOptions ?? {},
    )
    await finalizeSuccess(publicationId, actor, attempt, result, transaction)
  } catch (error) {
    await finalizeFailure(publicationId, actor, attempt, error, transaction)
  }

  return readTelegramPublication(publicationId, dependencies.query ?? queryDatabase)
}

export async function createAndPublishTelegramPublication(actor, input, dependencies = {}) {
  const config = dependencies.config ?? readTelegramRoutingConfig()
  const prepared = validateTelegramPublicationInput(input, config)
  if (!prepared.ok) {
    throw new TelegramPublishingServiceError(
      prepared.code,
      prepared.code === 'TELEGRAM_NOT_CONFIGURED'
        ? 'Telegram publishing is not configured'
        : 'Telegram publication validation failed',
      {
        status: prepared.code === 'TELEGRAM_NOT_CONFIGURED' ? 503 : 400,
        errors: prepared.errors,
      },
    )
  }

  const transaction = dependencies.transaction ?? withDatabaseTransaction
  const created = await createPublicationRecord(actor, prepared, transaction)
  if (created.duplicate) {
    return {
      duplicate: true,
      publication: await readTelegramPublication(created.id, dependencies.query ?? queryDatabase),
    }
  }

  return {
    duplicate: false,
    publication: await deliver(created.id, actor, ['created'], dependencies),
  }
}

export async function retryTelegramPublication(actor, publicationId, dependencies = {}) {
  return deliver(publicationId, actor, ['created', 'failed'], dependencies)
}
