import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { renderPublicBlogMarkdown } from '../app/utils/publicBlogMarkdown'
import {
  assertValidBlogRepositoryAssets,
  validateBlogArticlePackage,
  validateBlogRepositoryAssets,
} from '../shared/blog-article'
import { readBlogRepositoryDirectory } from './blog-repository'

function metadata(overrides: Record<string, unknown> = {}) {
  return {
    id: 'first-article',
    slug: 'prompt-anatomy',
    status: 'published',
    publishedAt: '2026-09-09T18:00:00.000Z',
    updatedAt: '2026-09-09T19:00:00.000Z',
    author: {
      kind: 'editorial',
      name: 'Prompt Draft',
      url: '/',
    },
    hero: null,
    localizations: {
      en: {
        title: 'Prompt anatomy for visual workflows',
        description: 'A practical editorial guide to structuring reusable visual prompt workflows.',
      },
      fa: {
        title: 'آناتومی پرامپت برای جریان‌های تصویری',
        description: 'یک راهنمای عملی برای ساخت جریان‌های قابل استفاده مجدد در پرامپت‌های تصویری.',
      },
    },
    ...overrides,
  }
}

test('published Blog Article derives only authoritative locale availability', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'first-article',
    metadata: metadata(),
    body: {
      en: '# English body\n\nUseful editorial content.',
    },
  })

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.article.availableLocales, ['en'])
  assert.equal(result.article.body.fa, undefined)
})

test('published Blog Article requires at least one complete authoritative locale', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'first-article',
    metadata: metadata(),
    body: {},
  })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.issues.some(item => item.path === 'status' && /at least one authoritative locale/.test(item.message)))
})

test('draft Article never becomes publicly available even when localized bodies exist', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'first-article',
    metadata: metadata({ status: 'draft', publishedAt: null }),
    body: {
      en: '# Draft body',
      fa: '# بدنه پیش‌نویس',
    },
  })

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.article.availableLocales, [])
})

test('Article metadata is strict, identity-stable and publication timestamps are ordered', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'different-directory',
    metadata: metadata({
      extraEditorialState: 'private',
      updatedAt: '2026-09-08T19:00:00.000Z',
    }),
    body: { en: '# Body' },
  })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.issues.some(item => item.path === 'article.json' && /exactly/.test(item.message)))
  assert.ok(result.issues.some(item => item.path === 'id' && /directory name/.test(item.message)))
  assert.ok(result.issues.some(item => item.path === 'updatedAt' && /earlier than publishedAt/.test(item.message)))
})

test('V1 author identity is explicit editorial metadata and cannot smuggle private user identity', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'first-article',
    metadata: metadata({
      author: {
        kind: 'creator',
        name: 'Private User',
        url: '/creator/private-user',
        userId: '00000000-0000-0000-0000-000000000000',
      },
    }),
    body: { en: '# Body' },
  })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.issues.some(item => item.path === 'author' && /exactly/.test(item.message)))
  assert.ok(result.issues.some(item => item.path === 'author.kind' && /editorial/.test(item.message)))
})

test('Blog Markdown validation rejects embedded data/base64 and unsafe destination protocols', () => {
  const result = validateBlogArticlePackage({
    directoryId: 'first-article',
    metadata: metadata(),
    body: {
      en: '![embedded](data:image/png;base64,AAAA)',
    },
  })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.issues.some(item => item.path === 'body.en' && /unsafe Markdown/.test(item.message)))
})

test('repository validation rejects duplicate slugs and orphan Article body files', () => {
  const assets = {
    'first-article/article.json': JSON.stringify(metadata()),
    'first-article/en.md': '# First',
    'second-article/article.json': JSON.stringify(metadata({ id: 'second-article' })),
    'second-article/en.md': '# Second',
    'orphan-article/en.md': '# Orphan',
  }

  const result = validateBlogRepositoryAssets(assets)
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.issues.some(item => /duplicates slug/.test(item.message)))
  assert.ok(result.issues.some(item => item.path === 'orphan-article' && /without article.json/.test(item.message)))
})

test('repository validation produces deterministic Article packages from exact V1 files', () => {
  const articles = assertValidBlogRepositoryAssets({
    'README.md': '# ignored repository guidance',
    'first-article/article.json': JSON.stringify(metadata()),
    'first-article/en.md': '# English',
    'first-article/fa.md': '# فارسی',
  })

  assert.equal(articles.length, 1)
  assert.equal(articles[0].id, 'first-article')
  assert.equal(articles[0].slug, 'prompt-anatomy')
  assert.deepEqual(articles[0].availableLocales, ['en', 'fa'])
})

test('filesystem adapter consumes the same shared repository contract', async () => {
  const root = await mkdtemp(join(tmpdir(), 'prompt-draft-blog-'))
  try {
    const articleDir = join(root, 'first-article')
    await mkdir(articleDir, { recursive: true })
    await writeFile(join(articleDir, 'article.json'), JSON.stringify(metadata(), null, 2), 'utf8')
    await writeFile(join(articleDir, 'en.md'), '# English body', 'utf8')
    const articles = await readBlogRepositoryDirectory(root)
    assert.equal(articles.length, 1)
    assert.deepEqual(articles[0].availableLocales, ['en'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('Blog Markdown renderer escapes raw HTML and rejects unsafe link/image protocols', () => {
  const html = renderPublicBlogMarkdown(`# Heading

<script>alert('xss')</script>

[external](https://example.com/path)

[bad](javascript:alert(1))

![hero](https://cdn.example.com/hero.webp)

![bad-image](data:image/png;base64,AAAA)`)

  assert.match(html, /<h2>Heading<\/h2>/)
  assert.equal(html.includes('<script>'), false)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /href="https:\/\/example\.com\/path"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.equal(html.includes('href="javascript:'), false)
  assert.equal(html.includes('src="data:'), false)
  assert.match(html, /src="https:\/\/cdn\.example\.com\/hero\.webp"/)
})

test('Blog Markdown presentation groups heading hierarchy into open collapsible sections and marks images zoomable', () => {
  const html = renderPublicBlogMarkdown(`Intro paragraph.

# Parent heading

Parent body.

## Child heading

Child body.

# Sibling heading

![zoom](https://cdn.example.com/zoom.webp)`)

  assert.match(html, /<div class="blog-article-intro"><p>Intro paragraph\.<\/p><\/div>/)
  assert.equal((html.match(/<details class="blog-article-section"/g) ?? []).length, 3)
  assert.match(html, /data-heading-level="2" open><summary><h2>Parent heading<\/h2><\/summary>/)
  assert.match(html, /data-heading-level="3" open><summary><h3>Child heading<\/h3><\/summary>/)
  assert.match(html, /<h2>Parent heading<\/h2>[\s\S]*<h3>Child heading<\/h3>[\s\S]*<h2>Sibling heading<\/h2>/)
  assert.match(html, /data-blog-zoom="true" role="button" tabindex="0"/)
})

test('Blog Markdown V1 intentionally does not interpret Markdown tables', () => {
  const html = renderPublicBlogMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |')
  assert.equal(html.includes('<table'), false)
  assert.match(html, /\| A \| B \|/)
})
