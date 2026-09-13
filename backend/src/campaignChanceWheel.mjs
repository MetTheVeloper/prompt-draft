import { randomInt } from 'node:crypto'

const KEY_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const MAX_SEGMENTS = 50
const MAX_WEIGHT = 1_000_000_000
const MAX_TOTAL_WEIGHT = 1_000_000_000

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function issue(path, code, message) {
  return { path, code, message }
}

function validLocalizedLabel(value) {
  if (!isObject(value)) return false
  const entries = Object.entries(value)
  if (entries.length === 0 || entries.some(([locale]) => !['en', 'fa'].includes(locale))) return false
  return entries.every(([, label]) => typeof label === 'string' && label.trim().length > 0 && label.trim().length <= 120)
}

export function getChanceWheelSegmentKeys(mechanic) {
  const segments = mechanic?.config?.public?.segments
  if (!Array.isArray(segments)) return new Set()
  return new Set(
    segments
      .map(segment => typeof segment?.key === 'string' ? segment.key.trim() : '')
      .filter(Boolean),
  )
}

export function validateChanceWheelDefinition(mechanic, base = 'mechanic') {
  const errors = []
  const publicConfig = mechanic?.config?.public
  const privateConfig = mechanic?.config?.private
  const segments = publicConfig?.segments
  const weights = privateConfig?.weights

  if (!isObject(publicConfig) || !Array.isArray(segments) || segments.length < 1 || segments.length > MAX_SEGMENTS) {
    errors.push(issue(
      `${base}.config.public.segments`,
      'CAMPAIGN_WHEEL_SEGMENTS_INVALID',
      `chance_wheel requires 1-${MAX_SEGMENTS} public segments`,
    ))
    return errors
  }

  const segmentKeys = new Set()
  segments.forEach((segment, index) => {
    const path = `${base}.config.public.segments[${index}]`
    const key = typeof segment?.key === 'string' ? segment.key.trim() : ''
    if (!KEY_PATTERN.test(key)) {
      errors.push(issue(`${path}.key`, 'CAMPAIGN_WHEEL_SEGMENT_KEY_INVALID', 'wheel segment key must be 1-100 path-safe characters'))
    } else if (segmentKeys.has(key)) {
      errors.push(issue(`${path}.key`, 'CAMPAIGN_WHEEL_SEGMENT_KEY_DUPLICATE', 'wheel segment keys must be unique'))
    } else {
      segmentKeys.add(key)
    }

    if (!validLocalizedLabel(segment?.label)) {
      errors.push(issue(`${path}.label`, 'CAMPAIGN_WHEEL_SEGMENT_LABEL_INVALID', 'wheel segment label must contain non-empty en/fa localized text'))
    }
  })

  if (!isObject(privateConfig) || !isObject(weights)) {
    errors.push(issue(
      `${base}.config.private.weights`,
      'CAMPAIGN_WHEEL_WEIGHTS_INVALID',
      'chance_wheel requires private outcome weights',
    ))
    return errors
  }

  let totalWeight = 0
  for (const key of segmentKeys) {
    const weight = weights[key]
    if (!Number.isSafeInteger(weight) || weight <= 0 || weight > MAX_WEIGHT) {
      errors.push(issue(
        `${base}.config.private.weights.${key}`,
        'CAMPAIGN_WHEEL_WEIGHT_INVALID',
        `wheel weight must be an integer between 1 and ${MAX_WEIGHT}`,
      ))
      continue
    }
    totalWeight += weight
  }

  for (const key of Object.keys(weights)) {
    if (!segmentKeys.has(key)) {
      errors.push(issue(
        `${base}.config.private.weights.${key}`,
        'CAMPAIGN_WHEEL_WEIGHT_UNKNOWN_SEGMENT',
        'private wheel weight references an unknown public segment',
      ))
    }
  }

  if (totalWeight <= 0 || totalWeight > MAX_TOTAL_WEIGHT) {
    errors.push(issue(
      `${base}.config.private.weights`,
      'CAMPAIGN_WHEEL_WEIGHT_TOTAL_INVALID',
      `wheel weight total must be between 1 and ${MAX_TOTAL_WEIGHT}`,
    ))
  }

  if (!mechanic?.attemptPolicy) {
    errors.push(issue(
      `${base}.attemptPolicy`,
      'CAMPAIGN_WHEEL_ATTEMPT_POLICY_REQUIRED',
      'chance_wheel requires an attempt policy',
    ))
  }

  return errors
}

export function selectChanceWheelOutcome(mechanic, randomInteger = randomInt) {
  const segments = mechanic?.config?.public?.segments
  const weights = mechanic?.config?.private?.weights
  if (!Array.isArray(segments) || !isObject(weights) || segments.length === 0) {
    return { ok: false, code: 'CAMPAIGN_WHEEL_CONFIG_INVALID' }
  }

  const weighted = []
  let totalWeight = 0
  for (const segment of segments) {
    const key = typeof segment?.key === 'string' ? segment.key.trim() : ''
    const weight = weights[key]
    if (!KEY_PATTERN.test(key) || !Number.isSafeInteger(weight) || weight <= 0 || weight > MAX_WEIGHT) {
      return { ok: false, code: 'CAMPAIGN_WHEEL_CONFIG_INVALID' }
    }
    totalWeight += weight
    if (totalWeight > MAX_TOTAL_WEIGHT) return { ok: false, code: 'CAMPAIGN_WHEEL_CONFIG_INVALID' }
    weighted.push({ key, weight })
  }

  if (totalWeight <= 0) return { ok: false, code: 'CAMPAIGN_WHEEL_CONFIG_INVALID' }

  const draw = randomInteger(totalWeight)
  if (!Number.isSafeInteger(draw) || draw < 0 || draw >= totalWeight) {
    throw new Error('Chance wheel RNG returned an invalid value')
  }

  let cursor = 0
  for (const item of weighted) {
    cursor += item.weight
    if (draw < cursor) return { ok: true, outcome: item.key }
  }

  throw new Error('Chance wheel outcome selection failed')
}
