import assert from 'node:assert/strict'

const baseUrl = (process.env.BLOG_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')
if (/prompt-draft\.ir/i.test(baseUrl)) {
  throw new Error('Refusing to run Blog smoke against prompt-draft.ir')
}

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
  const text = await response.text()
  return { response, text }
}

function assertCanonical(html, expectedPath) {
  const escaped = expectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(html, new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*${escaped}["']`, 'i'))
}

function assertPublicClean(html, label) {
  for (const forbidden of [
    'source_user_id',
    'source_draft_id',
    'permissions',
    'balance',
    'variants',
    'storage_key',
  ]) {
    assert.equal(html.includes(forbidden), false, `${label} leaks ${forbidden}`)
  }
}

const inventories = {}
for (const locale of ['en', 'fa']) {
  const { response, text } = await request(`/api/public/blog?locale=${locale}`)
  console.log(`[blog-smoke] ${locale} public Blog API: ${response.status}`)
  assert.equal(response.status, 200)
  const payload = JSON.parse(text)
  assert.equal(payload.ok, true)
  assert.equal(Array.isArray(payload.articles), true)
  inventories[locale] = payload.articles
}

for (const locale of ['en', 'fa']) {
  const path = locale === 'fa' ? '/fa/blog' : '/blog'
  const { response, text } = await request(path)
  console.log(`[blog-smoke] ${locale} Blog index SSR: ${response.status}`)
  assert.equal(response.status, 200)
  assertCanonical(text, path)
  assert.match(text, /application\/ld\+json/i)
  assert.match(text, /CollectionPage/)
  assertPublicClean(text, `${locale} Blog index`)

  const xRobots = response.headers.get('x-robots-tag')
  if (xRobots) console.log(`[blog-smoke] ${locale} X-Robots-Tag: ${xRobots}`)
}

for (const locale of ['en', 'fa']) {
  const path = locale === 'fa'
    ? '/fa/blog/phase4e-nonexistent-article'
    : '/blog/phase4e-nonexistent-article'
  const { response } = await request(path)
  console.log(`[blog-smoke] ${locale} missing Blog Article: ${response.status}`)
  assert.equal(response.status, 404)
}

for (const locale of ['en', 'fa']) {
  const first = inventories[locale][0]
  if (!first) {
    console.log(`[blog-smoke] ${locale} positive Article runtime: skipped (no real published Article yet)`)
    continue
  }

  const path = locale === 'fa' ? `/fa/blog/${first.slug}` : `/blog/${first.slug}`
  const { response, text } = await request(path)
  console.log(`[blog-smoke] ${locale} representative Blog Article SSR: ${response.status}`)
  assert.equal(response.status, 200)
  assertCanonical(text, path)
  assert.match(text, /BlogPosting/)
  assert.match(text, new RegExp(first.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assertPublicClean(text, `${locale} Blog Article`)
}

console.log('[blog-smoke] PASS')
