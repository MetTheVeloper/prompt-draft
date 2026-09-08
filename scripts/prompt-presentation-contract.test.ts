import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('shared PromptPresentation is presentation-only and has an SSR media fallback', async () => {
  const source = await read('app/components/prompts/PromptPresentation.vue')

  assert.match(source, /<img[\s\S]*prompt-presentation__ssr-image/)
  assert.match(source, /<ClientOnly>[\s\S]*<visual-slider/)
  assert.ok(
    source.indexOf('prompt-presentation__ssr-image') < source.indexOf('<ClientOnly>'),
    'SSR image fallback must be emitted before client-only canvas enhancement',
  )

  for (const forbidden of [
    'usePromptArchiveUnlock',
    'useEconomy',
    'balance',
    'permissions',
    'authenticated',
    'viewer',
    'variants',
    'copyPrompt',
    'activePrompt',
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `PromptPresentation must not know protected state: ${forbidden}`,
    )
  }

  for (const slot of ['topbar-leading', 'actions', 'status', 'scroll-cue']) {
    assert.match(source, new RegExp(`slot name="${slot}"`))
  }
})

test('public Prompt uses the shared shell without crossing into protected data', async () => {
  const source = await read('app/pages/prompt/[id].vue')

  assert.match(source, /<PromptPresentation/)
  assert.match(source, /usePublicPrompt\(\)/)
  assert.match(source, /path: '\/prompts'/)
  assert.match(source, /localizedDescription/)

  for (const forbidden of [
    'usePromptArchive()',
    'usePromptArchiveUnlock',
    '/api/archive/',
    'item.prompt',
    'variants',
    'balance',
  ]) {
    assert.equal(source.includes(forbidden), false, `public Prompt crossed protected boundary: ${forbidden}`)
  }
})

test('protected Prompt keeps product state outside the shared shell', async () => {
  const [detail, archive, reader] = await Promise.all([
    read('app/components/prompts/PromptDetail.vue'),
    read('backend/src/archive.mjs'),
    read('app/composables/usePromptArchive.ts'),
  ])

  assert.match(detail, /<PromptPresentation/)
  assert.match(detail, /usePromptArchiveUnlock\(\)/)
  assert.match(detail, /props\.item\.prompt/)
  assert.match(detail, /props\.item\.variants/)
  assert.match(detail, /localizedDescription/)

  assert.match(archive, /items\.descriptions AS description/)
  assert.match(reader, /normalizeDescription\(value\.description\)/)
  assert.match(reader, /description: null/)

  assert.equal(
    detail.includes('usePublicPrompt()'),
    false,
    'protected Prompt must not cross-fetch the public Prompt DTO',
  )
})
