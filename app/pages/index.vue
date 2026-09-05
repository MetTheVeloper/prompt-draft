<script setup lang="ts">
import HomeDiscoverySection from '~/components/home/HomeDiscoverySection.vue'
import {
  DISCOVERY_INTERESTS,
  type DiscoveryInterestDefinition,
} from '~/composables/useDiscoveryPreferences'
import type { HomeDiscoverySection as HomeDiscoverySectionData } from '~/composables/useHomeDiscovery'

const { t } = useI18n()
const screen = useScreen()
const offlinePackage = useOfflinePackage()
const auth = useAuth()
const discovery = useDiscoveryPreferences()
const preferencesModal = useDiscoveryPreferencesModal()
const homeDiscovery = useHomeDiscovery()

const heroSources = ref<string[]>([])
const sections = ref<HomeDiscoverySectionData[]>([])
const feedLoading = ref(true)
const feedError = ref(false)
const preferencesReady = ref(false)

const selectedInterestDefinitions = computed(() => {
  const selected = new Set(discovery.interests.value)
  return DISCOVERY_INTERESTS.filter(definition => selected.has(definition.key))
})

const orderedInterestDefinitions = computed<DiscoveryInterestDefinition[]>(() => {
  if (!auth.isLoggedIn.value || !discovery.interests.value.length) {
    return [...DISCOVERY_INTERESTS]
  }

  const selected = new Set(discovery.interests.value)
  return [
    ...DISCOVERY_INTERESTS.filter(definition => selected.has(definition.key)),
    ...DISCOVERY_INTERESTS.filter(definition => !selected.has(definition.key)),
  ]
})

const personalizedHeroTags = computed(() => {
  return Array.from(new Set(
    selectedInterestDefinitions.value.flatMap(definition => [...definition.tags]),
  ))
})

const heroRenderKey = computed(() => {
  return heroSources.value.length
    ? `personalized-${heroSources.value.join('|')}`
    : 'fallback-slider'
})

const gridColumns = computed(() => {
  if (screen.mobile.value) return 1
  if (screen.tablet.value || screen.laptop.value) return 2
  return 3
})

onMounted(async () => {
  await auth.initialize()

  if (auth.isLoggedIn.value) {
    try {
      await discovery.load(true)
      preferencesReady.value = true

      if (!discovery.interests.value.length) {
        openPreferencesModal()
      }
    } catch (error) {
      console.warn('[Prompt Draft] home preference load failed', error)
    }
  }

  await refreshHomeDiscovery()
})

function openPreferencesModal() {
  if (!auth.isLoggedIn.value) return

  preferencesModal.open({
    onSaved: async () => {
      preferencesReady.value = true
      await refreshHomeDiscovery()
    },
  })
}

async function refreshHomeDiscovery() {
  feedLoading.value = true
  feedError.value = false

  const definitions = orderedInterestDefinitions.value

  const [heroResult, sectionResult] = await Promise.allSettled([
    homeDiscovery.loadHeroSources(personalizedHeroTags.value, 50),
    homeDiscovery.loadSections(definitions),
  ])

  if (heroResult.status === 'fulfilled') {
    heroSources.value = heroResult.value
  } else {
    console.warn('[Prompt Draft] personalized hero media failed', heroResult.reason)
    heroSources.value = []
  }

  if (sectionResult.status === 'fulfilled') {
    sections.value = sectionResult.value
  } else {
    console.warn('[Prompt Draft] home showcase sections failed', sectionResult.reason)
    sections.value = []
    feedError.value = true
  }

  feedLoading.value = false
}

function scrollToFeed() {
  if (!import.meta.client) return
  document.querySelector('#home-discovery-feed')?.scrollIntoView({ behavior: 'smooth' })
}

function sectionGridSpan(index: number, total: number) {
  const columns = gridColumns.value

  if (columns === 1) return 6

  if (columns === 2) {
    if (index === total - 1 && total % 2 === 1) return 6
    return 3
  }

  const remainder = total % 3
  if (remainder === 1 && index === total - 1) return 6
  if (remainder === 2 && index >= total - 2) return 3
  return 2
}
</script>

<template>
  <div class="home-page w100">
    <section class="home-hero por ofh">
      <visual-tile
        :key="heroRenderKey"
        :count="94"
        :sources="heroSources.length ? heroSources : undefined"
        :interval="2400"
        :transition-duration="4200"
        extension="webp"
        :edge-blur="360"
        :z-index="1"
      />

      <div class="home-hero__veil pen" />
      <div class="home-hero__grain pen" />

      <el-flex
        rules="ccc"
        class="home-hero__content zi10 w100 h100 por"
        :gap="12"
        :p="screen.mobile.value ? 22 : 36">
        <el-text
          v-if="offlinePackage.state.isStandalone && !offlinePackage.state.online"
          type="span"
          :size="11"
          :weight="700"
          marker="orange40"
          class="tc">
          {{ t('pwa.offline.status.offlineMode') }}
        </el-text>

        <el-text :size="10" :weight="900" color="white" class="tc" style="opacity: .72">
          {{ t('growth.home.eyebrow') }}
        </el-text>

        <el-text
          type="h1"
          :size="screen.mobile.value ? 46 : screen.tablet.value ? 68 : 88"
          :weight="850"
          color="white"
          class="home-hero__title tc">
          {{ t('growth.home.title') }}
        </el-text>

        <el-text
          type="p"
          :size="screen.mobile.value ? 14 : 18"
          :weight="450"
          color="white"
          class="home-hero__description tc">
          {{ t('growth.home.description') }}
        </el-text>

        <el-flex rules="rcc" :gap="8" wrap class="home-hero__actions">
          <el-button
            color="white"
            text-color="normal"
            icon="explore"
            :label="t('growth.home.explore')"
            @click="scrollToFeed"
          />
          <el-button
            mode="flat"
            color="white"
            text-color="white"
            icon-color="white"
            icon="auto_fix_high"
            :label="t('growth.home.create')"
            to="/create"
          />
          <el-button
            v-if="auth.isLoggedIn.value && preferencesReady"
            mode="flat"
            color="white"
            text-color="white"
            icon-color="white"
            icon="tune"
            :label="t('growth.home.editInterests')"
            @click="openPreferencesModal"
          />
        </el-flex>
      </el-flex>

      <button type="button" class="home-hero__scroll" @click="scrollToFeed">
        <span>{{ t('growth.home.scroll') }}</span>
        <el-icon icon="keyboard_arrow_down" :size="18" color="white" />
      </button>
    </section>

    <section id="home-discovery-feed" class="home-feed por">
      <el-flex
        v-if="feedLoading"
        rules="ccc"
        class="home-feed__state w100"
        :gap="10"
        bg="surface10">
        <el-icon icon="refresh" :size="28" color="prim" />
        <el-text :size="13" color="normal55">
          {{ t('growth.home.loadingSections') }}
        </el-text>
      </el-flex>

      <el-flex
        v-else-if="feedError || !sections.length"
        rules="ccc"
        class="home-feed__state w100"
        :gap="12"
        :p="32"
        bg="surface10">
        <el-icon icon="explore" :size="34" color="prim" />
        <el-text :size="13" color="normal55" class="tc" style="max-width: 560px">
          {{ t('growth.home.loadError') }}
        </el-text>
        <el-button to="/prompts" color="prim" icon="explore" :label="t('growth.home.explore')" />
      </el-flex>

      <div v-else class="home-feed__grid">
        <HomeDiscoverySection
          v-for="(section, index) in sections"
          :key="section.key"
          :definition="section.definition"
          :items="section.items"
          :style="{ gridColumn: `span ${sectionGridSpan(index, sections.length)}` }"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  background: var(--themeBackground);
}

.home-hero {
  height: 100vh;
  min-height: 640px;
  isolation: isolate;
  background: #09090d;
}

.home-hero :deep(.canvas-tiled-slider-bg) {
  position: absolute;
  inset: 0;
}

.home-hero__veil,
.home-hero__grain {
  position: absolute;
  inset: 0;
}

.home-hero__veil {
  z-index: 3;
  background:
    radial-gradient(circle at 50% 42%, rgba(0, 0, 0, .08), rgba(0, 0, 0, .35) 56%, rgba(0, 0, 0, .62) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .42));
}

.home-hero__grain {
  z-index: 4;
  opacity: .08;
  background-image: repeating-radial-gradient(circle at 0 0, rgba(255,255,255,.3) 0, rgba(255,255,255,.3) .5px, transparent .6px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.home-hero__content {
  z-index: 8;
}

.home-hero__title {
  max-width: 1040px;
  line-height: .92 !important;
  letter-spacing: -.055em;
  text-wrap: balance;
  text-shadow: 0 10px 42px rgba(0, 0, 0, .5);
}

.home-hero__description {
  max-width: 680px;
  line-height: 1.5 !important;
  opacity: .86;
  text-shadow: 0 4px 22px rgba(0, 0, 0, .55);
}

.home-hero__actions {
  margin-top: 8px;
}

.home-hero__scroll {
  position: absolute;
  z-index: 10;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 0;
  border-radius: 100px;
  background: rgba(0, 0, 0, .24);
  backdrop-filter: blur(12px);
  color: white;
  font: inherit;
  font-size: 10px;
  font-weight: 750;
  cursor: pointer;
  opacity: .8;
  transition: opacity 180ms ease, transform 180ms ease;
}

.home-hero__scroll:hover {
  opacity: 1;
  transform: translate(-50%, -2px);
}

.home-feed {
  z-index: 20;
  min-height: 100vh;
  background: var(--themeBackground);
}

.home-feed__state {
  min-height: 100vh;
}

.home-feed__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-auto-rows: 100vh;
  width: 100%;
}

@media (max-width: 819px) {
  .home-hero {
    min-height: 100svh;
    height: 100svh;
  }

  .home-feed__grid {
    grid-auto-rows: 100svh;
  }
}
</style>
