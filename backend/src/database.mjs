import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST ?? 'db',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'prompt_draft',
  user: process.env.DB_USER ?? 'prompt_draft',
  password: process.env.DB_PASSWORD ?? 'prompt_draft_dev',
  connectionTimeoutMillis: 3000,
})

export function queryDatabase(text, values) {
  return pool.query(text, values)
}

export function closeDatabase() {
  return pool.end()
}

function mapWizardRunRow(row) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  }
}

function mapPromptDraftRow(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    serverUpdatedAt: row.serverUpdatedAt.toISOString(),
    revision: Number(row.revision),
    snapshot: row.snapshot,
  }
}

export async function getDatabaseStatus() {
  const result = await queryDatabase(`
    SELECT
      current_database() AS database,
      current_user AS "user",
      NOW() AS "serverTime"
  `)

  return result.rows[0]
}

export async function insertWizardRun(run) {
  const result = await queryDatabase(
    `
      INSERT INTO wizard_runs (
        id,
        created_at,
        wizard_id,
        wizard_version,
        output,
        snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING
        id,
        created_at AS "createdAt",
        wizard_id AS "wizardId",
        wizard_version AS "wizardVersion",
        output,
        snapshot
    `,
    [
      run.id,
      run.createdAt,
      run.wizardId,
      run.wizardVersion,
      run.output,
      JSON.stringify(run.snapshot),
    ],
  )

  return mapWizardRunRow(result.rows[0])
}

export async function getWizardRunById(id) {
  const result = await queryDatabase(
    `
      SELECT
        id,
        created_at AS "createdAt",
        wizard_id AS "wizardId",
        wizard_version AS "wizardVersion",
        output,
        snapshot
      FROM wizard_runs
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )

  const row = result.rows[0]
  return row ? mapWizardRunRow(row) : null
}

export async function listWizardRuns({ limit, cursor, wizardId }) {
  const values = []
  const conditions = []

  if (wizardId) {
    values.push(wizardId)
    conditions.push(`wizard_id = $${values.length}`)
  }

  if (cursor) {
    values.push(cursor.createdAt, cursor.id)
    const createdAtParameter = values.length - 1
    const idParameter = values.length
    conditions.push(
      `(created_at, id) < ($${createdAtParameter}::timestamptz, $${idParameter}::uuid)`,
    )
  }

  const fetchLimit = limit + 1
  values.push(fetchLimit)
  const limitParameter = values.length
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join('\n          AND ')}`
    : ''

  const result = await queryDatabase(
    `
      SELECT
        id,
        created_at AS "createdAt",
        wizard_id AS "wizardId",
        wizard_version AS "wizardVersion"
      FROM wizard_runs
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const runs = result.rows.slice(0, limit).map(mapWizardRunRow)

  return {
    runs,
    hasMore,
  }
}

export async function upsertPromptDraft(userId, draft) {
  const result = await queryDatabase(
    `
      INSERT INTO prompt_drafts (
        user_id,
        draft_id,
        title,
        created_at,
        client_updated_at,
        snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (user_id, draft_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        created_at = LEAST(prompt_drafts.created_at, EXCLUDED.created_at),
        client_updated_at = EXCLUDED.client_updated_at,
        server_updated_at = NOW(),
        revision = prompt_drafts.revision + 1,
        snapshot = EXCLUDED.snapshot
      RETURNING
        draft_id AS id,
        title,
        created_at AS "createdAt",
        client_updated_at AS "updatedAt",
        server_updated_at AS "serverUpdatedAt",
        revision,
        snapshot
    `,
    [
      userId,
      draft.id,
      draft.title,
      draft.createdAt,
      draft.updatedAt,
      JSON.stringify(draft.snapshot),
    ],
  )

  return mapPromptDraftRow(result.rows[0])
}

export async function getPromptDraftById(userId, id) {
  const result = await queryDatabase(
    `
      SELECT
        draft_id AS id,
        title,
        created_at AS "createdAt",
        client_updated_at AS "updatedAt",
        server_updated_at AS "serverUpdatedAt",
        revision,
        snapshot
      FROM prompt_drafts
      WHERE user_id = $1
        AND draft_id = $2
      LIMIT 1
    `,
    [userId, id],
  )

  const row = result.rows[0]
  return row ? mapPromptDraftRow(row) : null
}

export async function listPromptDrafts({ userId, limit, cursor }) {
  const values = [userId]
  const conditions = ['user_id = $1']

  if (cursor) {
    values.push(cursor.updatedAt, cursor.id)
    const updatedAtParameter = values.length - 1
    const idParameter = values.length
    conditions.push(
      `(client_updated_at < $${updatedAtParameter}::timestamptz OR (client_updated_at = $${updatedAtParameter}::timestamptz AND draft_id < $${idParameter}))`,
    )
  }

  const fetchLimit = limit + 1
  values.push(fetchLimit)
  const limitParameter = values.length

  const result = await queryDatabase(
    `
      SELECT
        draft_id AS id,
        title,
        created_at AS "createdAt",
        client_updated_at AS "updatedAt",
        server_updated_at AS "serverUpdatedAt",
        revision,
        snapshot
      FROM prompt_drafts
      WHERE ${conditions.join('\n        AND ')}
      ORDER BY client_updated_at DESC, draft_id DESC
      LIMIT $${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const drafts = result.rows.slice(0, limit).map(mapPromptDraftRow)

  return {
    drafts,
    hasMore,
  }
}
