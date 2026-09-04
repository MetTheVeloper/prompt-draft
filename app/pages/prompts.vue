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
const tagFilter = ref('all')
const sortMode = ref<'newest' | 'oldest'>('newest')
const viewMode = ref<'grid' | 'list'>('grid')

let filterTimer: ReturnType<typeof setTimeout> | undefined

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

const cardColumns = computed(() => {
  if (mobile.value) return 1
  if (tablet.value) return 2
  return 4
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
})

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer)
})

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
  if (!import.meta.client) return
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

  <el-flex
    v-else
    rules="csc"
    class="prompts-page w100 h100 ofya"
    :data-archive-source="archive.source.value || undefined">
    <el-flex
      rules="csc"
      class="prompts-page__content w100"
      :gap="20"
      :p="mobile ? 0 : 4">
      <el-grid :gap="8" class="w100">
        <el-flex rules="rbc" :gap="12" wrap>
          <el-grid :gap="4">
            <el-text type="h1" :size="mini ? 24 : 32" :weight="800">
              {{ t('prompts.title') }}
            </el-text>

            <el-text type="p" :size="13" color="normal60">
              {{ t('prompts.description') }}
            </el-text>
          </el-grid>

          <el-text
            v-if="archive.source.value"
            :size="11"
            :p="[6, 9]"
            :radius="100"
            marker="prim15"
            class="wsnw">
            {{ t('prompts.total', { count: archive.totalCount.value }) }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-grid
        :cols="mobile ? 1 : tablet ? 2 : 4"
        :gap="10"
        class="w100"
        :p="12"
        :radius="16"
        :br="1"
        bc="normal10"
        bg="normal0">
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
            :radius="12"
            :br="1"
            bc="normal10"
            bg="normal5">
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
  </el-flex>
</template>

<style scoped>
.prompts-page {
  min-height: 0;
}

.prompts-page__content {
  max-width: 1440px;
  margin-inline: auto;
  padding-bottom: 32px;
}
</style>