export const PUBLIC_INDEXABLE_HOSTNAME = 'prompt-draft.ir'

export function normalizePublicRequestHostname(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  // Host headers may include a port. Parse through URL so IPv6 and trailing-dot
  // hostnames are handled without ad-hoc string splitting.
  try {
    return new URL(`http://${raw}`)
      .hostname
      .toLowerCase()
      .replace(/\.$/, '')
  } catch {
    return ''
  }
}

export function isExplicitNoindexEnabled(value: unknown) {
  return String(value ?? '').trim().toLowerCase() === 'true'
}

export function isPublicIndexingEnabledForRequest(
  noindexValue: unknown,
  requestHost: unknown,
) {
  if (isExplicitNoindexEnabled(noindexValue)) return false

  return normalizePublicRequestHostname(requestHost) === PUBLIC_INDEXABLE_HOSTNAME
}
