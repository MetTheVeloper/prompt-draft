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
  assert.match(media, /alt:\s*requireAlt\(body\.alt\)/)
  assert.match(media, /alt:\s*payload\.alt/)
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

test('Gallery folder navigation and image list use the accepted component-system layout', () => {
  const gallery = source('app/components/manage/MediaGallery.vue')

  assert.doesNotMatch(gallery, /manage\.blog\.media\.folders/)
  assert.match(gallery, /<el-divider\s*\/>[\s\S]*v-if="folders\.length"/)
  assert.match(gallery, /v-for="folder in folders"[\s\S]*:mode="undefined"[\s\S]*color="background"[\s\S]*text-color="normal"[\s\S]*icon-color="normal50"[\s\S]*rules="rsc"/)
  assert.match(gallery, /<el-flex rules="css"[^>]*>[\s\S]*manage\.blog\.media\.assets/)
})

test('Gallery selection is toggleable and upload waits for required persisted alt text', () => {
  const gallery = source('app/components/manage/MediaGallery.vue')
  const types = source('app/types/blogMedia.ts')

  assert.match(gallery, /selected\.value\?\.id === asset\.id \? null : asset/)
  assert.match(gallery, /pendingFile/)
  assert.match(gallery, /pendingAlt/)
  assert.match(gallery, /uploadAltRequired/)
  assert.match(gallery, /alt,/)
  assert.doesNotMatch(gallery, /if \(file\) void uploadFile\(file\)/)
  assert.match(types, /alt:\s*string/)
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

test('Markdown image workflow reuses Gallery and defaults editable alt from managed media', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')
  const altModal = source('app/components/manage/ManageBlogImageAltModal.vue')
  const altComposable = source('app/composables/useBlogImageAltModal.ts')

  assert.match(editor, /useMediaGalleryModal\(\)/)
  assert.match(editor, /useBlogImageAltModal\(\)/)
  assert.match(editor, /asset,/)
  assert.match(editor, /initialAlt:\s*range\.selected\.trim\(\) \|\| asset\.alt/)
  assert.match(editor, /asset\.fullUrl/)
  assert.doesNotMatch(editor, /https:\/\/example\.com\/image\.webp/)
  assert.match(altModal, /props\.asset\.alt/)
  assert.match(altModal, /asset\.thumbnailUrl \|\| asset\.fullUrl/)
  assert.match(altModal, /imageAltRequired/)
  assert.match(altModal, /<el-text-field\b/)
  assert.match(altComposable, /asset:\s*BlogMediaAsset/)
})

test('Markdown authoring panes stay top-aligned and preview images are capped to 400px', () => {
  const editor = source('app/components/manage/ManageBlogMarkdownEditor.vue')

  assert.match(editor, /align-items="start"/)
  assert.ok((editor.match(/<el-flex\s+rules="css"/g) ?? []).length >= 3)
  assert.match(editor, /max-width:\s*min\(100%, 400px\)/)
  assert.match(editor, /max-height:\s*400px/)
  assert.match(editor, /object-fit:\s*contain/)
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
