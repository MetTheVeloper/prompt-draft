<script setup lang="ts">
import type {
  PromptArchiveDetailItem,
  PromptArchiveListItem,
  PromptArchiveListQuery,
  PromptArchiveModel,
} from '~/types/promptArchive'

const route = useRoute()
const { t, locale } = useI18n()
const { mobile, tablet, mini } = useScreen()
const auth = useAuth()
const archive = usePromptArchive()

const searchQuery = ref('')
const modelFilter = ref<'all' | PromptArchiveModel>('all')
const tagFilter = ref(normalizeRouteTag(route.query.tag))
const sortMode = ref<'newest' | 'oldest'>('newest')
const viewMode = ref<'grid' | 'list'>('grid')
const ambientBackground = ref('')
const previousAmbientBackground = ref('')

let filterTimer: ReturnType<typeof setTimeout> | undefined
let ambientSwapTimer: ReturnType<typeof setTimeout> | undefined
let ambientPreloadVersion = 0

const hasDetailQuery = computed(() => {
  return typeof route.query.id === 'string' && route.query.id.trim().length > 0
})

const detailId = computed(() => {
  if (!hasDetailQuery.value) return null
  const value = Number(route.query.id)
  return Number.isInteger(value) && value > 0 ? value : null
})

const activeItem = computed(() => archive.detail.value)
const previousItem = computed(() => archive.previousItem.value)
const nextItem = computed(() => archive.nextItem.value)

const canReadArchive = computed(() => {
  return auth.isLoggedIn.value && auth.hasProfileField('email')
})

const contentPadding = computed(() => mobile.value ? 16 : tablet.value || mini.value ? 24 : 40)
const cardColumns = computed(() => {
  if (mobile.value) return 1
  if (tablet.value || mini.value) return 2
  return 3
})

const modelOptions = computed(() => [
  { value: 'all', label: t('prompts.filters.allModels') },
  { value: 'gpt-image-1', label: t('prompts.models.gptImage1') },
  { value: 'dall-e', label: t('prompts.models.dallE') },
])

const sortOptions = computed(() => [
  { value: 'newest', label: t('prompts.sort.newest') },
  { value: 'oldest', label: t('prompts.sort.oldest') },
])

const tagOptions = computed(() => {
  return [
    { value: 'all', label: t('prompts.filters.allTags') },
    ...archive.availableTags.value.map((tag) => ({
      value: tag,
      label: formatTag(tag),
    })),
  ]
})

const visibleItems = computed(() => archive.items.value)
const backgroundSources = computed(() => {
  const seen = new Set<string>()
  const sources: string[] = []

  for (const item of visibleItems.value) {
    for (const image of [item.coverImage, item.secondaryImage]) {
      const source = image?.thumbnailUrl || image?.fullUrl || ''
      if (!source || seen.has(source)) continue
      seen.add(source)
      sources.push(source)
    }
  }

  return sources
})
const canLoadMore = computed(() => archive.hasMore.value)
const remainingCount = computed(() => {
  return Math.max(0, archive.totalCount.value - archive.items.value.length)
})

const hasActiveFilters = computed(() => {
  return Boolean(searchQuery.value.trim()) ||
    modelFilter.value !== 'all' ||
    tagFilter.value !== 'all' ||
    sortMode.value !== 'newest'
})

const localizedActiveTitle = computed(() => {
  if (!activeItem.value) return ''
  return locale.value === 'fa'
    ? activeItem.value.title.fa
    : activeItem.value.title.en
})

useHead(() => ({
  title: activeItem.value
    ? `${localizedActiveTitle.value} · Prompt Draft`
    : t('prompts.title'),
}))

watch(
  [searchQuery, modelFilter, tagFilter, sortMode],
  () => {
    if (hasDetailQuery.value || !canReadArchive.value) return

    if (filterTimer) clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
      void loadFirstPage()
    }, 280)
  },
)

watch(
  () => route.query.tag,
  (value) => {
    const nextTag = normalizeRouteTag(value)
    if (tagFilter.value !== nextTag) tagFilter.value = nextTag
  },
)

watch(
  backgroundSources,
  (sources) => {
    selectAmbientBackground(sources)
  },
)

watch(
  () => route.query.id,
  () => {
    if (!canReadArchive.value) return
    void loadCurrentRoute()
  },
)

watch(canReadArchive, (allowed) => {
  if (allowed) void loadCurrentRoute()
})

onMounted(async () => {
  await auth.initialize()
  if (canReadArchive.value) await loadCurrentRoute()
  if (!ambientBackground.value) selectAmbientBackground(backgroundSources.value)
})

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer)
  if (ambientSwapTimer) clearTimeout(ambientSwapTimer)
  ambientPreloadVersion += 1
})

function normalizeRouteTag(value: unknown) {
  if (typeof value !== 'string') return 'all'
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.length > 100 || /\s/.test(normalized)) return 'all'
  return normalized
}

function currentListQuery(cursor: string | null = null): PromptArchiveListQuery {
  return {
    limit: 24,
    cursor,
    search: searchQuery.value.trim(),
    model: modelFilter.value === 'all' ? null : modelFilter.value,
    tag: tagFilter.value === 'all' ? null : tagFilter.value,
    sort: sortMode.value,
  }
}

async function loadCurrentRoute() {
  if (!canReadArchive.value) return

  if (hasDetailQuery.value) {
    if (detailId.value == null) {
      archive.clearDetail()
      return
    }

    await archive.loadDetail(detailId.value)
    return
  }

  archive.clearDetail()
  await loadFirstPage()
}

function loadFirstPage() {
  return archive.loadList(currentListQuery())
}

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function selectAmbientBackground(sources = backgroundSources.value) {
  if (!import.meta.client) return

  if (!sources.length) {
    ambientPreloadVersion += 1
    if (ambientSwapTimer) clearTimeout(ambientSwapTimer)
    previousAmbientBackground.value = ''
    ambientBackground.value = ''
    return
  }

  const current = ambientBackground.value
  const candidates = sources.filter(source => source !== current)
  const pool = candidates.length ? candidates : sources
  const next = pool[Math.floor(Math.random() * pool.length)] || ''

  if (!next || next === current) return

  const preloadVersion = ++ambientPreloadVersion
  const image = new Image()

  image.decoding = 'async'
  image.onload = () => {
    if (preloadVersion !== ambientPreloadVersion) return

    previousAmbientBackground.value = ambientBackground.value
    ambientBackground.value = next

    if (ambientSwapTimer) clearTimeout(ambientSwapTimer)
    ambientSwapTimer = setTimeout(() => {
      previousAmbientBackground.value = ''
    }, 900)
  }
  image.onerror = () => {
    if (preloadVersion !== ambientPreloadVersion) return
    previousAmbientBackground.value = ''
  }
  image.src = next
}

function clearFilters() {
  searchQuery.value = ''
  modelFilter.value = 'all'
  tagFilter.value = 'all'
  sortMode.value = 'newest'
}

function loadMore() {
  if (!archive.nextCursor.value || archive.pending.value) return

  return archive.loadList(
    currentListQuery(archive.nextCursor.value),
    { append: true },
  )
}

function retryList() {
  return archive.loadList(currentListQuery(), { forceFallbackSnapshot: true })
}

function retryDetail() {
  if (detailId.value == null) return
  return archive.loadDetail(detailId.value, { forceFallbackSnapshot: true })
}

function openTelegram(item: PromptArchiveListItem | PromptArchiveDetailItem) {
  if (!import.meta.client || !item.telegramUrl) return
  window.open(item.telegramUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <template v-if="hasDetailQuery">
    <el-flex
      v-if="archive.detailPending.value"
      rules="ccc"
      class="w100 h100"
      :gap="8"
      :p="40">
      <el-icon icon="refresh" :size="30" color="prim" />
      <el-text :size="13" color="normal60">
        {{ t('prompts.loading') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else-if="archive.detailError.value"
      rules="ccc"
      class="w100 h100"
      :gap="10"
      :p="32">
      <el-icon icon="warning" :size="34" color="red" />
      <el-text :size="15" :weight="800">
        {{ t('prompts.error.title') }}
      </el-text>
      <el-button
        :label="t('prompts.error.retry')"
        icon="refresh"
        mode="flat"
        color="red"
        :size="12"
        @click="retryDetail"
      />
    </el-flex>

    <prompts-prompt-detail
      v-else-if="activeItem"
      :item="activeItem"
      :previous-item="previousItem"
      :next-item="nextItem"
      @telegram="openTelegram"
    />

    <el-flex
      v-else
      rules="ccc"
      class="w100 h100"
      :gap="10"
      :p="32">
      <el-icon icon="search" :size="42" color="normal35" />
      <el-text type="h1" :size="mini ? 24 : 32" :weight="900">
        {{ t('prompts.detail.notFoundTitle') }}
      </el-text>
      <el-text type="p" :size="13" color="normal55" class="tc">
        {{ t('prompts.detail.notFoundDescription') }}
      </el-text>
      <el-button
        to="/prompts"
        :label="t('prompts.detail.back')"
        icon="arrow_left"
        mode="flat"
        color="prim"
        :size="12"
        :p="[9, 12]"
      />
    </el-flex>
  </template>

  <div
    v-else
    class="prompts-page w100 por"
    :data-archive-source="archive.source.value || undefined">
    <div
      v-if="ambientBackground || previousAmbientBackground"
      class="prompts-page__ambient pen">
      <img
        v-if="previousAmbientBackground"
        :src="previousAmbientBackground"
        alt=""
        aria-hidden="true"
        class="prompts-page__ambient-image prompts-page__ambient-image--previous"
        decoding="async"
        draggable="false"
      />
      <img
        v-if="ambientBackground"
        :key="ambientBackground"
        :src="ambientBackground"
        alt=""
        aria-hidden="true"
        class="prompts-page__ambient-image prompts-page__ambient-image--current"
        decoding="async"
        draggable="false"
      />
    </div>
    <div v-else class="prompts-page__fallback-bg pen" />
    <div class="prompts-page__grain pen" />

    <el-flex
      rules="csc"
      class="prompts-page__surface w100 por zi10"
      :gap="24"
      :p="contentPadding"
      bg="normal15"
      bd="b8">
      <el-flex rules="rbe" class="prompts-page__heading w100" :gap="18" wrap>
        <el-grid :gap="8" class="fg100">
          <el-text :size="10" :weight="900" color="prim" class="wsnw">
            {{ t('prompts.title') }}
          </el-text>
          <el-text
            type="h1"
            :size="mobile ? 38 : 58"
            :weight="600"
            class="prompts-page__title">
            {{ t('prompts.title') }}
          </el-text>
          <el-text
            type="p"
            :size="mobile ? 12 : 14"
            color="normal55"
            class="prompts-page__description">
            {{ t('prompts.description') }}
          </el-text>
        </el-grid>

        <el-text
          v-if="archive.source.value"
          :size="11"
          :weight="800"
          :p="[7, 10]"
          :radius="100"
          marker="surface"
          color="normal"
          class="wsnw">
          {{ t('prompts.total', { count: archive.totalCount.value }) }}
        </el-text>
      </el-flex>

      <el-grid
        :cols="mobile ? 1 : tablet || mini ? 2 : 4"
        :gap="10"
        class="prompts-page__filters w100"
        :p="12"
        :radius="18"
        :br="1"
        bc="normal15"
        bg="surface10"
        bd="b8">
        <el-text-field
          v-model="searchQuery"
          :placeholder="t('prompts.search.placeholder')"
          :actions="false"
          :size="13"
        />

        <el-dropdown
          v-model="modelFilter"
          :items="modelOptions"
          item-label="label"
          item-value="value"
          :placeholder="t('prompts.filters.model')"
        />

        <el-dropdown
          v-model="tagFilter"
          :items="tagOptions"
          item-label="label"
          item-value="value"
          :placeholder="t('prompts.filters.tag')"
          :menu-options="{ maxHeight: 'min(420px, calc(100vh - 24px))' }"
        />

        <el-dropdown
          v-model="sortMode"
          :items="sortOptions"
          item-label="label"
          item-value="value"
          :placeholder="t('prompts.filters.sort')"
        />
      </el-grid>

      <el-flex rules="rbc" class="w100" :gap="10" wrap>
        <el-text :size="12" color="normal55">
          {{ t('prompts.results', { count: archive.totalCount.value }) }}
        </el-text>

        <el-flex rules="rsc" :gap="6" wrap>
          <el-button
            v-if="hasActiveFilters"
            :label="t('prompts.filters.clear')"
            icon="cancel"
            mode="flat"
            color="normal"
            :size="11"
            :p="[7, 9]"
            @click="clearFilters"
          />

          <el-flex
            rules="rcc"
            :gap="4"
            :p="4"
            :radius="100"
            :br="1"
            bc="normal15"
            bg="surface10"
            bd="b8">
            <el-button
              type="fab"
              :label="t('prompts.view.grid')"
              icon="dashboard"
              :mode="viewMode === 'grid' ? 'normal' : 'flat'"
              :color="viewMode === 'grid' ? 'prim' : 'normal'"
              :size="12"
              :p="8"
              @click="viewMode = 'grid'"
            />

            <el-button
              type="fab"
              :label="t('prompts.view.list')"
              icon="view_list"
              :mode="viewMode === 'list' ? 'normal' : 'flat'"
              :color="viewMode === 'list' ? 'prim' : 'normal'"
              :size="12"
              :p="8"
              @click="viewMode = 'list'"
            />
          </el-flex>
        </el-flex>
      </el-flex>

      <el-flex
        v-if="archive.pending.value && !archive.items.value.length"
        rules="ccc"
        class="w100 fg100"
        :gap="8"
        :p="40">
        <el-icon icon="refresh" :size="28" color="prim" />
        <el-text :size="13" color="normal60">
          {{ t('prompts.loading') }}
        </el-text>
      </el-flex>

      <el-flex
        v-else-if="archive.error.value"
        rules="ccc"
        class="w100"
        :gap="10"
        :p="32"
        :radius="16"
        bg="red5">
        <el-icon icon="warning" :size="30" color="red" />
        <el-text :size="14" :weight="700">
          {{ t('prompts.error.title') }}
        </el-text>
        <el-button
          :label="t('prompts.error.retry')"
          icon="refresh"
          mode="flat"
          color="red"
          :size="12"
          @click="retryList"
        />
      </el-flex>

      <el-flex
        v-else-if="!visibleItems.length"
        rules="ccc"
        class="w100"
        :gap="8"
        :p="40"
        :radius="16"
        bg="normal5">
        <el-icon icon="search" :size="36" color="normal40" />
        <el-text :size="15" :weight="800">
          {{ t('prompts.empty.title') }}
        </el-text>
        <el-text :size="12" color="normal55" class="tc">
          {{ t('prompts.empty.description') }}
        </el-text>
      </el-flex>

      <template v-else>
        <el-grid
          :cols="viewMode === 'grid' ? cardColumns : 1"
          :gap="viewMode === 'grid' ? 14 : 8"
          class="w100">
          <prompts-prompt-item
            v-for="item in visibleItems"
            :key="item.id"
            :item="item"
            :view="viewMode"
            @telegram="openTelegram"
          />
        </el-grid>

        <el-flex
          v-if="canLoadMore"
          rules="ccc"
          class="w100"
          :p="8">
          <el-button
            :label="t('prompts.loadMore', { count: remainingCount })"
            icon="arrow_downward"
            mode="flat"
            color="normal"
            :size="12"
            :p="[10, 14]"
            :loading="archive.pending.value"
            @click="loadMore"
          />
        </el-flex>
      </template>
    </el-flex>
  </div>
</template>

<style scoped>
.prompts-page {
  min-height: 100%;
  isolation: isolate;
  background: #09090d;
}

.prompts-page__ambient,
.prompts-page__fallback-bg,
.prompts-page__grain {
  position: fixed;
  inset: 0;
}

.prompts-page__ambient {
  z-index: 0;
  overflow: hidden;
  background: #09090d;
}

.prompts-page__ambient-image {
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  display: block;
  object-fit: cover;
  object-position: center;
  opacity: 0.32;
  filter: blur(48px) saturate(1.05);
  transform: scale(1.1);
  pointer-events: none;
  user-select: none;
}

.prompts-page__ambient-image--current {
  animation: promptsAmbientFadeIn 700ms ease both;
}

.prompts-page__ambient-image--previous {
  opacity: 0.32;
}

.prompts-page__fallback-bg {
  z-index: 0;
  background:
    radial-gradient(circle at 14% 16%, var(--primary35), transparent 40%),
    radial-gradient(circle at 84% 20%, var(--themePurple25), transparent 44%),
    linear-gradient(145deg, var(--themeSurface20), var(--themeBackground));
}

.prompts-page__grain {
  z-index: 2;
  opacity: 0.08;
  background-image:
    repeating-radial-gradient(circle at 0 0, var(--themeSurface15) 0, var(--themeSurface15) .6px, transparent .7px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.prompts-page__surface {
  min-height: 100%;
  margin-inline: 0;
  padding-top: 64px !important;
  padding-bottom: 72px !important;
}

.prompts-page__heading {
  align-items: flex-end !important;
}

.prompts-page__title {
  line-height: 0.98 !important;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.prompts-page__description {
  max-width: 760px;
}

.prompts-page__filters {
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.08);
}

@keyframes promptsAmbientFadeIn {
  from { opacity: 0; }
  to { opacity: 0.32; }
}

@media (prefers-reduced-motion: reduce) {
  .prompts-page__ambient-image--current {
    animation: none;
  }
}

@media (max-width: 640px) {
  .prompts-page__surface {
    padding-top: 36px !important;
    padding-bottom: 48px !important;
  }
}
</style>
