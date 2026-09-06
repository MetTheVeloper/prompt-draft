import type { EconomyState } from "~/types/economy";

interface PromptArchiveUnlockRecord {
  id: string
  resourceType: string
  resourceId: string
  economyEventId: string | null
  priceGoin: number
  pricingRuleVersion: number
  metadata: Record<string, unknown>
  unlockedAt: string
}

interface PromptArchiveUnlockPolicy {
  costGoin: number
  ruleVersion: number
}

interface PromptArchiveUnlockStateResponse {
  ok: true
  resource: {
    type: string
    id: string
    publicId: number
  }
  unlocked: boolean
  unlock: PromptArchiveUnlockRecord | null
  policy: PromptArchiveUnlockPolicy
  economy: EconomyState
  canAfford: boolean
}

interface PromptArchiveUnlockMutationResponse {
  ok: true
  newlyUnlocked: boolean
  alreadyUnlocked: boolean
  chargedGoin: number
  unlock: PromptArchiveUnlockRecord
  economy: EconomyState
}

export interface PromptArchiveUnlockFailure {
  code: string | null
  message: string
  status: number | null
  balance: number | null
  required: number | null
}

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function normalizeFailure(error: any): PromptArchiveUnlockFailure {
  const data = error?.data ?? error?.response?._data ?? null
  const status = Number(error?.statusCode ?? error?.response?.status ?? 0) || null
  const balance = Number(data?.balance)
  const required = Number(data?.required)

  return {
    code: typeof data?.code === 'string' ? data.code : null,
    message:
      typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Failed to process Prompt Archive unlock',
    status,
    balance: Number.isFinite(balance) ? balance : null,
    required: Number.isFinite(required) ? required : null,
  }
}

export function usePromptArchiveUnlock() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const accountEconomy = useEconomy()
  const apiBase = normalizeApiBase(config.public.apiBase)

  const state = ref<PromptArchiveUnlockStateResponse | null>(null)
  const loading = ref(false)
  const pending = ref(false)
  const failure = ref<PromptArchiveUnlockFailure | null>(null)

  let loadVersion = 0

  function endpoint(publicId: number) {
    return `${apiBase}/api/economy/unlocks/prompt-archive/${publicId}`
  }

  function reset() {
    loadVersion += 1
    state.value = null
    loading.value = false
    pending.value = false
    failure.value = null
  }

  async function load(publicId: number) {
    if (!import.meta.client || !Number.isSafeInteger(publicId) || publicId <= 0) {
      return null
    }

    const version = ++loadVersion
    loading.value = true
    failure.value = null

    try {
      const response = await $fetch<PromptArchiveUnlockStateResponse>(endpoint(publicId), {
        headers: auth.authHeaders(),
      })

      accountEconomy.applyEconomy(response.economy)
      if (version === loadVersion) state.value = response
      return response
    } catch (error) {
      const normalized = normalizeFailure(error)
      if (version === loadVersion) {
        state.value = null
        failure.value = normalized
      }
      return null
    } finally {
      if (version === loadVersion) loading.value = false
    }
  }

  async function unlock(publicId: number) {
    if (!import.meta.client || !Number.isSafeInteger(publicId) || publicId <= 0) {
      return null
    }

    if (pending.value) return null

    pending.value = true
    failure.value = null

    try {
      const response = await $fetch<PromptArchiveUnlockMutationResponse>(endpoint(publicId), {
        method: 'POST',
        headers: auth.authHeaders(),
      })

      accountEconomy.applyEconomy(response.economy)

      const previous = state.value
      state.value = {
        ok: true,
        resource: previous?.resource ?? {
          type: 'prompt_archive_item',
          id: String(publicId),
          publicId,
        },
        unlocked: true,
        unlock: response.unlock,
        policy: previous?.policy ?? {
          costGoin: response.unlock.priceGoin,
          ruleVersion: response.unlock.pricingRuleVersion,
        },
        economy: response.economy,
        canAfford: true,
      }

      return response
    } catch (error) {
      failure.value = normalizeFailure(error)
      return null
    } finally {
      pending.value = false
    }
  }

  return {
    state: readonly(state),
    loading: readonly(loading),
    pending: readonly(pending),
    failure: readonly(failure),
    unlocked: computed(() => Boolean(state.value?.unlocked)),
    unlockRecord: computed(() => state.value?.unlock ?? null),
    policy: computed(() => state.value?.policy ?? null),
    economy: computed(() => state.value?.economy ?? null),
    canAfford: computed(() => state.value?.canAfford ?? null),
    load,
    unlock,
    reset,
  }
}
