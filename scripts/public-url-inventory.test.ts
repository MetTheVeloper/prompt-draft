import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPublicUrlInventory,
  isPublicApiInventory,
  renderSitemapXml,
  type PublicApiInventory,
} from './public-url-inventory'

const dynamicInventory: PublicApiInventory = {
  prompts: [
    { id: 10, availableLocales: ['en', 'fa'] },
    { id: 11, availableLocales: ['fa'] },
  ],
  creators: [
    {
      username: 'indexable.creator',
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

test('shared inventory includes static, Discovery, Prompt and indexable Creator canonical routes', () => {
  const inventory = buildPublicUrlInventory({ dynamicInventory })
  const paths = inventory.map(resource => resource.canonicalPath)

  for (const path of [
    '/',
    '/fa',
    '/guide',
    '/fa/guide',
    '/discover/portrait-photography',
    '/fa/discover/portrait-photography',
    '/prompt/10',
    '/fa/prompt/10',
    '/fa/prompt/11',
    '/creator/indexable.creator',
    '/fa/creator/indexable.creator',
  ]) {
    assert.ok(paths.includes(path), `missing ${path}`)
  }

  assert.equal(paths.includes('/prompt/11'), false, 'invented EN Prompt locale')
  assert.equal(paths.includes('/creator/accessible-only'), false, 'included non-indexable Creator')
  assert.equal(paths.includes('/fa/creator/accessible-only'), false, 'included non-indexable Creator FA route')
})

test('shared inventory is deterministic and deduplicated', () => {
  const first = buildPublicUrlInventory({ dynamicInventory })
  const second = buildPublicUrlInventory({ dynamicInventory })

  assert.deepEqual(second, first)
  assert.equal(
    new Set(first.map(resource => `${resource.locale}:${resource.canonicalPath}`)).size,
    first.length,
  )
})

test('global noindex disables all public URL inventory projections', () => {
  assert.deepEqual(
    buildPublicUrlInventory({ dynamicInventory, indexingEnabled: false }),
    [],
  )
})

test('API inventory validation rejects fake locales and malformed policy', () => {
  assert.equal(isPublicApiInventory(dynamicInventory), true)
  assert.equal(isPublicApiInventory({
    prompts: [{ id: 10, availableLocales: ['en', 'de'] }],
    creators: [],
  }), false)
  assert.equal(isPublicApiInventory({
    prompts: [],
    creators: [{
      username: 'creator',
      availableLocales: ['en'],
      policy: { indexable: 'yes', discoverable: true },
    }],
  }), false)
})

test('sitemap projection contains only canonical URLs from the shared inventory', () => {
  const inventory = buildPublicUrlInventory({ dynamicInventory })
  const sitemap = renderSitemapXml(inventory, 'https://example.test')

  assert.match(sitemap, /<loc>https:\/\/example\.test\/prompt\/10<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/example\.test\/fa\/creator\/indexable\.creator<\/loc>/)
  assert.equal(sitemap.includes('/prompts?id='), false)
  assert.equal(sitemap.includes('/user?un='), false)
  assert.equal(sitemap.includes('accessible-only'), false)
  assert.equal(sitemap.includes('source_user_id'), false)
  assert.equal(sitemap.includes('variants'), false)
})
