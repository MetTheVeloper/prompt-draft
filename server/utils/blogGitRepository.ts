import { createHash } from 'node:crypto'
import {
  BLOG_ARTICLE_BODY_FILES,
  BLOG_ARTICLE_METADATA_FILE,
  BLOG_LOCALES,
  validateBlogArticlePackage,
  validateBlogRepositoryAssets,
  type BlogArticle,
  type BlogLocale,
  type BlogValidationIssue,
} from '../../shared/blog-article'
import {
  BLOG_SYSTEM_AUTHOR,
  type ManageBlogWriteInput,
} from '../../shared/manage-blog'

const BLOG_REPOSITORY_PREFIX = 'content/blog/'
const ARTICLE_ID_MAX_LENGTH = 80
const ARTICLE_VERSION_PATTERN = /^[a-f0-9]{64}$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const WRITE_INPUT_KEYS = ['expectedVersion', 'slug', 'status', 'hero', 'localizations', 'body'] as const

export type BlogGitConfig = {
  token: string
  repository: string
  branch: string
}

type BlogGitTreeEntry = {
  path?: string
  mode?: string
  type?: string
  sha?: string
}

export type BlogGitRepositorySnapshot = {
  headSha: string
  treeSha: string
  assets: Record<string, string>
  articles: BlogArticle[]
  versions: Map<string, string>
  blobShaByPath: Map<string, string>
}

export type BlogGitWriteResult = {
  article: BlogArticle
  version: string
  commitSha: string
  branch: string
  action: 'create' | 'update' | 'publish' | 'unpublish'
}

export class BlogGitRepositoryError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly issues: BlogValidationIssue[] | null

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    issues: BlogValidationIssue[] | null = null,
  ) {
    super(message)
    this.name = 'BlogGitRepositoryError'
    this.code = code
    this.statusCode = statusCode
    this.issues = issues
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

export function resolveBlogGitConfig(value: {
  blogGithubToken?: unknown
  blogGithubRepository?: unknown
  blogGithubBranch?: unknown
}): BlogGitConfig | null {
  const token = typeof value.blogGithubToken === 'string' ? value.blogGithubToken.trim() : ''
  const repository = typeof value.blogGithubRepository === 'string'
    ? value.blogGithubRepository.trim()
    : ''
  const branch = typeof value.blogGithubBranch === 'string' ? value.blogGithubBranch.trim() : ''

  if (!token || !repository || !branch) return null
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new BlogGitRepositoryError(
      'BLOG_GIT_CONFIG_INVALID',
      'Blog Git repository must use owner/repository format',
      503,
    )
  }
  if (
    branch.length > 255 ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.includes('..') ||
    /[\s~^:?*\\[\]]/.test(branch)
  ) {
    throw new BlogGitRepositoryError(
      'BLOG_GIT_CONFIG_INVALID',
      'Blog Git branch is invalid',
      503,
    )
  }

  return { token, repository, branch }
}

export function parseManageBlogWriteInput(value: unknown): ManageBlogWriteInput {
  if (!isPlainObject(value) || !exactKeys(value, WRITE_INPUT_KEYS)) {
    throw new BlogGitRepositoryError(
      'BLOG_WRITE_INVALID',
      `Blog write body must contain exactly: ${[...WRITE_INPUT_KEYS].sort().join(', ')}`,
      400,
    )
  }

  if (
    value.expectedVersion !== null &&
    (typeof value.expectedVersion !== 'string' || !ARTICLE_VERSION_PATTERN.test(value.expectedVersion))
  ) {
    throw new BlogGitRepositoryError(
      'BLOG_WRITE_INVALID',
      'expectedVersion must be null or a canonical Article version',
      400,
    )
  }

  return {
    expectedVersion: value.expectedVersion as string | null,
    slug: value.slug as ManageBlogWriteInput['slug'],
    status: value.status as ManageBlogWriteInput['status'],
    hero: value.hero as ManageBlogWriteInput['hero'],
    localizations: value.localizations as ManageBlogWriteInput['localizations'],
    body: value.body as ManageBlogWriteInput['body'],
  }
}

function githubHeaders(config: BlogGitConfig) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Prompt-Draft-Blog-Publisher',
  }
}

function githubUrl(config: BlogGitConfig, path: string) {
  return `https://api.github.com/repos/${config.repository}${path}`
}

async function githubJson<T>(
  config: BlogGitConfig,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(githubUrl(config, path), {
    ...init,
    headers: {
      ...githubHeaders(config),
      ...(init.headers ?? {}),
    },
  })

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const remoteMessage = isPlainObject(payload) && typeof payload.message === 'string'
      ? payload.message
      : `GitHub returned HTTP ${response.status}`
    throw new BlogGitRepositoryError(
      response.status === 404 ? 'BLOG_GIT_NOT_FOUND' : 'BLOG_GIT_REMOTE_ERROR',
      remoteMessage,
      response.status === 404 ? 404 : 502,
    )
  }

  return payload as T
}

function decodeGitBlob(value: { content?: string; encoding?: string }) {
  if (value.encoding !== 'base64' || typeof value.content !== 'string') {
    throw new BlogGitRepositoryError('BLOG_GIT_BLOB_INVALID', 'GitHub returned an unsupported Blog blob', 502)
  }
  return Buffer.from(value.content.replace(/\n/g, ''), 'base64').toString('utf8')
}

function articleAssetFiles(assets: Record<string, string>, articleId: string) {
  const prefix = `${articleId}/`
  return Object.entries(assets)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([left], [right]) => left.localeCompare(right))
}

export function computeBlogArticleVersion(assets: Record<string, string>, articleId: string) {
  const files = articleAssetFiles(assets, articleId)
  if (!files.length) return null

  const hash = createHash('sha256')
  for (const [path, content] of files) {
    hash.update(path)
    hash.update('\0')
    hash.update(content)
    hash.update('\0')
  }
  return hash.digest('hex')
}

function branchRefPath(branch: string) {
  return `/git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`
}

export async function readBlogGitRepository(
  config: BlogGitConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<BlogGitRepositorySnapshot> {
  const ref = await githubJson<{ object?: { sha?: string } }>(
    config,
    branchRefPath(config.branch),
    {},
    fetchImpl,
  )
  const headSha = ref.object?.sha
  if (!headSha) {
    throw new BlogGitRepositoryError('BLOG_GIT_REF_INVALID', 'GitHub branch ref did not contain a commit SHA', 502)
  }

  const commit = await githubJson<{ tree?: { sha?: string } }>(
    config,
    `/git/commits/${encodeURIComponent(headSha)}`,
    {},
    fetchImpl,
  )
  const treeSha = commit.tree?.sha
  if (!treeSha) {
    throw new BlogGitRepositoryError('BLOG_GIT_TREE_INVALID', 'GitHub commit did not contain a tree SHA', 502)
  }

  const tree = await githubJson<{ tree?: BlogGitTreeEntry[]; truncated?: boolean }>(
    config,
    `/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
    {},
    fetchImpl,
  )
  if (tree.truncated) {
    throw new BlogGitRepositoryError('BLOG_GIT_TREE_TRUNCATED', 'GitHub returned a truncated repository tree', 502)
  }

  const blobEntries = (tree.tree ?? []).filter(entry => (
    entry.type === 'blob' &&
    typeof entry.path === 'string' &&
    entry.path.startsWith(BLOG_REPOSITORY_PREFIX) &&
    typeof entry.sha === 'string'
  ))

  const assets: Record<string, string> = {}
  const blobShaByPath = new Map<string, string>()

  await Promise.all(blobEntries.map(async (entry) => {
    const repositoryPath = entry.path as string
    const blobSha = entry.sha as string
    const relativePath = repositoryPath.slice(BLOG_REPOSITORY_PREFIX.length)
    const blob = await githubJson<{ content?: string; encoding?: string }>(
      config,
      `/git/blobs/${encodeURIComponent(blobSha)}`,
      {},
      fetchImpl,
    )
    assets[relativePath] = decodeGitBlob(blob)
    blobShaByPath.set(repositoryPath, blobSha)
  }))

  const validation = validateBlogRepositoryAssets(assets)
  if (!validation.ok) {
    throw new BlogGitRepositoryError(
      'BLOG_GIT_REPOSITORY_INVALID',
      'Canonical Blog repository failed validation',
      500,
      validation.issues,
    )
  }

  const versions = new Map<string, string>()
  for (const article of validation.articles) {
    const version = computeBlogArticleVersion(assets, article.id)
    if (version) versions.set(article.id, version)
  }

  return {
    headSha,
    treeSha,
    assets,
    articles: validation.articles,
    versions,
    blobShaByPath,
  }
}

function trimIdBase(slug: string, suffix = '') {
  const maxBase = Math.max(1, ARTICLE_ID_MAX_LENGTH - suffix.length)
  return slug.slice(0, maxBase).replace(/-+$/g, '') || 'article'
}

export function deriveUniqueBlogArticleId(slug: string, usedIds: Iterable<string>) {
  const occupied = new Set(usedIds)
  const first = trimIdBase(slug)
  if (!occupied.has(first)) return first

  for (let number = 2; number < 10_000; number += 1) {
    const suffix = `-${number}`
    const candidate = `${trimIdBase(slug, suffix)}${suffix}`
    if (!occupied.has(candidate)) return candidate
  }

  throw new BlogGitRepositoryError('BLOG_ID_EXHAUSTED', 'Could not assign a unique Blog Article ID', 409)
}

function timestampAtLeast(now: string, minimum: string | null) {
  if (!minimum) return now
  return Date.parse(now) >= Date.parse(minimum) ? now : minimum
}

function canonicalArticleFiles(article: BlogArticle) {
  const metadata = {
    id: article.id,
    slug: article.slug,
    status: article.status,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: article.author,
    hero: article.hero,
    localizations: article.localizations,
  }
  const files: Record<string, string> = {
    [`${article.id}/${BLOG_ARTICLE_METADATA_FILE}`]: `${JSON.stringify(metadata, null, 2)}\n`,
  }

  for (const locale of BLOG_LOCALES) {
    const body = article.body[locale]?.trim()
    if (body) files[`${article.id}/${BLOG_ARTICLE_BODY_FILES[locale]}`] = `${body}\n`
  }

  return files
}

function buildCanonicalArticle({
  id,
  existing,
  input,
  now,
}: {
  id: string
  existing: BlogArticle | null
  input: ManageBlogWriteInput
  now: string
}) {
  const publishedAt = existing?.publishedAt ?? (input.status === 'published' ? now : null)
  const updatedAt = timestampAtLeast(now, publishedAt)
  const result = validateBlogArticlePackage({
    directoryId: id,
    metadata: {
      id,
      slug: input.slug,
      status: input.status,
      publishedAt,
      updatedAt,
      author: { ...BLOG_SYSTEM_AUTHOR },
      hero: input.hero,
      localizations: input.localizations,
    },
    body: input.body,
  })

  if (!result.ok) {
    throw new BlogGitRepositoryError(
      'BLOG_WRITE_VALIDATION_FAILED',
      'Blog Article failed canonical validation',
      400,
      result.issues,
    )
  }

  return result.article
}

function assertTargetVersion(
  snapshot: BlogGitRepositorySnapshot,
  articleId: string,
  expectedVersion: string | null,
  creating: boolean,
) {
  const currentVersion = snapshot.versions.get(articleId) ?? null

  if (creating) {
    if (currentVersion !== null) {
      throw new BlogGitRepositoryError(
        'BLOG_ARTICLE_CONFLICT',
        'A Blog Article with this repository identity already exists',
        409,
      )
    }
    return
  }

  if (!expectedVersion || currentVersion !== expectedVersion) {
    throw new BlogGitRepositoryError(
      'BLOG_ARTICLE_CONFLICT',
      'This Blog Article changed in Git after it was loaded. Reload before saving.',
      409,
    )
  }
}

function determineAction(existing: BlogArticle | null, next: BlogArticle): BlogGitWriteResult['action'] {
  if (!existing) return 'create'
  if (existing.status !== 'published' && next.status === 'published') return 'publish'
  if (existing.status === 'published' && next.status !== 'published') return 'unpublish'
  return 'update'
}

function repositoryWithArticle(
  snapshot: BlogGitRepositorySnapshot,
  articleId: string,
  files: Record<string, string>,
) {
  const nextAssets = { ...snapshot.assets }
  for (const fileName of [BLOG_ARTICLE_METADATA_FILE, ...Object.values(BLOG_ARTICLE_BODY_FILES)]) {
    delete nextAssets[`${articleId}/${fileName}`]
  }
  Object.assign(nextAssets, files)
  return nextAssets
}

async function commitArticleFiles({
  config,
  snapshot,
  articleId,
  files,
  message,
  fetchImpl,
}: {
  config: BlogGitConfig
  snapshot: BlogGitRepositorySnapshot
  articleId: string
  files: Record<string, string>
  message: string
  fetchImpl: typeof fetch
}) {
  const treeEntries: Array<Record<string, unknown>> = Object.entries(files).map(([relativePath, content]) => ({
    path: `${BLOG_REPOSITORY_PREFIX}${relativePath}`,
    mode: '100644',
    type: 'blob',
    content,
  }))

  for (const locale of BLOG_LOCALES) {
    const relativePath = `${articleId}/${BLOG_ARTICLE_BODY_FILES[locale]}`
    const repositoryPath = `${BLOG_REPOSITORY_PREFIX}${relativePath}`
    if (!(relativePath in files) && snapshot.blobShaByPath.has(repositoryPath)) {
      treeEntries.push({ path: repositoryPath, mode: '100644', type: 'blob', sha: null })
    }
  }

  const tree = await githubJson<{ sha?: string }>(
    config,
    '/git/trees',
    {
      method: 'POST',
      body: JSON.stringify({ base_tree: snapshot.treeSha, tree: treeEntries }),
      headers: { 'Content-Type': 'application/json' },
    },
    fetchImpl,
  )
  if (!tree.sha) throw new BlogGitRepositoryError('BLOG_GIT_TREE_INVALID', 'GitHub did not create a tree', 502)

  const commit = await githubJson<{ sha?: string }>(
    config,
    '/git/commits',
    {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [snapshot.headSha] }),
      headers: { 'Content-Type': 'application/json' },
    },
    fetchImpl,
  )
  if (!commit.sha) throw new BlogGitRepositoryError('BLOG_GIT_COMMIT_INVALID', 'GitHub did not create a commit', 502)

  try {
    await githubJson(
      config,
      branchRefPath(config.branch),
      {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha, force: false }),
        headers: { 'Content-Type': 'application/json' },
      },
      fetchImpl,
    )
  } catch (error) {
    if (error instanceof BlogGitRepositoryError && error.code === 'BLOG_GIT_REMOTE_ERROR') {
      throw new BlogGitRepositoryError(
        'BLOG_GIT_REF_RACE',
        'Git branch moved while saving the Blog Article',
        409,
      )
    }
    throw error
  }

  return commit.sha
}

export async function writeBlogGitArticle({
  config,
  input: rawInput,
  articleId = null,
  now = new Date().toISOString(),
  fetchImpl = fetch,
}: {
  config: BlogGitConfig
  input: unknown
  articleId?: string | null
  now?: string
  fetchImpl?: typeof fetch
}): Promise<BlogGitWriteResult> {
  const input = parseManageBlogWriteInput(rawInput)
  let attempt = 0

  while (attempt < 2) {
    const snapshot = await readBlogGitRepository(config, fetchImpl)
    const creating = articleId === null
    let id = articleId
    let existing: BlogArticle | null = null

    if (creating) {
      if (input.expectedVersion !== null) {
        throw new BlogGitRepositoryError('BLOG_ARTICLE_CONFLICT', 'New Blog Articles must not include an existing version', 409)
      }
      if (snapshot.articles.some(article => article.slug === input.slug)) {
        throw new BlogGitRepositoryError('BLOG_SLUG_CONFLICT', 'Another Blog Article already uses this public slug', 409)
      }
      id = deriveUniqueBlogArticleId(input.slug, snapshot.articles.map(article => article.id))
      assertTargetVersion(snapshot, id, null, true)
    } else {
      existing = snapshot.articles.find(article => article.id === id) ?? null
      if (!existing) {
        throw new BlogGitRepositoryError('BLOG_ARTICLE_NOT_FOUND', 'Blog Article not found', 404)
      }
      assertTargetVersion(snapshot, id as string, input.expectedVersion, false)
      if (snapshot.articles.some(article => article.id !== id && article.slug === input.slug)) {
        throw new BlogGitRepositoryError('BLOG_SLUG_CONFLICT', 'Another Blog Article already uses this public slug', 409)
      }
    }

    const article = buildCanonicalArticle({ id: id as string, existing, input, now })
    const files = canonicalArticleFiles(article)
    const nextAssets = repositoryWithArticle(snapshot, article.id, files)
    const repositoryValidation = validateBlogRepositoryAssets(nextAssets)
    if (!repositoryValidation.ok) {
      throw new BlogGitRepositoryError(
        'BLOG_WRITE_REPOSITORY_INVALID',
        'Blog repository would be invalid after this write',
        400,
        repositoryValidation.issues,
      )
    }

    const action = determineAction(existing, article)
    const message = `blog: ${action} ${article.id}`

    try {
      const commitSha = await commitArticleFiles({
        config,
        snapshot,
        articleId: article.id,
        files,
        message,
        fetchImpl,
      })
      const version = computeBlogArticleVersion(nextAssets, article.id)
      if (!version) throw new BlogGitRepositoryError('BLOG_VERSION_INVALID', 'Could not compute saved Article version', 500)
      return { article, version, commitSha, branch: config.branch, action }
    } catch (error) {
      if (error instanceof BlogGitRepositoryError && error.code === 'BLOG_GIT_REF_RACE' && attempt === 0) {
        attempt += 1
        continue
      }
      throw error
    }
  }

  throw new BlogGitRepositoryError('BLOG_GIT_REF_RACE', 'Git branch kept moving while saving the Blog Article', 409)
}
