import { evaluateCreatorProfileContent } from './creatorProfileRequirements.mjs'
import { queryDatabase } from './database.mjs'
import { normalizePublicPromptLocalization, PUBLIC_CONTENT_LOCALES } from './publicLocalization.mjs'
import { evaluateCreatorPublicPolicy } from './publicCreator.mjs'

const PUBLIC_INVENTORY_PATH = '/api/public/inventory'

export function mapPublicInventoryPrompt(row) {
  const id = Number(row?.id)
  if (!Number.isSafeInteger(id) || id <= 0) return null

  const localized = normalizePublicPromptLocalization(row?.title, row?.description)
  if (!localized) return null

  return {
    id,
    availableLocales: [...localized.availableLocales],
  }
}

export function mapPublicInventoryCreator(row) {
  const username = typeof row?.username === 'string' ? row.username.trim() : ''
  if (!username) return null

  const content = evaluateCreatorProfileContent({
    profile: {
      screenName: {
        en: row?.screenNameEn ?? null,
        fa: row?.screenNameFa ?? null,
      },
      bio: {
        en: row?.bioEn ?? null,
        fa: row?.bioFa ?? null,
      },
      article: {
        en: row?.articleEn ?? null,
        fa: row?.articleFa ?? null,
      },
    },
    activeSkillSlugs: Array.isArray(row?.activeSkillSlugs) ? row.activeSkillSlugs : [],
  })

  const policy = evaluateCreatorPublicPolicy({
    accountExists: true,
    accountStatus: row?.accountStatus ?? null,
    creatorStatus: row?.creatorStatus ?? null,
    username,
    creatorProfileComplete: content.complete,
    // Publication count is deliberately not queried here. It remains a signal
    // only in the accepted 4C policy and must never become an inventory gate.
    hasPublishedPrompt: false,
  })

  if (!policy.accessible) return null

  return {
    username,
    availableLocales: policy.indexable ? [...PUBLIC_CONTENT_LOCALES] : [],
    policy: {
      indexable: policy.indexable,
      discoverable: policy.discoverable,
    },
  }
}

async function readPromptInventory(query) {
  const result = await query(`
    SELECT
      items.public_id AS id,
      items.titles AS title,
      items.descriptions AS description
    FROM prompt_archive_items items
    WHERE items.status = 'published'
      AND items.public_id IS NOT NULL
    ORDER BY items.public_id ASC
  `)

  return result.rows
    .map(mapPublicInventoryPrompt)
    .filter(Boolean)
}

async function readCreatorInventory(query) {
  const result = await query(`
    SELECT
      users.username,
      users.status AS "accountStatus",
      creator.status AS "creatorStatus",
      profile.screen_name_en AS "screenNameEn",
      profile.screen_name_fa AS "screenNameFa",
      profile.bio_en AS "bioEn",
      profile.bio_fa AS "bioFa",
      profile.article_en AS "articleEn",
      profile.article_fa AS "articleFa",
      COALESCE(
        ARRAY_AGG(DISTINCT skills.slug) FILTER (
          WHERE skills.slug IS NOT NULL
            AND skills.active = TRUE
            AND categories.active = TRUE
        ),
        ARRAY[]::text[]
      ) AS "activeSkillSlugs"
    FROM users
    INNER JOIN creator_accounts creator
      ON creator.user_id = users.id
    LEFT JOIN user_profiles profile
      ON profile.user_id = users.id
    LEFT JOIN user_profile_skills selected
      ON selected.user_id = users.id
    LEFT JOIN profile_skills skills
      ON skills.slug = selected.skill_slug
    LEFT JOIN profile_skill_categories categories
      ON categories.slug = skills.category_slug
    GROUP BY
      users.id,
      users.username,
      users.status,
      creator.status,
      profile.screen_name_en,
      profile.screen_name_fa,
      profile.bio_en,
      profile.bio_fa,
      profile.article_en,
      profile.article_fa
    ORDER BY users.username ASC
  `)

  return result.rows
    .map(mapPublicInventoryCreator)
    .filter(Boolean)
}

export async function readPublicInventory(query = queryDatabase) {
  const [prompts, creators] = await Promise.all([
    readPromptInventory(query),
    readCreatorInventory(query),
  ])

  return {
    prompts,
    creators,
  }
}

export async function handlePublicInventoryRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  query = queryDatabase,
}) {
  if (url.pathname !== PUBLIC_INVENTORY_PATH) return false

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method not allowed' },
      { ...corsHeaders, Allow: 'GET' },
    )
    return true
  }

  try {
    const inventory = await readPublicInventory(query)
    sendJson(response, 200, { ok: true, inventory }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] public inventory read failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to read public inventory' }, corsHeaders)
  }

  return true
}
