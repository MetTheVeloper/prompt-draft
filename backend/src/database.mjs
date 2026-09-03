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

export async function getDatabaseStatus() {
  const result = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS "user",
      NOW() AS "serverTime"
  `)

  return result.rows[0]
}
