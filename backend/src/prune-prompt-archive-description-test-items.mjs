import { fileURLToPath } from 'node:url'
import { closeDatabase, withDatabaseTransaction } from './database.mjs'
import { readStorageError, requestArchiveStorage } from './archiveStorage.mjs'
import {
  DESCRIPTION_TEST_ARCHIVE_TARGETS,
  IMAGE_KEYS_QUERY,
  ITEM_DELETE_QUERY,
  PROMPT_ARCHIVE_RESOURCE_TYPE,
  TARGET_SELECT_QUERY,
  UNLOCK_DELETE_QUERY,
  assertExpectedDescriptionTestRows,
  collectArchiveStorageKeys,
} from './promptArchiveDescriptionTestPrune.mjs'

export async function pruneApprovedDescriptionTestItems() {
  const publicIds = DESCRIPTION_TEST_ARCHIVE_TARGETS.map(target => target.publicId)
  const publicIdStrings = publicIds.map(String)

  const databaseResult = await withDatabaseTransaction(async client => {
    const targetResult = await client.query(TARGET_SELECT_QUERY, [publicIds])
    const rows = assertExpectedDescriptionTestRows(targetResult.rows)
    const internalIds = rows.map(row => row.internalId)

    const imageResult = await client.query(IMAGE_KEYS_QUERY, [internalIds])
    const storageKeys = collectArchiveStorageKeys(imageResult.rows)

    const unlockResult = await client.query(
      UNLOCK_DELETE_QUERY,
      [PROMPT_ARCHIVE_RESOURCE_TYPE, publicIdStrings],
    )

    const deleteResult = await client.query(ITEM_DELETE_QUERY, [internalIds])
    const deletedPublicIds = deleteResult.rows
      .map(row => Number(row.publicId))
      .sort((a, b) => a - b)

    const expectedPublicIds = [...publicIds].sort((a, b) => a - b)
    if (
      deletedPublicIds.length !== expectedPublicIds.length ||
      deletedPublicIds.some((id, index) => id !== expectedPublicIds[index])
    ) {
      throw new Error(
        `Archive deletion scope changed during transaction; expected ${expectedPublicIds.join(', ')}, deleted ${deletedPublicIds.join(', ')}`,
      )
    }

    return {
      deletedPublicIds,
      deletedUnlockCount: unlockResult.rowCount ?? 0,
      storageKeys,
    }
  })

  const storageFailures = []
  let deletedStorageObjectCount = 0

  for (const key of databaseResult.storageKeys) {
    try {
      const response = await requestArchiveStorage({ method: 'DELETE', key })
      if (!response.ok) {
        storageFailures.push({ key, error: (await readStorageError(response)).message })
        continue
      }
      deletedStorageObjectCount += 1
    } catch (error) {
      storageFailures.push({ key, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return {
    ...databaseResult,
    deletedStorageObjectCount,
    storageFailures,
  }
}

async function main() {
  const result = await pruneApprovedDescriptionTestItems()

  console.log(
    `Deleted approved staging/test Archive rows: ${result.deletedPublicIds.join(', ')}.`,
  )
  console.log(`Deleted ${result.deletedUnlockCount} associated unlock record(s).`)
  console.log(`Deleted ${result.deletedStorageObjectCount} Archive storage object(s).`)

  if (result.storageFailures.length) {
    console.error(
      '[Prompt Archive prune] Archive DB rows are deleted, but some detached storage objects could not be removed:',
    )
    for (const failure of result.storageFailures) {
      console.error(`- ${failure.key}: ${failure.error}`)
    }
    process.exitCode = 2
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main()
    .catch(error => {
      console.error('[Prompt Archive prune] failed:', error.message)
      process.exitCode = 1
    })
    .finally(() => closeDatabase())
}
