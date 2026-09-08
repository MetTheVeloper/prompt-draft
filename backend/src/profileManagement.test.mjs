import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleProfileManagementRequest,
  normalizeProfileUpdateInput,
} from './profileManagement.mjs'

function validBody(overrides = {}) {
  return {
    account: {
      username: 'creator.one',
      email: 'creator@example.com',
      ...(overrides.account ?? {}),
    },
    profile: {
      screenName: { en: 'Creator One', fa: 'کریتور یک' },
      bio: { en: 'Bio', fa: 'بیو' },
      article: { en: '# About', fa: '# درباره' },
      birthday: '1994-04-12',
      skills: ['frontend-development'],
      links: [
        { type: 'website', url: 'https://example.com', label: 'Website' },
      ],
      location: {
        text: 'Tehran, Iran',
        source: 'custom',
        providerPlaceId: 'ignored-for-custom',
        countryCode: 'ir',
      },
      ...(overrides.profile ?? {}),
    },
  }
}

function createResponseRecorder() {
  const calls = []
  return {
    calls,
    sendJson(_response, statusCode, body, headers = {}) {
      calls.push({ statusCode, body, headers })
    },
  }
}

test('ordinary profile update may be incomplete without becoming Creator-ready', () => {
  const result = normalizeProfileUpdateInput({
    account: { username: 'ordinary.user', email: null },
    profile: {
      screenName: { en: 'Ordinary User' },
      bio: {},
      article: {},
      birthday: null,
      skills: [],
      links: [],
      location: null,
    },
  })

  assert.deepEqual(result.errors, [])
  assert.equal(result.value.account.username, 'ordinary.user')
  assert.equal(result.value.account.email, null)
  assert.equal(result.value.profile.screenName.en, 'Ordinary User')
  assert.equal(result.value.profile.screenName.fa, null)
  assert.deepEqual(result.value.profile.skills, [])
})

test('profile update normalizes identity, URLs and custom location safely', () => {
  const result = normalizeProfileUpdateInput(validBody({
    account: {
      username: ' Creator.One ',
      email: ' CREATOR@EXAMPLE.COM ',
    },
  }))

  assert.deepEqual(result.errors, [])
  assert.equal(result.value.account.username, 'creator.one')
  assert.equal(result.value.account.email, 'creator@example.com')
  assert.equal(result.value.profile.links[0].url, 'https://example.com/')
  assert.deepEqual(result.value.profile.location, {
    text: 'Tehran, Iran',
    source: 'custom',
    providerPlaceId: null,
    countryCode: 'IR',
  })
})

test('profile update rejects invalid date, identity and unsafe link scheme', () => {
  const result = normalizeProfileUpdateInput(validBody({
    account: { username: 'bad username', email: 'not-an-email' },
    profile: {
      birthday: '2026-02-31',
      links: [{ type: 'website', url: 'javascript:alert(1)' }],
    },
  }))

  const fields = result.errors.map(error => error.field)
  assert.ok(fields.includes('account.username'))
  assert.ok(fields.includes('account.email'))
  assert.ok(fields.includes('account'))
  assert.ok(fields.includes('profile.birthday'))
  assert.ok(fields.includes('profile.links.0.url'))
  assert.equal(result.value, null)
})

test('profile links are capped at five by validation contract', () => {
  const links = Array.from({ length: 6 }, (_, index) => ({
    type: 'website',
    url: `https://example.com/${index}`,
  }))
  const result = normalizeProfileUpdateInput(validBody({ profile: { links } }))

  assert.ok(result.errors.some(error => error.field === 'profile.links'))
  assert.equal(result.value, null)
})

test('profile handler ignores unrelated paths', async () => {
  const recorder = createResponseRecorder()
  const handled = await handleProfileManagementRequest({
    request: { method: 'GET', headers: {} },
    response: {},
    url: new URL('http://localhost/api/other'),
    corsHeaders: {},
    sendJson: recorder.sendJson,
  })

  assert.equal(handled, false)
  assert.deepEqual(recorder.calls, [])
})

test('profile handler requires authentication', async () => {
  const recorder = createResponseRecorder()
  const handled = await handleProfileManagementRequest({
    request: { method: 'GET', headers: {} },
    response: {},
    url: new URL('http://localhost/api/profile'),
    corsHeaders: {},
    sendJson: recorder.sendJson,
    getUser: async () => null,
  })

  assert.equal(handled, true)
  assert.equal(recorder.calls[0].statusCode, 401)
})

test('profile GET returns owner-only management projection', async () => {
  const recorder = createResponseRecorder()
  const payload = {
    ok: true,
    account: { username: 'owner', email: 'owner@example.com' },
    profile: { skills: [] },
    creator: { status: 'none' },
    taxonomy: { categories: [], skills: [] },
  }

  await handleProfileManagementRequest({
    request: { method: 'GET', headers: {} },
    response: {},
    url: new URL('http://localhost/api/profile'),
    corsHeaders: {},
    sendJson: recorder.sendJson,
    getUser: async () => ({ id: 'owner-id' }),
    readProfile: async userId => {
      assert.equal(userId, 'owner-id')
      return payload
    },
  })

  assert.equal(recorder.calls[0].statusCode, 200)
  assert.deepEqual(recorder.calls[0].body, payload)
})

test('profile handler exposes GET and PUT only', async () => {
  const recorder = createResponseRecorder()

  await handleProfileManagementRequest({
    request: { method: 'DELETE', headers: {} },
    response: {},
    url: new URL('http://localhost/api/profile'),
    corsHeaders: {},
    sendJson: recorder.sendJson,
    getUser: async () => ({ id: 'owner-id' }),
  })

  assert.equal(recorder.calls[0].statusCode, 405)
  assert.equal(recorder.calls[0].headers.Allow, 'GET, PUT')
})
