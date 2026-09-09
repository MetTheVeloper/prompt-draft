import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { normalizePublicCreatorAttribution } from '../app/utils/publicCreatorAttribution'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

function withoutStyles(source: string) {
  return source.replace(/<style\b[\s\S]*?<\/style>/g, '')
}

test('browser attribution normalizer projects only canonical username and safe avatar', () => {
  const value = normalizePublicCreatorAttribution({
    username: 'grassias',
    avatarUrl: 'https://cdn.example.com/avatar.webp',
    id: 'PRIVATE_UUID_SENTINEL',
    email: 'PRIVATE_EMAIL_SENTINEL@example.com',
    role: 'super_admin',
    creatorStatus: 'approved',
  })

  assert.deepEqual(value, {
    username: 'grassias',
    avatarUrl: 'https://cdn.example.com/avatar.webp',
  })
  assert.equal(JSON.stringify(value).includes('PRIVATE_UUID_SENTINEL'), false)
  assert.equal(JSON.stringify(value).includes('PRIVATE_EMAIL_SENTINEL'), false)

  assert.equal(normalizePublicCreatorAttribution(null), null)
  assert.equal(normalizePublicCreatorAttribution({ username: 'GrassiaS', avatarUrl: null }), undefined)
  assert.equal(normalizePublicCreatorAttribution({ username: 'grassias', avatarUrl: 'javascript:alert(1)' }), undefined)
})

test('Public Prompt renders locale-safe Creator attribution only from the public creator field', async () => {
  const source = withoutStyles(await read('app/pages/prompt/[id].vue'))

  assert.match(source, /publicCreatorPath\(prompt\.value\.creator\.username\)/)
  assert.match(source, /localePath\(publicCreatorPath\(prompt\.value\.creator\.username\),\s*activeLocale\.value\)/)
  assert.match(source, /v-if="prompt\?\.creator"/)
  assert.match(source, /prompt\.creator\.avatarUrl/)
  assert.match(source, /@\{\{ prompt\.creator\.username \}\}/)

  for (const forbidden of ['sourceUserId', 'source_user_id', 'owner.id', 'creator.id', 'creator.email']) {
    assert.equal(source.includes(forbidden), false, `${forbidden} must not enter Public Prompt attribution`)
  }
})

test('Home and public Discovery use Creator vocabulary and locale-safe Creator links, never active-user owner metadata', async () => {
  const [homeType, homeCard, discoveryCard] = await Promise.all([
    read('app/composables/useHomeDiscovery.ts'),
    read('app/components/home/HomeDiscoverySection.vue'),
    read('app/components/discover/PublicDiscoveryCard.vue'),
  ])

  assert.match(homeType, /creator:\s*PublicCreatorAttribution \| null/)
  assert.doesNotMatch(homeType, /owner:\s*\{/)

  for (const source of [homeCard, discoveryCard]) {
    const runtime = withoutStyles(source)
    assert.match(runtime, /publicCreatorPath/)
    assert.match(runtime, /\.creator\.username/)
    assert.match(runtime, /\.creator\.avatarUrl/)
    assert.doesNotMatch(runtime, /\.owner\b/)
    assert.doesNotMatch(runtime, /sourceUserId|source_user_id|creator\.id|creator\.email/)
  }
})
