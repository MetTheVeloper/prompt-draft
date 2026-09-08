export const PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY = `
  SELECT
    items.public_id AS "publicId",
    items.titles AS title,
    items.published_at AS "publishedAt",
    COALESCE((
      SELECT json_agg(tags.slug ORDER BY tags.slug)
      FROM prompt_archive_item_tags item_tags
      INNER JOIN prompt_archive_tags tags ON tags.id = item_tags.tag_id
      WHERE item_tags.archive_item_id = items.id
    ), '[]'::json) AS tags,
    (
      SELECT COALESCE(images.thumbnail_url, images.full_url, images.source_path)
      FROM prompt_archive_images images
      WHERE images.archive_item_id = items.id
      ORDER BY images.position ASC, images.id ASC
      LIMIT 1
    ) AS "previewUrl",
    items.descriptions AS description
  FROM prompt_archive_items items
  WHERE items.status = 'published'
  ORDER BY items.public_id ASC
`

function normalizeLocalizedRequired(value, field, publicId) {
  const en = typeof value?.en === 'string' ? value.en.trim() : ''
  const fa = typeof value?.fa === 'string' ? value.fa.trim() : ''
  if (!en || !fa) {
    throw new Error(`Published Archive row ${publicId} has incomplete ${field} localization`)
  }
  return { en, fa }
}

function normalizeLocalizedOptional(value) {
  const en = typeof value?.en === 'string' ? value.en.trim() : ''
  const fa = typeof value?.fa === 'string' ? value.fa.trim() : ''
  return { en, fa }
}

export function mapPromptArchiveDescriptionInventoryRow(row) {
  const publicId = Number(row?.publicId)
  if (!Number.isInteger(publicId) || publicId <= 0) {
    throw new Error('Published Archive inventory contains an invalid public id')
  }

  const publishedAt = row?.publishedAt instanceof Date
    ? row.publishedAt.toISOString()
    : new Date(row?.publishedAt).toISOString()

  return {
    publicId,
    title: normalizeLocalizedRequired(row?.title, 'title', publicId),
    tags: Array.isArray(row?.tags)
      ? row.tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim())
      : [],
    previewUrl: typeof row?.previewUrl === 'string' && row.previewUrl.trim()
      ? row.previewUrl.trim()
      : null,
    publishedAt,
    description: normalizeLocalizedOptional(row?.description),
  }
}

export function buildPromptArchiveDescriptionInventory(rows, generatedAt = new Date()) {
  const items = rows.map(mapPromptArchiveDescriptionInventoryRow)
  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    publishedCount: items.length,
    items,
  }
}
