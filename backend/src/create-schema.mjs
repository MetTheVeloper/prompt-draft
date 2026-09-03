import { readFile } from 'node:fs/promises'
import { closeDatabase, queryDatabase } from './database.mjs'

const schemaUrl = new URL('../sql/001_create_wizard_runs.sql', import.meta.url)

try {
  const sql = await readFile(schemaUrl, 'utf8')
  await queryDatabase(sql)
  console.log('Database schema applied: wizard_runs')
} catch (error) {
  console.error('Database schema failed', error)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
