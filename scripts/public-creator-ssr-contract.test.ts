import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('../app/pages/creator/[username].vue', import.meta.url)

async function readPage() {
  return readFile(pageUrl, 'utf8')
}

test('public Creator route is SSR-backed by the sanitized public API contract', async () => {
  const source = await readPage()
  assert.match(source, /usePublicCreator\(\)/)
  assert.match(source, /await useAsyncData\(/)
  assert.match(source, /publicCreatorApi\.load\(canonicalUsername\)/)
  assert.match(source, /statusCode:\s*404/)
  assert.match(source, /statusCode:\s*502/)
})

test('public Creator route canonicalizes mixed-case usernames with a permanent localized redirect', async () => {
  const source = await readPage()
  assert.match(source, /normalizePublicCreatorUsername\(rawUsername\)/)
  assert.match(source, /publicCreatorPath\(canonicalUsername\)/)
  assert.match(source, /redirectCode:\s*301/)
  assert.match(source, /localePath\(publicCreatorPath\(canonicalUsername\),\s*locale\.value\)/)
})

test('Creator article HTML is rendered only through the constrained sanitizer', async () => {
  const source = await readPage()
  assert.match(source, /renderPublicCreatorMarkdown\(localizedArticle\.value\)/)
  assert.match(source, /v-html="articleHtml"/)
  assert.doesNotMatch(source, /v-html="localizedArticle"/)
})

test('public Creator presentation is locale-directed and links publications to canonical public Prompt routes', async () => {
  const source = await readPage()
  assert.match(source, /:dir="pageDirection"/)
  assert.match(source, /publicPromptPath\(publication\.id\)/)
  assert.match(source, /publication\.availableLocales\.includes\(activeLocale\.value\)/)
})

test('public Creator route contains no authenticated owner or admin management hooks', async () => {
  const source = await readPage()
  for (const forbidden of [
    'useAuth(',
    'useProfileManagement(',
    '/manage/profile',
    '/manage/users',
    'creator-account/request',
    'admin/creators',
  ]) {
    assert.equal(source.includes(forbidden), false, `${forbidden} must not enter the public Creator route`)
  }
})
