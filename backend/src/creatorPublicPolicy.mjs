import { isCanonicalCreatorUsername } from './creatorProfileRequirements.mjs'

export function evaluateCreatorPublicPolicy({
  accountExists = false,
  accountStatus = null,
  creatorStatus = null,
  username = null,
  creatorProfileComplete = false,
  hasPublishedPrompt = false,
} = {}) {
  const signals = {
    accountActive: Boolean(accountExists && accountStatus === 'active'),
    creatorApproved: creatorStatus === 'approved',
    canonicalUsername: isCanonicalCreatorUsername(username),
    creatorProfileComplete: Boolean(creatorProfileComplete),
    hasPublishedPrompt: Boolean(hasPublishedPrompt),
  }

  const accessible = Boolean(
    accountExists &&
    signals.accountActive &&
    signals.creatorApproved &&
    signals.canonicalUsername
  )
  const indexable = accessible && signals.creatorProfileComplete
  const discoverable = indexable
  const reasons = []

  if (!accountExists) reasons.push('account_missing')
  if (accountExists && !signals.accountActive) reasons.push('account_inactive')
  if (accountExists && !signals.creatorApproved) reasons.push('creator_not_approved')
  if (accountExists && !signals.canonicalUsername) reasons.push('canonical_username_missing')
  if (accessible && !signals.creatorProfileComplete) reasons.push('creator_profile_incomplete')

  return {
    accessible,
    indexable,
    discoverable,
    reasons,
    signals,
  }
}
