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

test('Blog management UI is built from Prompt Draft el primitives instead of page-local native controls', () => {
  const page = source('app/pages/manage/blog.vue')
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const linkModal = source('app/components/manage/ManageBlogLinkModal.vue')

  assert.match(page, /<el-flex\b/)
  assert.match(page, /<el-grid\b/)
  assert.match(page, /<el-text\b/)
  assert.match(page, /<el-text-field\b/)
  assert.match(page, /<el-dropdown\b/)
  assert.match(page, /<el-button\b/)
  assert.match(page, /<el-divider\b/)
  assert.doesNotMatch(page, /<(?:input|textarea|select|option|button|label|section|div|span|h[1-6]|p|strong|small|code|ul|li)\b/i)
  assert.doesNotMatch(page, /<style\b/i)

  assert.match(editor, /<el-text-field\b/)
  assert.match(editor, /type="textarea"/)
  assert.match(editor, /<el-button\b/)
  assert.match(editor, /<el-grid\b/)
  assert.match(editor, /<el-flex\b/)
  assert.match(editor, /<el-text\b/)
  assert.doesNotMatch(editor, /<(?:textarea|button|label|section|span|strong|em)\b/i)
  const nativeDivs = editor.match(/<div\b/gi) ?? []
  assert.equal(nativeDivs.length, 1)
  assert.match(editor, /<div[\s\S]*?v-html="previewHtml"/)

  assert.match(linkModal, /<el-text-field\b/)
  assert.match(linkModal, /<el-button\b/)
  assert.doesNotMatch(linkModal, /<(?:input|textarea|button|label|section|div)\b/i)
})

test('repository identity, timestamps, and editorial author are system-owned instead of raw editor inputs', () => {
  const page = source('app/pages/manage/blog.vue')
  const draft = source('app/utils/manageBlogDraft.ts')

  assert.doesNotMatch(page, /v-model="draft\.id"/)
  assert.doesNotMatch(page, /v-model="draft\.publishedAt"/)
  assert.doesNotMatch(page, /v-model="draft\.updatedAt"/)
  assert.doesNotMatch(page, /draft\.authorName|draft\.authorUrl/)
  assert.doesNotMatch(page, /publicLocalesLabel|fields\.publicLocales/)
  assert.match(page, /localeStates/)
  assert.match(page, /systemMetadataHint/)

  assert.match(draft, /BLOG_SYSTEM_AUTHOR/)
  assert.match(draft, /deriveManageBlogDraftId/)
  assert.doesNotMatch(draft, /authorName:\s*string/)
  assert.doesNotMatch(draft, /authorUrl:\s*string/)
})

test('Markdown link workflow uses the global modal and canonical Blog public URL validator', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const modalComponent = source('app/components/manage/ManageBlogLinkModal.vue')
  const modalComposable = source('app/composables/useBlogLinkModal.ts')

  assert.match(editor, /useBlogLinkModal\(\)/)
  assert.match(editor, /initialLabel:\s*range\.selected/)
  assert.doesNotMatch(editor, /\[\$\{selected \|\| 'label'\}\]\(https:\/\/example\.com\)/)
  assert.match(modalComponent, /normalizeBlogPublicUrl/)
  assert.match(modalComponent, /modal\.close\(\)/)
  assert.match(modalComposable, /modal\.open\(/)
  assert.match(modalComposable, /ManageBlogLinkModal/)
})

test('Markdown preview is theme-colored and top-aligned', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  assert.match(editor, /rules="css"[\s\S]*blog-markdown-preview-shell/)
  assert.match(editor, /color:\s*var\(--normalText\)/)
})

test('Markdown editor grows with content without introducing contenteditable', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')

  assert.match(editor, /syncEditorHeight/)
  assert.match(editor, /element\.style\.height\s*=\s*['"]auto['"]/)
  assert.match(editor, /element\.style\.overflowY\s*=\s*['"]hidden['"]/)
  assert.match(editor, /element\.style\.resize\s*=\s*['"]none['"]/)
  assert.match(editor, /element\.scrollHeight/)
  assert.match(editor, /watch\(model/)
  assert.doesNotMatch(editor, /contenteditable/i)
})

test('Blog Markdown context actions are delegated to the el-text-field global menu pipeline', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const textField = source('app/components/el/text-field.vue')

  assert.match(textField, /contextMenuItems\?:\s*TextFieldContextMenuItemsProp/)
  assert.match(textField, /if \(props\.actions === false\)\s*\{\s*return \[\]/)
  assert.match(textField, /getCustomContextMenuItems\(event\)/)
  assert.match(textField, /selectionStart:\s*field\?\.selectionStart/)
  assert.match(textField, /selectionEnd:\s*field\?\.selectionEnd/)
  assert.match(textField, /mode:\s*["']point["']/)
  assert.match(textField, /@contextmenu="openContextActionMenu"/)

  assert.match(editor, /:context-menu-items="markdownContextMenuItems"/)
  assert.match(editor, /function markdownContextMenuItems\(/)
  assert.match(editor, /return markdownMenuItems\(/)
  assert.match(editor, /handler:\s*\(\) => insertLink\(range\)/)
  assert.match(editor, /handler:\s*\(\) => insertImage\(range\)/)
  assert.match(editor, /handler:\s*\(\) => wrap\(['"]\*\*['"]/)
  assert.match(editor, /handler:\s*\(\) => prefixLines\(['"]## /)
  assert.doesNotMatch(editor, /useMenu\(\)/)
  assert.doesNotMatch(editor, /openMarkdownContextMenu/)
  assert.doesNotMatch(editor, /@contextmenu=/)
})

test('Markdown toolbar restores selection focus without scrolling the page', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const textField = source('app/components/el/text-field.vue')

  assert.match(editor, /focus\?\.\(\{\s*preventScroll:\s*true\s*\}\)/)
  assert.match(editor, /setSelectionRange\(range\.start, range\.start \+ replacement\.length\)/)
  assert.match(textField, /function focus\(options\?: FocusOptions\)/)
  assert.match(textField, /fieldRef\.value\?\.focus\(options\)/)
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
  assert.match(en, /toolbarLabel/)
  assert.match(fa, /toolbarLabel/)
})

test('Blog management neutral styling uses project theme semantics instead of hardcoded white or black', () => {
  const files = [
    source('app/pages/manage/blog.vue'),
    source('app/components/manage/ManageBlogMarkdownEditor.vue'),
    source('app/components/manage/ManageBlogLinkModal.vue'),
  ]

  for (const ui of files) {
    assert.doesNotMatch(ui, /rgb\(\s*255[ ,]/i)
    assert.doesNotMatch(ui, /rgb\(\s*0[ ,]+0[ ,]+0/i)
    assert.doesNotMatch(ui, /#(?:fff|ffffff|000|000000)\b/i)
    assert.doesNotMatch(ui, /(?:color|background(?:-color)?):\s*(?:white|black)\b/i)
  }

  const page = files[0]
  const editor = files[1]
  assert.match(page, /bg="surface"/)
  assert.match(page, /bc="normal15"/)
  assert.match(page, /color="normal55"/)
  assert.match(editor, /bg="normal5"/)
  assert.match(editor, /bc="normal15"/)
  assert.match(editor, /var\(--normalText5\)/)
  assert.match(editor, /var\(--normalText\)/)
})

test('4E.4 adds no editor dependency or second Markdown engine', () => {
  const packageJson = source('package.json')
  assert.doesNotMatch(packageJson, /md-editor-v3/)
  assert.doesNotMatch(packageJson, /markdown-it/)
})
