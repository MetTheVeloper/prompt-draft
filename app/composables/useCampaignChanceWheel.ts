import type { CampaignCallerState, CampaignPublicMechanic, PublicCampaign } from '~/composables/useCampaignRuntime'
import { readCampaignApiErrorCode } from '~/composables/useCampaignRuntime'
import type { CampaignAttempt } from '~/composables/useCampaignMechanics'
import { createCampaignMechanicRequestKey } from '~/composables/useCampaignMechanics'

type WheelProps = {
  campaign: PublicCampaign
  mechanic: CampaignPublicMechanic
  state: CampaignCallerState
  refreshing: boolean
}

type WheelSegment = {
  key: string
  label: Partial<Record<'en' | 'fa', string>>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readSegments(mechanic: CampaignPublicMechanic): WheelSegment[] {
  const raw = mechanic.config.public.segments
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (!isObject(item) || typeof item.key !== 'string' || !isObject(item.label)) return []
    const key = item.key.trim()
    if (!key) return []
    const label: WheelSegment['label'] = {}
    if (typeof item.label.en === 'string' && item.label.en.trim()) label.en = item.label.en.trim()
    if (typeof item.label.fa === 'string' && item.label.fa.trim()) label.fa = item.label.fa.trim()
    return Object.keys(label).length ? [{ key, label }] : []
  })
}

export function useCampaignChanceWheel(
  props: WheelProps,
  activeLocale: () => 'en' | 'fa',
  refresh: () => void,
) {
  const { t } = useI18n()
  const api = useCampaignMechanics()
  const attempt = ref<CampaignAttempt | null>(null)
  const recovering = ref(false)
  const reserving = ref(false)
  const spinning = ref(false)
  const error = ref('')
  const recoveredParticipationId = ref('')
  const latestParticipationStatus = ref<string | null>(null)

  const participation = computed(() => props.state.participation)
  const mechanicState = computed(() => props.state.mechanics.find(item => item.mechanicId === props.mechanic.id) ?? null)
  const availability = computed(() => props.state.attemptAvailability.find(item => item.mechanicId === props.mechanic.id) ?? null)
  const participationStatus = computed(() => latestParticipationStatus.value ?? participation.value?.status ?? null)
  const participationOpen = computed(() => participationStatus.value === 'started' || participationStatus.value === 'in_progress')
  const progressOpen = computed(() => props.campaign.status === 'active' || (
    props.campaign.status === 'ended' && props.campaign.lifecycle.participationAfterEnd === 'allow_existing_only'
  ))
  const busy = computed(() => props.refreshing || recovering.value || reserving.value || spinning.value)

  const segments = computed(() => readSegments(props.mechanic))
  const possibleLabels = computed(() => segments.value.map((segment) => {
    const localized = segment.label[activeLocale()]
    if (localized) return localized
    const fallbackLocale = props.campaign.experience.defaultLocale ?? 'en'
    return segment.label[fallbackLocale] ?? segment.label.en ?? segment.label.fa ?? segment.key
  }))

  const remainingAttempts = computed(() => {
    const current = availability.value
    if (!current) return null
    if (!participationOpen.value) return 0
    const reported = Number(current.remainingAttempts ?? 0)
    const maxAttempts = Number(current.maxAttempts ?? 0)
    const attemptIndex = Number(attempt.value?.attemptIndex ?? 0)
    if (maxAttempts > 0 && attemptIndex > 0) {
      return Math.max(0, Math.min(reported, maxAttempts - attemptIndex))
    }
    return Math.max(0, reported)
  })

  const canSpin = computed(() => Boolean(
    participation.value &&
    participationOpen.value &&
    progressOpen.value &&
    availability.value?.available &&
    (remainingAttempts.value ?? 0) > 0 &&
    !busy.value
  ))

  const attemptOutcomeKey = computed(() => {
    const value = attempt.value?.outcome
    return isObject(value) && typeof value.key === 'string' && value.key.trim() ? value.key.trim() : null
  })

  const persistedOutcomeKey = computed(() => {
    const state = mechanicState.value?.state
    if (!isObject(state) || state.lastAction !== 'spin_requested') return null
    return typeof state.lastOutcome === 'string' && state.lastOutcome.trim() ? state.lastOutcome.trim() : null
  })

  const outcomeKey = computed(() => attemptOutcomeKey.value ?? persistedOutcomeKey.value)
  const outcomeLabel = computed(() => {
    const key = outcomeKey.value
    if (!key) return ''
    const segment = segments.value.find(item => item.key === key)
    if (!segment) return key
    const localized = segment.label[activeLocale()]
    if (localized) return localized
    const fallbackLocale = props.campaign.experience.defaultLocale ?? 'en'
    return segment.label[fallbackLocale] ?? segment.label.en ?? segment.label.fa ?? key
  })

  const storageKey = computed(() => `prompt-draft:campaign-wheel:attempt:v1:${props.campaign.slug}:${participation.value?.id ?? 'anonymous'}:${props.mechanic.id}`)

  function readKey() {
    if (!import.meta.client) return null
    try { return window.sessionStorage.getItem(storageKey.value)?.trim() || null } catch { return null }
  }

  function writeKey(value: string) {
    if (!import.meta.client) return
    try { window.sessionStorage.setItem(storageKey.value, value) } catch { /* recovery only */ }
  }

  function clearKey() {
    if (!import.meta.client) return
    try { window.sessionStorage.removeItem(storageKey.value) } catch { /* recovery only */ }
  }

  function mapError(value: unknown) {
    const code = readCampaignApiErrorCode(value)
    if (code === 'CAMPAIGN_ATTEMPT_LIMIT_REACHED') return t('campaign.wheel.limitReached')
    if (code === 'CAMPAIGN_NOT_ACTIVE' || code === 'CAMPAIGN_PARTICIPATION_CLOSED') return t('campaign.wheel.closed')
    if (code === 'CAMPAIGN_IDEMPOTENCY_CONFLICT') return t('campaign.wheel.conflict')
    if (['CAMPAIGN_ACTION_SCHEMA_INVALID', 'CAMPAIGN_ATTEMPT_INVALID', 'CAMPAIGN_ATTEMPT_STATE_INVALID'].includes(code ?? '')) return t('campaign.wheel.invalidAttempt')
    return t('campaign.wheel.error')
  }

  async function resolveReserved(current: CampaignAttempt) {
    if (current.status === 'resolved') {
      attempt.value = current
      clearKey()
      refresh()
      return
    }
    if (current.status !== 'reserved' || spinning.value) return

    spinning.value = true
    error.value = ''
    try {
      const response = await api.submitAction(props.campaign.slug, props.mechanic.id, 'spin_requested', {
        idempotencyKey: `campaign:wheel:spin:${current.id}`,
        payload: {},
        evidence: { attemptId: current.id },
      })
      attempt.value = response.result.attempt ?? current
      latestParticipationStatus.value = response.result.participation?.status ?? latestParticipationStatus.value
      if (attempt.value?.status === 'resolved') clearKey()
      refresh()
    } catch (value) {
      error.value = mapError(value)
      refresh()
    } finally {
      spinning.value = false
    }
  }

  async function reserveWithKey(key: string) {
    if (reserving.value) return
    reserving.value = true
    error.value = ''
    try {
      const response = await api.reserveAttempt(props.campaign.slug, props.mechanic.id, key)
      attempt.value = response.attempt
      refresh()
      await resolveReserved(response.attempt)
    } catch (value) {
      error.value = mapError(value)
      refresh()
    } finally {
      reserving.value = false
    }
  }

  async function spin() {
    if (!canSpin.value) return
    error.value = ''
    attempt.value = null
    const key = readKey() ?? createCampaignMechanicRequestKey(`wheel-attempt:${props.campaign.slug}:${props.mechanic.id}`)
    writeKey(key)
    await reserveWithKey(key)
  }

  async function recover() {
    if (!import.meta.client || !participation.value || recoveredParticipationId.value === participation.value.id) return
    recoveredParticipationId.value = participation.value.id
    const key = readKey()
    if (!key) return
    recovering.value = true
    try { await reserveWithKey(key) } finally { recovering.value = false }
  }

  watch(() => participation.value?.status, (status) => {
    latestParticipationStatus.value = status ?? null
  }, { immediate: true })
  watch(() => participation.value?.id, recover, { immediate: true })

  return {
    recovering,
    reserving,
    spinning,
    error,
    remainingAttempts,
    busy,
    canSpin,
    possibleLabels,
    outcomeLabel,
    spin,
  }
}
