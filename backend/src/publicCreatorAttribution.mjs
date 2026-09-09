import { evaluateCreatorPublicPolicy } from './publicCreator.mjs'

function normalizeHttpUrl(value) {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Minimal public attribution projection used by Public Prompt and Discovery.
 *
 * It deliberately uses the exact Creator accessibility policy exported by the
 * canonical public Creator module. Profile completeness/indexability is not an
 * attribution gate: an approved active canonical Creator remains accessible
 * even if defensive legacy/corrupt profile data forces that Creator page to
 * noindex.
 */
export function mapPublicCreatorAttribution(row) {
  const username = typeof row?.creatorUsername === 'string'
    ? row.creatorUsername.trim()
    : null

  const policy = evaluateCreatorPublicPolicy({
    accountExists: Boolean(username),
    accountStatus: row?.creatorAccountStatus ?? null,
    creatorStatus: row?.creatorStatus ?? null,
    username,
    creatorProfileComplete: false,
    hasPublishedPrompt: false,
  })

  if (!policy.accessible) return null

  return {
    username,
    avatarUrl: normalizeHttpUrl(row?.creatorAvatarUrl),
  }
}
