<script setup lang="ts">
import PublicDiscoveryCard from '~/components/discover/PublicDiscoveryCard.vue'
import { DISCOVERY_INTERESTS } from '~/composables/useDiscoveryPreferences'
import type { HomeShowcaseItem } from '~/composables/useHomeDiscovery'

const route = useRoute()
const { t } = useI18n()
const { mobile, tablet } = useScreen()
const publicDiscovery = usePublicDiscovery()

const items = ref<HomeShowcaseItem[]>([])
const loading = ref(true)
const failed = ref(false)

const slug = computed(() => {
  return typeof route.params.slug === 'string' ? route.params.slug.trim().toLowerCase() : ''
})

const definition = computed(() => {
  return DISCOVERY_INTERESTS.find(item => item.slug === slug.value) ?? null
})

const categoryTitle = computed(() => {
  return definition.value ? t(definition.value.messageKey) : t('growth.publicDiscovery.notFoundTitle')
})

const categoryDescription = computed(() => {
  return definition.value
    ? t(definition.value.descriptionKey)
    : t('growth.publicDiscovery.notFoundDescription')
})

const archiveUrl = computed(() => {
  if (!definition.value) return '/prompts'
  const params = new URLSearchParams()
  for (const tag of definition.value.tags) params.append('tag', tag)
  return `/prompts?${params.toString()}`
})

const gridColumns = computed(() => {
  if (mobile.value) return 1
  if (tablet.value) return 2
  return 3
})

const relatedDefinitions = computed(() => {
  if (!definition.value) return DISCOVERY_INTERESTS
  return DISCOVERY_INTERESTS.filter(item => item.key !== definition.value?.key)
})

usePublicSeo({
  title: categoryTitle.value,
  description: categoryDescription.value,
  canonicalPath: `/discover/${slug.value}`,
})

onMounted(async () => {
  if (!definition.value) {
    loading.value = false
    return
  }

  try {
    items.value = await publicDiscovery.load(definition.value.tags, 18)
  } catch (error) {
    console.warn('[Prompt Draft] public discovery page failed', error)
    failed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="public-discovery-page w100">
    <section class="public-discovery-page__hero por ofh">
      <img
        v-if="items[0]?.coverImage?.fullUrl || items[0]?.coverImage?.thumbnailUrl"
        :src="items[0]?.coverImage?.fullUrl || items[0]?.coverImage?.thumbnailUrl || ''"
        alt=""
        class="public-discovery-page__hero-image pen"
      >
      <div class="public-discovery-page__hero-fallback pen" />
      <div class="public-discovery-page__hero-shade pen" />

      <el-flex
        rules="cbs"
        class="public-discovery-page__hero-content w100 h100 por zi10"
        :gap="18"
        :p="mobile ? 22 : 40">
        <el-flex rules="csc" class="w100" :gap="8">
          <el-text :size="10" :weight="900" color="prim" class="w100">
            {{ t('growth.publicDiscovery.eyebrow') }}
          </el-text>
          <el-text
            type="h1"
            :size="mobile ? 42 : tablet ? 58 : 76"
            :weight="850"
            class="public-discovery-page__title w100">
            {{ categoryTitle }}
          </el-text>
          <el-text
            :size="mobile ? 14 : 17"
            color="normal70"
            class="public-discovery-page__description w100">
            {{ categoryDescription }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" class="w100 fw" :gap="8" wrap>
          <el-button
            v-if="definition"
            color="normal"
            icon="explore"
            :label="t('growth.publicDiscovery.openArchive')"
            :to="archiveUrl"
          />
          <el-button
            mode="flat"
            color="normal"
            icon="home"
            :label="t('growth.publicDiscovery.backHome')"
            to="/"
          />
        </el-flex>
      </el-flex>
    </section>

    <section class="public-discovery-page__body">
      <el-flex
        v-if="loading"
        rules="ccc"
        class="public-discovery-page__state w100"
        :gap="10">
        <el-icon icon="refresh" :size="28" color="prim" />
        <el-text :size="13" color="normal55">
          {{ t('growth.publicDiscovery.loading') }}
        </el-text>
      </el-flex>

      <el-flex
        v-else-if="!definition"
        rules="ccc"
        class="public-discovery-page__state w100"
        :gap="12"
        :p="32">
        <el-icon icon="search_off" :size="38" color="normal45" />
        <el-text type="h2" :size="26" :weight="800">
          {{ t('growth.publicDiscovery.notFoundTitle') }}
        </el-text>
        <el-text :size="13" color="normal55" class="tc">
          {{ t('growth.publicDiscovery.notFoundDescription') }}
        </el-text>
        <el-button color="normal" to="/" :label="t('growth.publicDiscovery.backHome')" />
      </el-flex>

      <el-flex
        v-else-if="failed"
        rules="ccc"
        class="public-discovery-page__state w100"
        :gap="12"
        :p="32">
        <el-icon icon="error" :size="34" color="red" />
        <el-text :size="13" color="normal55" class="tc">
          {{ t('growth.publicDiscovery.error') }}
        </el-text>
        <el-button color="normal" :to="archiveUrl" :label="t('growth.publicDiscovery.openArchive')" />
      </el-flex>

      <template v-else>
        <el-flex rules="csc" class="public-discovery-page__collection w100" :gap="18">
          <el-flex rules="rbc" class="w100" :gap="12" wrap>
            <el-flex rules="csc" :gap="4" class="fg100">
              <el-text :size="10" :weight="900" color="prim">
                {{ t('growth.publicDiscovery.collectionEyebrow') }}
              </el-text>
              <el-text type="h2" :size="mobile ? 26 : 34" :weight="820">
                {{ t('growth.publicDiscovery.collectionTitle', { category: categoryTitle }) }}
              </el-text>
            </el-flex>
            <el-button
              mode="flat"
              color="normal"
              icon="arrow_forward"
              :label="t('growth.publicDiscovery.openArchive')"
              :to="archiveUrl"
            />
          </el-flex>

          <div
            v-if="items.length"
            class="public-discovery-page__grid w100"
            :style="{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }">
            <PublicDiscoveryCard
              v-for="item in items"
              :key="item.id"
              :item="item"
            />
          </div>

          <el-flex v-else rules="ccc" class="w100" :gap="8" :p="40">
            <el-icon icon="collections" :size="30" color="normal40" />
            <el-text :size="13" color="normal55">
              {{ t('growth.publicDiscovery.empty') }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-flex rules="csc" class="public-discovery-page__related w100" :gap="14">
          <el-text type="h2" :size="mobile ? 24 : 30" :weight="800">
            {{ t('growth.publicDiscovery.related') }}
          </el-text>
          <el-flex rules="rsc" class="w100 fw" :gap="8" wrap>
            <el-button
              v-for="related in relatedDefinitions"
              :key="related.key"
              mode="flat"
              color="normal"
              :icon="related.icon"
              :label="t(related.messageKey)"
              :to="`/discover/${related.slug}`"
            />
          </el-flex>
        </el-flex>
      </template>
    </section>
  </main>
</template>

<style scoped>
.public-discovery-page {
  min-height: 100%;
  background: var(--themeBackground);
}

.public-discovery-page__hero {
  min-height: min(72vh, 720px);
  isolation: isolate;
  background: var(--themeSurface);
}

.public-discovery-page__hero-image,
.public-discovery-page__hero-fallback,
.public-discovery-page__hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.public-discovery-page__hero-image {
  z-index: 0;
  object-fit: cover;
  opacity: .36;
  filter: saturate(.85);
}

.public-discovery-page__hero-fallback {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 22%, var(--primary20), transparent 42%),
    radial-gradient(circle at 82% 68%, var(--themeBlue15), transparent 46%),
    var(--themeSurface);
}

.public-discovery-page__hero-shade {
  z-index: 2;
  background:
    radial-gradient(circle at 48% 48%, var(--themeSurface55), var(--themeSurface20) 62%, var(--themeSurface5) 100%),
    linear-gradient(180deg, var(--themeSurface5), var(--themeBackground));
}

.public-discovery-page__hero-content {
  max-width: 1280px;
  margin: 0 auto;
}

.public-discovery-page__title {
  max-width: 980px;
  line-height: .96 !important;
  letter-spacing: -.045em;
  text-wrap: balance;
}

.public-discovery-page__description {
  max-width: 760px;
  line-height: 1.6 !important;
}

.public-discovery-page__body {
  width: 100%;
}

.public-discovery-page__state {
  min-height: 52vh;
}

.public-discovery-page__collection,
.public-discovery-page__related {
  max-width: 1500px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 56px);
}

.public-discovery-page__grid {
  display: grid;
  gap: 12px;
}

.public-discovery-page__related {
  border-top: 1px solid var(--normalText10);
}
</style>
