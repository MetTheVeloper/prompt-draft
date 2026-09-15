import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveTelegramStartParam } from '../app/utils/telegramStartParam'

test('routes Prompt Telegram start params directly to the protected unlock surface', () => {
  assert.equal(resolveTelegramStartParam('prompt_511'), '/prompts?id=511')
  assert.equal(resolveTelegramStartParam('prompt_1'), '/prompts?id=1')
})

test('preserves Campaign Telegram attribution routing', () => {
  assert.equal(
    resolveTelegramStartParam('campaign_summer-launch'),
    '/campaign/summer-launch?source=telegram&medium=campaign_channel',
  )
})

test('preserves supported static Mini App routes and rejects malformed dynamic params', () => {
  assert.equal(resolveTelegramStartParam('create'), '/create')
  assert.equal(resolveTelegramStartParam('collage'), '/collage')
  assert.equal(resolveTelegramStartParam('guide'), '/guide')
  assert.equal(resolveTelegramStartParam('prompt_abc'), undefined)
  assert.equal(resolveTelegramStartParam('prompt_511_extra'), undefined)
  assert.equal(resolveTelegramStartParam('campaign_Summer'), undefined)
})
