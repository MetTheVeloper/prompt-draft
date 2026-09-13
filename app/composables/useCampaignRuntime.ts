export type CampaignLocale = 'en' | 'fa'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived'

export type CampaignLocalizedContent = {
  title: string
  subtitle?: string
  description?: string
  body?: string
  ctaLabel?: string
  rewardLabel?: string
  countdownLabel?: string
}

export type CampaignParticipation = {
  id: string
  campaignId: string
  campaignVersionId: string
  campaignVersion: number
  userId: string
  status: 'started' | 'in_progress' | 'completed' | 'qualified' | 'rewarded' | 'disqualified' | 'expired' | 'reward_failed'
  attribution: Record<string, unknown>
  state: Record<string, unknown>
  startedAt: string
  lastProgressAt: string | null
  completedAt: string | null
  qualifiedAt: string | null
  rewardedAt: string | null
  disqualifiedAt: string | null
  expiredAt: string | null
  updatedAt: string
}

export type CampaignPublicMechanic = {
  id: string
  type: string
  renderer?: {
    kind: 'builtin' | 'custom'
    key: string
  }
  config: {
    public: Record<string, unknown>
  }
  attemptPolicy?: {
    maxAttempts: number
    period: 'campaign' | 'calendar_day' | 'rolling_24h' | 'session'
    timezone?: string
  }
}

export type CampaignPublicReward = {
  id: string
  type: string
  amount: number
  trigger: {
    type: 'campaign_completion' | 'mechanic_outcome'
    mechanicId?: string
    outcome?: string
  }
  perUserLimit?: number
  expiresAfterSeconds?: number
}

export type PublicCampaign = {
  id: string
  slug: string
  version: number
  schemaVersion: 'campaign.v1'
  status: CampaignStatus
  lifecycle: {
    startsAt: string | null
    endsAt: string | null
    timezone: string | null
    participationAfterEnd: 'deny' | 'allow_existing_only'
  }
  experience: {
    renderer: {
      kind: 'builtin' | 'custom'
      key: string
    } | null
    locales: CampaignLocale[]
    defaultLocale: CampaignLocale | null
    content: Partial<Record<CampaignLocale, CampaignLocalizedContent>>
    seo: {
      indexing?: 'noindex' | 'index'
      canonicalPath?: string
      endBehavior?: 'archive' | 'gone' | 'redirect'
      redirectPath?: string
    }
  }
  mechanics: CampaignPublicMechanic[]
  completion: Record<string, unknown> | null
  rewards: CampaignPublicReward[]
}

export type CampaignEligibility = {
  eligible: boolean
  reasonCodes: string[]
}

export type CampaignViewer = {
  authenticated: boolean
  eligibility: CampaignEligibility
  participation: CampaignParticipation | null
  effects?: unknown[]
  economy?: unknown
}

export type CampaignPublicRuntime = {
  ok: true
  campaign: PublicCampaign
  viewer: CampaignViewer
}

export type CampaignMechanicState = {
  mechanicId: string
  state: Record<string, unknown>
  revision: number
  updatedAt?: string | null
}

export type CampaignAttemptAvailability = {
  mechanicId: string
  period: 'campaign' | 'calendar_day' | 'rolling_24h' | 'session'
  maxAttempts?: number
  usedAttempts?: number
  remainingAttempts: number
  available: boolean
  nextEligibleAt: string | null
  reasonCode?: string
}

export type CampaignCallerState = {
  ok: true
  campaign: {
    id: string
    slug: string
    version: number
    status: CampaignStatus
  }
  eligibility: CampaignEligibility
  participation: CampaignParticipation | null
  mechanics: CampaignMechanicState[]
  attemptAvailability: CampaignAttemptAvailability[]
  effects: unknown[]
  economy?: unknown
}

export type CampaignAttribution = Partial<Record<
  'source' | 'medium' | 'campaign' | 'placement' | 'referrer',
  string
>>

export type CampaignParticipationStart = {
  ok: true
  duplicate: boolean
  participation: CampaignParticipation
  effects: unknown[]
  economy?: unknown
}

const PARTICIPATION_IDEMPOTENCY_PREFIX = 'prompt-draft:campaign-participation:idempotency:v1'
const CAMPAIGN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function requireCampaignSlug(slug: string) {
  const normalized = slug.trim().toLowerCase()
  if (!CAMPAIGN_SLUG_PATTERN.test(normalized) || normalized.length > 100) {
    throw new Error('Invalid Campaign slug')
  }
  return normalized
}

function createIdempotencyKey(slug: string) {
  if (!import.meta.client) return `campaign-participation:${slug}:${Date.now()}`

  const storageKey = `${PARTICIPATION_IDEMPOTENCY_PREFIX}:${slug}`
  try {
    const existing = window.sessionStorage.getItem(storageKey)?.trim()
    if (existing) return existing

    const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const key = `campaign-participation:${slug}:${randomPart}`
    window.sessionStorage.setItem(storageKey, key)
    return key
  } catch {
    return `campaign-participation:${slug}:${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function readCampaignApiErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const code = (error as { data?: { code?: unknown } }).data?.code
  return typeof code === 'string' ? code : null
}

export function readCampaignApiStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const candidate = error as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }
  const status = Number(candidate.statusCode ?? candidate.status ?? candidate.response?.status)
  return Number.isInteger(status) ? status : null
}

export function useCampaignRuntime() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const apiBase = normalizeApiBase(
    import.meta.server ? config.apiBaseInternal : config.public.apiBase,
  )

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  async function loadPublic(slug: string) {
    const normalizedSlug = requireCampaignSlug(slug)
    const response = await $fetch<CampaignPublicRuntime>(
      endpoint(`/api/campaigns/${encodeURIComponent(normalizedSlug)}`),
    )

    if (
      !response ||
      response.ok !== true ||
      !response.campaign ||
      response.campaign.slug !== normalizedSlug ||
      response.campaign.schemaVersion !== 'campaign.v1'
    ) {
      throw new Error('Invalid Campaign response')
    }

    return response
  }

  async function loadState(slug: string) {
    if (!import.meta.client) throw new Error('Campaign caller state is client-only')
    const normalizedSlug = requireCampaignSlug(slug)
    await auth.initialize()
    if (!auth.isLoggedIn.value) throw new Error('Authentication required')

    return $fetch<CampaignCallerState>(
      endpoint(`/api/campaigns/${encodeURIComponent(normalizedSlug)}/state`),
      { headers: auth.authHeaders() },
    )
  }

  async function startParticipation(
    slug: string,
    attribution: CampaignAttribution = {},
  ) {
    if (!import.meta.client) throw new Error('Campaign participation is client-only')
    const normalizedSlug = requireCampaignSlug(slug)
    await auth.initialize()
    if (!auth.isLoggedIn.value) throw new Error('Authentication required')

    return $fetch<CampaignParticipationStart>(
      endpoint(`/api/campaigns/${encodeURIComponent(normalizedSlug)}/participation`),
      {
        method: 'POST',
        headers: auth.authHeaders(),
        body: {
          idempotencyKey: createIdempotencyKey(normalizedSlug),
          attribution,
        },
      },
    )
  }

  return {
    loadPublic,
    loadState,
    startParticipation,
  }
}
