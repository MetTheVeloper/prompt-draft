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

export async function listWizardRuns({ limit, cursor }) {
  const fetchLimit = limit + 1
  const result = cursor
    ? await queryDatabase(
        `
          SELECT
            id,
            created_at AS "createdAt",
            wizard_id AS "wizardId",
            wizard_version AS "wizardVersion"
          FROM wizard_runs
          WHERE (created_at, id) < ($1::timestamptz, $2::uuid)
          ORDER BY created_at DESC, id DESC
          LIMIT $3
        `,
        [cursor.createdAt, cursor.id, fetchLimit],
      )
    : await queryDatabase(
        `
          SELECT
            id,
            created_at AS "createdAt",
            wizard_id AS "wizardId",
            wizard_version AS "wizardVersion"
          FROM wizard_runs
          ORDER BY created_at DESC, id DESC
          LIMIT $1
        `,
        [fetchLimit],
      )

  const hasMore = result.rows.length > limit
  const runs = result.rows.slice(0, limit).map(mapWizardRunRow)

  return {
    runs,
    hasMore,
  }
}
