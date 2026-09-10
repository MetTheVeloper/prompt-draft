import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

test('Blog media API is permission-gated and reuses the existing Arvan storage authority', () => {
  const media = source('backend/src/adminBlogMedia.mjs')
  const storage = source('backend/src/archiveStorage.mjs')
  const route = source('backend/src/adminArchiveRoute.mjs')

  assert.match(media, /PERMISSIONS\.BLOG_MANAGE/)
  assert.match(media, /hasPermission\(user, PERMISSIONS\.BLOG_MANAGE\)/)
  assert.match(media, /BLOG_MEDIA_ROOT\s*=\s*['"]blog\//)
  assert.match(media, /requestArchiveStorage/)
  assert.match(media, /getArchiveStoragePublicUrl/)
  assert.match(media, /blog\.media\.upload/)
  assert.doesNotMatch(media, /ARCHIVE_S3_ACCESS_KEY_ID|ARCHIVE_S3_SECRET_ACCESS_KEY/)
  assert.match(storage, /canonicalizeArchiveStorageQuery/)
  assert.match(storage, /query\s*=\s*null/)
  assert.match(route, /handleAdminBlogMediaRequest/)
})

test('Media Gallery uses Prompt Draft UI primitives with only file/image browser capability sinks', () => {
  const gallery = source('app/components/manage/MediaGallery.vue')
  const api = source('app/composables/useBlogMediaApi.ts')

  assert.match(gallery, /<el-flex\b/)
  assert.match(gallery, /<el-grid\b/)
  assert.match(gallery, /<el-button\b/)
  assert.match(gallery, /<el-text\b/)
  assert.match(gallery, /prepareArchiveImage/)
  assert.match(gallery, /blobToBase64/)
  assert.match(gallery, /type="file"/)
  assert.equal((gallery.match(/<input\b/gi) ?? []).length, 1)
  assert.match(gallery, /<img\b/)
  assert.doesNotMatch(gallery, /<(?:button|textarea|select|option|label|section)\b/i)
  assert.match(api, /\/api\/admin\/blog\/media/)
  assert.match(api, /auth\.authHeaders\(\)/)
})

test('Hero media is selected through Gallery and no longer exposes raw URL/dimension inputs', () => {
  const page = source('app/pages/manage/blog.vue')

  assert.match(page, /useMediaGalleryModal\(\)/)
  assert.match(page, /chooseHero/)
  assert.match(page, /asset\.fullUrl/)
  assert.match(page, /asset\.thumbnailUrl/)
  assert.match(page, /asset\.width/)
  assert.match(page, /asset\.height/)
  assert.doesNotMatch(page, /v-model="draft\.heroFullUrl"/)
  assert.doesNotMatch(page, /v-model="draft\.heroThumbnailUrl"/)
  assert.doesNotMatch(page, /v-model="draft\.heroWidth"/)
  assert.doesNotMatch(page, /v-model="draft\.heroHeight"/)
})

test('Markdown image workflow reuses Gallery and collects contextual alt text before insertion', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const altModal = source('app/components/manage/ManageBlogImageAltModal.vue')

  assert.match(editor, /useMediaGalleryModal\(\)/)
  assert.match(editor, /useBlogImageAltModal\(\)/)
  assert.match(editor, /initialAlt:\s*range\.selected\.trim\(\)/)
  assert.match(editor, /asset\.fullUrl/)
  assert.doesNotMatch(editor, /https:\/\/example\.com\/image\.webp/)
  assert.match(altModal, /imageAltRequired/)
  assert.match(altModal, /<el-text-field\b/)
})

test('Blog media UI stays theme semantic without a parallel local color system', () => {
  const files = [
    source('app/components/manage/MediaGallery.vue'),
    source('app/pages/manage/blog.vue'),
    source('app/components/manage/ManageBlogImageAltModal.vue'),
  ]

  for (const ui of files) {
    assert.doesNotMatch(ui, /rgb\(\s*255[ ,]/i)
    assert.doesNotMatch(ui, /rgb\(\s*0[ ,]+0[ ,]+0/i)
    assert.doesNotMatch(ui, /#(?:fff|ffffff|000|000000)\b/i)
    assert.doesNotMatch(ui, /(?:color|background(?:-color)?):\s*(?:white|black)\b/i)
  }
  assert.match(files[0], /var\(--normalText5\)/)
})
