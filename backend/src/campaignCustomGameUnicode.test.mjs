import assert from 'node:assert/strict'
import test from 'node:test'
import {
  prepareCustomGameAttemptContext,
  validateCustomGameSubmission,
} from './campaignCustomGame.mjs'

test('custom game verifier accepts normalized Persian answers', () => {
  const attemptId = '00000000-0000-4000-8000-000000000042'
  const mechanic = {
    id: 'game',
    type: 'custom_game',
    attemptPolicy: { maxAttempts: 1, period: 'campaign' },
    config: {
      public: {},
      private: {
        verifier: {
          key: 'exact_answer_v1',
          caseSensitive: false,
          trim: true,
          challenges: [{
            id: 'orbit',
            prompt: { en: 'Type ORBIT', fa: 'کلمه ORBIT را وارد کن' },
            acceptedAnswers: ['orbit', 'مدار'],
          }],
        },
      },
    },
  }

  const prepared = prepareCustomGameAttemptContext({ mechanic, attemptId })
  assert.equal(prepared.ok, true)

  const result = validateCustomGameSubmission({
    attempt: {
      id: attemptId,
      privateContext: prepared.privateContext,
    },
    payload: { answer: '  مدار  ' },
    evidence: { attemptId },
  })

  assert.deepEqual(result, { ok: true, outcome: 'win' })
})
