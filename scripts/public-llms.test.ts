import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPublicUrlInventory,
  renderLlmsTxt,
  type PublicApiInventory,
} from './public-url-inventory'

const dynamicInventory: PublicApiInventory = {
  prompts: [
    { id: 42, availableLocales: ['en', 'fa'] },
    { id: 43, availableLocales: ['fa'] },
  ],
  creators: [
    {
      username: 'grassias',
      availableLocales: ['en', 'fa'],
      policy: { indexable: true, discoverable: true },
    },
    {
      username: 'accessible-only',
      availableLocales: [],
      policy: { indexable: false, discoverable: false },
    },
  ],
}

test('llms.txt projects the same canonical public resource inventory', () => {
  const resources = buildPublicUrlInventory({ dynamicInventory, indexingEnabled: true })
  const llms = renderLlmsTxt(resources, 'https://example.test')
  const links = [...llms.matchAll(/^- \[[^\]]+\]\((https:\/\/example\.test[^)]+)\)$/gm)]

  assert.equal(links.length, resources.length)
  assert.match(llms, /^# Prompt Draft$/m)
  assert.match(llms, /^> Discover curated visual prompts/m)
  assert.match(llms, /^## Core$/m)
  assert.match(llms, /^## Discovery$/m)
  assert.match(llms, /^## Creators$/m)
  assert.match(llms, /^## Public Prompts$/m)

  assert.match(llms, /https:\/\/example\.test\/prompt\/42/)
  assert.match(llms, /https:\/\/example\.test\/fa\/prompt\/42/)
  assert.doesNotMatch(llms, /https:\/\/example\.test\/prompt\/43/)
  assert.match(llms, /https:\/\/example\.test\/fa\/prompt\/43/)
  assert.match(llms, /https:\/\/example\.test\/creator\/grassias/)
  assert.match(llms, /https:\/\/example\.test\/fa\/creator\/grassias/)
  assert.doesNotMatch(llms, /accessible-only/)
})

test('llms.txt excludes protected, private and legacy route forms', () => {
  const resources = buildPublicUrlInventory({ dynamicInventory, indexingEnabled: true })
  const llms = renderLlmsTxt(resources, 'https://example.test')

  for (const forbidden of [
    '/manage',
    '/login',
    '/user?un=',
    '/prompts?id=',
    'source_user_id',
    'source_draft_id',
    'email',
    'birthday',
    'balance',
    'permissions',
    'sessions',
    'storage_key',
  ]) {
    assert.equal(llms.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test('global noindex llms.txt publishes orientation only and no canonical links', () => {
  const resources = buildPublicUrlInventory({ dynamicInventory, indexingEnabled: false })
  const llms = renderLlmsTxt(resources, 'https://grassic.ir')

  assert.deepEqual(resources, [])
  assert.match(llms, /public AI-discovery inventory is disabled for this environment/)
  assert.doesNotMatch(llms, /https?:\/\//)
  assert.doesNotMatch(llms, /^## Public Prompts$/m)
})
