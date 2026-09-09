import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateCreatorPublicPolicy,
  handlePublicCreatorRequest,
  mapPublicCreatorPublication,
  readPublicCreator,
} from './publicCreator.mjs'

const USER_ID = '11111111-2222-3333-4444-555555555555'

const STATE_ROW = {
  id: USER_ID,
  username: 'grassias',
  accountStatus: 'active',
  creatorStatus: 'approved',
  hasPublishedPrompt: true,
  email: 'PRIVATE_EMAIL_SENTINEL@example.com',
  role: 'super_admin',
  reviewNote: 'PRIVATE_REVIEW_SENTINEL',
}

const PROFILE_ROW = {
  avatarUrl: 'https://cdn.example.com/avatar.webp',
  coverUrl: 'https://cdn.example.com/cover.webp',
  coverThumbnailUrl: 'https://cdn.example.com/cover-thumb.webp',
  coverWidth: 1600,
  coverHeight: 900,
  coverThumbnailWidth: 640,
  coverThumbnailHeight: 360,
  screenNameEn: 'Grassias',
  screenNameFa: 'چمن',
  bioEn: 'Creator building Prompt Draft.',
  bioFa: 'سازنده پرامپت درفت.',
  articleEn: '# Hello\nLong-form English profile.',
  articleFa: '# سلام\nمتن بلند فارسی.',
  locationText: 'Earth',
  birthday: '1993-03-31',
  locationProviderPlaceId: 'PRIVATE_PLACE_SENTINEL',
  avatarStorageKey: 'PRIVATE_AVATAR_STORAGE_SENTINEL',
  coverStorageKey: 'PRIVATE_COVER_STORAGE_SENTINEL',
}

const SKILL_ROWS = [
  {
    slug: 'prompt-engineering',
    categorySlug: 'ai-data',
    titleEn: 'Prompt Engineering',
    titleFa: 'مهندسی پرامپت',
    active: true,
    internalNote: 'PRIVATE_SKILL_SENTINEL',
  },
]

const LINK_ROWS = [
  {
    type: 'website',
    url: 'https://prompt-draft.ir/',
    label: 'Prompt Draft',
    position: 0,
    id: 'PRIVATE_LINK_ID_SENTINEL',
  },
  {
    type: 'other',
    url: 'javascript:alert(1)',
    label: 'unsafe',
  },
]

const PUBLICATION_ROWS = [
  {
    id: 73,
    title: {
      en: 'Macro Toy Portrait',
      fa: 'پرتره ماکرو اسباب‌بازی',
    },
    description: {
      en: 'A public prompt summary.',
      fa: 'خلاصه یک پرامپت عمومی.',
    },
    publishedAt: new Date('2026-09-01T10:00:00.000Z'),
    coverImage: {
      fullUrl: 'https://cdn.example.com/prompts/73/full.webp',
      thumbnailUrl: 'https://cdn.example.com/prompts/73/thumb.webp',
      storageKey: 'PRIVATE_PUBLICATION_STORAGE_SENTINEL',
    },
    prompt: 'PROTECTED_PROMPT_SENTINEL',
    variants: ['PROTECTED_VARIANT_SENTINEL'],
    sourceUserId: USER_ID,
    sourceDraftId: 'PRIVATE_DRAFT_SENTINEL',
  },
]

function createQueryFixture(overrides = {}) {
  const sql = []
  const values = []

  const query = async (statement, params = []) => {
    sql.push(statement)
    values.push(params)

    if (/FROM users\s+LEFT JOIN creator_accounts/i.test(statement)) {
      return { rows: overrides.stateRows ?? [STATE_ROW] }
    }

    if (/LEFT JOIN user_profiles profile/i.test(statement)) {
      return { rows: overrides.profileRows ?? [PROFILE_ROW] }
    }

    if (/FROM user_profile_skills selected/i.test(statement)) {
      return { rows: overrides.skillRows ?? SKILL_ROWS }
    }

    if (/FROM user_profile_links/i.test(statement)) {
      return { rows: overrides.linkRows ?? LINK_ROWS }
    }

    if (/FROM prompt_archive_items items/i.test(statement)) {
      return { rows: overrides.publicationRows ?? PUBLICATION_ROWS }
    }

    throw new Error(`Unexpected SQL in public Creator test: ${statement}`)
  }

  return { query, sql, values }
}

function createHandlerHarness({
  method = 'GET',
  pathname = '/api/public/creators/grassias',
  query,
} = {}) {
  const calls = []
  const sendJson = (_response, status, body, headers = {}) => {
    calls.push({ status, body, headers })
  }

  return {
    input: {
      request: { method },
      response: {},
      url: new URL(`http://localhost${pathname}`),
      corsHeaders: { 'Access-Control-Allow-Origin': 'https://example.com' },
      sendJson,
      query,
    },
    calls,
  }
}

test('Creator public policy requires active approved canonical identity but not publications', () => {
  const withoutPublications = evaluateCreatorPublicPolicy({
    accountExists: true,
    accountStatus: 'active',
    creatorStatus: 'approved',
    username: 'grassias',
    creatorProfileComplete: true,
    hasPublishedPrompt: false,
  })

  assert.equal(withoutPublications.accessible, true)
  assert.equal(withoutPublications.indexable, true)
  assert.equal(withoutPublications.discoverable, true)
  assert.equal(withoutPublications.signals.hasPublishedPrompt, false)

  for (const input of [
    { accountStatus: 'suspended', creatorStatus: 'approved', username: 'grassias' },
    { accountStatus: 'active', creatorStatus: 'pending', username: 'grassias' },
    { accountStatus: 'active', creatorStatus: 'rejected', username: 'grassias' },
    { accountStatus: 'active', creatorStatus: 'suspended', username: 'grassias' },
    { accountStatus: 'active', creatorStatus: 'approved', username: 'Grassias' },
  ]) {
    const policy = evaluateCreatorPublicPolicy({
      accountExists: true,
      creatorProfileComplete: true,
      hasPublishedPrompt: true,
      ...input,
    })
    assert.equal(policy.accessible, false)
    assert.equal(policy.indexable, false)
    assert.equal(policy.discoverable, false)
  }
})

test('approved Creator with defensive profile incompleteness stays accessible but is noindex and undiscoverable', () => {
  const policy = evaluateCreatorPublicPolicy({
    accountExists: true,
    accountStatus: 'active',
    creatorStatus: 'approved',
    username: 'grassias',
    creatorProfileComplete: false,
    hasPublishedPrompt: true,
  })

  assert.equal(policy.accessible, true)
  assert.equal(policy.indexable, false)
  assert.equal(policy.discoverable, false)
  assert.deepEqual(policy.reasons, ['creator_profile_incomplete'])
})

test('public Creator publication summary is canonical and drops protected Archive data', () => {
  const publication = mapPublicCreatorPublication(PUBLICATION_ROWS[0])
  assert.deepEqual(publication, {
    id: 73,
    title: {
      en: 'Macro Toy Portrait',
      fa: 'پرتره ماکرو اسباب‌بازی',
    },
    description: {
      en: 'A public prompt summary.',
      fa: 'خلاصه یک پرامپت عمومی.',
    },
    availableLocales: ['en', 'fa'],
    publishedAt: '2026-09-01T10:00:00.000Z',
    coverImage: {
      fullUrl: 'https://cdn.example.com/prompts/73/full.webp',
      thumbnailUrl: 'https://cdn.example.com/prompts/73/thumb.webp',
    },
  })

  const serialized = JSON.stringify(publication)
  assert.equal(serialized.includes('PROTECTED_PROMPT_SENTINEL'), false)
  assert.equal(serialized.includes('PROTECTED_VARIANT_SENTINEL'), false)
  assert.equal(serialized.includes('PRIVATE_DRAFT_SENTINEL'), false)
  assert.equal(serialized.includes('PRIVATE_PUBLICATION_STORAGE_SENTINEL'), false)
})

test('readPublicCreator returns the positive public allowlist and privacy denylist never leaks', async () => {
  const { query } = createQueryFixture()
  const creator = await readPublicCreator('grassias', query)

  assert.deepEqual(creator, {
    identity: {
      username: 'grassias',
      screenName: { en: 'Grassias', fa: 'چمن' },
      bio: {
        en: 'Creator building Prompt Draft.',
        fa: 'سازنده پرامپت درفت.',
      },
      article: {
        en: '# Hello\nLong-form English profile.',
        fa: '# سلام\nمتن بلند فارسی.',
      },
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      cover: {
        fullUrl: 'https://cdn.example.com/cover.webp',
        thumbnailUrl: 'https://cdn.example.com/cover-thumb.webp',
        width: 1600,
        height: 900,
        thumbnailWidth: 640,
        thumbnailHeight: 360,
      },
      skills: [
        {
          slug: 'prompt-engineering',
          categorySlug: 'ai-data',
          title: { en: 'Prompt Engineering', fa: 'مهندسی پرامپت' },
        },
      ],
      links: [
        {
          type: 'website',
          url: 'https://prompt-draft.ir/',
          label: 'Prompt Draft',
        },
      ],
      location: { text: 'Earth' },
    },
    publications: [
      {
        id: 73,
        title: {
          en: 'Macro Toy Portrait',
          fa: 'پرتره ماکرو اسباب‌بازی',
        },
        description: {
          en: 'A public prompt summary.',
          fa: 'خلاصه یک پرامپت عمومی.',
        },
        availableLocales: ['en', 'fa'],
        publishedAt: '2026-09-01T10:00:00.000Z',
        coverImage: {
          fullUrl: 'https://cdn.example.com/prompts/73/full.webp',
          thumbnailUrl: 'https://cdn.example.com/prompts/73/thumb.webp',
        },
      },
    ],
    policy: {
      indexable: true,
      discoverable: true,
    },
  })

  const serialized = JSON.stringify(creator)
  for (const sentinel of [
    'PRIVATE_EMAIL_SENTINEL',
    'PRIVATE_REVIEW_SENTINEL',
    'PRIVATE_PLACE_SENTINEL',
    'PRIVATE_AVATAR_STORAGE_SENTINEL',
    'PRIVATE_COVER_STORAGE_SENTINEL',
    'PRIVATE_SKILL_SENTINEL',
    'PRIVATE_LINK_ID_SENTINEL',
    'PRIVATE_PUBLICATION_STORAGE_SENTINEL',
    'PROTECTED_PROMPT_SENTINEL',
    'PROTECTED_VARIANT_SENTINEL',
    'PRIVATE_DRAFT_SENTINEL',
    USER_ID,
    '1993-03-31',
    'super_admin',
  ]) {
    assert.equal(serialized.includes(sentinel), false, `${sentinel} leaked into public Creator DTO`)
  }
})

test('readPublicCreator uses only approved-safe profile columns and published canonical Archive summaries', async () => {
  const fixture = createQueryFixture()
  const creator = await readPublicCreator('grassias', fixture.query)
  assert.equal(creator.identity.username, 'grassias')

  const allSql = fixture.sql.join('\n')
  assert.match(allSql, /creator\.status\s+AS\s+"creatorStatus"/i)
  assert.match(allSql, /items\.source_user_id\s*=\s*\$1/i)
  assert.match(allSql, /items\.status\s*=\s*'published'/i)
  assert.match(allSql, /items\.public_id\s+IS\s+NOT\s+NULL/i)
  assert.match(allSql, /profile\.screen_name_en/i)
  assert.match(allSql, /profile\.article_fa/i)
  assert.match(allSql, /profile\.location_text/i)

  for (const forbiddenSql of [
    /users\.email/i,
    /profile\.birthday/i,
    /review_note/i,
    /reviewed_by/i,
    /avatar_storage_key/i,
    /cover_storage_key/i,
    /location_provider_place_id/i,
    /location_country_code/i,
    /items\.prompt/i,
    /items\.variants/i,
    /source_draft/i,
    /user_economy/i,
    /auth_sessions/i,
    /referrals/i,
  ]) {
    assert.doesNotMatch(allSql, forbiddenSql)
  }
})

test('non-approved Creator states return null before reading profile details', async () => {
  for (const creatorStatus of ['pending', 'rejected', 'suspended', null]) {
    let queryCount = 0
    const creator = await readPublicCreator('grassias', async (sql) => {
      queryCount += 1
      assert.match(sql, /LEFT JOIN creator_accounts/i)
      return {
        rows: [{ ...STATE_ROW, creatorStatus }],
      }
    })

    assert.equal(creator, null)
    assert.equal(queryCount, 1)
  }
})

test('invalid or non-canonical public Creator username does not touch database', async () => {
  for (const username of ['Grassias', 'bad username', 'x']) {
    let queryCalled = false
    const creator = await readPublicCreator(username, async () => {
      queryCalled = true
      return { rows: [] }
    })
    assert.equal(creator, null)
    assert.equal(queryCalled, false)
  }
})

test('GET accessible public Creator returns sanitized projection', async () => {
  const fixture = createQueryFixture()
  const { input, calls } = createHandlerHarness({ query: fixture.query })

  assert.equal(await handlePublicCreatorRequest(input), true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].status, 200)
  assert.equal(calls[0].body.ok, true)
  assert.equal(calls[0].body.creator.identity.username, 'grassias')
  assert.equal(calls[0].body.creator.policy.indexable, true)
  assert.equal(JSON.stringify(calls[0].body).includes('PRIVATE_EMAIL_SENTINEL'), false)
})

test('missing, pending, rejected and suspended public Creator requests are indistinguishable as generic 404', async () => {
  for (const stateRows of [
    [],
    [{ ...STATE_ROW, creatorStatus: 'pending' }],
    [{ ...STATE_ROW, creatorStatus: 'rejected' }],
    [{ ...STATE_ROW, creatorStatus: 'suspended' }],
  ]) {
    const fixture = createQueryFixture({ stateRows })
    const { input, calls } = createHandlerHarness({ query: fixture.query })

    assert.equal(await handlePublicCreatorRequest(input), true)
    assert.deepEqual(calls, [{
      status: 404,
      body: { ok: false, message: 'Public Creator not found' },
      headers: { 'Access-Control-Allow-Origin': 'https://example.com' },
    }])
  }
})

test('public Creator handler rejects non-GET and ignores unrelated paths', async () => {
  let queryCalled = false
  const post = createHandlerHarness({
    method: 'POST',
    query: async () => {
      queryCalled = true
      return { rows: [] }
    },
  })
  assert.equal(await handlePublicCreatorRequest(post.input), true)
  assert.equal(post.calls[0].status, 405)
  assert.equal(post.calls[0].headers.Allow, 'GET')
  assert.equal(queryCalled, false)

  const unrelated = createHandlerHarness({
    pathname: '/api/public/prompts/73',
    query: async () => {
      throw new Error('query must not run')
    },
  })
  assert.equal(await handlePublicCreatorRequest(unrelated.input), false)
  assert.equal(unrelated.calls.length, 0)
})
