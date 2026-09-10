import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const isWindows = process.platform === 'win32'
const fixtureId = 'phase4e-final-published-fixture'
const fixtureDir = join(process.cwd(), 'content', 'blog', fixtureId)
const siteBase = 'https://example.test'

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

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function fixtureMetadata() {
  return {
    id: fixtureId,
    slug: fixtureId,
    status: 'published',
    publishedAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-10T12:05:00.000Z',
    author: {
      kind: 'editorial',
      name: 'Prompt Draft',
      url: '/',
    },
    hero: null,
    localizations: {
      en: {
        title: 'Phase 4E final published fixture',
        description: 'Deterministic published Blog fixture for the final static acceptance gate.',
      },
      fa: {
        title: 'فیکسچر نهایی انتشار بلاگ',
        description: 'فیکسچر قطعی مقاله منتشرشده برای پذیرش نهایی استاتیک بلاگ.',
      },
    },
  }
}

async function writeFixture() {
  assert.equal(
    await pathExists(fixtureDir),
    false,
    `Refusing to overwrite existing canonical Blog directory ${fixtureId}`,
  )

  await mkdir(fixtureDir, { recursive: false })
  await Promise.all([
    writeFile(join(fixtureDir, 'article.json'), `${JSON.stringify(fixtureMetadata(), null, 2)}\n`, 'utf8'),
    writeFile(join(fixtureDir, 'en.md'), '# Phase 4E final published fixture\n\nThis Article exists only during the deterministic static verification.\n', 'utf8'),
    writeFile(join(fixtureDir, 'fa.md'), '# فیکسچر نهایی انتشار بلاگ\n\nاین مقاله فقط هنگام راستی‌آزمایی قطعی استاتیک ساخته می‌شود.\n', 'utf8'),
  ])
}

async function assertGeneratedFixture() {
  const paths = [
    [`/blog/${fixtureId}`, 'Phase 4E final published fixture'],
    [`/fa/blog/${fixtureId}`, 'فیکسچر نهایی انتشار بلاگ'],
  ]

  for (const [canonicalPath, title] of paths) {
    const htmlPath = join(process.cwd(), '.output', 'public', ...canonicalPath.split('/').filter(Boolean), 'index.html')
    const html = await readFile(htmlPath, 'utf8')
    assert.ok(html.includes(title), `${canonicalPath} fixture title missing from generated HTML`)
    assert.ok(html.includes('"@type":"BlogPosting"'), `${canonicalPath} BlogPosting JSON-LD missing`)
    assert.ok(
      html.includes(`rel="canonical" href="${siteBase}${canonicalPath}"`),
      `${canonicalPath} canonical missing`,
    )
    assert.equal(html.includes('name="robots" content="noindex'), false, `${canonicalPath} inherited noindex`)
  }

  const [sitemap, llms] = await Promise.all([
    readFile(join(process.cwd(), '.output', 'public', 'sitemap.xml'), 'utf8'),
    readFile(join(process.cwd(), '.output', 'public', 'llms.txt'), 'utf8'),
  ])

  for (const canonicalPath of [`/blog/${fixtureId}`, `/fa/blog/${fixtureId}`]) {
    assert.ok(sitemap.includes(`${siteBase}${canonicalPath}`), `${canonicalPath} missing from generated sitemap`)
    assert.ok(llms.includes(`${siteBase}${canonicalPath}`), `${canonicalPath} missing from generated llms.txt`)
  }
}

console.log('[phase4e-static] Creating an untracked deterministic published Blog fixture for this verification only.')

try {
  await writeFixture()
  const result = runPnpmScript('verify:blog-inventory-static')
  if (result.error) throw result.error
  assert.equal(result.status, 0, `pnpm verify:blog-inventory-static exited with ${result.status ?? 'unknown status'}`)
  await assertGeneratedFixture()
  console.log('[phase4e-static] PASS: published EN/FA Blog detail HTML, BlogPosting SEO, sitemap and llms projection were generated from the deterministic fixture.')
} finally {
  await rm(fixtureDir, { recursive: true, force: true })
  console.log('[phase4e-static] Temporary fixture removed from content/blog.')
}
