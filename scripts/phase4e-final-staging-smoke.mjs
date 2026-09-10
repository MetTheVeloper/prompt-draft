import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const siteBase = String(process.env.PHASE4E_SITE_BASE || 'https://grassic.ir').replace(/\/+$/, '')

assert.equal(siteBase.includes('prompt-draft.ir'), false, 'Phase 4E smoke must never target prompt-draft.ir')

const forbiddenSerializedKeys = [
  '"email":',
  '&quot;email&quot;:',
  '"birthday":',
  '"role":',
  '"sourceDraftId":',
  '"sourceUserId":',
  '"source_draft_id":',
  '"source_user_id":',
  '"storageKey":',
  '"storage_key":',
  '"variants":',
  '"balance":',
  '"permissions":',
  '"sessions":',
  '"viewer":',
]

function runPnpmScript(script) {
  if (isWindows) {
    return spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', `pnpm ${script}`],
      { stdio: 'inherit', env: process.env },
    )
  }
  return spawnSync('pnpm', [script], { stdio: 'inherit', env: process.env })
}

function failSpawn(label, result) {
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${label} exited with ${result.status ?? 'unknown status'}`)
}

function assertNoPrivateKeys(body, label) {
  for (const key of forbiddenSerializedKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoindex(response, label) {
  const header = response.headers.get('x-robots-tag') || ''
  assert.match(header, /noindex/i, `${label} must preserve staging X-Robots-Tag noindex`)
}

function assertCanonical(html, expected) {
  const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(html, new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${escaped}["']`, 'i'))
}

async function request(path) {
  const response = await fetch(`${siteBase}${path}`, { redirect: 'manual' })
  const text = await response.text()
  console.log(`[phase4e-smoke] ${path}: ${response.status}`)
  return { response, text }
}

console.log('[phase4e-smoke] First re-running the accepted external Phase 4D staging baseline.')
const baseline = runPnpmScript('smoke:phase4d-final')
failSpawn('pnpm smoke:phase4d-final', baseline)

const inventories = {}
for (const locale of ['en', 'fa']) {
  const { response, text } = await request(`/api/public/blog?locale=${locale}`)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale} public Blog API`)
  const payload = JSON.parse(text)
  assert.equal(payload?.ok, true)
  assert.ok(Array.isArray(payload.articles), `${locale} Blog API articles must be an array`)
  inventories[locale] = payload.articles
  assertNoPrivateKeys(text, `${locale} public Blog API`)
}

for (const locale of ['en', 'fa']) {
  const path = locale === 'fa' ? '/fa/blog' : '/blog'
  const alternate = locale === 'fa' ? `${siteBase}/blog` : `${siteBase}/fa/blog`
  const { response, text } = await request(path)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale} Blog index`)
  assertCanonical(text, `${siteBase}${path}`)
  assert.ok(text.includes(alternate), `${locale} Blog reciprocal alternate missing`)
  assert.match(text, /hreflang=["']en-US["']/i)
  assert.match(text, /hreflang=["']fa-IR["']/i)
  assert.match(text, /hreflang=["']x-default["']/i)
  assert.match(text, /CollectionPage/)
  assert.match(text, /ItemList/)
  assertNoPrivateKeys(text, `${locale} Blog index`)
}

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const missing = `${prefix}/blog/phase4e-nonexistent-article`
  const { response } = await request(missing)
  assert.equal(response.status, 404)
  assertNoindex(response, `${locale} missing Blog Article`)
}

const removedSmokeSlug = 'blog-publication-smoke-20260910'
for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const { response } = await request(`${prefix}/blog/${removedSmokeSlug}`)
  assert.equal(response.status, 404, 'Removed publication smoke Article must not be publicly deployed')
}

for (const locale of ['en', 'fa']) {
  const first = inventories[locale][0]
  if (!first) {
    console.log(`[phase4e-smoke] ${locale} positive published Article staging case skipped: canonical staging currently has no published Blog Article.`)
    continue
  }
  const prefix = locale === 'fa' ? '/fa' : ''
  const path = `${prefix}/blog/${first.slug}`
  const { response, text } = await request(path)
  assert.equal(response.status, 200)
  assertNoindex(response, `${locale} representative Blog Article`)
  assertCanonical(text, `${siteBase}${path}`)
  assert.match(text, /BlogPosting/)
  assertNoPrivateKeys(text, `${locale} representative Blog Article`)
}

console.log('\n[phase4e-smoke] PASS: Phase 4D external baseline plus Blog API/index/404/noindex/canonical/privacy staging checks passed.')
console.log('[phase4e-smoke] Positive published Article rendering is mandatory in the separate deterministic static fixture verification when staging has no published Article.')
console.log('[phase4e-smoke] prompt-draft.ir was not targeted.')
