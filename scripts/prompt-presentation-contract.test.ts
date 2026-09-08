import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

function withoutStyles(source: string) {
  return source.replace(/<style\b[\s\S]*?<\/style>/g, '')
}

test('root PromptPresentation alias resolves the shared prompts component', async () => {
  const alias = await read('app/components/PromptPresentation.vue')

  assert.match(alias, /import PromptsPromptPresentation from '\.\/prompts\/PromptPresentation\.vue'/)
  assert.match(alias, /<PromptsPromptPresentation v-bind="\$attrs">/)

  for (const slot of ['topbar-leading', 'meta', 'actions', 'status', 'scroll-cue']) {
    assert.match(alias, new RegExp(`slot name="${slot}"`))
  }
})

test('shared PromptPresentation is presentation-only, SSR-safe, and theme-synced', async () => {
  const source = await read('app/components/prompts/PromptPresentation.vue')
  const presentationSurface = withoutStyles(source)

  assert.match(source, /<img[\s\S]*prompt-presentation__ssr-image/)
  assert.match(source, /<ClientOnly>[\s\S]*<visual-slider/)
  assert.ok(
    source.indexOf('prompt-presentation__ssr-image') < source.indexOf('<ClientOnly>'),
    'SSR image fallback must be emitted before client-only canvas enhancement',
  )

  assert.match(source, /background:\s*var\(--themeSurface\)/)
  assert.match(source, /color-mix\(in srgb, var\(--themeSurface\)/)
  assert.doesNotMatch(source, /\.prompt-presentation__description\s*\{[^}]*color:/s)
  assert.doesNotMatch(source, /\.prompt-presentation__meta\s*\{[^}]*color:/s)
  assert.match(source, /bg="surface"[\s\S]*color="normal"/)
  assert.match(source, /bg="blue"[\s\S]*color="white"/)

  assert.match(source, /telegramMessageId\?: number \| null/)
  assert.match(source, /telegramUrl\?: string \| null/)
  assert.match(source, /https:\/\/t\.me\/prompt-draft\/\$\{resolvedTelegramMessageId\.value\}/)
  assert.match(source, /target="_blank"/)
  assert.match(source, /rel="noopener noreferrer"/)

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
      presentationSurface.includes(forbidden),
      false,
      `PromptPresentation must not know protected state: ${forbidden}`,
    )
  }

  for (const slot of ['topbar-leading', 'actions', 'status', 'scroll-cue']) {
    assert.match(source, new RegExp(`slot name="${slot}"`))
  }
})

test('public Prompt uses the shared shell without crossing into protected data', async () => {
  const [source, layout] = await Promise.all([
    read('app/pages/prompt/[id].vue'),
    read('app/layouts/default.vue'),
  ])

  assert.match(source, /<PromptPresentation/)
  assert.match(source, /usePublicPrompt\(\)/)
  assert.match(source, /path: '\/prompts'/)
  assert.match(source, /localizedDescription/)
  assert.match(source, /:telegram-message-id="prompt\?\.telegramMessageId \?\? null"/)

  assert.match(layout, /const publicPromptDetailMode = computed\(\(\) => \{/)
  assert.match(layout, /baseRouteName\.value === "prompt-id"/)
  assert.match(layout, /publicPromptDetailMode\.value/)

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
  assert.match(detail, /:telegram-url="item\.telegramUrl"/)
  assert.match(detail, /locale\.value === 'fa' \? 'arrow_forward' : 'arrow_back'/)
  assert.doesNotMatch(detail, /'arrow-right'|'arrow-left'/)

  assert.match(archive, /items\.descriptions AS description/)
  assert.match(reader, /normalizeDescription\(value\.description\)/)
  assert.match(reader, /description: null/)

  assert.equal(
    detail.includes('usePublicPrompt()'),
    false,
    'protected Prompt must not cross-fetch the public Prompt DTO',
  )
})
