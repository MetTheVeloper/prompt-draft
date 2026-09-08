import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handlePublicPromptRequest,
  mapPublicPromptRow,
  readPublicPrompt,
} from './publicPrompt.mjs'

const PUBLIC_ROW = {
  id: 123,
  title: {
    en: 'Macro Toy Portrait',
    fa: 'پرتره ماکرو اسباب‌بازی',
  },
  description: {
    en: 'Turn a reference portrait into a macro toy-style image.',
    fa: 'پرتره مرجع را به تصویری ماکرو با حال‌وهوای اسباب‌بازی تبدیل کنید.',
  },
  publishedAt: new Date('2026-08-20T10:00:00.000Z'),
  previewGeneratedWith: 'gpt-image-1',
  optimizedFor: ['gpt-image-1'],
  tags: ['portrait', 'macro'],
  images: [
    {
      position: 0,
      fullUrl: 'https://cdn.example.com/prompts/123/0.webp',
      thumbnailUrl: 'https://cdn.example.com/prompts/123/0-thumb.webp',
      storageKey: 'must-not-leak.webp',
    },
  ],
  prompt: 'PROTECTED_PROMPT_SENTINEL',
  variants: [{ prompt: 'PROTECTED_VARIANT_SENTINEL' }],
  sourceTitle: 'PRIVATE_SOURCE_TITLE_SENTINEL',
  sourceUserId: 'PRIVATE_USER_SENTINEL',
  sourceDraftId: 'PRIVATE_DRAFT_SENTINEL',
  storageKey: 'PRIVATE_STORAGE_SENTINEL',
  unlock: { unlocked: true },
  balance: 999999,
  permissions: ['all'],
  viewer: { id: 'private-viewer' },
}

function createHandlerHarness({ method = 'GET', pathname = '/api/public/prompts/123', query }) {
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

test('mapPublicPromptRow returns only the explicit public allowlist', () => {
  const prompt = mapPublicPromptRow(PUBLIC_ROW)

  assert.deepEqual(prompt, {
    id: 123,
    title: {
      en: 'Macro Toy Portrait',
      fa: 'پرتره ماکرو اسباب‌بازی',
    },
    description: {
      en: 'Turn a reference portrait into a macro toy-style image.',
      fa: 'پرتره مرجع را به تصویری ماکرو با حال‌وهوای اسباب‌بازی تبدیل کنید.',
    },
    availableLocales: ['en', 'fa'],
    publishedAt: '2026-08-20T10:00:00.000Z',
    tags: ['portrait', 'macro'],
    model: {
      previewGeneratedWith: 'gpt-image-1',
      optimizedFor: ['gpt-image-1'],
    },
    images: [
      {
        position: 0,
        fullUrl: 'https://cdn.example.com/prompts/123/0.webp',
        thumbnailUrl: 'https://cdn.example.com/prompts/123/0-thumb.webp',
      },
    ],
  })

  const serialized = JSON.stringify(prompt)
  for (const sentinel of [
    'PROTECTED_PROMPT_SENTINEL',
    'PROTECTED_VARIANT_SENTINEL',
    'PRIVATE_SOURCE_TITLE_SENTINEL',
    'PRIVATE_USER_SENTINEL',
    'PRIVATE_DRAFT_SENTINEL',
    'PRIVATE_STORAGE_SENTINEL',
    'must-not-leak.webp',
    'private-viewer',
  ]) {
    assert.equal(serialized.includes(sentinel), false, `${sentinel} leaked into public DTO`)
  }
})

test('locale availability requires complete localized title and description without fallback', () => {
  const prompt = mapPublicPromptRow({
    ...PUBLIC_ROW,
    title: { en: 'English only', fa: 'عنوان فارسی' },
    description: { en: 'English description', fa: '   ' },
  })

  assert.deepEqual(prompt.title, { en: 'English only' })
  assert.deepEqual(prompt.description, { en: 'English description' })
  assert.deepEqual(prompt.availableLocales, ['en'])
  assert.equal('fa' in prompt.title, false)
  assert.equal('fa' in prompt.description, false)
})

test('public row with no complete localization is rejected', () => {
  assert.throws(
    () => mapPublicPromptRow({
      ...PUBLIC_ROW,
      title: { en: 'English title' },
      description: { fa: 'توضیح فارسی' },
    }),
    /no complete authoritative localization/,
  )
})

test('readPublicPrompt uses a published-only query and selects description without protected columns', async () => {
  let capturedSql = ''
  let capturedValues = null

  const prompt = await readPublicPrompt(123, async (sql, values) => {
    capturedSql = sql
    capturedValues = values
    return { rows: [PUBLIC_ROW] }
  })

  assert.equal(prompt.id, 123)
  assert.deepEqual(capturedValues, [123])
  assert.match(capturedSql, /items\.public_id\s*=\s*\$1/i)
  assert.match(capturedSql, /items\.status\s*=\s*'published'/i)
  assert.match(capturedSql, /items\.descriptions\s+AS\s+description/i)

  for (const forbiddenSql of [
    /items\.prompt/i,
    /items\.variants/i,
    /items\.source_title/i,
    /source_draft/i,
    /storage_key/i,
    /user_content_unlocks/i,
    /user_economy/i,
  ]) {
    assert.doesNotMatch(capturedSql, forbiddenSql)
  }
})

test('GET published public Prompt returns 200 with sanitized projection', async () => {
  const { input, calls } = createHandlerHarness({
    query: async () => ({ rows: [PUBLIC_ROW] }),
  })

  assert.equal(await handlePublicPromptRequest(input), true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].status, 200)
  assert.equal(calls[0].body.ok, true)
  assert.equal(calls[0].body.prompt.id, 123)
  assert.equal(calls[0].body.prompt.description.en, PUBLIC_ROW.description.en)
  assert.equal(JSON.stringify(calls[0].body).includes('PROTECTED_PROMPT_SENTINEL'), false)
  assert.equal(JSON.stringify(calls[0].body).includes('PROTECTED_VARIANT_SENTINEL'), false)
})

test('GET missing or non-public Prompt is indistinguishable as 404', async () => {
  const { input, calls } = createHandlerHarness({
    query: async (sql) => {
      assert.match(sql, /items\.status\s*=\s*'published'/i)
      return { rows: [] }
    },
  })

  assert.equal(await handlePublicPromptRequest(input), true)
  assert.deepEqual(calls, [{
    status: 404,
    body: { ok: false, message: 'Public Prompt not found' },
    headers: { 'Access-Control-Allow-Origin': 'https://example.com' },
  }])
})

test('invalid public Prompt id returns 404 without touching the database', async () => {
  let queryCalled = false
  const { input, calls } = createHandlerHarness({
    pathname: '/api/public/prompts/0',
    query: async () => {
      queryCalled = true
      return { rows: [] }
    },
  })

  assert.equal(await handlePublicPromptRequest(input), true)
  assert.equal(queryCalled, false)
  assert.equal(calls[0].status, 404)
})

test('non-GET public Prompt request returns 405 with Allow GET', async () => {
  let queryCalled = false
  const { input, calls } = createHandlerHarness({
    method: 'POST',
    query: async () => {
      queryCalled = true
      return { rows: [] }
    },
  })

  assert.equal(await handlePublicPromptRequest(input), true)
  assert.equal(queryCalled, false)
  assert.equal(calls[0].status, 405)
  assert.equal(calls[0].headers.Allow, 'GET')
})

test('unrelated path is not claimed by public Prompt handler', async () => {
  const { input, calls } = createHandlerHarness({
    pathname: '/api/archive/123',
    query: async () => {
      throw new Error('query must not run')
    },
  })

  assert.equal(await handlePublicPromptRequest(input), false)
  assert.equal(calls.length, 0)
})
