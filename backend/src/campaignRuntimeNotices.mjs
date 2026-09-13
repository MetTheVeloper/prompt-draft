const NOTICE_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const PLACEMENTS = new Set(['campaign', 'mechanic'])
const TONES = new Set(['neutral', 'info', 'success', 'warning'])
const ATTEMPT_STATES = new Set(['available', 'exhausted'])
const PARTICIPATION_STATUSES = new Set([
  'started', 'in_progress', 'completed', 'qualified', 'rewarded',
  'disqualified', 'expired', 'reward_failed',
])
const CAMPAIGN_STATUSES = new Set(['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'])
const MAX_NOTICES = 50

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function issue(path, code, message) {
  return { path, code, message }
}

function validText(value, max) {
  return typeof value === 'string' && Boolean(value.trim()) && value.length <= max
}

function noticeMechanicId(notice) {
  if (typeof notice?.mechanicId === 'string' && notice.mechanicId.trim()) return notice.mechanicId.trim()
  if (notice?.when?.source === 'attempt_availability' && typeof notice.when.mechanicId === 'string') {
    return notice.when.mechanicId.trim()
  }
  return null
}

function attemptsExhausted(availability) {
  if (!availability) return false
  const used = Number(availability.usedAttempts ?? 0)
  const max = Number(availability.maxAttempts ?? 0)
  return max > 0 && used >= max && Number(availability.remainingAttempts ?? 0) === 0
}

export function validateCampaignRuntimeNotices(definition) {
  const notices = definition?.experience?.notices
  if (notices === undefined) return []
  if (!Array.isArray(notices)) {
    return [issue('experience.notices', 'CAMPAIGN_NOTICES_INVALID', 'experience.notices must be an array')]
  }

  const errors = []
  if (notices.length > MAX_NOTICES) {
    errors.push(issue('experience.notices', 'CAMPAIGN_NOTICES_LIMIT_EXCEEDED', `experience.notices supports at most ${MAX_NOTICES} notices`))
  }

  const ids = new Set()
  const mechanics = new Set((definition?.mechanics ?? [])
    .filter(mechanic => typeof mechanic?.id === 'string')
    .map(mechanic => mechanic.id))
  const locales = Array.isArray(definition?.experience?.locales) ? definition.experience.locales : []

  notices.forEach((notice, index) => {
    const base = `experience.notices[${index}]`
    if (!isObject(notice)) {
      errors.push(issue(base, 'CAMPAIGN_NOTICE_INVALID', 'notice must be an object'))
      return
    }

    const id = typeof notice.id === 'string' ? notice.id.trim() : ''
    if (!NOTICE_ID_PATTERN.test(id)) {
      errors.push(issue(`${base}.id`, 'CAMPAIGN_NOTICE_ID_INVALID', 'notice id must be 1-100 path-safe characters'))
    } else if (ids.has(id)) {
      errors.push(issue(`${base}.id`, 'CAMPAIGN_NOTICE_ID_DUPLICATE', 'notice ids must be unique'))
    } else ids.add(id)

    if (!PLACEMENTS.has(notice.placement)) {
      errors.push(issue(`${base}.placement`, 'CAMPAIGN_NOTICE_PLACEMENT_INVALID', 'notice placement must be campaign or mechanic'))
    }
    if (notice.tone !== undefined && !TONES.has(notice.tone)) {
      errors.push(issue(`${base}.tone`, 'CAMPAIGN_NOTICE_TONE_INVALID', 'notice tone must be neutral, info, success, or warning'))
    }

    if (!isObject(notice.when)) {
      errors.push(issue(`${base}.when`, 'CAMPAIGN_NOTICE_CONDITION_INVALID', 'notice when must be an object'))
    } else if (notice.when.source === 'attempt_availability') {
      if (typeof notice.when.mechanicId !== 'string' || !mechanics.has(notice.when.mechanicId)) {
        errors.push(issue(`${base}.when.mechanicId`, 'CAMPAIGN_NOTICE_MECHANIC_UNKNOWN', 'attempt notice requires a known mechanicId'))
      }
      if (!ATTEMPT_STATES.has(notice.when.state)) {
        errors.push(issue(`${base}.when.state`, 'CAMPAIGN_NOTICE_ATTEMPT_STATE_INVALID', 'attempt notice state must be available or exhausted'))
      }
    } else if (notice.when.source === 'participation_status') {
      if (!PARTICIPATION_STATUSES.has(notice.when.status)) {
        errors.push(issue(`${base}.when.status`, 'CAMPAIGN_NOTICE_PARTICIPATION_STATUS_INVALID', 'participation notice status is invalid'))
      }
    } else if (notice.when.source === 'campaign_status') {
      if (!CAMPAIGN_STATUSES.has(notice.when.status)) {
        errors.push(issue(`${base}.when.status`, 'CAMPAIGN_NOTICE_CAMPAIGN_STATUS_INVALID', 'campaign notice status is invalid'))
      }
    } else {
      errors.push(issue(`${base}.when.source`, 'CAMPAIGN_NOTICE_SOURCE_INVALID', 'notice source must be attempt_availability, participation_status, or campaign_status'))
    }

    const mechanicId = noticeMechanicId(notice)
    if (notice.placement === 'mechanic') {
      if (!mechanicId || !mechanics.has(mechanicId)) {
        errors.push(issue(`${base}.mechanicId`, 'CAMPAIGN_NOTICE_MECHANIC_REQUIRED', 'mechanic placement requires a known mechanic'))
      }
    } else if (notice.mechanicId !== undefined && (!mechanicId || !mechanics.has(mechanicId))) {
      errors.push(issue(`${base}.mechanicId`, 'CAMPAIGN_NOTICE_MECHANIC_UNKNOWN', 'notice mechanicId must reference a known mechanic'))
    }

    if (!isObject(notice.content)) {
      errors.push(issue(`${base}.content`, 'CAMPAIGN_NOTICE_CONTENT_INVALID', 'notice content must be a locale map'))
    } else {
      for (const locale of Object.keys(notice.content)) {
        if (!locales.includes(locale)) {
          errors.push(issue(`${base}.content.${locale}`, 'CAMPAIGN_NOTICE_LOCALE_INVALID', 'notice content locale must be declared by the Campaign experience'))
        }
      }
      for (const locale of locales) {
        const content = notice.content[locale]
        if (!isObject(content)) {
          errors.push(issue(`${base}.content.${locale}`, 'CAMPAIGN_NOTICE_CONTENT_REQUIRED', 'every declared locale requires notice content'))
          continue
        }
        const titleOk = content.title === undefined ? false : validText(content.title, 160)
        const bodyOk = content.body === undefined ? false : validText(content.body, 600)
        if (!titleOk && !bodyOk) {
          errors.push(issue(`${base}.content.${locale}`, 'CAMPAIGN_NOTICE_CONTENT_REQUIRED', 'notice locale requires a non-empty title or body'))
        }
        if (content.title !== undefined && !titleOk) {
          errors.push(issue(`${base}.content.${locale}.title`, 'CAMPAIGN_NOTICE_TITLE_INVALID', 'notice title must be 1-160 characters'))
        }
        if (content.body !== undefined && !bodyOk) {
          errors.push(issue(`${base}.content.${locale}.body`, 'CAMPAIGN_NOTICE_BODY_INVALID', 'notice body must be 1-600 characters'))
        }
      }
    }

    if (notice.countdown !== undefined) {
      if (!isObject(notice.countdown) || notice.countdown.source !== 'nextEligibleAt') {
        errors.push(issue(`${base}.countdown`, 'CAMPAIGN_NOTICE_COUNTDOWN_INVALID', 'countdown source must be nextEligibleAt'))
      } else if (notice.when?.source !== 'attempt_availability') {
        errors.push(issue(`${base}.countdown`, 'CAMPAIGN_NOTICE_COUNTDOWN_SOURCE_INVALID', 'nextEligibleAt countdown requires attempt_availability'))
      }
    }
  })

  return errors
}

function matchNotice(notice, { campaignStatus, participation, availabilityByMechanic }) {
  const when = notice.when
  if (when.source === 'campaign_status') return campaignStatus === when.status ? {} : null
  if (when.source === 'participation_status') return participation?.status === when.status ? {} : null
  if (when.source !== 'attempt_availability') return null

  const availability = availabilityByMechanic.get(when.mechanicId)
  if (!availability) return null
  if (when.state === 'available' && availability.available === true) return { availability }
  if (when.state === 'exhausted' && attemptsExhausted(availability)) return { availability }
  return null
}

function projectConfiguredNotice(notice, match) {
  const availability = match.availability ?? null
  const mechanicId = noticeMechanicId(notice)
  const targetAt = notice.countdown?.source === 'nextEligibleAt'
    ? availability?.nextEligibleAt ?? null
    : null
  return {
    id: notice.id,
    placement: notice.placement,
    tone: TONES.has(notice.tone) ? notice.tone : 'neutral',
    ...(mechanicId ? { mechanicId } : {}),
    content: notice.content,
    ...(availability?.period ? { period: availability.period } : {}),
    ...(availability?.reasonCode ? { reasonCode: availability.reasonCode } : {}),
    ...(targetAt ? { countdown: { source: 'nextEligibleAt', targetAt } } : {}),
  }
}

export function evaluateCampaignRuntimeNotices({
  definition,
  campaignStatus,
  participation = null,
  attemptAvailability = [],
  asOf = new Date(),
}) {
  const effectiveAt = asOf instanceof Date ? asOf : new Date(asOf)
  const serverNow = Number.isNaN(effectiveAt.getTime()) ? new Date().toISOString() : effectiveAt.toISOString()
  const availabilityByMechanic = new Map(attemptAvailability.map(item => [item.mechanicId, item]))
  const activeNotices = []
  const customExhaustion = new Set()

  for (const notice of definition?.experience?.notices ?? []) {
    if (!isObject(notice) || !isObject(notice.when)) continue
    const match = matchNotice(notice, { campaignStatus, participation, availabilityByMechanic })
    if (!match) continue
    activeNotices.push(projectConfiguredNotice(notice, match))
    if (notice.when.source === 'attempt_availability' && notice.when.state === 'exhausted') {
      customExhaustion.add(notice.when.mechanicId)
    }
  }

  for (const availability of attemptAvailability) {
    if (!attemptsExhausted(availability) || customExhaustion.has(availability.mechanicId)) continue
    const hasReset = Boolean(availability.nextEligibleAt)
    activeNotices.push({
      id: `system-attempts-exhausted-${availability.mechanicId}`,
      placement: 'mechanic',
      tone: 'info',
      mechanicId: availability.mechanicId,
      templateKey: hasReset && availability.period === 'calendar_day'
        ? 'attempts_exhausted_calendar_day'
        : 'attempts_exhausted',
      period: availability.period,
      reasonCode: availability.reasonCode ?? 'CAMPAIGN_ATTEMPT_LIMIT_REACHED',
      ...(hasReset ? { countdown: { source: 'nextEligibleAt', targetAt: availability.nextEligibleAt } } : {}),
    })
  }

  return { serverNow, activeNotices }
}
