export const PROFILE_FIELDS = Object.freeze(['username', 'email'])

export function normalizeProfileFields(fields = []) {
  if (!Array.isArray(fields)) return []

  const normalized = []
  const seen = new Set()

  for (const field of fields) {
    if (!PROFILE_FIELDS.includes(field) || seen.has(field)) continue
    seen.add(field)
    normalized.push(field)
  }

  return normalized
}

export function getMissingProfileFields(user, requiredFields = PROFILE_FIELDS) {
  const required = normalizeProfileFields(requiredFields)

  return required.filter((field) => {
    const value = user?.[field]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

export function createProfileState(user) {
  const completedFields = PROFILE_FIELDS.filter((field) => {
    const value = user?.[field]
    return typeof value === 'string' && value.trim().length > 0
  })

  return {
    supportedFields: [...PROFILE_FIELDS],
    completedFields,
    missingFields: PROFILE_FIELDS.filter((field) => !completedFields.includes(field)),
  }
}

export function createProfileRequirementPayload(user, requiredFields) {
  const required = normalizeProfileFields(requiredFields)
  const missingFields = getMissingProfileFields(user, required)

  return {
    ok: false,
    code: 'PROFILE_REQUIREMENT',
    message: 'Additional profile information is required',
    requiredFields: required,
    missingFields,
  }
}
