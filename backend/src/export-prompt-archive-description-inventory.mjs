import { closeDatabase, queryDatabase } from './database.mjs'
import {
  buildPromptArchiveDescriptionInventory,
  PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY,
} from './promptArchiveDescriptionInventory.mjs'

export async function exportPromptArchiveDescriptionInventory() {
  const result = await queryDatabase(PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY)
  return buildPromptArchiveDescriptionInventory(result.rows)
}

async function main() {
  const inventory = await exportPromptArchiveDescriptionInventory()
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch(error => {
      console.error('[Prompt Archive description inventory] export failed:', error.message)
      process.exitCode = 1
    })
    .finally(() => closeDatabase())
}
