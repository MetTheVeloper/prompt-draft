import { normalizePublicCreatorUsername } from './publicRoutes'

export type PublicCreatorAttribution = {
  username: string
  avatarUrl: string | null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeHttpUrl(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return undefined

  const raw = value.trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/**
 * `null` is a valid unattributed public item.
 * `undefined` means the API attempted to provide an invalid attribution shape.
 */
export function normalizePublicCreatorAttribution(
  value: unknown,
): PublicCreatorAttribution | null | undefined {
  if (value === null || value === undefined) return null
  if (!isPlainObject(value)) return undefined

  if (typeof value.username !== 'string') return undefined
  const rawUsername = value.username.trim()

  let username = ''
  try {
    username = normalizePublicCreatorUsername(rawUsername)
  } catch {
    return undefined
  }

  if (username !== rawUsername) return undefined

  const avatarUrl = normalizeHttpUrl(value.avatarUrl)
  if (avatarUrl === undefined) return undefined

  return { username, avatarUrl }
}
