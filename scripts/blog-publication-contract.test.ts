import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

test('canonical Blog Git credentials stay server-only and are passed only to frontend Nitro runtime', () => {
  const compose = source('compose.yaml')
  const env = source('.env.example')
  const nuxt = source('nuxt.config.ts')

  assert.match(compose, /BLOG_GITHUB_TOKEN:\s*\$\{BLOG_GITHUB_TOKEN:-\}/)
  assert.match(compose, /BLOG_GITHUB_REPOSITORY:/)
  assert.match(compose, /BLOG_GITHUB_BRANCH:/)
  assert.match(env, /BLOG_GITHUB_TOKEN=/)
  assert.match(env, /Contents\s+read\/write permission/)
  assert.doesNotMatch(env, /BLOG_GITHUB_TOKEN=gh[pousr]_/)
  assert.doesNotMatch(nuxt, /NUXT_PUBLIC_BLOG_GITHUB|blogGithubToken/)
})

test('public Blog runtime remains deploy-local and has no GitHub request dependency', () => {
  const publicRepository = source('server/utils/blogRepository.ts')
  const publicList = source('server/api/public/blog/index.get.ts')
  const publicDetail = source('server/api/public/blog/[slug].get.ts')

  for (const runtime of [publicRepository, publicList, publicDetail]) {
    assert.doesNotMatch(runtime, /api\.github\.com|BLOG_GITHUB|blogGitRepository/i)
  }
  assert.match(publicRepository, /useStorage\(['"]assets:blog['"]\)/)
})

test('management Git reads fail closed when configured instead of silently using stale deployed content', () => {
  const repository = source('server/utils/blogManageRepository.ts')
  assert.match(repository, /getConfiguredBlogGitRepository/)
  assert.match(repository, /if \(gitConfig\)[\s\S]*readBlogGitRepository\(gitConfig\)/)
  assert.match(repository, /source:\s*['"]git['"]/)
  assert.match(repository, /source:\s*['"]deployed['"]/)
  assert.doesNotMatch(repository, /catch[\s\S]*loadBlogRepository/)
})

test('Blog Git publication uses one atomic Git tree/commit/ref update with optimistic Article versioning', () => {
  const writer = source('server/utils/blogGitRepository.ts')
  const orchestrator = source('server/utils/blogManageWrite.ts')

  assert.match(writer, /expectedVersion/)
  assert.match(writer, /BLOG_ARTICLE_CONFLICT/)
  assert.match(writer, /base_tree:\s*snapshot\.treeSha/)
  assert.match(writer, /['"]\/git\/trees['"]/)
  assert.match(writer, /['"]\/git\/commits['"]/)
  assert.match(writer, /force:\s*false/)
  assert.match(writer, /BLOG_GIT_REF_RACE/)
  assert.match(writer, /attempt < 2/)
  assert.match(orchestrator, /recordBlogPublicationAudit/)
  assert.match(orchestrator, /BLOG_GIT_NOT_CONFIGURED/)
})

test('publication audit records actor-side metadata without copying Article content into the audit receipt', () => {
  const audit = source('backend/src/adminBlogPublicationAudit.mjs')
  const route = source('backend/src/adminArchiveRoute.mjs')
  const bridge = source('server/utils/blogPublicationAudit.ts')

  assert.match(audit, /PERMISSIONS\.BLOG_MANAGE/)
  assert.match(audit, /actor_user_id/)
  assert.match(audit, /blog\.article\.\$\{body\.action\}/)
  assert.match(route, /handleAdminBlogPublicationAuditRequest/)
  assert.match(bridge, /\/api\/admin\/blog\/publication-audit/)
  assert.doesNotMatch(bridge, /body:\s*result\.article\.body|localizations:\s*result\.article/)
})

test('Blog management UI exposes state-driven save/publish actions and explicit deployment lag', () => {
  const page = source('app/pages/manage/blog.vue')
  const en = source('i18n/locales/manage-blog.en.ts')

  assert.match(page, /saveActionLabel/)
  assert.match(page, /saveArticle/)
  assert.match(page, /blogApi\.create/)
  assert.match(page, /blogApi\.update/)
  assert.match(page, /articleVersion/)
  assert.match(page, /writeConfigured/)
  assert.match(en, /Public runtime will reflect it after the next deployment/)
})
