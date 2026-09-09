import assert from 'node:assert/strict'

const creatorUsername = String(
  process.argv[2] || process.env.PHASE4C_SMOKE_CREATOR || 'grassias',
).trim().toLowerCase()
const siteBase = String(process.env.PHASE4C_SITE_BASE || 'https://grassic.ir').replace(/\/+$/, '')
const apiBase = String(process.env.PHASE4C_API_BASE || 'https://api.grassic.ir').replace(/\/+$/, '')
const optionalPromptId = Number(process.env.PHASE4C_SMOKE_PROMPT_ID || 0)
const unknownUsername = 'phase4c-no-such-creator-9x7z1'

assert.match(creatorUsername, /^[a-z0-9._-]{3,64}$/, 'Creator smoke username must be canonical')
assert.equal(siteBase.includes('prompt-draft.ir'), false, 'Phase 4C smoke must never target prompt-draft.ir')
assert.equal(apiBase.includes('prompt-draft.ir'), false, 'Phase 4C smoke must never target prompt-draft.ir')

const forbiddenSerializedKeys = [
  '"email":',
  '&quot;email&quot;:',
  '"birthday":',
  '&quot;birthday&quot;:',
  '"passwordHash":',
  '"password_hash":',
  '"role":',
  '&quot;role&quot;:',
  '"creatorStatus":',
  '"reviewNote":',
  '"balance":',
  '"goin":',
  '"permissions":',
  '"sessions":',
  '"totalXp":',
  '"sourceDraftId":',
  '"sourceUserId":',
  '"source_user_id":',
  '"storageKey":',
  '"storage_key":',
  '"locationProviderPlaceId":',
  '"providerPlaceId":',
  '"adminAudit":',
]

function assertNoPrivateKeys(body, label) {
  for (const key of forbiddenSerializedKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertExactKeys(value, expected, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} contains unexpected/missing keys`)
}

function assertNoindex(response, label) {
  const value = response.headers.get('x-robots-tag') || ''
  assert.match(value, /noindex/i, `${label} must preserve staging X-Robots-Tag noindex`)
}

async function get(url, label, options = {}) {
  const response = await fetch(url, { redirect: 'manual', ...options })
  console.log(`[phase4c-smoke] ${label}: ${response.status}`)
  return response
}

const creatorApi = await get(`${apiBase}/api/public/creators/${creatorUsername}`, 'approved Creator API')
assert.equal(creatorApi.status, 200)
const creatorPayload = await creatorApi.json()
assert.equal(creatorPayload?.ok, true)
assertExactKeys(creatorPayload, ['ok', 'creator'], 'Creator API envelope')
assertExactKeys(creatorPayload.creator, ['identity', 'publications', 'policy'], 'Creator public projection')
assertExactKeys(
  creatorPayload.creator.identity,
  ['username', 'screenName', 'bio', 'article', 'avatarUrl', 'cover', 'skills', 'links', 'location'],
  'Creator identity projection',
)
assertExactKeys(creatorPayload.creator.policy, ['indexable', 'discoverable'], 'Creator public policy projection')
assert.equal(creatorPayload.creator.identity.username, creatorUsername)
assert.equal(creatorPayload.creator.policy.indexable, true)
assert.equal(creatorPayload.creator.policy.discoverable, true)
assert.ok(Array.isArray(creatorPayload.creator.publications))
assertExactKeys(creatorPayload.creator.identity.screenName, ['en', 'fa'], 'Creator ScreenName')
assertExactKeys(creatorPayload.creator.identity.bio, ['en', 'fa'], 'Creator Bio')
assertExactKeys(creatorPayload.creator.identity.article, ['en', 'fa'], 'Creator Article')

if (creatorPayload.creator.identity.location !== null) {
  assertExactKeys(creatorPayload.creator.identity.location, ['text'], 'Creator public location')
}

for (const skill of creatorPayload.creator.identity.skills) {
  assertExactKeys(skill, ['slug', 'categorySlug', 'title'], 'Creator public skill')
  assertExactKeys(skill.title, ['en', 'fa'], 'Creator public skill title')
}

for (const link of creatorPayload.creator.identity.links) {
  assertExactKeys(link, ['type', 'url', 'label'], 'Creator public link')
}

assertNoPrivateKeys(JSON.stringify(creatorPayload), 'Creator API')

const unknownApi = await get(`${apiBase}/api/public/creators/${unknownUsername}`, 'unknown Creator API')
assert.equal(unknownApi.status, 404)
const unknownApiPayload = await unknownApi.json()
assert.deepEqual(unknownApiPayload, { ok: false, message: 'Public Creator not found' })

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const canonical = `${siteBase}${prefix}/creator/${creatorUsername}`
  const alternate = `${siteBase}${locale === 'fa' ? '' : '/fa'}/creator/${creatorUsername}`
  const response = await get(canonical, `${locale.toUpperCase()} Creator SSR`)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale.toUpperCase()} Creator SSR`)
  const html = await response.text()

  const screenName = creatorPayload.creator.identity.screenName[locale]
  const bio = creatorPayload.creator.identity.bio[locale]
  assert.ok(screenName && html.includes(screenName), `${locale.toUpperCase()} localized ScreenName missing`)
  assert.ok(bio && html.includes(bio), `${locale.toUpperCase()} localized Bio missing`)
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${locale.toUpperCase()} Creator canonical mismatch`)
  assert.ok(html.includes('hreflang="en-US"'), `${locale.toUpperCase()} EN alternate missing`)
  assert.ok(html.includes('hreflang="fa-IR"'), `${locale.toUpperCase()} FA alternate missing`)
  assert.ok(html.includes('hreflang="x-default"'), `${locale.toUpperCase()} x-default missing`)
  assert.ok(html.includes(alternate), `${locale.toUpperCase()} reciprocal Creator alternate missing`)
  assert.ok(html.includes('"@type":"ProfilePage"'), `${locale.toUpperCase()} ProfilePage JSON-LD missing`)
  assert.ok(html.includes('"@type":"Person"'), `${locale.toUpperCase()} Person JSON-LD missing`)
  assertNoPrivateKeys(html, `${locale.toUpperCase()} Creator SSR`)

  const mixedCaseUsername = `${creatorUsername[0].toUpperCase()}${creatorUsername.slice(1)}`
  if (mixedCaseUsername !== creatorUsername) {
    const redirect = await get(
      `${siteBase}${prefix}/creator/${mixedCaseUsername}`,
      `${locale.toUpperCase()} mixed-case Creator redirect`,
    )
    assert.ok([301, 308].includes(redirect.status), `Expected permanent Creator redirect, got ${redirect.status}`)
    const location = redirect.headers.get('location') || ''
    assert.ok(location.endsWith(`${prefix}/creator/${creatorUsername}`), `${locale.toUpperCase()} redirect target mismatch`)
  }

  const missing = await get(`${siteBase}${prefix}/creator/${unknownUsername}`, `${locale.toUpperCase()} missing Creator SSR`)
  assert.equal(missing.status, 404)
  assertNoindex(missing, `${locale.toUpperCase()} missing Creator SSR`)
}

if (Number.isSafeInteger(optionalPromptId) && optionalPromptId > 0) {
  const promptApi = await get(`${apiBase}/api/public/prompts/${optionalPromptId}`, 'Creator-attributed Public Prompt API')
  assert.equal(promptApi.status, 200)
  const promptPayload = await promptApi.json()
  assert.equal(promptPayload?.ok, true)
  assert.equal(promptPayload?.prompt?.creator?.username, creatorUsername)
  assertExactKeys(promptPayload.prompt.creator, ['username', 'avatarUrl'], 'Public Prompt Creator attribution')
  assertNoPrivateKeys(JSON.stringify(promptPayload), 'Creator-attributed Public Prompt API')

  for (const locale of ['en', 'fa']) {
    const prefix = locale === 'fa' ? '/fa' : ''
    const promptPage = await get(`${siteBase}${prefix}/prompt/${optionalPromptId}`, `${locale.toUpperCase()} attributed Public Prompt SSR`)
    assert.equal(promptPage.status, 200)
    assertNoindex(promptPage, `${locale.toUpperCase()} attributed Public Prompt SSR`)
    const html = await promptPage.text()
    assert.ok(html.includes(`${prefix}/creator/${creatorUsername}`), `${locale.toUpperCase()} Prompt Creator link missing`)
    assertNoPrivateKeys(html, `${locale.toUpperCase()} attributed Public Prompt SSR`)
  }
} else {
  console.log('[phase4c-smoke] Optional Creator-attributed Prompt smoke skipped; set PHASE4C_SMOKE_PROMPT_ID when a stable staging fixture is available.')
}

console.log('\n[phase4c-smoke] PASS: Creator API/SSR, EN/FA SEO, canonical redirects, generic 404, privacy denylist and staging noindex checks passed.')
console.log('[phase4c-smoke] prompt-draft.ir was not targeted by this smoke.')
