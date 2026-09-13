import { getCampaignMechanic } from './campaignRegistry.mjs'
import { validateCustomGameDefinition } from './campaignCustomGame.mjs'
import {
  getCampaignPromotionRenderer,
  isCampaignPromotionSlot,
} from './campaignPromotionRegistry.mjs'

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function issue(path, code, message) {
  return { path, code, message }
}

function validTimeZone(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

function collectMechanicOutcomeIds(rule, output = new Set()) {
  if (!isObject(rule)) return output
  if (rule.type === 'all' || rule.type === 'any') {
    for (const child of rule.rules ?? []) collectMechanicOutcomeIds(child, output)
    return output
  }
  if (rule.type === 'not') return collectMechanicOutcomeIds(rule.rule, output)
  if (rule.type === 'condition' && rule.condition?.source === 'mechanic_outcome') {
    if (typeof rule.condition.mechanicId === 'string') output.add(rule.condition.mechanicId)
  }
  return output
}

function validatePromotionDefinition(promotion, index, promotionIds, errors) {
  const base = `promotions[${index}]`
  if (!isObject(promotion)) {
    errors.push(issue(base, 'CAMPAIGN_PROMOTION_INVALID', 'promotion must be an object'))
    return
  }

  const id = typeof promotion.id === 'string' ? promotion.id.trim() : ''
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(id)) {
    errors.push(issue(`${base}.id`, 'CAMPAIGN_PROMOTION_ID_INVALID', 'promotion id must be 1-100 path-safe characters'))
  } else if (promotionIds.has(id)) {
    errors.push(issue(`${base}.id`, 'CAMPAIGN_PROMOTION_ID_DUPLICATE', 'promotion ids must be unique'))
  } else {
    promotionIds.add(id)
  }

  if (!isCampaignPromotionSlot(promotion.slot)) {
    errors.push(issue(
      `${base}.slot`,
      'CAMPAIGN_PROMOTION_SLOT_INVALID',
      'promotion slot must be site_header, floating_corner, modal, or dashboard_banner',
    ))
  }

  const renderer = promotion.renderer
  if (
    !isObject(renderer) ||
    !['builtin', 'custom'].includes(renderer.kind) ||
    typeof renderer.key !== 'string' ||
    !renderer.key.trim()
  ) {
    errors.push(issue(`${base}.renderer`, 'CAMPAIGN_PROMOTION_RENDERER_INVALID', 'promotion renderer reference is invalid'))
  } else {
    const registered = getCampaignPromotionRenderer(renderer.key)
    if (!registered || registered.kind !== renderer.kind) {
      errors.push(issue(`${base}.renderer.key`, 'CAMPAIGN_PROMOTION_RENDERER_UNKNOWN', 'promotion renderer is not registered'))
    } else if (isCampaignPromotionSlot(promotion.slot) && !registered.slots.includes(promotion.slot)) {
      errors.push(issue(`${base}.renderer.key`, 'CAMPAIGN_PROMOTION_RENDERER_SLOT_MISMATCH', 'promotion renderer does not support this slot'))
    }
  }

  if (promotion.schedule !== undefined) {
    if (!isObject(promotion.schedule)) {
      errors.push(issue(`${base}.schedule`, 'CAMPAIGN_PROMOTION_SCHEDULE_INVALID', 'promotion schedule must be an object'))
    } else {
      const startsAt = promotion.schedule.startsAt
      const endsAt = promotion.schedule.endsAt
      if (startsAt !== undefined && (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt)))) {
        errors.push(issue(`${base}.schedule.startsAt`, 'CAMPAIGN_PROMOTION_START_INVALID', 'promotion startsAt must be a valid timestamp'))
      }
      if (endsAt !== undefined && (typeof endsAt !== 'string' || Number.isNaN(Date.parse(endsAt)))) {
        errors.push(issue(`${base}.schedule.endsAt`, 'CAMPAIGN_PROMOTION_END_INVALID', 'promotion endsAt must be a valid timestamp'))
      }
      if (
        typeof startsAt === 'string' && typeof endsAt === 'string' &&
        !Number.isNaN(Date.parse(startsAt)) && !Number.isNaN(Date.parse(endsAt)) &&
        Date.parse(endsAt) <= Date.parse(startsAt)
      ) {
        errors.push(issue(`${base}.schedule.endsAt`, 'CAMPAIGN_PROMOTION_END_BEFORE_START', 'promotion endsAt must be after startsAt'))
      }
    }
  }

  if (promotion.dismiss !== undefined) {
    const dismiss = promotion.dismiss
    if (!isObject(dismiss) || typeof dismiss.enabled !== 'boolean') {
      errors.push(issue(`${base}.dismiss`, 'CAMPAIGN_PROMOTION_DISMISS_INVALID', 'dismiss must contain an enabled boolean'))
    } else if (dismiss.enabled) {
      if (!['session', 'device', 'user'].includes(dismiss.persistence)) {
        errors.push(issue(`${base}.dismiss.persistence`, 'CAMPAIGN_PROMOTION_DISMISS_PERSISTENCE_INVALID', 'dismiss persistence must be session, device, or user'))
      }
      if (
        dismiss.ttlSeconds !== undefined &&
        (!Number.isSafeInteger(dismiss.ttlSeconds) || dismiss.ttlSeconds <= 0)
      ) {
        errors.push(issue(`${base}.dismiss.ttlSeconds`, 'CAMPAIGN_PROMOTION_DISMISS_TTL_INVALID', 'dismiss ttlSeconds must be a positive integer'))
      }
    }
  }

  if (promotion.frequencyCap !== undefined) {
    const cap = promotion.frequencyCap
    if (!isObject(cap)) {
      errors.push(issue(`${base}.frequencyCap`, 'CAMPAIGN_PROMOTION_FREQUENCY_INVALID', 'frequencyCap must be an object'))
    } else {
      if (!Number.isSafeInteger(cap.maxImpressions) || cap.maxImpressions <= 0 || cap.maxImpressions > 1000) {
        errors.push(issue(`${base}.frequencyCap.maxImpressions`, 'CAMPAIGN_PROMOTION_FREQUENCY_MAX_INVALID', 'maxImpressions must be an integer between 1 and 1000'))
      }
      if (!['session', 'day', 'campaign'].includes(cap.period)) {
        errors.push(issue(`${base}.frequencyCap.period`, 'CAMPAIGN_PROMOTION_FREQUENCY_PERIOD_INVALID', 'frequency period must be session, day, or campaign'))
      }
    }
  }

  if (promotion.priority !== undefined && !Number.isSafeInteger(promotion.priority)) {
    errors.push(issue(`${base}.priority`, 'CAMPAIGN_PROMOTION_PRIORITY_INVALID', 'promotion priority must be an integer'))
  }
}

export function validateCampaignRuntimeDefinition(definition) {
  const errors = []
  const rewards = Array.isArray(definition?.rewards) ? definition.rewards : []
  const mechanics = Array.isArray(definition?.mechanics) ? definition.mechanics : []
  const promotions = Array.isArray(definition?.promotions) ? definition.promotions : []
  const mechanicById = new Map(
    mechanics
      .filter(mechanic => typeof mechanic?.id === 'string')
      .map(mechanic => [mechanic.id, mechanic]),
  )
  const rewardIds = new Set()
  const promotionIds = new Set()
  const completionOutcomeIds = collectMechanicOutcomeIds(definition?.completion)

  if (!Array.isArray(definition?.promotions)) {
    errors.push(issue('promotions', 'CAMPAIGN_PROMOTIONS_INVALID', 'promotions must be an array'))
  } else {
    promotions.forEach((promotion, index) => validatePromotionDefinition(promotion, index, promotionIds, errors))
  }

  mechanics.forEach((mechanic, index) => {
    const base = `mechanics[${index}]`
    if (
      typeof mechanic?.id !== 'string' ||
      !/^[A-Za-z0-9._-]{1,100}$/.test(mechanic.id)
    ) {
      errors.push(issue(
        `${base}.id`,
        'CAMPAIGN_MECHANIC_ID_INVALID',
        'mechanic id must be 1-100 path-safe characters',
      ))
    }

    if (mechanic?.type === 'custom_game') {
      errors.push(...validateCustomGameDefinition(mechanic, base))
    }

    if (mechanic?.attemptPolicy === undefined) return
    const policy = mechanic.attemptPolicy
    if (!isObject(policy)) {
      errors.push(issue(
        `${base}.attemptPolicy`,
        'CAMPAIGN_ATTEMPT_POLICY_INVALID',
        'attemptPolicy must be an object',
      ))
      return
    }
    if (!Number.isSafeInteger(policy.maxAttempts) || policy.maxAttempts <= 0 || policy.maxAttempts > 1000) {
      errors.push(issue(
        `${base}.attemptPolicy.maxAttempts`,
        'CAMPAIGN_ATTEMPT_MAX_INVALID',
        'maxAttempts must be an integer between 1 and 1000',
      ))
    }
    if (!['campaign', 'calendar_day', 'rolling_24h', 'session'].includes(policy.period)) {
      errors.push(issue(
        `${base}.attemptPolicy.period`,
        'CAMPAIGN_ATTEMPT_PERIOD_INVALID',
        'attempt period must be campaign, calendar_day, rolling_24h, or session',
      ))
    }
    if (policy.period === 'calendar_day' && !validTimeZone(policy.timezone)) {
      errors.push(issue(
        `${base}.attemptPolicy.timezone`,
        'CAMPAIGN_TIMEZONE_INVALID',
        'calendar_day attempt policy requires a valid IANA timezone',
      ))
    }
  })

  rewards.forEach((reward, index) => {
    const base = `rewards[${index}]`
    const rewardId = typeof reward?.id === 'string' ? reward.id.trim() : ''
    if (!rewardId || rewardId.length > 100) {
      errors.push(issue(`${base}.id`, 'CAMPAIGN_REWARD_ID_INVALID', 'reward id must be 1-100 characters'))
    } else if (rewardIds.has(rewardId)) {
      errors.push(issue(`${base}.id`, 'CAMPAIGN_REWARD_ID_DUPLICATE', 'reward ids must be unique'))
    } else {
      rewardIds.add(rewardId)
    }

    if (reward?.perUserLimit !== undefined && reward.perUserLimit !== 1) {
      errors.push(issue(
        `${base}.perUserLimit`,
        'CAMPAIGN_REWARD_PER_USER_LIMIT_UNSUPPORTED',
        'V1 runtime currently supports perUserLimit = 1',
      ))
    }

    if (reward?.budget !== undefined) {
      if (!isObject(reward.budget) || !Number.isSafeInteger(reward.budget.maxAmount) || reward.budget.maxAmount < reward.amount) {
        errors.push(issue(
          `${base}.budget.maxAmount`,
          'CAMPAIGN_REWARD_BUDGET_INVALID',
          'budget.maxAmount must be an integer at least as large as one reward amount',
        ))
      }
    }

    if (
      reward?.expiresAfterSeconds !== undefined &&
      (!Number.isSafeInteger(reward.expiresAfterSeconds) || reward.expiresAfterSeconds <= 0)
    ) {
      errors.push(issue(
        `${base}.expiresAfterSeconds`,
        'CAMPAIGN_REWARD_EXPIRY_INVALID',
        'expiresAfterSeconds must be a positive integer when provided',
      ))
    }

    const trigger = reward?.trigger
    if (!isObject(trigger)) {
      errors.push(issue(`${base}.trigger`, 'CAMPAIGN_REWARD_TRIGGER_INVALID', 'reward trigger is required'))
      return
    }

    if (trigger.type === 'campaign_completion') {
      if (!definition?.completion) {
        errors.push(issue(
          `${base}.trigger`,
          'CAMPAIGN_REWARD_COMPLETION_RULE_REQUIRED',
          'campaign_completion reward requires a completion rule',
        ))
      }
      return
    }

    if (trigger.type === 'mechanic_outcome') {
      const mechanic = mechanicById.get(trigger.mechanicId)
      if (!mechanic || typeof trigger.outcome !== 'string' || !trigger.outcome.trim()) {
        errors.push(issue(
          `${base}.trigger`,
          'CAMPAIGN_REWARD_MECHANIC_TRIGGER_INVALID',
          'mechanic_outcome reward requires a known mechanicId and non-empty outcome',
        ))
        return
      }
      const registry = getCampaignMechanic(mechanic.type)
      if (registry?.trustModel === 'client_reported') {
        errors.push(issue(
          `${base}.trigger.mechanicId`,
          'CAMPAIGN_CLIENT_REPORTED_REWARD_FORBIDDEN',
          'client_reported mechanic outcomes cannot directly authorize Goin',
        ))
      }
      return
    }

    errors.push(issue(
      `${base}.trigger.type`,
      'CAMPAIGN_REWARD_TRIGGER_INVALID',
      'reward trigger must be campaign_completion or mechanic_outcome',
    ))
  })

  const completionRewards = rewards.filter(reward => reward?.trigger?.type === 'campaign_completion')
  for (const mechanicId of completionOutcomeIds) {
    const mechanic = mechanicById.get(mechanicId)
    if (!mechanic) {
      errors.push(issue(
        'completion',
        'CAMPAIGN_COMPLETION_MECHANIC_UNKNOWN',
        `completion references unknown mechanic ${mechanicId}`,
      ))
      continue
    }
    const registry = getCampaignMechanic(mechanic.type)
    if (completionRewards.length > 0 && registry?.trustModel === 'client_reported') {
      errors.push(issue(
        'completion',
        'CAMPAIGN_CLIENT_REPORTED_REWARD_FORBIDDEN',
        `completion cannot authorize Goin through client_reported mechanic ${mechanicId}`,
      ))
    }
  }

  return { errors, warnings: [] }
}
