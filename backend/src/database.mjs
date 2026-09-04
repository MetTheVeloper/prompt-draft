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

export async function withDatabaseTransaction(work) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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

function mapAdminUserRow(row) {
  return {
    id: row.id,
    username: row.username ?? null,
    email: row.email ?? null,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    cloudDraftCount: Number(row.cloudDraftCount),
    activeSessionCount: Number(row.activeSessionCount),
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
      run.snapshot,
    ],
  )

  return mapWizardRunRow(result.rows[0])
}

export async function listWizardRuns({ limit, cursor, wizardId }) {
  const values = []
  const where = []

  if (wizardId) {
    values.push(wizardId)
    where.push(`wizard_id = $${values.length}`)
  }

  if (cursor) {
    values.push(cursor.createdAt, cursor.id)
    where.push(
      `(created_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
    )
  }

  values.push(limit + 1)
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
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const rows = result.rows.slice(0, limit)

  return {
    runs: rows.map(mapWizardRunRow),
    hasMore,
  }
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

  return result.rows[0] ? mapWizardRunRow(result.rows[0]) : null
}

export async function listPromptDrafts({ userId, limit, cursor }) {
  const values = [userId]
  const where = ['user_id = $1']

  if (cursor) {
    values.push(cursor.updatedAt, cursor.id)
    where.push(
      `(client_updated_at, draft_id) < ($${values.length - 1}::timestamptz, $${values.length}::text)`,
    )
  }

  values.push(limit + 1)
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
      WHERE ${where.join(' AND ')}
      ORDER BY client_updated_at DESC, draft_id DESC
      LIMIT $${values.length}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  return {
    drafts: result.rows.slice(0, limit).map(mapPromptDraftRow),
    hasMore,
  }
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

  return result.rows[0] ? mapPromptDraftRow(result.rows[0]) : null
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
        server_updated_at,
        revision,
        snapshot
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), 1, $6::jsonb)
      ON CONFLICT (user_id, draft_id) DO UPDATE SET
        title = EXCLUDED.title,
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
      draft.snapshot,
    ],
  )

  return mapPromptDraftRow(result.rows[0])
}

export async function listAdminUsers({ limit, cursor, query, role }) {
  const values = []
  const where = []

  if (query) {
    values.push(`%${query}%`)
    const parameter = `$${values.length}`
    where.push(`(
      COALESCE(username, '') ILIKE ${parameter}
      OR COALESCE(email, '') ILIKE ${parameter}
    )`)
  }

  if (role) {
    values.push(role)
    where.push(`role = $${values.length}`)
  }

  if (cursor) {
    values.push(cursor.createdAt, cursor.id)
    where.push(
      `(created_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
    )
  }

  values.push(limit + 1)
  const result = await queryDatabase(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.role,
        users.status,
        users.created_at AS "createdAt",
        (
          SELECT COUNT(*)::int
          FROM prompt_drafts
          WHERE prompt_drafts.user_id = users.id
        ) AS "cloudDraftCount",
        (
          SELECT COUNT(*)::int
          FROM auth_sessions
          WHERE auth_sessions.user_id = users.id
            AND auth_sessions.expires_at > NOW()
        ) AS "activeSessionCount"
      FROM users
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY users.created_at DESC, users.id DESC
      LIMIT $${values.length}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  return {
    users: result.rows.slice(0, limit).map(mapAdminUserRow),
    hasMore,
  }
}

export async function getAdminUserById(id) {
  const result = await queryDatabase(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.role,
        users.status,
        users.created_at AS "createdAt",
        (
          SELECT COUNT(*)::int
          FROM prompt_drafts
          WHERE prompt_drafts.user_id = users.id
        ) AS "cloudDraftCount",
        (
          SELECT COUNT(*)::int
          FROM auth_sessions
          WHERE auth_sessions.user_id = users.id
            AND auth_sessions.expires_at > NOW()
        ) AS "activeSessionCount"
      FROM users
      WHERE users.id = $1
      LIMIT 1
    `,
    [id],
  )

  return result.rows[0] ? mapAdminUserRow(result.rows[0]) : null
}
