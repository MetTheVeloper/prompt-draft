import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { PUBLIC_DISCOVERY_INTERESTS } from '../shared/public-discovery'

const isWindows = process.platform === 'win32'
const siteBase = 'https://example.test'

const forbiddenPrivateKeys = [
  '"email":',
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

function runPnpmScript(script: string) {
  if (isWindows) {
    return spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', `pnpm ${script}`],
      { stdio: 'inherit', env: process.env },
    )
  }

  return spawnSync('pnpm', [script], { stdio: 'inherit', env: process.env })
}

function assertNoPrivateKeys(body: string, label: string) {
  for (const key of forbiddenPrivateKeys) {
    assert.equal(body.includes(key), false, `${label} leaked private serialized key ${key}`)
  }
}

function assertNoLegacyDiscoveryRoutes(body: string, label: string) {
  assert.equal(body.includes('/prompts?id='), false, `${label} contains protected Prompt detail route`)
  assert.equal(body.includes('/user?un='), false, `${label} contains legacy Creator detail route`)
}

function generatedHtmlPath(canonicalPath: string) {
  return join(
    process.cwd(),
    '.output',
    'public',
    ...canonicalPath.split('/').filter(Boolean),
    'index.html',
  )
}

console.log('[phase4f-static] Running the accepted Phase 4E static gate first.')
const phase4e = runPnpmScript('verify:phase4e-static')
if (phase4e.error) throw phase4e.error
assert.equal(
  phase4e.status,
  0,
  `pnpm verify:phase4e-static exited with ${phase4e.status ?? 'unknown status'}`,
)

const publicDir = join(process.cwd(), '.output', 'public')
const [sitemap, llms] = await Promise.all([
  readFile(join(publicDir, 'sitemap.xml'), 'utf8'),
  readFile(join(publicDir, 'llms.txt'), 'utf8'),
])
assertNoLegacyDiscoveryRoutes(sitemap, 'static sitemap.xml')
assertNoLegacyDiscoveryRoutes(llms, 'static llms.txt')
assertNoPrivateKeys(sitemap, 'static sitemap.xml')
assertNoPrivateKeys(llms, 'static llms.txt')

let discoveryPagesChecked = 0
for (const locale of ['en', 'fa'] as const) {
  const prefix = locale === 'fa' ? '/fa' : ''
  const language = locale === 'fa' ? 'fa-IR' : 'en-US'
  const direction = locale === 'fa' ? 'rtl' : 'ltr'

  for (const definition of PUBLIC_DISCOVERY_INTERESTS) {
    const canonicalPath = `${prefix}/discover/${definition.slug}`
    const html = await readFile(generatedHtmlPath(canonicalPath), 'utf8')
    const canonical = `${siteBase}${canonicalPath}`
    const label = `${locale.toUpperCase()} static Discovery ${definition.slug}`

    assert.ok(html.includes(`lang="${language}"`), `${label} lang mismatch`)
    assert.ok(html.includes(`dir="${direction}"`), `${label} dir mismatch`)
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${label} canonical mismatch`)
    assert.ok(html.includes('hreflang="en-US"'), `${label} EN hreflang missing`)
    assert.ok(html.includes('hreflang="fa-IR"'), `${label} FA hreflang missing`)
    assert.ok(html.includes('"@type":"CollectionPage"'), `${label} CollectionPage JSON-LD missing`)
    assert.ok(html.includes('"@type":"ItemList"'), `${label} ItemList JSON-LD missing`)
    assert.equal(html.includes('data-public-seo-snapshot'), false, `${label} legacy snapshot marker remains`)
    assert.equal(html.includes('data-public-seo-structured'), false, `${label} legacy structured-data marker remains`)
    assert.equal(
      html.includes('name="robots" content="noindex'),
      false,
      `${label} inherited staging noindex`,
    )
    assertNoLegacyDiscoveryRoutes(html, label)
    assertNoPrivateKeys(html, label)
    discoveryPagesChecked += 1
  }
}

console.log(`\n[phase4f-static] Native Discovery HTML checked: ${discoveryPagesChecked}`)
console.log('[phase4f-static] PASS: integrated Blog/shared-inventory static generation plus native Discovery legacy/private exclusion checks passed.')
