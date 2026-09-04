import { readdir, readFile } from 'node:fs/promises'
import { closeDatabase, queryDatabase } from './database.mjs'

const sqlDirectoryUrl = new URL('../sql/', import.meta.url)

try {
  const entries = await readdir(sqlDirectoryUrl, { withFileTypes: true })
  const schemaFiles = entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((first, second) => first.localeCompare(second))

  if (schemaFiles.length === 0) {
    throw new Error('No numbered SQL schema files found')
  }

  for (const fileName of schemaFiles) {
    const sql = await readFile(new URL(fileName, sqlDirectoryUrl), 'utf8')
    await queryDatabase(sql)
    console.log(`Database schema applied: ${fileName}`)
  }
} catch (error) {
  console.error('Database schema failed', error)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
