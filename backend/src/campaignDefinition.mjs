import { createHash } from 'node:crypto'
import { getCampaignMechanic, getCampaignRenderer } from './campaignRegistry.mjs'
import { validateRuleExpression } from './campaignRules.mjs'

export const CAMPAIGN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const LOCALES = new Set(['en', 'fa'])
const OBJECTIVES = new Set([
  'acquisition',
  'activation',
  'education',
  'engagement',
  'retention',
  'reactivation',
  'referral',
  'conversion',
  'monetization',
  'other',
])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function error(path, code, message) {
  return { path, code, message }
}

function validateSlug(value, path, errors) {
  if (
    typeof value !== 'string' ||
    value.length > 100 ||
    !CAMPAIGN_SLUG_PATTERN.test(value)
  ) {
    errors.push(error(
      path,
      'CAMPAIGN_SLUG_INVALID',
      'slug must be a normalized lowercase URL-safe token up to 100 characters',
    ))
  }
}

function validateInternalName(value, path, errors) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 160
  ) {
    errors.push(error(
      path,
      'CAMPAIGN_INTERNAL_NAME_INVALID',
      'internalName must be 1-160 characters',
    ))
  }
}

export function validateCampaignHeadInput({ slug, internalName }) {
  const errors = []
  validateSlug(slug, 'slug', errors)
  validateInternalName(internalName, 'internalName', errors)
  return errors
}

export function canonicalizeCampaignDefinition(value) {
  if (Array.isArray(value)) return value.map(canonicalizeCampaignDefinition)
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, canonicalizeCampaignDefinition(value[key])]),
  )
}

export function hashCampaignDefinition(definition) {
  const canonical = JSON.stringify(canonicalizeCampaignDefinition(definition))
  return createHash('sha256').update(canonical).digest('hex')
}

export function validateCampaignDefinition(
  definition,
  { mode = 'publish', headSlug = null } = {},
) {
  const errors = []
  const warnings = []

  if (!isObject(definition)) {
    return {
      publishable: false,
      errors: [error(
        'definition',
        'CAMPAIGN_DEFINITION_INVALID',
        'Campaign definition must be an object',
      )],
      warnings,
    }
  }

  if (
    definition.schemaVersion !== undefined &&
    definition.schemaVersion !== 'campaign.v1'
  ) {
    errors.push(error(
      'schemaVersion',
      'CAMPAIGN_SCHEMA_VERSION_INVALID',
      'schemaVersion must be campaign.v1',
    ))
  }

  if (definition.identity !== undefined) {
    if (!isObject(definition.identity)) {
      errors.push(error(
        'identity',
        'CAMPAIGN_IDENTITY_INVALID',
        'identity must be an object',
      ))
    } else {
      if (definition.identity.slug !== undefined) {
        validateSlug(definition.identity.slug, 'identity.slug', errors)
        if (headSlug && definition.identity.slug !== headSlug) {
          errors.push(error(
            'identity.slug',
            'CAMPAIGN_SLUG_MISMATCH',
            'definition slug must match campaign head slug',
          ))
        }
      }
      if (definition.identity.internalName !== undefined) {
        validateInternalName(
          definition.identity.internalName,
          'identity.internalName',
          errors,
        )
      }
    }
  }

  if (mode === 'draft') {
    return { publishable: false, errors, warnings }
  }

  if (definition.schemaVersion !== 'campaign.v1') {
    errors.push(error(
      'schemaVersion',
      'CAMPAIGN_SCHEMA_VERSION_REQUIRED',
      'schemaVersion campaign.v1 is required for publish',
    ))
  }

  if (!isObject(definition.identity)) {
    errors.push(error(
      'identity',
      'CAMPAIGN_IDENTITY_REQUIRED',
      'identity is required for publish',
    ))
  } else {
    if (definition.identity.slug === undefined) {
      errors.push(error(
        'identity.slug',
        'CAMPAIGN_SLUG_REQUIRED',
        'identity.slug is required for publish',
      ))
    }
    if (definition.identity.internalName === undefined) {
      errors.push(error(
        'identity.internalName',
        'CAMPAIGN_INTERNAL_NAME_REQUIRED',
        'identity.internalName is required for publish',
      ))
    }
  }

  if (!isObject(definition.objective) || !OBJECTIVES.has(definition.objective.type)) {
    errors.push(error(
      'objective.type',
      'CAMPAIGN_OBJECTIVE_INVALID',
      'objective.type is invalid',
    ))
  }

  const lifecycle = definition.lifecycle
  if (!isObject(lifecycle)) {
    errors.push(error(
      'lifecycle',
      'CAMPAIGN_LIFECYCLE_REQUIRED',
      'lifecycle is required',
    ))
  } else {
    if (!lifecycle.startsAt || Number.isNaN(Date.parse(lifecycle.startsAt))) {
      errors.push(error(
        'lifecycle.startsAt',
        'CAMPAIGN_START_INVALID',
        'startsAt must be an ISO date/time',
      ))
    }
    if (lifecycle.endsAt && Number.isNaN(Date.parse(lifecycle.endsAt))) {
      errors.push(error(
        'lifecycle.endsAt',
        'CAMPAIGN_END_INVALID',
        'endsAt must be an ISO date/time',
      ))
    }
    if (
      lifecycle.startsAt &&
      lifecycle.endsAt &&
      !Number.isNaN(Date.parse(lifecycle.startsAt)) &&
      !Number.isNaN(Date.parse(lifecycle.endsAt)) &&
      Date.parse(lifecycle.endsAt) <= Date.parse(lifecycle.startsAt)
    ) {
      errors.push(error(
        'lifecycle.endsAt',
        'CAMPAIGN_END_BEFORE_START',
        'endsAt must be after startsAt',
      ))
    }
    if (typeof lifecycle.timezone !== 'string' || !lifecycle.timezone.trim()) {
      errors.push(error(
        'lifecycle.timezone',
        'CAMPAIGN_TIMEZONE_REQUIRED',
        'timezone is required',
      ))
    }
  }

  const experience = definition.experience
  if (!isObject(experience)) {
    errors.push(error(
      'experience',
      'CAMPAIGN_EXPERIENCE_REQUIRED',
      'experience is required',
    ))
  } else {
    const renderer = experience.renderer
    if (
      !isObject(renderer) ||
      !['builtin', 'custom'].includes(renderer.kind) ||
      typeof renderer.key !== 'string' ||
      !renderer.key.trim()
    ) {
      errors.push(error(
        'experience.renderer',
        'CAMPAIGN_RENDERER_INVALID',
        'renderer reference is invalid',
      ))
    } else {
      const registeredRenderer = getCampaignRenderer(renderer.key)
      if (!registeredRenderer || registeredRenderer.kind !== renderer.kind) {
        errors.push(error(
          'experience.renderer.key',
          'CAMPAIGN_RENDERER_UNKNOWN',
          'renderer is not registered for the requested kind',
        ))
      }
    }

    if (
      !Array.isArray(experience.locales) ||
      experience.locales.length === 0 ||
      experience.locales.some(locale => !LOCALES.has(locale))
    ) {
      errors.push(error(
        'experience.locales',
        'CAMPAIGN_LOCALES_INVALID',
        'locales must contain en and/or fa',
      ))
    }

    if (
      typeof experience.defaultLocale !== 'string' ||
      !experience.locales?.includes(experience.defaultLocale)
    ) {
      errors.push(error(
        'experience.defaultLocale',
        'CAMPAIGN_DEFAULT_LOCALE_INVALID',
        'defaultLocale must be one of the declared locales',
      ))
    }

    for (const locale of experience.locales ?? []) {
      if (
        !isObject(experience.content?.[locale]) ||
        typeof experience.content[locale].title !== 'string' ||
        !experience.content[locale].title.trim()
      ) {
        errors.push(error(
          `experience.content.${locale}.title`,
          'CAMPAIGN_LOCALE_CONTENT_REQUIRED',
          'every declared locale requires a title',
        ))
      }
    }
  }

  const mechanicIds = new Set()
  const mechanicTrust = new Map()

  if (!Array.isArray(definition.mechanics)) {
    errors.push(error(
      'mechanics',
      'CAMPAIGN_MECHANICS_INVALID',
      'mechanics must be an array',
    ))
  } else {
    definition.mechanics.forEach((mechanic, index) => {
      const base = `mechanics[${index}]`
      if (!isObject(mechanic) || typeof mechanic.id !== 'string' || !mechanic.id.trim()) {
        errors.push(error(
          `${base}.id`,
          'CAMPAIGN_MECHANIC_ID_REQUIRED',
          'mechanic id is required',
        ))
      } else if (mechanicIds.has(mechanic.id)) {
        errors.push(error(
          `${base}.id`,
          'CAMPAIGN_MECHANIC_ID_DUPLICATE',
          'mechanic ids must be unique',
        ))
      } else {
        mechanicIds.add(mechanic.id)
      }

      const registry = getCampaignMechanic(mechanic?.type)
      if (!registry) {
        errors.push(error(
          `${base}.type`,
          'CAMPAIGN_MECHANIC_UNKNOWN',
          'mechanic type is not registered',
        ))
      } else if (mechanic?.id) {
        mechanicTrust.set(mechanic.id, registry.trustModel)
      }

      if (!isObject(mechanic?.config) || !isObject(mechanic.config.public)) {
        errors.push(error(
          `${base}.config.public`,
          'CAMPAIGN_PUBLIC_CONFIG_REQUIRED',
          'mechanic config.public must be an object',
        ))
      }

      if (
        mechanic?.attemptPolicy?.period === 'calendar_day' &&
        !mechanic.attemptPolicy.timezone
      ) {
        errors.push(error(
          `${base}.attemptPolicy.timezone`,
          'CAMPAIGN_TIMEZONE_REQUIRED',
          'calendar_day attempt policy requires a timezone',
        ))
      }
    })
  }

  if (definition.completion != null) {
    errors.push(...validateRuleExpression(definition.completion, 'completion'))
  }
  if (definition.eligibility?.rules) {
    errors.push(...validateRuleExpression(
      definition.eligibility.rules,
      'eligibility.rules',
    ))
  }

  if (!Array.isArray(definition.rewards)) {
    errors.push(error(
      'rewards',
      'CAMPAIGN_REWARDS_INVALID',
      'rewards must be an array',
    ))
  } else {
    definition.rewards.forEach((reward, index) => {
      if (reward?.type !== 'goin') {
        errors.push(error(
          `rewards[${index}].type`,
          'CAMPAIGN_REWARD_TYPE_INVALID',
          'V1 reward type must be goin',
        ))
      }
      if (!Number.isSafeInteger(reward?.amount) || reward.amount <= 0) {
        errors.push(error(
          `rewards[${index}].amount`,
          'CAMPAIGN_REWARD_AMOUNT_INVALID',
          'Goin amount must be a positive integer',
        ))
      }
    })
  }

  const rewardBearing = Array.isArray(definition.rewards) && definition.rewards.length > 0
  if (rewardBearing && definition.eligibility?.authenticated !== true) {
    errors.push(error(
      'eligibility.authenticated',
      'CAMPAIGN_AUTHENTICATION_REQUIRED_FOR_REWARD',
      'reward-bearing campaigns must require authenticated participation',
    ))
  }

  if (rewardBearing) {
    const clientReportedMechanic = [...mechanicTrust.entries()]
      .find(([, trustModel]) => trustModel === 'client_reported')
    if (clientReportedMechanic) {
      errors.push(error(
        `mechanics.${clientReportedMechanic[0]}`,
        'CAMPAIGN_CLIENT_REPORTED_REWARD_FORBIDDEN',
        'client_reported mechanics cannot participate in a reward-bearing V1 campaign',
      ))
    }
  }

  return {
    publishable: errors.length === 0,
    errors,
    warnings,
  }
}
