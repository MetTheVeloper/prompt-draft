import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handlePublicInventoryRequest,
  mapPublicInventoryCreator,
  mapPublicInventoryPrompt,
  readPublicInventory,
} from './publicInventory.mjs'

function completeCreator(overrides = {}) {
  return {
    username: 'grassias',
    accountStatus: 'active',
    creatorStatus: 'approved',
    screenNameEn: 'Grassias',
    screenNameFa: 'گراسیاس',
    bioEn: 'English bio',
    bioFa: 'بیو فارسی',
    articleEn: 'English article',
    articleFa: 'مقاله فارسی',
    activeSkillSlugs: ['portrait-photography'],
    ...overrides,
  }
}

test('Prompt inventory advertises only authoritative title+description locales', () => {
  assert.deepEqual(
    mapPublicInventoryPrompt({
      id: 42,
      title: { en: 'English', fa: 'فارسی' },
      description: { en: 'English description', fa: '' },
    }),
    {
      id: 42,
      availableLocales: ['en'],
    },
  )

  assert.equal(
    mapPublicInventoryPrompt({
      id: 43,
      title: { en: '', fa: 'فارسی' },
      description: { en: '', fa: '' },
    }),
    null,
  )
})

test('Creator inventory consumes accepted 4C public policy without a publication gate', () => {
  assert.deepEqual(mapPublicInventoryCreator(completeCreator()), {
    username: 'grassias',
    availableLocales: ['en', 'fa'],
    policy: {
      indexable: true,
      discoverable: true,
    },
  })

  assert.deepEqual(
    mapPublicInventoryCreator(completeCreator({ articleFa: '' })),
    {
      username: 'grassias',
      availableLocales: [],
      policy: {
        indexable: false,
        discoverable: false,
      },
    },
  )
})

test('Creator inventory excludes inaccessible Creator states and noncanonical usernames', () => {
  assert.equal(mapPublicInventoryCreator(completeCreator({ accountStatus: 'suspended' })), null)
  assert.equal(mapPublicInventoryCreator(completeCreator({ creatorStatus: 'pending' })), null)
  assert.equal(mapPublicInventoryCreator(completeCreator({ creatorStatus: 'rejected' })), null)
  assert.equal(mapPublicInventoryCreator(completeCreator({ creatorStatus: 'suspended' })), null)
  assert.equal(mapPublicInventoryCreator(completeCreator({ username: 'Grassias' })), null)
})

test('Public inventory projection exposes only canonical URL inputs', async () => {
  const promptRows = [
    {
      id: 7,
      title: { en: 'Seven', fa: 'هفت' },
      description: { en: 'Seven description', fa: 'توضیح هفت' },
      promptBody: 'must never leak',
      sourceUserId: 'internal-user-id',
    },
  ]
  const creatorRows = [
    completeCreator({
      email: 'private@example.com',
      birthday: '1990-01-01',
      internalUserId: 'internal-user-id',
      role: 'admin',
    }),
  ]

  const query = async (sql) => {
    if (sql.includes('FROM prompt_archive_items items')) return { rows: promptRows }
    if (sql.includes('FROM users')) return { rows: creatorRows }
    throw new Error(`Unexpected query: ${sql}`)
  }

  const inventory = await readPublicInventory(query)
  assert.deepEqual(inventory, {
    prompts: [{ id: 7, availableLocales: ['en', 'fa'] }],
    creators: [{
      username: 'grassias',
      availableLocales: ['en', 'fa'],
      policy: { indexable: true, discoverable: true },
    }],
  })

  const serialized = JSON.stringify(inventory)
  for (const forbidden of [
    'promptBody',
    'sourceUserId',
    'private@example.com',
    'birthday',
    'internalUserId',
    'role',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`)
  }
})

test('Public inventory HTTP handler is GET-only and returns sanitized inventory', async () => {
  const calls = []
  const query = async (sql) => {
    if (sql.includes('FROM prompt_archive_items items')) return { rows: [] }
    if (sql.includes('FROM users')) return { rows: [completeCreator()] }
    throw new Error(`Unexpected query: ${sql}`)
  }
  const sendJson = (_response, statusCode, body, headers) => {
    calls.push({ statusCode, body, headers })
  }

  assert.equal(await handlePublicInventoryRequest({
    request: { method: 'POST' },
    response: {},
    url: new URL('https://api.example.test/api/public/inventory'),
    corsHeaders: {},
    sendJson,
    query,
  }), true)
  assert.equal(calls.at(-1).statusCode, 405)
  assert.equal(calls.at(-1).headers.Allow, 'GET')

  assert.equal(await handlePublicInventoryRequest({
    request: { method: 'GET' },
    response: {},
    url: new URL('https://api.example.test/api/public/inventory'),
    corsHeaders: {},
    sendJson,
    query,
  }), true)
  assert.equal(calls.at(-1).statusCode, 200)
  assert.deepEqual(calls.at(-1).body.inventory.creators[0], {
    username: 'grassias',
    availableLocales: ['en', 'fa'],
    policy: { indexable: true, discoverable: true },
  })
})
