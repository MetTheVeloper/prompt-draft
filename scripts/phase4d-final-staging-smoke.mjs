import assert from 'node:assert/strict'

const siteBase = String(process.env.PHASE4D_SITE_BASE || 'https://grassic.ir').replace(/\/+$/, '')
const apiBase = String(process.env.PHASE4D_API_BASE || 'https://api.grassic.ir').replace(/\/+$/, '')
const discoverySlug = String(
  process.env.PHASE4D_DISCOVERY_SLUG || 'portrait-photography',
).trim().toLowerCase()

assert.ok(discoverySlug, 'Discovery smoke slug is required')
assert.equal(siteBase.includes('prompt-draft.ir'), false, 'Phase 4D smoke must never target prompt-draft.ir')
assert.equal(apiBase.includes('prompt-draft.ir'), false, 'Phase 4D smoke must never target prompt-draft.ir')

const applicationNoindexPaths = [
  '/create',
  '/collage',
  '/vectorizer',
  '/history',
  '/dashboard',
  '/login',
  '/manage',
  '/wizard',
  '/prompts',
  '/user',
]

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
  '"sourceDraftId":',
  '"sourceUserId":',
  '"source_draft_id":',
  '"source_user_id":',
  '"storageKey":',
  '"storage_key":',
  '"variants":',
  '"balance":',
  '"goin":',
  '"permissions":',
  '"sessions":',
  '"viewer":',
  '"totalXp":',
  '"adminAudit":',
]

const CLOUDFLARE_MANAGED_ROBOTS_END = '# END Cloudflare Managed Content'

function assertExactKeys(value, expected, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} contains unexpected/missing keys`)
}

function assertNoPrivateKeys(body, label) {
  for (const key of forbiddenSerializedKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoLegacyDetailRoutes(body, label) {
  assert.equal(body.includes('/prompts?id='), false, `${label} contains legacy Prompt detail route`)
  assert.equal(body.includes('/user?un='), false, `${label} contains legacy Creator detail route`)
}

function assertNoindex(response, label) {
  const value = response.headers.get('x-robots-tag') || ''
  assert.match(value, /noindex/i, `${label} must preserve staging X-Robots-Tag noindex`)
}

function assertNoStore(response, label) {
  const value = response.headers.get('cache-control') || ''
  assert.match(value, /no-store/i, `${label} must preserve no-store under global staging noindex`)
}

function extractOriginRobotsPolicy(body) {
  const markerIndex = body.indexOf(CLOUDFLARE_MANAGED_ROBOTS_END)
  if (markerIndex < 0) {
    return { managedPrependDetected: false, originPolicy: body }
  }

  return {
    managedPrependDetected: true,
    originPolicy: body.slice(markerIndex + CLOUDFLARE_MANAGED_ROBOTS_END.length).trimStart(),
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertPublicSeoHead(html, { canonical, alternate, locale, label }) {
  const language = locale === 'fa' ? 'fa-IR' : 'en-US'
  const direction = locale === 'fa' ? 'rtl' : 'ltr'

  assert.ok(html.includes(`lang="${language}"`), `${label} html lang mismatch`)
  assert.ok(html.includes(`dir="${direction}"`), `${label} html dir mismatch`)
  assert.ok(html.includes('name="robots" content="noindex, nofollow, noarchive"'), `${label} staging robots meta missing`)
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${label} canonical mismatch`)
  assert.ok(html.includes('hreflang="en-US"'), `${label} EN hreflang missing`)
  assert.ok(html.includes('hreflang="fa-IR"'), `${label} FA hreflang missing`)
  assert.ok(html.includes('hreflang="x-default"'), `${label} x-default missing`)
  assert.ok(html.includes(alternate), `${label} reciprocal alternate URL missing`)
}

async function get(url, label) {
  const response = await fetch(url, { redirect: 'manual' })
  console.log(`[phase4d-smoke] ${label}: ${response.status}`)
  return response
}

const inventoryResponse = await get(`${apiBase}/api/public/inventory`, 'public inventory API')
assert.equal(inventoryResponse.status, 200)
const inventoryPayload = await inventoryResponse.json()
assert.equal(inventoryPayload?.ok, true)
assertExactKeys(inventoryPayload, ['ok', 'inventory'], 'Public inventory envelope')
assertExactKeys(inventoryPayload.inventory, ['prompts', 'creators'], 'Public inventory projection')
assert.ok(Array.isArray(inventoryPayload.inventory.prompts), 'Public inventory prompts must be an array')
assert.ok(Array.isArray(inventoryPayload.inventory.creators), 'Public inventory creators must be an array')
assert.ok(inventoryPayload.inventory.prompts.length > 0, 'Staging must expose at least one public Prompt inventory entry')

for (const prompt of inventoryPayload.inventory.prompts) {
  assertExactKeys(prompt, ['id', 'availableLocales'], 'Public inventory Prompt entry')
  assert.ok(Number.isSafeInteger(Number(prompt.id)) && Number(prompt.id) > 0, 'Public inventory Prompt id must be positive')
  assert.ok(Array.isArray(prompt.availableLocales), 'Public inventory Prompt locales must be an array')
}

for (const creator of inventoryPayload.inventory.creators) {
  assertExactKeys(creator, ['username', 'availableLocales', 'policy'], 'Public inventory Creator entry')
  assertExactKeys(creator.policy, ['indexable', 'discoverable'], 'Public inventory Creator policy')
  assert.ok(Array.isArray(creator.availableLocales), 'Public inventory Creator locales must be an array')
}

assertNoPrivateKeys(JSON.stringify(inventoryPayload), 'Public inventory API')

const prompt = inventoryPayload.inventory.prompts.find(item =>
  item.availableLocales?.includes('en') && item.availableLocales?.includes('fa'),
)
assert.ok(prompt, 'Phase 4D staging smoke requires one authoritative EN+FA public Prompt')

const creator = inventoryPayload.inventory.creators.find(item =>
  item.policy?.indexable === true &&
  item.policy?.discoverable === true &&
  item.availableLocales?.includes('en') &&
  item.availableLocales?.includes('fa'),
)
assert.ok(creator, 'Phase 4D staging smoke requires one indexable/discoverable EN+FA Creator')

const protectedArchive = await get(`${apiBase}/api/archive/${prompt.id}`, 'protected Archive detail API')
assert.ok(
  [401, 403].includes(protectedArchive.status),
  `Protected Archive detail must reject unauthenticated access, got ${protectedArchive.status}`,
)

const robotsResponse = await get(`${siteBase}/robots.txt`, 'external robots.txt')
assert.equal(robotsResponse.status, 200)
assertNoindex(robotsResponse, 'external robots.txt')
const robots = await robotsResponse.text()
const { managedPrependDetected, originPolicy: originRobots } = extractOriginRobotsPolicy(robots)
console.log(
  `[phase4d-smoke] Cloudflare Managed robots.txt prepend: ${managedPrependDetected ? 'detected' : 'not detected'}`,
)
assert.match(originRobots, /^User-agent:\s*\*$/mi)
assert.match(originRobots, /^Allow:\s*\/$/m)
assert.doesNotMatch(originRobots, /^Disallow:\s*\/$/m)
assert.doesNotMatch(originRobots, /^Sitemap:/mi)
for (const path of applicationNoindexPaths) {
  assert.ok(originRobots.includes(`Disallow: ${path}`), `origin robots.txt missing ${path}`)
  assert.ok(originRobots.includes(`Disallow: /fa${path}`), `origin robots.txt missing /fa${path}`)
}

const sitemapResponse = await get(`${siteBase}/sitemap.xml`, 'external sitemap.xml')
assert.equal(sitemapResponse.status, 200)
assertNoindex(sitemapResponse, 'external sitemap.xml')
assertNoStore(sitemapResponse, 'external sitemap.xml')
const sitemap = await sitemapResponse.text()
assert.match(sitemap, /<urlset\b/)
assert.equal((sitemap.match(/<url>/g) || []).length, 0, 'Staging sitemap must contain zero public URLs')
assertNoLegacyDetailRoutes(sitemap, 'external sitemap.xml')
assertNoPrivateKeys(sitemap, 'external sitemap.xml')

const llmsResponse = await get(`${siteBase}/llms.txt`, 'external llms.txt')
assert.equal(llmsResponse.status, 200)
assertNoindex(llmsResponse, 'external llms.txt')
assertNoStore(llmsResponse, 'external llms.txt')
const llms = await llmsResponse.text()
assert.match(llms, /^# Prompt Draft$/m)
assert.match(llms, /public AI-discovery inventory is disabled for this environment/i)
assert.equal((llms.match(/\]\(https?:\/\//g) || []).length, 0, 'Staging llms.txt must contain zero canonical Markdown links')
assertNoLegacyDetailRoutes(llms, 'external llms.txt')
assertNoPrivateKeys(llms, 'external llms.txt')

const escapedSiteBase = escapeRegex(siteBase)

for (const locale of ['en', 'fa']) {
  const prefix = locale === 'fa' ? '/fa' : ''

  const promptCanonical = `${siteBase}${prefix}/prompt/${prompt.id}`
  const promptAlternate = `${siteBase}${locale === 'fa' ? '' : '/fa'}/prompt/${prompt.id}`
  const promptResponse = await get(promptCanonical, `${locale.toUpperCase()} representative Public Prompt SSR`)
  assert.equal(promptResponse.status, 200)
  assertNoindex(promptResponse, `${locale.toUpperCase()} representative Public Prompt SSR`)
  const promptHtml = await promptResponse.text()
  assertPublicSeoHead(promptHtml, {
    canonical: promptCanonical,
    alternate: promptAlternate,
    locale,
    label: `${locale.toUpperCase()} representative Public Prompt SSR`,
  })
  assert.ok(promptHtml.includes('"@type":"CreativeWork"'), `${locale.toUpperCase()} Prompt CreativeWork JSON-LD missing`)
  assertNoLegacyDetailRoutes(promptHtml, `${locale.toUpperCase()} representative Public Prompt SSR`)
  assertNoPrivateKeys(promptHtml, `${locale.toUpperCase()} representative Public Prompt SSR`)

  const creatorCanonical = `${siteBase}${prefix}/creator/${creator.username}`
  const creatorAlternate = `${siteBase}${locale === 'fa' ? '' : '/fa'}/creator/${creator.username}`
  const creatorResponse = await get(creatorCanonical, `${locale.toUpperCase()} representative Creator SSR`)
  assert.equal(creatorResponse.status, 200)
  assertNoindex(creatorResponse, `${locale.toUpperCase()} representative Creator SSR`)
  const creatorHtml = await creatorResponse.text()
  assertPublicSeoHead(creatorHtml, {
    canonical: creatorCanonical,
    alternate: creatorAlternate,
    locale,
    label: `${locale.toUpperCase()} representative Creator SSR`,
  })
  assert.ok(creatorHtml.includes('"@type":"ProfilePage"'), `${locale.toUpperCase()} Creator ProfilePage JSON-LD missing`)
  assert.ok(creatorHtml.includes('"@type":"Person"'), `${locale.toUpperCase()} Creator Person JSON-LD missing`)
  assertNoLegacyDetailRoutes(creatorHtml, `${locale.toUpperCase()} representative Creator SSR`)
  assertNoPrivateKeys(creatorHtml, `${locale.toUpperCase()} representative Creator SSR`)

  const discoveryCanonical = `${siteBase}${prefix}/discover/${discoverySlug}`
  const discoveryAlternate = `${siteBase}${locale === 'fa' ? '' : '/fa'}/discover/${discoverySlug}`
  const discoveryResponse = await get(discoveryCanonical, `${locale.toUpperCase()} representative Discovery SSR`)
  assert.equal(discoveryResponse.status, 200)
  assertNoindex(discoveryResponse, `${locale.toUpperCase()} representative Discovery SSR`)
  const discoveryHtml = await discoveryResponse.text()
  assertPublicSeoHead(discoveryHtml, {
    canonical: discoveryCanonical,
    alternate: discoveryAlternate,
    locale,
    label: `${locale.toUpperCase()} representative Discovery SSR`,
  })
  assert.ok(discoveryHtml.includes('public-discovery-page__hero'), `${locale.toUpperCase()} Discovery hero missing`)
  assert.ok(discoveryHtml.includes('"@type":"CollectionPage"'), `${locale.toUpperCase()} Discovery CollectionPage JSON-LD missing`)
  assert.ok(discoveryHtml.includes('"@type":"ItemList"'), `${locale.toUpperCase()} Discovery ItemList JSON-LD missing`)
  const promptUrlPattern = new RegExp(`${escapedSiteBase}${prefix}/prompt/\\d+`)
  assert.match(discoveryHtml, promptUrlPattern, `${locale.toUpperCase()} Discovery canonical Prompt URLs missing`)
  assert.equal(discoveryHtml.includes('data-public-seo-snapshot'), false, `${locale.toUpperCase()} legacy Discovery snapshot marker remains`)
  assert.equal(discoveryHtml.includes('data-public-seo-structured'), false, `${locale.toUpperCase()} legacy Discovery JSON-LD marker remains`)
  assertNoLegacyDetailRoutes(discoveryHtml, `${locale.toUpperCase()} representative Discovery SSR`)
  assertNoPrivateKeys(discoveryHtml, `${locale.toUpperCase()} representative Discovery SSR`)
}

console.log(`\n[phase4d-smoke] Representative public Prompt: ${prompt.id}`)
console.log(`[phase4d-smoke] Representative public Creator: ${creator.username}`)
console.log('[phase4d-smoke] PASS: external robots/sitemap/llms staging precedence, public inventory privacy, protected Archive boundary, and EN/FA Prompt/Creator/Discovery SSR SEO checks passed.')
console.log('[phase4d-smoke] prompt-draft.ir was not targeted by this smoke.')
