export type DiscoveryInterestKey =
  | 'portrait_photography'
  | 'three_d_sculpture'
  | 'illustration_animation'
  | 'poster_editorial'
  | 'product_fashion'
  | 'cinematic_game_art'

export type DiscoveryInterestDefinition = {
  key: DiscoveryInterestKey
  tags: readonly string[]
  icon: string
  messageKey: string
  descriptionKey: string
}

export const DISCOVERY_INTERESTS: readonly DiscoveryInterestDefinition[] = [
  {
    key: 'portrait_photography',
    tags: ['portrait', 'photography', 'avatar'],
    icon: 'portrait',
    messageKey: 'growth.discovery.interests.portraitPhotography.title',
    descriptionKey: 'growth.discovery.interests.portraitPhotography.description',
  },
  {
    key: 'three_d_sculpture',
    tags: ['3d', 'sculpture'],
    icon: 'deployed_code',
    messageKey: 'growth.discovery.interests.threeDSculpture.title',
    descriptionKey: 'growth.discovery.interests.threeDSculpture.description',
  },
  {
    key: 'illustration_animation',
    tags: ['illustration', 'animation-style', 'anime', 'cartoon'],
    icon: 'brush',
    messageKey: 'growth.discovery.interests.illustrationAnimation.title',
    descriptionKey: 'growth.discovery.interests.illustrationAnimation.description',
  },
  {
    key: 'poster_editorial',
    tags: ['poster', 'editorial'],
    icon: 'view_quilt',
    messageKey: 'growth.discovery.interests.posterEditorial.title',
    descriptionKey: 'growth.discovery.interests.posterEditorial.description',
  },
  {
    key: 'product_fashion',
    tags: ['product', 'fashion'],
    icon: 'styler',
    messageKey: 'growth.discovery.interests.productFashion.title',
    descriptionKey: 'growth.discovery.interests.productFashion.description',
  },
  {
    key: 'cinematic_game_art',
    tags: ['cinematic', 'game-style', 'pixel-art'],
    icon: 'movie',
    messageKey: 'growth.discovery.interests.cinematicGameArt.title',
    descriptionKey: 'growth.discovery.interests.cinematicGameArt.description',
  },
] as const

const INTEREST_KEYS = new Set<DiscoveryInterestKey>(
  DISCOVERY_INTERESTS.map(interest => interest.key),
)

const state = reactive({
  loadedForUserId: null as string | null,
  loading: false,
  saving: false,
  interests: [] as DiscoveryInterestKey[],
  updatedAt: null as string | null,
})

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function normalizeInterests(value: unknown): DiscoveryInterestKey[] {
  if (!Array.isArray(value)) return []

  const result: DiscoveryInterestKey[] = []
  const seen = new Set<DiscoveryInterestKey>()

  for (const rawInterest of value) {
    if (typeof rawInterest !== 'string') continue
    const interest = rawInterest as DiscoveryInterestKey
    if (!INTEREST_KEYS.has(interest) || seen.has(interest)) continue
    seen.add(interest)
    result.push(interest)
  }

  return result
}

type DiscoveryPreferencesResponse = {
  ok: true
  preferences: {
    interests: DiscoveryInterestKey[]
    updatedAt: string | null
  }
}

export function useDiscoveryPreferences() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function reset() {
    state.loadedForUserId = null
    state.interests = []
    state.updatedAt = null
    state.loading = false
    state.saving = false
  }

  async function load(force = false) {
    if (!import.meta.client) return [] as DiscoveryInterestKey[]

    await auth.initialize()

    const userId = auth.user.value?.id ?? null
    if (!auth.isLoggedIn.value || !userId) {
      reset()
      return []
    }

    if (!force && state.loadedForUserId === userId) {
      return [...state.interests]
    }

    state.loading = true

    try {
      const response = await $fetch<DiscoveryPreferencesResponse>(
        endpoint('/api/preferences/discovery'),
        {
          headers: auth.authHeaders(),
        },
      )

      if (auth.user.value?.id !== userId) {
        return []
      }

      state.loadedForUserId = userId
      state.interests = normalizeInterests(response.preferences?.interests)
      state.updatedAt = response.preferences?.updatedAt ?? null
      return [...state.interests]
    } finally {
      state.loading = false
    }
  }

  async function save(interests: DiscoveryInterestKey[]) {
    if (!import.meta.client) return [] as DiscoveryInterestKey[]

    await auth.initialize()

    const userId = auth.user.value?.id ?? null
    if (!auth.isLoggedIn.value || !userId) {
      throw new Error('Authentication required')
    }

    const normalized = normalizeInterests(interests)
    if (normalized.length !== interests.length) {
      throw new Error('Invalid discovery interests')
    }

    state.saving = true

    try {
      const response = await $fetch<DiscoveryPreferencesResponse>(
        endpoint('/api/preferences/discovery'),
        {
          method: 'PUT',
          headers: auth.authHeaders(),
          body: { interests: normalized },
        },
      )

      if (auth.user.value?.id !== userId) {
        return []
      }

      state.loadedForUserId = userId
      state.interests = normalizeInterests(response.preferences?.interests)
      state.updatedAt = response.preferences?.updatedAt ?? null
      return [...state.interests]
    } finally {
      state.saving = false
    }
  }

  return {
    interests: computed(() => state.interests),
    updatedAt: computed(() => state.updatedAt),
    loading: computed(() => state.loading),
    saving: computed(() => state.saving),
    loadedForUserId: computed(() => state.loadedForUserId),
    load,
    save,
    reset,
  }
}
