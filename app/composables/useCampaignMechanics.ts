import type { CampaignMechanicState, CampaignParticipation } from '~/composables/useCampaignRuntime'

export type CampaignAttempt = {
  id: string
  mechanicId: string
  status: string
  attemptIndex: number
  period: {
    type: 'campaign' | 'calendar_day' | 'rolling_24h' | 'session'
    nextEligibleAt: string | null
  }
  expiresAt: string | null
  publicContext: Record<string, unknown>
  outcome?: Record<string, unknown>
}

export type CampaignAttemptReservation = {
  ok: true
  duplicate: boolean
  attempt: CampaignAttempt
}

export type CampaignActionSuccess = {
  ok: true
  accepted: true
  duplicate: boolean
  result: {
    participation: CampaignParticipation
    mechanicState: CampaignMechanicState
    attempt: CampaignAttempt | null
    effects: unknown[]
    economy?: unknown
  }
}

const CAMPAIGN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CAMPAIGN_NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const IDEMPOTENCY_KEY_MAX = 240

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function requireSlug(value: string) {
  const slug = value.trim().toLowerCase()
  if (!CAMPAIGN_SLUG_PATTERN.test(slug) || slug.length > 100) throw new Error('Invalid Campaign slug')
  return slug
}

function requireName(value: string) {
  const normalized = value.trim()
  if (!CAMPAIGN_NAME_PATTERN.test(normalized)) throw new Error('Invalid Campaign mechanic/action name')
  return normalized
}

function requireIdempotency(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.length > IDEMPOTENCY_KEY_MAX) throw new Error('Invalid Campaign idempotency key')
  return normalized
}

export function createCampaignMechanicRequestKey(scope: string) {
  const safeScope = scope.replace(/[^A-Za-z0-9._:-]/g, '-').slice(0, 120)
  const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `campaign:${safeScope}:${randomPart}`.slice(0, IDEMPOTENCY_KEY_MAX)
}

export function useCampaignMechanics() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  async function requireAuth() {
    if (!import.meta.client) throw new Error('Campaign mechanic runtime is client-only')
    await auth.initialize()
    if (!auth.isLoggedIn.value) throw new Error('Authentication required')
  }

  async function reserveAttempt(slug: string, mechanicId: string, idempotencyKey: string) {
    const normalizedSlug = requireSlug(slug)
    const normalizedMechanicId = requireName(mechanicId)
    const normalizedIdempotency = requireIdempotency(idempotencyKey)
    await requireAuth()

    return $fetch<CampaignAttemptReservation>(
      endpoint(`/api/campaigns/${encodeURIComponent(normalizedSlug)}/mechanics/${encodeURIComponent(normalizedMechanicId)}/attempts`),
      {
        method: 'POST',
        headers: auth.authHeaders(),
        body: { idempotencyKey: normalizedIdempotency },
      },
    )
  }

  async function submitAction(
    slug: string,
    mechanicId: string,
    action: string,
    input: {
      idempotencyKey: string
      payload?: Record<string, unknown>
      evidence?: Record<string, unknown>
    },
  ) {
    const normalizedSlug = requireSlug(slug)
    const normalizedMechanicId = requireName(mechanicId)
    const normalizedAction = requireName(action)
    const normalizedIdempotency = requireIdempotency(input.idempotencyKey)
    await requireAuth()

    return $fetch<CampaignActionSuccess>(
      endpoint(`/api/campaigns/${encodeURIComponent(normalizedSlug)}/actions`),
      {
        method: 'POST',
        headers: auth.authHeaders(),
        body: {
          mechanicId: normalizedMechanicId,
          action: normalizedAction,
          idempotencyKey: normalizedIdempotency,
          payload: input.payload ?? {},
          evidence: input.evidence ?? {},
        },
      },
    )
  }

  return { reserveAttempt, submitAction }
}
