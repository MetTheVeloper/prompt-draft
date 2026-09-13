<script setup lang="ts">
import CampaignDefaultExperience from '~/components/campaign/DefaultExperience.vue'
import type {
  CampaignCallerState,
  CampaignLocale,
  CampaignViewer,
} from '~/composables/useCampaignRuntime'
import {
  readCampaignApiErrorCode,
  readCampaignApiStatus,
} from '~/composables/useCampaignRuntime'

const CAMPAIGN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function readRouteSlug(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const slug = raw.trim().toLowerCase()
  return CAMPAIGN_SLUG_PATTERN.test(slug) && slug.length <= 100 ? slug : null
}

function safeCanonicalPath(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const path = value.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  return path.split(/[?#]/, 1)[0] || fallback
}

definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
const campaignApi = useCampaignRuntime()
const promotions = useCampaignPromotions()

const slug = readRouteSlug(route.params.slug)
if (!slug) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })

const { data: runtime } = await useAsyncData(`public-campaign:${slug}`, async () => {
  try {
    return await campaignApi.loadPublic(slug)
  } catch (error) {
    if (readCampaignApiStatus(error) === 404) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
    console.error('[Prompt Draft] public Campaign SSR fetch failed', error)
    throw createError({ statusCode: 502, statusMessage: 'Campaign is temporarily unavailable' })
  }
})

if (!runtime.value) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })

const campaign = computed(() => runtime.value!.campaign)
const customGames = computed(() => campaign.value.mechanics.filter(mechanic => mechanic.type === 'custom_game' && mechanic.attemptPolicy))
const activeLocale = computed<CampaignLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const localeAvailable = computed(() => campaign.value.experience.locales.includes(activeLocale.value) && Boolean(campaign.value.experience.content[activeLocale.value]?.title))

if (!localeAvailable.value) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
watch(activeLocale, () => {
  if (!localeAvailable.value) showError(createError({ statusCode: 404, statusMessage: 'Campaign not found' }))
})

const localizedContent = computed(() => campaign.value.experience.content[activeLocale.value]!)
const canonicalPath = computed(() => safeCanonicalPath(campaign.value.experience.seo?.canonicalPath, `/campaign/${slug}`))
const alternateLocales = computed(() => campaign.value.experience.locales)

usePublicSeo({
  title: computed(() => localizedContent.value.title),
  description: computed(() => localizedContent.value.description || localizedContent.value.subtitle || ''),
  canonicalPath,
  alternateLocales,
  noindex: computed(() => campaign.value.experience.seo?.indexing !== 'index'),
})

const callerState = ref<CampaignCallerState | null>(null)
const authReady = ref(false)
const refreshingState = ref(false)
const starting = ref(false)
const actionError = ref('')

const viewer = computed<CampaignViewer>(() => {
  if (callerState.value) {
    return {
      authenticated: true,
      eligibility: callerState.value.eligibility,
      participation: callerState.value.participation,
      effects: callerState.value.effects,
      ...(callerState.value.economy !== undefined ? { economy: callerState.value.economy } : {}),
    }
  }
  return {
    ...runtime.value!.viewer,
    authenticated: authReady.value ? auth.isLoggedIn.value : runtime.value!.viewer.authenticated,
  }
})

const rendererComponent = computed(() => {
  const renderer = campaign.value.experience.renderer
  return renderer?.kind === 'builtin' && renderer.key === 'campaign-default-v1' ? CampaignDefaultExperience : null
})

async function refreshCallerState() {
  if (!import.meta.client || !auth.isLoggedIn.value) {
    callerState.value = null
    return
  }
  refreshingState.value = true
  try {
    callerState.value = await campaignApi.loadState(slug)
  } catch (error) {
    console.warn('[Prompt Draft] Campaign caller state load failed', error)
  } finally {
    refreshingState.value = false
  }
}

async function signIn() {
  await navigateTo(localePath({ path: '/login', query: { next: route.fullPath } }))
}

async function startParticipation() {
  actionError.value = ''
  if (!auth.isLoggedIn.value) {
    await signIn()
    return
  }
  if (starting.value) return
  starting.value = true
  try {
    const attribution = promotions.readPendingCampaignAttribution(slug)
    await campaignApi.startParticipation(slug, attribution ?? {})
    promotions.readPendingCampaignAttribution(slug, { consume: true })
    await refreshCallerState()
  } catch (error) {
    const code = readCampaignApiErrorCode(error)
    if (code === 'CAMPAIGN_NOT_ELIGIBLE') actionError.value = t('campaign.participation.notEligible')
    else if (code === 'CAMPAIGN_NOT_ACTIVE' || code === 'CAMPAIGN_PARTICIPATION_CLOSED') actionError.value = t('campaign.participation.closed')
    else actionError.value = t('campaign.participation.error')
  } finally {
    starting.value = false
  }
}

onMounted(async () => {
  await auth.initialize()
  authReady.value = true
  if (auth.isLoggedIn.value) await refreshCallerState()
})
</script>

<template>
  <main class="campaign-public-page w100">
    <el-flex rules="csc" :gap="18" :p="[32, 16]" class="campaign-public-shell w100">
      <component
        :is="rendererComponent"
        v-if="rendererComponent"
        :campaign="campaign"
        :content="localizedContent"
        :viewer="viewer"
        :state="callerState"
        :refreshing="!authReady || refreshingState"
        :starting="starting"
        :action-error="actionError"
        @login="signIn"
        @start="startParticipation"
      />

      <CampaignCustomGame
        v-for="mechanic in customGames"
        v-if="callerState?.participation"
        :key="mechanic.id"
        :campaign="campaign"
        :mechanic="mechanic"
        :state="callerState"
        :refreshing="refreshingState"
        @refresh="refreshCallerState"
      />

      <el-flex v-if="!rendererComponent" rules="csc" :gap="8" :p="16" :radius="14" :br="1" bc="normal15" bg="surface" class="w100">
        <el-text color="red" :size="13" :weight="700">{{ t('campaign.rendererUnavailable') }}</el-text>
      </el-flex>
    </el-flex>
  </main>
</template>

<style scoped>
.campaign-public-page { min-height: 100%; }
.campaign-public-shell { max-width: 920px; margin-inline: auto; }
</style>
