import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTelegramMiniAppUrl,
  publicTelegramRoutingConfig,
  validateTelegramPublicationInput,
} from './telegramPostContract.mjs'
import {
  TelegramApiError,
  TelegramDeliveryUnknownError,
  publishTelegramPost,
} from './telegramPublisher.mjs'
import { handleAdminTelegramRoute } from './adminTelegramRoute.mjs'

const config = Object.freeze({
  configured: true,
  errors: [],
  botToken: '123456:server-secret-token',
  destinationChatId: '@promptdraftchannel',
  botUsername: 'PromptDraftBot',
  miniAppShortName: 'campaign',
})

function input(overrides = {}) {
  return {
    idempotencyKey: 'tg1-test-1',
    source: { type: 'manual' },
    post: {
      caption: 'Preview caption',
      media: [],
      ctas: [{ label: 'Open', startParam: 'campaign_demo' }],
    },
    ...overrides,
  }
}

function okResponse(result, status = 200) {
  return {
    status,
    async json() {
      return { ok: true, result }
    },
  }
}

function rejectedResponse(description = 'Bad Request', errorCode = 400) {
  return {
    status: errorCode,
    async json() {
      return { ok: false, error_code: errorCode, description }
    },
  }
}

function readCall(call) {
  return {
    url: call[0],
    body: JSON.parse(call[1].body),
  }
}

test('direct Mini App URL uses startapp and public config never exposes bot token', () => {
  assert.equal(
    buildTelegramMiniAppUrl(config, 'campaign_demo'),
    'https://t.me/PromptDraftBot/campaign?startapp=campaign_demo',
  )

  const publicConfig = publicTelegramRoutingConfig(config)
  assert.equal(publicConfig.configured, true)
  assert.equal(publicConfig.destinationChatId, '@promptdraftchannel')
  assert.equal('botToken' in publicConfig, false)
  assert.equal(JSON.stringify(publicConfig).includes('server-secret-token'), false)
})

test('publication contract resolves source-neutral CTA URLs and payload hash', () => {
  const prepared = validateTelegramPublicationInput(input(), config)
  assert.equal(prepared.ok, true)
  assert.match(prepared.payloadHash, /^[0-9a-f]{64}$/)
  assert.equal(prepared.normalized.source.type, 'manual')
  assert.equal(prepared.normalized.source.id, null)
  assert.equal(
    prepared.normalized.post.ctas[0].url,
    'https://t.me/PromptDraftBot/campaign?startapp=campaign_demo',
  )
  assert.equal(JSON.stringify(prepared.normalized).includes(config.botToken), false)
})

test('publication contract rejects non-HTTPS media, invalid start params, and missing CTAs', () => {
  const insecure = validateTelegramPublicationInput(input({
    post: {
      caption: 'Preview',
      media: [{ type: 'photo', url: 'http://example.com/a.jpg' }],
      ctas: [{ label: 'Open', startParam: 'bad value' }],
    },
  }), config)
  assert.equal(insecure.ok, false)
  assert.ok(insecure.errors.some(error => error.field === 'post.media[0].url'))
  assert.ok(insecure.errors.some(error => error.field === 'post.ctas[0].startParam'))

  const noCta = validateTelegramPublicationInput(input({
    post: { caption: 'Preview', media: [], ctas: [] },
  }), config)
  assert.equal(noCta.ok, false)
  assert.ok(noCta.errors.some(error => error.field === 'post.ctas'))
})

test('publisher sends a text post with URL keyboard', async () => {
  const calls = []
  const fetchImpl = async (...args) => {
    calls.push(args)
    return okResponse({ message_id: 101, chat: { id: -1001 } })
  }
  const prepared = validateTelegramPublicationInput(input(), config)
  const result = await publishTelegramPost(prepared.normalized, config, { fetchImpl })

  assert.equal(calls.length, 1)
  const call = readCall(calls[0])
  assert.match(call.url, /\/sendMessage$/)
  assert.equal(call.body.text, 'Preview caption')
  assert.equal(
    call.body.reply_markup.inline_keyboard[0][0].url,
    'https://t.me/PromptDraftBot/campaign?startapp=campaign_demo',
  )
  assert.equal(result.messages[0].telegramMessageId, 101)
  assert.equal(result.messages[0].telegramUrl, 'https://t.me/promptdraftchannel/101')
})

test('publisher sends one photo with caption and URL keyboard', async () => {
  const calls = []
  const fetchImpl = async (...args) => {
    calls.push(args)
    return okResponse({ message_id: 202, chat: { id: -1001 } })
  }
  const prepared = validateTelegramPublicationInput(input({
    post: {
      caption: 'Photo preview',
      media: [{ type: 'photo', url: 'https://cdn.example.com/a.jpg' }],
      ctas: [{ label: 'Open', startParam: 'prompt_42' }],
    },
  }), config)
  const result = await publishTelegramPost(prepared.normalized, config, { fetchImpl })

  assert.equal(calls.length, 1)
  const call = readCall(calls[0])
  assert.match(call.url, /\/sendPhoto$/)
  assert.equal(call.body.photo, 'https://cdn.example.com/a.jpg')
  assert.equal(call.body.caption, 'Photo preview')
  assert.equal(result.messages[0].telegramMessageId, 202)
})

test('publisher sends an album followed by a CTA message', async () => {
  const calls = []
  const fetchImpl = async (...args) => {
    calls.push(args)
    if (calls.length === 1) {
      return okResponse([
        { message_id: 301, chat: { id: -1001 }, media_group_id: 'album-1' },
        { message_id: 302, chat: { id: -1001 }, media_group_id: 'album-1' },
      ])
    }
    return okResponse({ message_id: 303, chat: { id: -1001 } })
  }
  const prepared = validateTelegramPublicationInput(input({
    post: {
      caption: 'Album preview',
      media: [
        { type: 'photo', url: 'https://cdn.example.com/a.jpg' },
        { type: 'photo', url: 'https://cdn.example.com/b.jpg' },
      ],
      ctas: [{ label: 'Open', startParam: 'prompt_42' }],
      multiMediaCtaText: 'Open this Prompt in Prompt Draft',
    },
  }), config)
  const result = await publishTelegramPost(prepared.normalized, config, { fetchImpl })

  assert.equal(calls.length, 2)
  assert.match(readCall(calls[0]).url, /\/sendMediaGroup$/)
  assert.equal(readCall(calls[0]).body.reply_markup, undefined)
  assert.match(readCall(calls[1]).url, /\/sendMessage$/)
  assert.equal(readCall(calls[1]).body.text, 'Open this Prompt in Prompt Draft')
  assert.deepEqual(result.messages.map(message => message.telegramMessageId), [301, 302, 303])
  assert.deepEqual(result.messages.map(message => message.role), ['content', 'content', 'cta'])
})

test('explicit Telegram API rejection is a definite failed outcome', async () => {
  const prepared = validateTelegramPublicationInput(input(), config)
  await assert.rejects(
    publishTelegramPost(prepared.normalized, config, {
      fetchImpl: async () => rejectedResponse('Bad Request: chat not found', 400),
    }),
    error => {
      assert.ok(error instanceof TelegramApiError)
      assert.equal(error.kind, 'failed')
      assert.equal(error.errorCode, 'TELEGRAM_API_400')
      return true
    },
  )
})

test('transport failure is delivery_unknown and is never represented as safe-to-retry failure', async () => {
  const prepared = validateTelegramPublicationInput(input(), config)
  await assert.rejects(
    publishTelegramPost(prepared.normalized, config, {
      fetchImpl: async () => { throw new Error('socket closed') },
    }),
    error => {
      assert.ok(error instanceof TelegramDeliveryUnknownError)
      assert.equal(error.kind, 'delivery_unknown')
      assert.equal(error.errorCode, 'TELEGRAM_TRANSPORT_ERROR')
      return true
    },
  )
})

test('album success followed by CTA rejection preserves partial message identities as delivery_unknown', async () => {
  let callCount = 0
  const prepared = validateTelegramPublicationInput(input({
    post: {
      caption: 'Album preview',
      media: [
        { type: 'photo', url: 'https://cdn.example.com/a.jpg' },
        { type: 'photo', url: 'https://cdn.example.com/b.jpg' },
      ],
      ctas: [{ label: 'Open', startParam: 'prompt_42' }],
    },
  }), config)

  await assert.rejects(
    publishTelegramPost(prepared.normalized, config, {
      fetchImpl: async () => {
        callCount += 1
        if (callCount === 1) {
          return okResponse([
            { message_id: 401, chat: { id: -1001 }, media_group_id: 'album-2' },
            { message_id: 402, chat: { id: -1001 }, media_group_id: 'album-2' },
          ])
        }
        return rejectedResponse('Bad Request: button invalid', 400)
      },
    }),
    error => {
      assert.ok(error instanceof TelegramDeliveryUnknownError)
      assert.equal(error.kind, 'delivery_unknown')
      assert.deepEqual(
        error.partialMessages.map(message => message.telegramMessageId),
        [401, 402],
      )
      return true
    },
  )
})

test('admin Telegram route is exact-super-admin only and public config does not expose the token', async () => {
  const request = { method: 'GET', headers: {} }
  const url = new URL('http://localhost/api/admin/telegram/config')

  async function invoke(user) {
    let captured = null
    const handled = await handleAdminTelegramRoute({
      request,
      response: {},
      url,
      corsHeaders: {},
      sendJson: (_response, status, body) => { captured = { status, body } },
      dependencies: {
        getAuthenticatedUser: async () => user,
        readTelegramRoutingConfig: () => config,
      },
    })
    return { handled, captured }
  }

  const anonymous = await invoke(null)
  assert.equal(anonymous.handled, true)
  assert.equal(anonymous.captured.status, 401)

  const admin = await invoke({ id: 'admin', role: 'admin' })
  assert.equal(admin.captured.status, 403)

  const superAdmin = await invoke({ id: 'super', role: 'super_admin' })
  assert.equal(superAdmin.captured.status, 200)
  assert.equal(superAdmin.captured.body.telegram.configured, true)
  assert.equal(JSON.stringify(superAdmin.captured.body).includes(config.botToken), false)
})
