import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BlogGitRepositoryError,
  computeBlogArticleVersion,
  deriveUniqueBlogArticleId,
  parseManageBlogWriteInput,
  writeBlogGitArticle,
  type BlogGitConfig,
} from './blogGitRepository'

const config: BlogGitConfig = {
  token: 'test-token',
  repository: 'MetTheVeloper/prompt-draft',
  branch: 'feature/growth-foundation',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createEmptyGitFetch({ failFirstPatch = false } = {}) {
  const calls: Array<{ method: string; url: string; body: any }> = []
  let refReads = 0
  let patchCalls = 0

  const fetchImpl = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const parsed = new URL(url)
    const method = (init.method || 'GET').toUpperCase()
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : null
    calls.push({ method, url, body })

    if (method === 'GET' && parsed.pathname.includes('/git/ref/heads/')) {
      refReads += 1
      return response({ object: { sha: refReads === 1 ? 'a'.repeat(40) : 'b'.repeat(40) } })
    }
    if (method === 'GET' && parsed.pathname.includes('/git/commits/')) {
      return response({ tree: { sha: 'c'.repeat(40) } })
    }
    if (method === 'GET' && parsed.pathname.includes('/git/trees/')) {
      return response({ tree: [], truncated: false })
    }
    if (method === 'POST' && parsed.pathname.endsWith('/git/trees')) {
      return response({ sha: patchCalls === 0 ? 'd'.repeat(40) : 'e'.repeat(40) }, 201)
    }
    if (method === 'POST' && parsed.pathname.endsWith('/git/commits')) {
      return response({ sha: patchCalls === 0 ? 'f'.repeat(40) : '1'.repeat(40) }, 201)
    }
    if (method === 'PATCH' && parsed.pathname.includes('/git/ref/heads/')) {
      patchCalls += 1
      if (failFirstPatch && patchCalls === 1) return response({ message: 'Update is not a fast forward' }, 422)
      return response({ object: { sha: body.sha } })
    }

    throw new Error(`Unexpected GitHub request ${method} ${url}`)
  }

  return { fetchImpl: fetchImpl as typeof fetch, calls, get patchCalls() { return patchCalls } }
}

function draftInput(expectedVersion: string | null = null) {
  return {
    expectedVersion,
    slug: 'first-blog-article',
    status: 'draft',
    hero: null,
    localizations: {
      en: {
        title: 'First Blog Article',
        description: 'A canonical Blog Article used by the publication contract test.',
      },
    },
    body: {
      en: '## Hello\n\nThis is the body.',
    },
  }
}

test('Blog write input rejects browser ownership of server metadata', () => {
  assert.throws(
    () => parseManageBlogWriteInput({ ...draftInput(), id: 'browser-owned' }),
    (error: unknown) => error instanceof BlogGitRepositoryError && error.code === 'BLOG_WRITE_INVALID',
  )
})

test('Blog Article identity is deterministic and collision-safe', () => {
  assert.equal(deriveUniqueBlogArticleId('first-blog-article', []), 'first-blog-article')
  assert.equal(
    deriveUniqueBlogArticleId('first-blog-article', ['first-blog-article', 'first-blog-article-2']),
    'first-blog-article-3',
  )
})

test('new Blog draft is committed atomically with server-owned metadata', async () => {
  const git = createEmptyGitFetch()
  const now = '2026-09-10T12:00:00.000Z'
  const result = await writeBlogGitArticle({
    config,
    input: draftInput(),
    now,
    fetchImpl: git.fetchImpl,
  })

  assert.equal(result.article.id, 'first-blog-article')
  assert.equal(result.article.status, 'draft')
  assert.equal(result.article.publishedAt, null)
  assert.equal(result.article.updatedAt, now)
  assert.deepEqual(result.article.author, { kind: 'editorial', name: 'Prompt Draft', url: '/' })
  assert.equal(result.action, 'create')
  assert.match(result.version, /^[a-f0-9]{64}$/)
  assert.equal(git.patchCalls, 1)

  const treeCall = git.calls.find(call => call.method === 'POST' && new URL(call.url).pathname.endsWith('/git/trees'))
  assert.ok(treeCall)
  assert.equal(treeCall.body.base_tree, 'c'.repeat(40))
  const paths = treeCall.body.tree.map((entry: any) => entry.path).sort()
  assert.deepEqual(paths, [
    'content/blog/first-blog-article/article.json',
    'content/blog/first-blog-article/en.md',
  ])
  const metadataEntry = treeCall.body.tree.find((entry: any) => entry.path.endsWith('/article.json'))
  const metadata = JSON.parse(metadataEntry.content)
  assert.equal(metadata.author.name, 'Prompt Draft')
  assert.equal(metadata.updatedAt, now)
})

test('first publish receives a server timestamp', async () => {
  const git = createEmptyGitFetch()
  const now = '2026-09-10T12:30:00.000Z'
  const input = { ...draftInput(), status: 'published' as const }
  const result = await writeBlogGitArticle({ config, input, now, fetchImpl: git.fetchImpl })
  assert.equal(result.article.publishedAt, now)
  assert.equal(result.article.updatedAt, now)
  assert.equal(result.article.availableLocales.join(','), 'en')
})

test('Article version is stable for the same canonical file package', () => {
  const assets = {
    'alpha/article.json': '{"id":"alpha"}\n',
    'alpha/en.md': 'Hello\n',
  }
  assert.equal(computeBlogArticleVersion(assets, 'alpha'), computeBlogArticleVersion({ ...assets }, 'alpha'))
  assert.notEqual(
    computeBlogArticleVersion(assets, 'alpha'),
    computeBlogArticleVersion({ ...assets, 'alpha/en.md': 'Changed\n' }, 'alpha'),
  )
})

test('unrelated branch movement retries once without weakening optimistic Article versioning', async () => {
  const git = createEmptyGitFetch({ failFirstPatch: true })
  const result = await writeBlogGitArticle({
    config,
    input: draftInput(),
    now: '2026-09-10T13:00:00.000Z',
    fetchImpl: git.fetchImpl,
  })
  assert.equal(result.article.id, 'first-blog-article')
  assert.equal(git.patchCalls, 2)
})
