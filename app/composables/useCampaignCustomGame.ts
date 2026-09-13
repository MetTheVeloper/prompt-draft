import type { CampaignCallerState, CampaignPublicMechanic, PublicCampaign } from '~/composables/useCampaignRuntime'
import { readCampaignApiErrorCode } from '~/composables/useCampaignRuntime'
import type { CampaignAttempt } from '~/composables/useCampaignMechanics'
import { createCampaignMechanicRequestKey } from '~/composables/useCampaignMechanics'

type GameProps = {
  campaign: PublicCampaign
  mechanic: CampaignPublicMechanic
  state: CampaignCallerState
  refreshing: boolean
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function useCampaignCustomGame(
  props: GameProps,
  activeLocale: () => 'en' | 'fa',
  refresh: () => void,
) {
  const { t } = useI18n()
  const api = useCampaignMechanics()
  const attempt = ref<CampaignAttempt | null>(null)
  const answer = ref('')
  const submittedAnswer = ref<string | null>(null)
  const recovering = ref(false)
  const reserving = ref(false)
  const starting = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const recoveredParticipationId = ref('')
  const latestParticipationStatus = ref<string | null>(null)

  const participation = computed(() => props.state.participation)
  const availability = computed(() => props.state.attemptAvailability.find(item => item.mechanicId === props.mechanic.id) ?? null)
  const participationStatus = computed(() => latestParticipationStatus.value ?? participation.value?.status ?? null)
  const participationOpen = computed(() => participationStatus.value === 'started' || participationStatus.value === 'in_progress')
  const progressOpen = computed(() => props.campaign.status === 'active' || (
    props.campaign.status === 'ended' && props.campaign.lifecycle.participationAfterEnd === 'allow_existing_only'
  ))
  const busy = computed(() => recovering.value || reserving.value || starting.value || submitting.value)
  const canReserve = computed(() => Boolean(participation.value && participationOpen.value && progressOpen.value && availability.value?.available && !busy.value))
  const answerValid = computed(() => answer.value.trim().length > 0 && answer.value.trim().length <= 240)
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

  const challengePrompt = computed(() => {
    const context = attempt.value?.publicContext
    if (!isObject(context) || context.kind !== 'exact_answer_v1' || !isObject(context.challenge)) return ''
    const prompts = context.challenge.prompt
    if (!isObject(prompts)) return ''
    const localized = prompts[activeLocale()]
    if (typeof localized === 'string' && localized.trim()) return localized.trim()
    const fallback = props.campaign.experience.defaultLocale ? prompts[props.campaign.experience.defaultLocale] : null
    return typeof fallback === 'string' ? fallback.trim() : ''
  })

  const outcome = computed<'win' | 'lose' | null>(() => {
    const value = attempt.value?.outcome
    if (!isObject(value)) return null
    return value.key === 'win' || value.key === 'lose' ? value.key : null
  })

  const canTryAgain = computed(() => {
    if (!attempt.value || attempt.value.status !== 'resolved' || !participationOpen.value || !availability.value?.available || !progressOpen.value) return false
    return Number(availability.value.usedAttempts ?? -1) >= attempt.value.attemptIndex
  })

  const storageKey = computed(() => `prompt-draft:campaign-game:attempt:v1:${props.campaign.slug}:${participation.value?.id ?? 'anonymous'}:${props.mechanic.id}`)
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
    if (code === 'CAMPAIGN_ATTEMPT_LIMIT_REACHED') return t('campaign.game.limitReached')
    if (code === 'CAMPAIGN_NOT_ACTIVE' || code === 'CAMPAIGN_PARTICIPATION_CLOSED') return t('campaign.game.closed')
    if (code === 'CAMPAIGN_IDEMPOTENCY_CONFLICT') return t('campaign.game.conflict')
    if (['CAMPAIGN_ACTION_SCHEMA_INVALID', 'CAMPAIGN_ATTEMPT_INVALID', 'CAMPAIGN_ATTEMPT_STATE_INVALID'].includes(code ?? '')) return t('campaign.game.invalidAttempt')
    return t('campaign.game.error')
  }

  async function startReserved(current: CampaignAttempt) {
    if (current.status !== 'reserved' || starting.value) return
    starting.value = true
    error.value = ''
    try {
      const response = await api.submitAction(props.campaign.slug, props.mechanic.id, 'attempt_started', {
        idempotencyKey: `campaign:game:start:${current.id}`,
        payload: {}, evidence: { attemptId: current.id },
      })
      attempt.value = response.result.attempt ?? current
      latestParticipationStatus.value = response.result.participation?.status ?? latestParticipationStatus.value
    } catch (value) { error.value = mapError(value) } finally { starting.value = false }
  }

  async function reserveWithKey(key: string) {
    if (reserving.value) return
    reserving.value = true
    error.value = ''
    try {
      const response = await api.reserveAttempt(props.campaign.slug, props.mechanic.id, key)
      attempt.value = response.attempt
      refresh()
      if (response.attempt.status === 'reserved') await startReserved(response.attempt)
      else if (response.attempt.status === 'resolved') clearKey()
    } catch (value) { error.value = mapError(value) } finally { reserving.value = false }
  }

  async function begin() {
    if (!canReserve.value) return
    answer.value = ''
    submittedAnswer.value = null
    attempt.value = null
    error.value = ''
    const key = readKey() ?? createCampaignMechanicRequestKey(`game-attempt:${props.campaign.slug}:${props.mechanic.id}`)
    writeKey(key)
    await reserveWithKey(key)
  }

  async function retryStart() {
    if (attempt.value?.status === 'reserved') await startReserved(attempt.value)
  }

  async function submit() {
    if (!attempt.value || attempt.value.status !== 'started' || submitting.value) return
    if (!submittedAnswer.value && !answerValid.value) { error.value = t('campaign.game.answerRequired'); return }
    const snapshot = submittedAnswer.value ?? answer.value
    submittedAnswer.value = snapshot
    submitting.value = true
    error.value = ''
    try {
      const response = await api.submitAction(props.campaign.slug, props.mechanic.id, 'game_finished', {
        idempotencyKey: `campaign:game:finish:${attempt.value.id}`,
        payload: { answer: snapshot }, evidence: { attemptId: attempt.value.id },
      })
      if (response.result.attempt) attempt.value = response.result.attempt
      latestParticipationStatus.value = response.result.participation?.status ?? latestParticipationStatus.value
      if (attempt.value?.status === 'resolved') clearKey()
      refresh()
    } catch (value) { error.value = mapError(value) } finally { submitting.value = false }
  }

  async function tryAgain() {
    if (!canTryAgain.value) return
    attempt.value = null
    answer.value = ''
    submittedAnswer.value = null
    error.value = ''
    await begin()
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
    attempt, answer, submittedAnswer, recovering, reserving, starting, submitting, error,
    availability, remainingAttempts, participationOpen, progressOpen, busy, canReserve, answerValid,
    challengePrompt, outcome, canTryAgain,
    begin, retryStart, submit, tryAgain,
  }
}
