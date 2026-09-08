export const CREATOR_PROFILE_LIMITS = Object.freeze({
  screenName: 160,
  bio: 2000,
  article: 100000,
})

const USERNAME_PATTERN = /^[a-z0-9._-]{3,64}$/
const SKILL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const REQUIRED_LOCALIZED_FIELDS = Object.freeze([
  ['screenName', 'en'],
  ['screenName', 'fa'],
  ['bio', 'en'],
  ['bio', 'fa'],
  ['article', 'en'],
  ['article', 'fa'],
])

function readNestedValue(value, field, locale) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const localized = value[field]
  if (!localized || typeof localized !== 'object' || Array.isArray(localized)) return undefined
  return localized[locale]
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function textFieldLimit(field) {
  return CREATOR_PROFILE_LIMITS[field]
}

function validateLocalizedTextField(profile, field, locale) {
  const value = readNestedValue(profile, field, locale)
  const limit = textFieldLimit(field)

  if (value === undefined || value === null) return null

  if (typeof value !== 'string') {
    return {
      field: `${field}.${locale}`,
      message: `${field}.${locale} must be a string`,
    }
  }

  if (value.trim().length > limit) {
    return {
      field: `${field}.${locale}`,
      message: `${field}.${locale} must be at most ${limit} characters`,
    }
  }

  return null
}

export function normalizeCreatorUsername(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return USERNAME_PATTERN.test(normalized) ? normalized : null
}

export function isCanonicalCreatorUsername(value) {
  const normalized = normalizeCreatorUsername(value)
  return Boolean(normalized && typeof value === 'string' && value.trim() === normalized)
}

export function normalizeCreatorProfile(profile) {
  return {
    screenName: {
      en: normalizeOptionalText(readNestedValue(profile, 'screenName', 'en')),
      fa: normalizeOptionalText(readNestedValue(profile, 'screenName', 'fa')),
    },
    bio: {
      en: normalizeOptionalText(readNestedValue(profile, 'bio', 'en')),
      fa: normalizeOptionalText(readNestedValue(profile, 'bio', 'fa')),
    },
    article: {
      en: normalizeOptionalText(readNestedValue(profile, 'article', 'en')),
      fa: normalizeOptionalText(readNestedValue(profile, 'article', 'fa')),
    },
  }
}

export function validateCreatorProfileTechnicalLimits(profile) {
  const errors = []

  for (const [field, locale] of REQUIRED_LOCALIZED_FIELDS) {
    const error = validateLocalizedTextField(profile, field, locale)
    if (error) errors.push(error)
  }

  return errors
}

export function normalizeActiveSkillSlugs(value) {
  if (!Array.isArray(value)) return []

  return [...new Set(
    value
      .filter(item => typeof item === 'string')
      .map(item => item.trim().toLowerCase())
      .filter(item => SKILL_SLUG_PATTERN.test(item)),
  )]
}

export function evaluateCreatorProfileContent({ profile, activeSkillSlugs } = {}) {
  const normalizedProfile = normalizeCreatorProfile(profile)
  const normalizedActiveSkillSlugs = normalizeActiveSkillSlugs(activeSkillSlugs)
  const technicalErrors = validateCreatorProfileTechnicalLimits(profile)
  const missingFields = []

  for (const [field, locale] of REQUIRED_LOCALIZED_FIELDS) {
    if (!normalizedProfile[field][locale]) {
      missingFields.push(`${field}.${locale}`)
    }
  }

  if (normalizedActiveSkillSlugs.length === 0) {
    missingFields.push('skills')
  }

  return {
    complete: missingFields.length === 0 && technicalErrors.length === 0,
    missingFields,
    invalidFields: technicalErrors.map(error => error.field),
    errors: technicalErrors,
    profile: normalizedProfile,
    activeSkillSlugs: normalizedActiveSkillSlugs,
    signals: {
      screenNameEn: Boolean(normalizedProfile.screenName.en),
      screenNameFa: Boolean(normalizedProfile.screenName.fa),
      bioEn: Boolean(normalizedProfile.bio.en),
      bioFa: Boolean(normalizedProfile.bio.fa),
      articleEn: Boolean(normalizedProfile.article.en),
      articleFa: Boolean(normalizedProfile.article.fa),
      hasActiveSkill: normalizedActiveSkillSlugs.length > 0,
    },
  }
}

export function evaluateCreatorApplicationReadiness({
  accountStatus,
  username,
  profile,
  activeSkillSlugs,
} = {}) {
  const content = evaluateCreatorProfileContent({ profile, activeSkillSlugs })
  const accountActive = accountStatus === 'active'
  const canonicalUsername = isCanonicalCreatorUsername(username)
  const missingFields = [...content.missingFields]

  if (!accountActive) missingFields.unshift('account.status')
  if (!canonicalUsername) {
    const insertionIndex = accountActive ? 0 : 1
    missingFields.splice(insertionIndex, 0, 'username')
  }

  return {
    ready: missingFields.length === 0 && content.invalidFields.length === 0,
    missingFields,
    invalidFields: content.invalidFields,
    errors: content.errors,
    normalizedUsername: normalizeCreatorUsername(username),
    profile: content.profile,
    activeSkillSlugs: content.activeSkillSlugs,
    signals: {
      accountActive,
      canonicalUsername,
      ...content.signals,
    },
  }
}
