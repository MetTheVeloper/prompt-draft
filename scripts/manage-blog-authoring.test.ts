import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

test('frontend and backend share the explicit blog.manage permission contract', () => {
  const frontend = source('app/config/authorization.ts')
  const backend = source('backend/src/authorization.mjs')
  const manage = source('app/config/manage.ts')

  assert.match(frontend, /BLOG_MANAGE:\s*["']blog\.manage["']/)
  assert.match(backend, /BLOG_MANAGE:\s*'blog\.manage'/)
  assert.match(backend, /PERMISSIONS\.BLOG_MANAGE/)
  assert.match(manage, /key:\s*["']blog["']/)
  assert.match(manage, /route:\s*["']\/manage\/blog["']/)
  assert.match(manage, /AUTH_PERMISSIONS\.BLOG_MANAGE/)
})

test('Blog management page is permission-gated and reuses canonical validator + safe renderer', () => {
  const page = source('app/pages/manage/blog.vue')
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const draft = source('app/utils/manageBlogDraft.ts')

  assert.match(page, /middleware:\s*['"]authorization['"]/)
  assert.match(page, /AUTH_PERMISSIONS\.BLOG_MANAGE/)
  assert.match(page, /validateManageBlogDraft/)
  assert.match(page, /ManageBlogMarkdownEditor/)
  assert.match(draft, /validateBlogArticlePackage/)
  assert.match(editor, /renderPublicBlogMarkdown/)
  assert.doesNotMatch(editor, /v-html="model"/)
})

test('Blog management runtime contract stays inside the Nuxt app module graph and remains standalone-testable', () => {
  const draft = source('app/utils/manageBlogDraft.ts')
  const page = source('app/pages/manage/blog.vue')
  const rootContract = source('shared/blog-article.ts')
  const appContract = source('app/shared/blog-article.ts')

  assert.match(draft, /from ['"]\.\.\/shared\/blog-article['"]/)
  assert.doesNotMatch(draft, /from ['"]~\/shared\/blog-article['"]/)
  assert.doesNotMatch(draft, /\.\.\/\.\.\/shared\/blog-article/)
  assert.match(page, /from ['"]~\/shared\/blog-article['"]/)
  assert.match(rootContract, /export \* from ['"]\.\.\/app\/shared\/blog-article['"]/)
  assert.match(appContract, /validateBlogArticlePackage/)
  assert.match(appContract, /validateBlogRepositoryAssets/)
})

test('Nitro management repository endpoints fail behind server-side permission verification', () => {
  const listRoute = source('server/api/manage/blog/index.get.ts')
  const detailRoute = source('server/api/manage/blog/[id].get.ts')
  const auth = source('server/utils/blogManageAuthorization.ts')

  assert.match(listRoute, /requireBlogManage\(event\)/)
  assert.match(detailRoute, /requireBlogManage\(event\)/)
  assert.match(auth, /\/api\/auth\/me/)
  assert.match(auth, /BLOG_MANAGE_PERMISSION\s*=\s*['"]blog\.manage['"]/)
  assert.match(auth, /Authorization:\s*authHeader/)
  assert.match(auth, /statusCode:\s*403/)
  assert.match(auth, /statusCode:\s*502/)
})

test('4E.4 remains read-only until the canonical Git publication adapter', () => {
  assert.equal(existsSync('server/api/manage/blog/index.post.ts'), false)
  assert.equal(existsSync('server/api/manage/blog/[id].put.ts'), false)
  assert.equal(existsSync('server/api/manage/blog/[id].delete.ts'), false)

  const page = source('app/pages/manage/blog.vue')
  assert.match(page, /repositoryNoticeDetail/)
  assert.doesNotMatch(page, /saveArticle\(/)
  assert.doesNotMatch(page, /publishArticle\(/)
})

test('Blog management localization is registered for EN and FA', () => {
  const i18n = source('i18n/i18n.config.ts')
  const en = source('i18n/locales/manage-blog.en.ts')
  const fa = source('i18n/locales/manage-blog.fa.ts')

  assert.match(i18n, /manageBlogEn/)
  assert.match(i18n, /manageBlogFa/)
  assert.match(i18n, /manage-blog\.en/)
  assert.match(i18n, /manage-blog\.fa/)
  assert.match(en, /repository-backed bilingual Blog articles/)
  assert.match(fa, /مخزن/)
  assert.match(en, /repositoryMetadata/)
  assert.match(fa, /repositoryMetadata/)
})

test('4E.4 adds no editor dependency or second Markdown engine', () => {
  const packageJson = source('package.json')
  assert.doesNotMatch(packageJson, /md-editor-v3/)
  assert.doesNotMatch(packageJson, /markdown-it/)
})
