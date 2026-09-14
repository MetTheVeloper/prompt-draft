import assert from 'node:assert/strict'
import test from 'node:test'
import { validateTelegramPublicationInput } from './telegramPostContract.mjs'
import { publishTelegramPost } from './telegramPublisher.mjs'

const config = Object.freeze({
  configured: true,
  errors: [],
  botToken: '123456:server-secret-token',
  destinationChatId: '@promptdraftchannel',
  botUsername: 'PromptDraftBot',
  miniAppShortName: 'campaign',
})

function input(ctas) {
  return {
    idempotencyKey: 'tg-direct-cta-test',
    source: { type: 'manual' },
    post: {
      caption: 'Preview caption',
      media: [],
      ctas,
    },
  }
}

test('publication contract accepts a credential-free direct HTTPS CTA', () => {
  const prepared = validateTelegramPublicationInput(input([
    { label: 'Community', url: 'https://t.me/prompt_draft_group' },
  ]), config)

  assert.equal(prepared.ok, true)
  assert.deepEqual(prepared.normalized.post.ctas[0], {
    label: 'Community',
    url: 'https://t.me/prompt_draft_group',
  })
})

test('publication contract rejects ambiguous or insecure direct CTA targets', () => {
  const ambiguous = validateTelegramPublicationInput(input([
    {
      label: 'Bad target',
      startParam: 'prompt_42',
      url: 'https://t.me/prompt_draft_group',
    },
  ]), config)
  assert.equal(ambiguous.ok, false)
  assert.ok(ambiguous.errors.some(error => error.field === 'post.ctas[0]'))

  const insecure = validateTelegramPublicationInput(input([
    { label: 'Bad URL', url: 'http://t.me/prompt_draft_group' },
  ]), config)
  assert.equal(insecure.ok, false)
  assert.ok(insecure.errors.some(error => error.field === 'post.ctas[0].url'))
})

test('publisher sends a normalized direct CTA URL unchanged in the Telegram keyboard', async () => {
  const prepared = validateTelegramPublicationInput(input([
    { label: 'Community', url: 'https://t.me/prompt_draft_group' },
  ]), config)
  assert.equal(prepared.ok, true)

  const calls = []
  const result = await publishTelegramPost(prepared.normalized, config, {
    fetchImpl: async (...args) => {
      calls.push(args)
      return {
        status: 200,
        async json() {
          return { ok: true, result: { message_id: 77, chat: { id: -1001 } } }
        },
      }
    },
  })

  assert.equal(calls.length, 1)
  const body = JSON.parse(calls[0][1].body)
  assert.equal(
    body.reply_markup.inline_keyboard[0][0].url,
    'https://t.me/prompt_draft_group',
  )
  assert.equal(result.messages[0].telegramMessageId, 77)
})
