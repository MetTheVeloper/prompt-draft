import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('Prompt Archive cards open localized protected detail without stealing control clicks', async () => {
  const file = await source('app/components/prompts/PromptItem.vue')

  assert.match(file, /const localePath = useLocalePath\(\)/)
  assert.match(file, /detailUrl = computed\(\(\) => `\$\{localePath\('\/prompts'\)\}\?id=\$\{props\.item\.id\}`\)/)
  assert.equal((file.match(/@click="openDetailFromCard"/g) ?? []).length, 2)
  assert.match(file, /target\.closest\([^\n]*\.crp/)
  assert.match(file, /await navigateTo\(detailUrl\.value\)/)
})

test('owner Draft cards reuse the existing three-dot menu at the card click point', async () => {
  const page = await source('app/pages/user.vue')
  const plugin = await source('app/plugins/user-draft-card-menu.client.ts')

  assert.match(page, /function openDraftActions\(event: MouseEvent, draft: UserProfileDraftSummary\)/)
  assert.match(page, /mode: "point"/)
  assert.match(page, /icon="more_vert"/)

  assert.match(plugin, /\.user-profile__draft-card/)
  assert.match(plugin, /\.el-icon__symbol/)
  assert.match(plugin, /textContent\?\.trim\(\) === 'more_vert'/)
  assert.match(plugin, /icon\?\.closest\('\.crp'\)/)
  assert.match(plugin, /clientX: event\.clientX/)
  assert.match(plugin, /clientY: event\.clientY/)
  assert.match(plugin, /menuTrigger\.dispatchEvent\(cloneClickAtOriginalPoint\(event\)\)/)
  assert.match(plugin, /target\.closest\(INTERACTIVE_SELECTOR\)/)
})

test('Home separates category, Prompt body and controls while preserving canonical public routes', async () => {
  const file = await source('app/components/home/HomeDiscoverySection.vue')

  assert.match(file, /publicDiscoveryPath, publicPromptPath/)
  assert.match(file, /return localePath\(publicDiscoveryPath\(props\.definition\.slug\)\)/)
  assert.match(file, /return localePath\(publicPromptPath\(id\)\)/)
  assert.match(file, /@click="openActivePrompt"/)
  assert.match(file, /home-discovery-section__category-link/)
  assert.match(file, /@click\.stop="openDiscovery"/)
  assert.ok((file.match(/@click\.stop/g) ?? []).length >= 4)
})

test('Home carousel arrow semantics follow locale text direction', async () => {
  const home = await source('app/components/home/HomeDiscoverySection.vue')
  const direction = await source('app/utils/localeDirection.ts')

  assert.match(home, /localeTextDirection\(locale\.value\) === 'rtl'/)
  assert.match(home, /previousIcon = computed\(\(\) => isRtl\.value \? 'arrow_forward' : 'arrow_back'\)/)
  assert.match(home, /nextIcon = computed\(\(\) => isRtl\.value \? 'arrow_back' : 'arrow_forward'\)/)
  assert.match(direction, /new Intl\.Locale\(normalized\)/)
  assert.match(direction, /textInfo\?\.direction/)
})
