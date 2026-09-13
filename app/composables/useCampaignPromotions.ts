export type CampaignPromotionSlot =
  | 'site_header'
  | 'floating_corner'
  | 'modal'
  | 'dashboard_banner'

export type CampaignPromotionDismissPersistence = 'session' | 'device' | 'user'
export type CampaignPromotionFrequencyPeriod = 'session' | 'day' | 'campaign'

export type CampaignPromotionLocalizedContent = {
  title: string
  subtitle?: string
  description?: string
  ctaLabel?: string
  rewardLabel?: string
  countdownLabel?: string
}

export type CampaignPromotion = {
  campaignSlug: string
  campaignVersion: number
  promotionId: string
  slot: CampaignPromotionSlot
  renderer: {
    kind: 'builtin' | 'custom'
    key: string
  }
  content: {
    defaultLocale: 'en' | 'fa' | null
    locales: Partial<Record<'en' | 'fa', CampaignPromotionLocalizedContent>>
  }
  targetPath: string
  priority: number
  dismiss: {
    enabled: boolean
    persistence?: CampaignPromotionDismissPersistence
    ttlSeconds?: number
  }
  frequencyCap?: {
    maxImpressions: number
    period: CampaignPromotionFrequencyPeriod
  }
}

type CampaignPromotionsResponse = {
  ok: true
  slot: CampaignPromotionSlot
  promotions: CampaignPromotion[]
}

export type PendingCampaignAttribution = {
  source: 'onsite'
  medium: 'campaign_promotion'
  campaign: string
  placement: CampaignPromotionSlot
  referrer?: string
}

const DISMISS_STORAGE_PREFIX = 'prompt-draft:campaign-promotion:dismiss:v1'
const FREQUENCY_STORAGE_PREFIX = 'prompt-draft:campaign-promotion:frequency:v1'
const ATTRIBUTION_STORAGE_PREFIX = 'prompt-draft:campaign-attribution:v1'

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function promotionKey(promotion: CampaignPromotion) {
  return `${promotion.campaignSlug}:${promotion.campaignVersion}:${promotion.promotionId}`
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseJsonRecord(value: string | null) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

function storageForDismissal(persistence?: CampaignPromotionDismissPersistence) {
  if (!import.meta.client) return null
  if (persistence === 'session') return window.sessionStorage
  if (persistence === 'device') return window.localStorage
  return null
}

function storageForFrequency(period?: CampaignPromotionFrequencyPeriod) {
  if (!import.meta.client) return null
  return period === 'session' ? window.sessionStorage : window.localStorage
}

export function useCampaignPromotions() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const route = useRoute()
  const localePath = useLocalePath()
  const { locale } = useI18n()
  const analytics = useProductAnalytics()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function localizedContent(promotion: CampaignPromotion) {
    const requested = locale.value === 'fa' ? 'fa' : 'en'
    const defaultLocale = promotion.content.defaultLocale === 'fa' ? 'fa' : 'en'
    const selected = promotion.content.locales[requested]
      ?? promotion.content.locales[defaultLocale]
      ?? promotion.content.locales.en
      ?? promotion.content.locales.fa

    return selected ?? { title: promotion.campaignSlug }
  }

  function dismissalStorageKey(promotion: CampaignPromotion) {
    return `${DISMISS_STORAGE_PREFIX}:${promotionKey(promotion)}`
  }

  function isLocallyDismissed(promotion: CampaignPromotion) {
    if (!promotion.dismiss.enabled) return false
    const storage = storageForDismissal(promotion.dismiss.persistence)
    if (!storage) return false

    try {
      const key = dismissalStorageKey(promotion)
      const record = parseJsonRecord(storage.getItem(key))
      if (!record) return false
      const dismissUntil = typeof record.dismissUntil === 'string'
        ? Date.parse(record.dismissUntil)
        : NaN

      if (Number.isFinite(dismissUntil) && dismissUntil <= Date.now()) {
        storage.removeItem(key)
        return false
      }

      return true
    } catch {
      return false
    }
  }

  function frequencyStorageKey(promotion: CampaignPromotion) {
    const period = promotion.frequencyCap?.period
    const suffix = period === 'day' ? `:${localDateKey()}` : ''
    return `${FREQUENCY_STORAGE_PREFIX}:${promotionKey(promotion)}:${period ?? 'none'}${suffix}`
  }

  function currentImpressionCount(promotion: CampaignPromotion) {
    const cap = promotion.frequencyCap
    if (!cap) return 0
    const storage = storageForFrequency(cap.period)
    if (!storage) return 0

    try {
      const count = Number(storage.getItem(frequencyStorageKey(promotion)) ?? 0)
      return Number.isSafeInteger(count) && count > 0 ? count : 0
    } catch {
      return 0
    }
  }

  function isFrequencyAvailable(promotion: CampaignPromotion) {
    const cap = promotion.frequencyCap
    if (!cap) return true
    return currentImpressionCount(promotion) < cap.maxImpressions
  }

  function incrementImpressionCount(promotion: CampaignPromotion) {
    const cap = promotion.frequencyCap
    if (!cap || !import.meta.client) return
    const storage = storageForFrequency(cap.period)
    if (!storage) return

    try {
      const key = frequencyStorageKey(promotion)
      storage.setItem(key, String(currentImpressionCount(promotion) + 1))
    } catch {
      // Frequency caps are presentation-only; storage failures must not break the app.
    }
  }

  function canDismiss(promotion: CampaignPromotion) {
    if (!promotion.dismiss.enabled) return false
    if (promotion.dismiss.persistence === 'user') return auth.isLoggedIn.value
    return promotion.dismiss.persistence === 'session' || promotion.dismiss.persistence === 'device'
  }

  function analyticsMetadata(promotion: CampaignPromotion) {
    return {
      promotionId: promotion.promotionId,
      slot: promotion.slot,
      campaignVersion: promotion.campaignVersion,
      rendererKey: promotion.renderer.key,
      ...(promotion.dismiss.persistence
        ? { dismissPersistence: promotion.dismiss.persistence }
        : {}),
    }
  }

  function trackPromotionEvent(
    eventName:
      | 'campaign_promotion_impression'
      | 'campaign_promotion_click'
      | 'campaign_promotion_dismiss',
    promotion: CampaignPromotion,
  ) {
    void analytics.track(eventName, {
      resource: {
        type: 'campaign_promotion',
        id: promotion.campaignSlug,
      },
      metadata: analyticsMetadata(promotion),
    })
  }

  async function load(slot: CampaignPromotionSlot) {
    if (!import.meta.client) return [] as CampaignPromotion[]

    await auth.initialize()

    try {
      const response = await $fetch<CampaignPromotionsResponse>(
        endpoint(`/api/campaign-promotions?slot=${encodeURIComponent(slot)}`),
        { headers: auth.authHeaders() },
      )

      return response.promotions.filter((promotion) => {
        return !isLocallyDismissed(promotion) && isFrequencyAvailable(promotion)
      })
    } catch (error) {
      console.warn('[Prompt Draft] campaign promotion load failed', error)
      return [] as CampaignPromotion[]
    }
  }

  function recordImpression(promotion: CampaignPromotion) {
    incrementImpressionCount(promotion)
    trackPromotionEvent('campaign_promotion_impression', promotion)
  }

  function rememberAttribution(promotion: CampaignPromotion) {
    if (!import.meta.client) return

    const attribution: PendingCampaignAttribution = {
      source: 'onsite',
      medium: 'campaign_promotion',
      campaign: promotion.campaignSlug,
      placement: promotion.slot,
      ...(route.path
        ? { referrer: route.path.slice(0, 500) }
        : {}),
    }

    try {
      window.sessionStorage.setItem(
        `${ATTRIBUTION_STORAGE_PREFIX}:${promotion.campaignSlug}`,
        JSON.stringify(attribution),
      )
    } catch {
      // Attribution persistence is best-effort and cannot block campaign entry.
    }
  }

  function readPendingCampaignAttribution(
    campaignSlug: string,
    { consume = false } = {},
  ): PendingCampaignAttribution | null {
    if (!import.meta.client) return null
    const key = `${ATTRIBUTION_STORAGE_PREFIX}:${campaignSlug}`

    try {
      const record = parseJsonRecord(window.sessionStorage.getItem(key))
      if (!record) return null

      const attribution = record as PendingCampaignAttribution
      if (
        attribution.source !== 'onsite' ||
        attribution.medium !== 'campaign_promotion' ||
        attribution.campaign !== campaignSlug ||
        !['site_header', 'floating_corner', 'modal', 'dashboard_banner'].includes(attribution.placement)
      ) {
        return null
      }

      if (consume) window.sessionStorage.removeItem(key)
      return attribution
    } catch {
      return null
    }
  }

  async function activate(promotion: CampaignPromotion) {
    rememberAttribution(promotion)
    trackPromotionEvent('campaign_promotion_click', promotion)
    await navigateTo(localePath(promotion.targetPath))
  }

  async function dismiss(promotion: CampaignPromotion) {
    if (!canDismiss(promotion)) return false

    if (promotion.dismiss.persistence === 'user') {
      try {
        await $fetch(
          endpoint(
            `/api/campaign-promotions/${encodeURIComponent(promotion.campaignSlug)}/${encodeURIComponent(promotion.promotionId)}/dismiss`,
          ),
          {
            method: 'PUT',
            headers: auth.authHeaders(),
            body: {},
          },
        )
      } catch (error) {
        console.warn('[Prompt Draft] campaign promotion dismissal failed', error)
        return false
      }
    } else {
      const storage = storageForDismissal(promotion.dismiss.persistence)
      if (!storage) return false

      try {
        const dismissUntil = Number.isSafeInteger(promotion.dismiss.ttlSeconds)
          ? new Date(Date.now() + Number(promotion.dismiss.ttlSeconds) * 1000).toISOString()
          : null
        storage.setItem(
          dismissalStorageKey(promotion),
          JSON.stringify({ dismissedAt: new Date().toISOString(), dismissUntil }),
        )
      } catch {
        return false
      }
    }

    trackPromotionEvent('campaign_promotion_dismiss', promotion)
    return true
  }

  return {
    load,
    localizedContent,
    canDismiss,
    recordImpression,
    activate,
    dismiss,
    readPendingCampaignAttribution,
  }
}