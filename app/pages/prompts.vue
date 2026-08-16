<script setup lang="ts">
import type {
  PromptArchiveItem,
  PromptArchiveModel,
} from '~/types/promptArchive'

const { t } = useI18n()
const { mobile, tablet, mini } = useScreen()
const archive = usePromptArchive()

const searchQuery = ref('')
const modelFilter = ref<'all' | PromptArchiveModel>('all')
const tagFilter = ref('all')
const sortMode = ref<'newest' | 'oldest'>('newest')
const viewMode = ref<'grid' | 'list'>('grid')
const visibleCount = ref(24)

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
  const tags = new Set<string>()
  archive.items.value.forEach((item) => item.tags.forEach((tag) => tags.add(tag)))

  return [
    { value: 'all', label: t('prompts.filters.allTags') },
    ...Array.from(tags)
      .sort((first, second) => first.localeCompare(second))
      .map((tag) => ({ value: tag, label: formatTag(tag) })),
  ]
})

const normalizedSearch = computed(() => normalizeText(searchQuery.value))

const filteredItems = computed(() => {
  const result = archive.items.value.filter((item) => {
    if (modelFilter.value !== 'all' && item.model.previewGeneratedWith !== modelFilter.value) return false
    if (tagFilter.value !== 'all' && !item.tags.includes(tagFilter.value)) return false

    const query = normalizedSearch.value
    if (!query) return true

    const haystack = normalizeText([
      item.id,
      t(item.titleKey),
      item.sourceTitle,
      item.prompt,
      ...item.tags,
    ].join(' '))
    return haystack.includes(query)
  })

  return result.sort((first, second) => {
    const firstTime = new Date(first.publishedAt).getTime()
    const secondTime = new Date(second.publishedAt).getTime()
    return sortMode.value === 'oldest' ? firstTime - secondTime : secondTime - firstTime
  })
})

const visibleItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const canLoadMore = computed(() => visibleItems.value.length < filteredItems.value.length)

const hasActiveFilters = computed(() => {
  return Boolean(searchQuery.value.trim()) ||
    modelFilter.value !== 'all' ||
    tagFilter.value !== 'all' ||
    sortMode.value !== 'newest'
})

watch([searchQuery, modelFilter, tagFilter, sortMode], () => {
  visibleCount.value = 24
})

onMounted(() => {
  void archive.load()
})

function normalizeText(value: unknown) {
  return String(value ?? '')
    .toLocaleLowerCase()
    .replaceAll('ي', 'ی')
    .replaceAll('ك', 'ک')
    .replace(/\s+/g, ' ')
    .trim()
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
  visibleCount.value += 24
}

function openTelegram(item: PromptArchiveItem) {
  if (!import.meta.client) return
  window.open(item.telegramUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <el-flex rules="csc" class="prompts-page w100 h100 ofya">
    <el-flex rules="csc" class="prompts-page__content w100" :gap="20" :p="mobile ? 0 : 4">
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
            v-if="archive.payload.value"
            :size="11"
            :p="[6, 9]"
            :radius="100"
            marker="prim15"
            class="wsnw">
            {{ t('prompts.total', { count: archive.items.value.length }) }}
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
          {{ t('prompts.results', { count: filteredItems.length }) }}
        </el-text>

        <el-flex rules="rsc" :gap="6" wrap>
          <el-button
            v-if="hasActiveFilters"
            :label="t('prompts.filters.clear')"
            icon="close-circle"
            mode="flat"
            color="normal"
            :size="11"
            :p="[7, 9]"
            @click="clearFilters"
          />

          <el-flex rules="rcc" :gap="4" :p="4" :radius="12" :br="1" bc="normal10" bg="normal5">
            <el-button
              type="fab"
              :label="t('prompts.view.grid')"
              icon="element-3"
              :mode="viewMode === 'grid' ? 'normal' : 'flat'"
              :color="viewMode === 'grid' ? 'prim' : 'normal'"
              :size="12"
              :p="8"
              @click="viewMode = 'grid'"
            />
            <el-button
              type="fab"
              :label="t('prompts.view.list')"
              icon="row-horizontal"
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
        <el-icon icon="refresh-2" :size="28" color="prim" />
        <el-text :size="13" color="normal60">{{ t('prompts.loading') }}</el-text>
      </el-flex>

      <el-flex
        v-else-if="archive.error.value"
        rules="ccc"
        class="w100"
        :gap="10"
        :p="32"
        :radius="16"
        bg="red5">
        <el-icon icon="danger" :size="30" color="red" />
        <el-text :size="14" :weight="700">{{ t('prompts.error.title') }}</el-text>
        <el-button
          :label="t('prompts.error.retry')"
          icon="refresh-2"
          mode="flat"
          color="red"
          :size="12"
          @click="archive.load({ force: true })"
        />
      </el-flex>

      <el-flex
        v-else-if="!filteredItems.length"
        rules="ccc"
        class="w100"
        :gap="8"
        :p="40"
        :radius="16"
        bg="normal5">
        <el-icon icon="search-status" :size="36" color="normal40" />
        <el-text :size="15" :weight="800">{{ t('prompts.empty.title') }}</el-text>
        <el-text :size="12" color="normal55" class="tc">{{ t('prompts.empty.description') }}</el-text>
      </el-flex>

      <template v-else>
        <el-grid v-if="viewMode === 'grid'" :cols="cardColumns" :gap="14" class="w100">
          <prompts-prompt-card
            v-for="item in visibleItems"
            :key="item.id"
            :item="item"
            @telegram="openTelegram"
          />
        </el-grid>

        <el-grid v-else :cols="1" :gap="8" class="w100">
          <prompts-prompt-list-item
            v-for="item in visibleItems"
            :key="item.id"
            :item="item"
            @telegram="openTelegram"
          />
        </el-grid>

        <el-flex v-if="canLoadMore" rules="ccc" class="w100" :p="8">
          <el-button
            :label="t('prompts.loadMore', { count: filteredItems.length - visibleItems.length })"
            icon="arrow-down"
            mode="flat"
            color="normal"
            :size="12"
            :p="[10, 14]"
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
