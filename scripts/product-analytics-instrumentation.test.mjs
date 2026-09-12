import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('public Prompt and Creator views are tracked only after client mount', async () => {
  const publicPrompt = await source('app/pages/prompt/[id].vue')
  const publicCreator = await source('app/pages/creator/[username].vue')

  for (const [file, eventName, resourceType] of [
    [publicPrompt, 'public_prompt_view', 'public_prompt'],
    [publicCreator, 'public_creator_view', 'public_creator'],
  ]) {
    assert.match(file, /const analytics = useProductAnalytics\(\)/)
    assert.match(file, new RegExp(
      `onMounted\\(\\(\\) => \\{[\\s\\S]*analytics\\.track\\('${eventName}'[\\s\\S]*type: '${resourceType}'`,
    ))

    const asyncDataIndex = file.indexOf('await useAsyncData(')
    const mountedIndex = file.indexOf('onMounted(() => {')
    const eventIndex = file.indexOf(`analytics.track('${eventName}'`)

    assert.ok(asyncDataIndex >= 0)
    assert.ok(mountedIndex > asyncDataIndex)
    assert.ok(eventIndex > mountedIndex)
  }
})

test('public Blog index and Article views use client-mounted canonical resources', async () => {
  const blogIndex = await source('app/pages/blog/index.vue')
  const blogArticle = await source('app/pages/blog/[slug].vue')

  assert.match(blogIndex, /const analytics = useProductAnalytics\(\)/)
  assert.match(blogIndex, /analytics\.track\('public_blog_index_view'/)
  assert.match(blogIndex, /type: 'public_blog'/)
  assert.match(blogIndex, /id: 'index'/)
  assert.ok(blogIndex.indexOf('onMounted(() => {') > blogIndex.indexOf('await useAsyncData('))

  assert.match(blogArticle, /const analytics = useProductAnalytics\(\)/)
  assert.match(blogArticle, /analytics\.track\('public_blog_article_view'/)
  assert.match(blogArticle, /type: 'public_blog'/)
  assert.match(blogArticle, /id: article\.value!\.slug/)

  const articleDataIndex = blogArticle.indexOf('await useAsyncData(')
  const canonicalRedirectIndex = blogArticle.indexOf('if (rawSlugValue !== article.value.slug)')
  const articleMountedIndex = blogArticle.indexOf('onMounted(() => {')
  const articleEventIndex = blogArticle.indexOf("analytics.track('public_blog_article_view'")

  assert.ok(articleDataIndex >= 0)
  assert.ok(canonicalRedirectIndex > articleDataIndex)
  assert.ok(articleMountedIndex > canonicalRedirectIndex)
  assert.ok(articleEventIndex > articleMountedIndex)
})

test('public Discovery only tracks taxonomy-backed routes after client mount', async () => {
  const discovery = await source('app/pages/discover/[slug].vue')

  assert.match(discovery, /const analytics = useProductAnalytics\(\)/)
  assert.match(discovery, /if \(definition\.value\) \{[\s\S]*analytics\.track\('public_discovery_view'/)
  assert.match(discovery, /type: 'public_discovery'/)
  assert.match(discovery, /id: definition\.value\.slug/)

  const dataIndex = discovery.indexOf('await useAsyncData(')
  const mountedIndex = discovery.indexOf('onMounted(() => {')
  const guardIndex = discovery.indexOf('if (definition.value)', mountedIndex)
  const eventIndex = discovery.indexOf("analytics.track('public_discovery_view'", guardIndex)

  assert.ok(dataIndex >= 0)
  assert.ok(mountedIndex > dataIndex)
  assert.ok(guardIndex > mountedIndex)
  assert.ok(eventIndex > guardIndex)
})

test('Prompt detail records intent before unlock/copy completion without replacing success analytics', async () => {
  const file = await source('app/components/prompts/PromptDetail.vue')

  const copyFunctionIndex = file.indexOf('async function copyPrompt()')
  const copyIntentIndex = file.indexOf("analytics.track('prompt_copy_clicked'", copyFunctionIndex)
  const unlockGuardIndex = file.indexOf('if (!promptUnlock.unlocked.value)', copyFunctionIndex)
  const unlockIntentIndex = file.indexOf("analytics.track('prompt_unlock_clicked'", unlockGuardIndex)
  const unlockMutationIndex = file.indexOf('await promptUnlock.unlock(props.item.id)', unlockGuardIndex)
  const clipboardIndex = file.indexOf('const success = await copyText(value)', unlockMutationIndex)
  const copySuccessIndex = file.indexOf("analytics.track('prompt_archive_copy'", clipboardIndex)

  assert.ok(copyFunctionIndex >= 0)
  assert.ok(copyIntentIndex > copyFunctionIndex)
  assert.ok(unlockGuardIndex > copyIntentIndex)
  assert.ok(unlockIntentIndex > unlockGuardIndex)
  assert.ok(unlockMutationIndex > unlockIntentIndex)
  assert.ok(clipboardIndex > unlockMutationIndex)
  assert.ok(copySuccessIndex > clipboardIndex)

  assert.match(file, /type: 'public_prompt'/)
  assert.match(file, /type: 'prompt_archive_item'/)
})

test('admin growth reports acquisition views and launch intent while transactional tables remain conversion truth', async () => {
  const file = await source('backend/src/adminGrowth.mjs')

  for (const eventName of [
    'public_prompt_view',
    'public_creator_view',
    'public_blog_index_view',
    'public_blog_article_view',
    'public_discovery_view',
    'prompt_copy_clicked',
    'prompt_unlock_clicked',
  ]) {
    assert.ok(file.includes(`event_name = '${eventName}'`), eventName)
    assert.ok(file.includes(`'${eventName}'`), eventName)
  }

  assert.match(file, /launchFunnel:/)
  assert.match(file, /publicBlogIndexViews:/)
  assert.match(file, /publicBlogArticleViews:/)
  assert.match(file, /publicDiscoveryViews:/)
  assert.match(file, /completedUnlocks: toNumber\(row\.promptUnlocks\)/)
  assert.match(file, /FROM user_content_unlocks/)
  assert.match(file, /FROM user_economy_events/)
  assert.doesNotMatch(file, /event_name = 'prompt_unlock_completed'/)
  assert.doesNotMatch(file, /event_name = 'goin_spent'/)
})
