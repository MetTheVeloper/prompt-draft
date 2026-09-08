import assert from 'node:assert/strict'

const promptId = Number(process.argv[2] || process.env.PHASE4B_SMOKE_PROMPT_ID || 511)
const discoverySlug = String(process.argv[3] || process.env.PHASE4B_SMOKE_DISCOVERY_SLUG || 'portraits-photography').trim()
const siteBase = String(process.env.PHASE4B_SITE_BASE || 'https://grassic.ir').replace(/\/+$/, '')
const apiBase = String(process.env.PHASE4B_API_BASE || 'https://api.grassic.ir').replace(/\/+$/, '')

assert.ok(Number.isSafeInteger(promptId) && promptId > 0, 'Prompt smoke id must be a positive integer')
assert.ok(discoverySlug, 'Discovery smoke slug is required')
assert.equal(siteBase.includes('prompt-draft.ir'), false, 'Phase 4B smoke must never target prompt-draft.ir')
assert.equal(apiBase.includes('prompt-draft.ir'), false, 'Phase 4B smoke must never target prompt-draft.ir')

const forbiddenSerializedKeys = [
  '"sourceDraftId":',
  '"sourceUserId":',
  '"storageKey":',
  '"thumbnailStorageKey":',
  '"variants":',
  '"balance":',
  '"permissions":',
  '"viewer":',
  '"prompt":',
]

function assertNoPrivateKeys(body, label) {
  for (const key of forbiddenSerializedKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoindex(response, label) {
  const value = response.headers.get('x-robots-tag') || ''
  assert.match(value, /noindex/i, `${label} must preserve staging X-Robots-Tag noindex`)
}

async function get(url, label) {
  const response = await fetch(url, { redirect: 'manual' })
  console.log(`[phase4b-smoke] ${label}: ${response.status}`)
  return response
}

const publicApi = await get(`${apiBase}/api/public/prompts/${promptId}`, 'public Prompt API')
assert.equal(publicApi.status, 200)
const publicPayload = await publicApi.json()
assert.equal(publicPayload?.ok, true)
assert.equal(publicPayload?.prompt?.id, promptId)
assert.ok(publicPayload.prompt.availableLocales?.includes('en'))
assert.ok(publicPayload.prompt.availableLocales?.includes('fa'))
assert.ok(publicPayload.prompt.title?.en)
assert.ok(publicPayload.prompt.title?.fa)
assert.ok(publicPayload.prompt.description?.en)
assert.ok(publicPayload.prompt.description?.fa)

const invalidApi = await get(`${apiBase}/api/public/prompts/0`, 'invalid public Prompt API')
assert.equal(invalidApi.status, 404)

const protectedArchive = await get(`${apiBase}/api/archive/${promptId}`, 'protected Archive detail API')
assert.ok([401, 403].includes(protectedArchive.status), `Protected Archive detail must reject unauthenticated access, got ${protectedArchive.status}`)

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const expectedCanonical = `${siteBase}${prefix}/prompt/${promptId}`
  const alternateCanonical = `${siteBase}${locale === 'fa' ? '' : '/fa'}/prompt/${promptId}`
  const response = await get(`${siteBase}${prefix}/prompt/${promptId}`, `${locale.toUpperCase()} Public Prompt SSR`)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale.toUpperCase()} Public Prompt SSR`)
  const html = await response.text()

  assert.match(html, /class="prompt-presentation__ssr-image"/)
  assert.ok(html.includes(publicPayload.prompt.title[locale]), `${locale.toUpperCase()} SSR title missing`)
  assert.ok(html.includes(publicPayload.prompt.description[locale]), `${locale.toUpperCase()} authored description missing`)
  assert.ok(html.includes(`rel="canonical" href="${expectedCanonical}"`), `${locale.toUpperCase()} canonical mismatch`)
  assert.ok(html.includes(`hreflang="en-US"`), `${locale.toUpperCase()} EN alternate missing`)
  assert.ok(html.includes(`hreflang="fa-IR"`), `${locale.toUpperCase()} FA alternate missing`)
  assert.ok(html.includes('hreflang="x-default"'), `${locale.toUpperCase()} x-default missing`)
  assert.ok(html.includes(alternateCanonical), `${locale.toUpperCase()} reciprocal alternate URL missing`)
  assert.ok(html.includes('property="og:description"'), `${locale.toUpperCase()} OG description missing`)
  assert.ok(html.includes('name="twitter:description"'), `${locale.toUpperCase()} Twitter description missing`)
  assert.ok(html.includes('"@type":"CreativeWork"'), `${locale.toUpperCase()} CreativeWork JSON-LD missing`)
  assertNoPrivateKeys(html, `${locale.toUpperCase()} Public Prompt SSR`)
}

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const response = await get(`${siteBase}${prefix}/discover/${discoverySlug}`, `${locale.toUpperCase()} Discovery SSR`)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale.toUpperCase()} Discovery SSR`)
  const html = await response.text()

  assert.ok(html.includes('public-discovery-page__hero'), `${locale.toUpperCase()} Discovery hero missing`)
  assert.ok(html.includes('public-discovery-page__hero-image'), `${locale.toUpperCase()} Discovery SSR first image missing`)
  assert.ok(html.includes(`rel="canonical" href="${siteBase}${prefix}/discover/${discoverySlug}"`), `${locale.toUpperCase()} Discovery canonical mismatch`)
  assertNoPrivateKeys(html, `${locale.toUpperCase()} Discovery SSR`)
}

console.log('\n[phase4b-smoke] PASS: staging public API, EN/FA SSR, SEO, noindex and protected-boundary smoke passed.')
