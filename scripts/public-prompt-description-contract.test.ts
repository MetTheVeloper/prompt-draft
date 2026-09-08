import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('app/pages/prompt/[id].vue', 'utf8')
const presentationSource = readFileSync('app/components/prompts/PromptPresentation.vue', 'utf8')
const publicPromptSource = readFileSync('backend/src/publicPrompt.mjs', 'utf8')
const adminRouteSource = readFileSync('backend/src/adminArchiveRoute.mjs', 'utf8')
const migrationSource = readFileSync(
  'backend/sql/026_prompt_archive_published_localization_constraint.sql',
  'utf8',
)

test('Public Prompt page uses authored description for visible copy and SEO projection', () => {
  assert.match(pageSource, /const localizedDescription = computed\(/)
  assert.match(pageSource, /prompt\.value\?\.description\[activeLocale\.value\]/)
  assert.match(pageSource, /:description="localizedDescription"/)
  assert.match(presentationSource, /\{\{ description \}\}/)
  assert.match(pageSource, /description:\s*localizedDescription\.value/)
  assert.match(pageSource, /const seoDescription = computed\(\(\) => localizedDescription\.value\)/)
  assert.doesNotMatch(pageSource, /t\(['"]growth\.publicPrompt\.description['"]\)/)
})

test('Public Prompt SQL exposes only approved presentation metadata while protected fields remain excluded', () => {
  assert.match(publicPromptSource, /items\.descriptions AS description/)
  assert.match(publicPromptSource, /items\.telegram_message_id AS "telegramMessageId"/)
  assert.match(publicPromptSource, /items\.status = 'published'/)

  for (const forbidden of [
    /items\.prompt/i,
    /items\.variants/i,
    /items\.source_title/i,
    /source_draft/i,
    /storage_key/i,
    /user_content_unlocks/i,
    /user_economy/i,
  ]) {
    assert.doesNotMatch(publicPromptSource, forbidden)
  }
})

test('publish enforcement exists at both API and database boundaries', () => {
  assert.match(adminRouteSource, /validatePublishedArchiveLocalization/)
  assert.match(adminRouteSource, /titles AS title/)
  assert.match(adminRouteSource, /descriptions AS description/)
  assert.match(adminRouteSource, /Archive localization is incomplete/)

  assert.match(migrationSource, /status <> 'published'/)
  assert.match(migrationSource, /titles->>'en'/)
  assert.match(migrationSource, /titles->>'fa'/)
  assert.match(migrationSource, /descriptions->>'en'/)
  assert.match(migrationSource, /descriptions->>'fa'/)
})
