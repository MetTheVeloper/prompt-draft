import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateCampaignRuntimeNotices,
  validateCampaignRuntimeNotices,
} from './campaignRuntimeNotices.mjs'

function definition(overrides = {}) {
  return {
    experience: {
      locales: ['en', 'fa'],
      notices: [],
      ...(overrides.experience ?? {}),
    },
    mechanics: [
      {
        id: 'wheel',
        type: 'chance_wheel',
        attemptPolicy: { maxAttempts: 1, period: 'calendar_day', timezone: 'Asia/Tehran' },
      },
    ],
    ...overrides,
  }
}

function customExhaustionNotice() {
  return {
    id: 'wheel-done',
    when: { source: 'attempt_availability', mechanicId: 'wheel', state: 'exhausted' },
    placement: 'mechanic',
    tone: 'info',
    content: {
      en: { title: 'Done for today', body: 'Come back tomorrow.' },
      fa: { title: 'نوبت امروز تمام شد', body: 'فردا دوباره برگرد.' },
    },
    countdown: { source: 'nextEligibleAt' },
  }
}

test('runtime notice definition validates generic conditions, locales, and countdown source', () => {
  const valid = definition({
    experience: { locales: ['en', 'fa'], notices: [customExhaustionNotice()] },
  })
  assert.deepEqual(validateCampaignRuntimeNotices(valid), [])

  const invalid = definition({
    experience: {
      locales: ['en', 'fa'],
      notices: [{
        ...customExhaustionNotice(),
        when: { source: 'attempt_availability', mechanicId: 'missing', state: 'exhausted' },
        countdown: { source: 'client_clock' },
      }],
    },
  })
  const codes = validateCampaignRuntimeNotices(invalid).map(item => item.code)
  assert.ok(codes.includes('CAMPAIGN_NOTICE_MECHANIC_UNKNOWN'))
  assert.ok(codes.includes('CAMPAIGN_NOTICE_COUNTDOWN_INVALID'))
})

test('configured exhaustion notice activates with the server nextEligibleAt target', () => {
  const targetAt = '2026-09-14T20:30:00.000Z'
  const result = evaluateCampaignRuntimeNotices({
    definition: definition({
      experience: { locales: ['en', 'fa'], notices: [customExhaustionNotice()] },
    }),
    campaignStatus: 'active',
    participation: { status: 'in_progress' },
    attemptAvailability: [{
      mechanicId: 'wheel',
      period: 'calendar_day',
      maxAttempts: 1,
      usedAttempts: 1,
      remainingAttempts: 0,
      available: false,
      nextEligibleAt: targetAt,
    }],
    asOf: new Date('2026-09-13T20:30:00.000Z'),
  })

  assert.equal(result.serverNow, '2026-09-13T20:30:00.000Z')
  assert.equal(result.activeNotices.length, 1)
  assert.equal(result.activeNotices[0].id, 'wheel-done')
  assert.equal(result.activeNotices[0].mechanicId, 'wheel')
  assert.equal(result.activeNotices[0].countdown.targetAt, targetAt)
  assert.equal(result.activeNotices[0].content.fa.title, 'نوبت امروز تمام شد')
})

test('system fallback is generated for actual calendar-day exhaustion', () => {
  const result = evaluateCampaignRuntimeNotices({
    definition: definition(),
    campaignStatus: 'active',
    participation: { status: 'in_progress' },
    attemptAvailability: [{
      mechanicId: 'wheel',
      period: 'calendar_day',
      maxAttempts: 1,
      usedAttempts: 1,
      remainingAttempts: 0,
      available: false,
      nextEligibleAt: '2026-09-14T20:30:00.000Z',
    }],
  })

  assert.equal(result.activeNotices.length, 1)
  assert.equal(result.activeNotices[0].templateKey, 'attempts_exhausted_calendar_day')
  assert.equal(result.activeNotices[0].placement, 'mechanic')
})

test('zero remaining caused by a blocked participation is not treated as attempt exhaustion', () => {
  const result = evaluateCampaignRuntimeNotices({
    definition: definition(),
    campaignStatus: 'active',
    participation: { status: 'rewarded' },
    attemptAvailability: [{
      mechanicId: 'wheel',
      period: 'calendar_day',
      maxAttempts: 4,
      usedAttempts: 2,
      remainingAttempts: 0,
      available: false,
      nextEligibleAt: null,
      reasonCode: 'CAMPAIGN_PARTICIPATION_CLOSED',
    }],
  })

  assert.deepEqual(result.activeNotices, [])
})

test('campaign and participation status notices share the same evaluator', () => {
  const statusNotices = [
    {
      id: 'campaign-paused',
      when: { source: 'campaign_status', status: 'paused' },
      placement: 'campaign',
      content: { en: { title: 'Paused' }, fa: { title: 'متوقف شده' } },
    },
    {
      id: 'rewarded',
      when: { source: 'participation_status', status: 'rewarded' },
      placement: 'campaign',
      tone: 'success',
      content: { en: { title: 'Rewarded' }, fa: { title: 'پاداش گرفتی' } },
    },
  ]
  const result = evaluateCampaignRuntimeNotices({
    definition: definition({ experience: { locales: ['en', 'fa'], notices: statusNotices } }),
    campaignStatus: 'paused',
    participation: { status: 'rewarded' },
    attemptAvailability: [],
  })

  assert.deepEqual(result.activeNotices.map(item => item.id), ['campaign-paused', 'rewarded'])
})
