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

function llmsHrefs(llms: string) {
  return [...llms.matchAll(/^- \[[^\]]+\]\((https?:\/\/[^)]+)\)$/gm)].map(match => match[1])
}

test('llms.txt projects the same canonical public resource inventory', () => {
  const resources = buildPublicUrlInventory({ dynamicInventory, indexingEnabled: true })
  const llms = renderLlmsTxt(resources, 'https://example.test')
  const links = llmsHrefs(llms)

  assert.equal(links.length, resources.length)
  assert.match(llms, /^# Prompt Draft$/m)
  assert.match(llms, /^> Discover curated visual prompts/m)
  assert.match(llms, /^## Core$/m)
  assert.match(llms, /^## Discovery$/m)
  assert.match(llms, /^## Blog$/m)
  assert.match(llms, /^## Creators$/m)
  assert.match(llms, /^## Public Prompts$/m)

  assert.match(llms, /https:\/\/example\.test\/blog/)
  assert.match(llms, /https:\/\/example\.test\/fa\/blog/)
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
  const linkedUrls = llmsHrefs(llms).join('\n').toLowerCase()

  for (const forbiddenRoute of [
    '/manage',
    '/login',
    '/user?un=',
    '/prompts?id=',
  ]) {
    assert.equal(linkedUrls.includes(forbiddenRoute.toLowerCase()), false, forbiddenRoute)
  }

  // Canonical public inventory URLs must never carry query/hash payloads that
  // could smuggle legacy or viewer-specific state into the AI-discovery file.
  for (const href of llmsHrefs(llms)) {
    const url = new URL(href)
    assert.equal(url.search, '', href)
    assert.equal(url.hash, '', href)
  }

  // These implementation/private identifiers are not natural explanatory prose;
  // their presence anywhere in llms.txt would represent an actual projection leak.
  for (const forbiddenIdentifier of [
    'source_user_id',
    'source_draft_id',
    'storage_key',
  ]) {
    assert.equal(llms.toLowerCase().includes(forbiddenIdentifier), false, forbiddenIdentifier)
  }
})

test('global noindex llms.txt publishes orientation only and no canonical links', () => {
  const resources = buildPublicUrlInventory({ dynamicInventory, indexingEnabled: false })
  const llms = renderLlmsTxt(resources, 'https://grassic.ir')

  assert.deepEqual(resources, [])
  assert.match(llms, /public AI-discovery inventory is disabled for this environment/)
  assert.doesNotMatch(llms, /https?:\/\//)
  assert.doesNotMatch(llms, /^## Blog$/m)
  assert.doesNotMatch(llms, /^## Public Prompts$/m)
})
