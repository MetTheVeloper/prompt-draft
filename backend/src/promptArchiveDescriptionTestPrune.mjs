export const PROMPT_ARCHIVE_RESOURCE_TYPE = 'prompt_archive_item'

export const DESCRIPTION_TEST_ARCHIVE_TARGETS = Object.freeze([
  Object.freeze({ publicId: 9002, expectedTitleEn: 'TEST' }),
  Object.freeze({ publicId: 9003, expectedTitleEn: 'From Grassias' }),
])

export const TARGET_SELECT_QUERY = `
  SELECT
    items.id AS "internalId",
    items.public_id AS "publicId",
    items.titles->>'en' AS "titleEn",
    items.status
  FROM prompt_archive_items items
  WHERE items.public_id = ANY($1::integer[])
  ORDER BY items.public_id ASC
  FOR UPDATE
`

export const IMAGE_KEYS_QUERY = `
  SELECT
    archive_item_id AS "internalId",
    storage_key AS "storageKey",
    thumbnail_storage_key AS "thumbnailStorageKey"
  FROM prompt_archive_images
  WHERE archive_item_id = ANY($1::uuid[])
  ORDER BY archive_item_id ASC, position ASC
`

export const UNLOCK_DELETE_QUERY = `
  DELETE FROM user_content_unlocks
  WHERE resource_type = $1
    AND resource_id = ANY($2::text[])
`

export const ITEM_DELETE_QUERY = `
  DELETE FROM prompt_archive_items
  WHERE id = ANY($1::uuid[])
  RETURNING public_id AS "publicId"
`

export function assertExpectedDescriptionTestRows(rows) {
  const actual = Array.isArray(rows) ? rows : []
  if (actual.length !== DESCRIPTION_TEST_ARCHIVE_TARGETS.length) {
    throw new Error(
      `Expected ${DESCRIPTION_TEST_ARCHIVE_TARGETS.length} approved staging/test Archive rows, found ${actual.length}`,
    )
  }

  const byPublicId = new Map(actual.map(row => [Number(row.publicId), row]))

  for (const target of DESCRIPTION_TEST_ARCHIVE_TARGETS) {
    const row = byPublicId.get(target.publicId)
    if (!row) throw new Error(`Approved deletion target #${target.publicId} was not found`)
    if (row.status !== 'published') {
      throw new Error(`Approved deletion target #${target.publicId} is no longer published`)
    }
    if (row.titleEn !== target.expectedTitleEn) {
      throw new Error(
        `Approved deletion target #${target.publicId} title changed: expected "${target.expectedTitleEn}", got "${row.titleEn ?? ''}"`,
      )
    }
  }

  for (const row of actual) {
    if (!DESCRIPTION_TEST_ARCHIVE_TARGETS.some(target => target.publicId === Number(row.publicId))) {
      throw new Error(`Unexpected Archive row #${row.publicId} entered the deletion plan`)
    }
  }

  return actual
}

export function collectArchiveStorageKeys(imageRows) {
  const keys = new Set()
  for (const row of Array.isArray(imageRows) ? imageRows : []) {
    for (const value of [row.storageKey, row.thumbnailStorageKey]) {
      const key = typeof value === 'string' ? value.trim() : ''
      if (key) keys.add(key)
    }
  }
  return [...keys]
}
