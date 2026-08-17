<script setup lang="ts">
import type { PromptArchiveItem } from '~/types/promptArchive'

type PromptItemView = 'grid' | 'list'

const props = withDefaults(
  defineProps<{
    item: PromptArchiveItem
    view?: PromptItemView
  }>(),
  {
    view: 'grid',
  },
)

const emit = defineEmits<{
  (event: 'telegram', item: PromptArchiveItem): void
}>()

const { t, locale } = useI18n()
const { mobile } = useScreen()

const isGrid = computed(() => props.view === 'grid')

const coverImage = computed(() => props.item.images[0] || '')
const detailUrl = computed(() => `/prompts?id=${props.item.id}`)
const localizedTitle = computed(() => t(props.item.titleKey))

const visibleTagLimit = computed(() => {
  if (isGrid.value) return 3
  return mobile.value ? 2 : 4
})

const visibleTags = computed(() => props.item.tags.slice(0, visibleTagLimit.value))
const hiddenTagCount = computed(() => {
  return Math.max(0, props.item.tags.length - visibleTags.value.length)
})

const modelLabel = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? t('prompts.models.gptImage1')
    : t('prompts.models.dallE')
})

const modelMarker = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? 'green'
    : 'blue'
})

const formattedDate = computed(() => {
  const date = new Date(props.item.publishedAt)

  if (Number.isNaN(date.getTime())) return props.item.publishedAt

  return new Intl.DateTimeFormat(
    locale.value === 'fa' ? 'fa-IR' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  ).format(date)
})

const rootAttrs = computed(() => {
  if (isGrid.value) {
    return {
      rules: 'cbs',
      gap: 0,
      radius: 16,
      br: 1,
      bc: 'normal10',
      bg: 'surface',
      class: 'prompt-item prompt-item--grid w100 h100',
    }
  }

  return {
    rules: 'rbc',
    gap: mobile.value ? 8 : 12,
    p: mobile.value ? 7 : 9,
    radius: 14,
    br: 1,
    bc: 'normal10',
    bg: 'surface',
    class: 'prompt-item prompt-item--list w100 ofh',
  }
})

const mediaAttrs = computed(() => {
  if (isGrid.value) {
    return {
      class: 'prompt-item__media prompt-item__media--grid w100 por ofh',
    }
  }

  return {
    class: 'prompt-item__media prompt-item__media--list ofh',
    style: {
      width: `${mobile.value ? 78 : 112}px`,
      height: `${mobile.value ? 78 : 84}px`,
    },
  }
})

const bodyAttrs = computed(() => {
  if (isGrid.value) {
    return {
      rules: 'cbs',
      gap: 14,
      p: 16,
      class: 'prompt-item__body fg100 w100',
    }
  }

  return {
    rules: 'csc',
    gap: mobile.value ? 6 : 8,
    class: 'prompt-item__body fg100',
  }
})

const titleAttrs = computed(() => {
  return {
    type: isGrid.value ? 'h2' : 'h3',
    size: isGrid.value ? 16 : mobile.value ? 12 : 14,
    weight: 800,
    class: 'prompt-item__title w100',
  }
})

const tagsAttrs = computed(() => {
  return {
    rules: 'rsc',
    gap: 8,
    wrap: true,
    class: 'w100',
  }
})

const tagAttrs = computed(() => {
  return {
    size: isGrid.value ? 10 : 9,
    p: 4,
    radius: 100,
    marker: 'normal5',
    class: 'wsnw',
  }
})

const actionsAttrs = computed(() => {
  return {
    rules: isGrid.value
      ? 'rbc'
      : mobile.value
        ? 'ccc'
        : 'rcc',
    gap: isGrid.value ? 6 : 5,
    class: isGrid.value
      ? 'prompt-item__actions w100'
      : 'prompt-item__actions',
  }
})

const telegramButtonAttrs = computed(() => {
  return {
    class: isGrid.value ? 'fg100' : undefined,
    type: isGrid.value ? 'normal' : 'fab',
    label: t('prompts.actions.telegram'),
    icon: 'send',
    color: 'blue',
    size: 12,
    p: isGrid.value ? [10, 12] : mobile.value ? 8 : 9,
  }
})

const viewButtonAttrs = computed(() => {
  return {
    type: 'fab',
    to: detailUrl.value,
    label: t('prompts.actions.view'),
    icon: 'visibility',
    mode: 'flat',
    color: 'normal',
    size: 12,
    p: isGrid.value ? 10 : mobile.value ? 8 : 9,
  }
})

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function openTelegram() {
  emit('telegram', props.item)
}
</script>

<template>
  <el-flex v-bind="rootAttrs">
    <div v-bind="mediaAttrs">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="localizedTitle"
        class="prompt-item__image w100 h100"
        loading="lazy"
        decoding="async"
      />

      <el-flex
        v-else
        rules="ccc"
        class="w100 h100"
        bg="normal5">
        <el-icon
          icon="hide_image"
          :size="isGrid ? 42 : mobile ? 22 : 28"
          color="normal30"
        />

        <el-text
          v-if="isGrid"
          :size="11"
          color="normal40">
          {{ t('prompts.card.noPreview') }}
        </el-text>
      </el-flex>

      <el-flex
        v-if="isGrid"
        rules="rbc"
        class="poa t0 l0 r0"
        :p="10"
        :gap="6">
        <el-text
          :size="10"
          :weight="700"
          :p="[0, 2]"
          :radius="100"
          :marker="modelMarker"
          class="wsnw">
          {{ modelLabel }}
        </el-text>

        <el-text
          :size="10"
          :weight="700"
          :p="[0, 2]"
          :radius="100"
          marker="white"
          color="blue"
          class="wsnw">
          #{{ item.id }}
        </el-text>
      </el-flex>
    </div>

    <el-flex v-bind="bodyAttrs">
      <el-grid
        v-if="isGrid"
        :gap="7"
        class="w100">
        <el-text v-bind="titleAttrs">
          {{ localizedTitle }}
        </el-text>

        <el-flex rules="rsc" :gap="8" wrap>
          <el-text
            :size="11"
            color="normal50"
            icon="calendar_month">
            {{ formattedDate }}
          </el-text>

          <el-text
            v-if="item.images.length"
            :size="11"
            color="normal50"
            icon="photo_library">
            {{ t('prompts.card.imageCount', { count: item.images.length }) }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-text
        v-else
        v-bind="titleAttrs">
        {{ localizedTitle }}
      </el-text>

      <el-flex
        v-if="item.tags.length"
        v-bind="tagsAttrs">
        <el-text
          v-for="tag in visibleTags"
          :key="tag"
          v-bind="tagAttrs">
          {{ formatTag(tag) }}
        </el-text>

        <el-text
          v-if="hiddenTagCount"
          v-bind="tagAttrs">
          +{{ hiddenTagCount }}
        </el-text>
      </el-flex>

      <el-flex
        v-if="isGrid"
        v-bind="actionsAttrs">
        <el-button
          v-bind="telegramButtonAttrs"
          @click="openTelegram"
        />

        <el-button v-bind="viewButtonAttrs" />
      </el-flex>
    </el-flex>

    <el-flex
      v-if="!isGrid"
      v-bind="actionsAttrs">
      <el-button
        v-bind="telegramButtonAttrs"
        @click="openTelegram"
      />

      <el-button v-bind="viewButtonAttrs" />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.prompt-item {
  min-width: 0;
  overflow: hidden;
}

.prompt-item__media {
  flex: 0 0 auto;
  overflow: hidden;
  background: var(--normal5, transparent);
}

.prompt-item__media--grid {
  aspect-ratio: 4 / 3;
  min-height: 180px;
}

.prompt-item__media--list {
  border-radius: 10px;
}

.prompt-item__image {
  display: block;
  object-fit: cover;
}

.prompt-item--grid .prompt-item__image {
  transition: transform 450ms ease;
  will-change: transform;
}

.prompt-item--grid:hover .prompt-item__image {
  transform: scale(1.025);
}

.prompt-item__body {
  min-width: 0;
}

.prompt-item__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.prompt-item--grid .prompt-item__title {
  min-height: 2.55em;
}

.prompt-item__actions {
  flex: 0 0 auto;
}
</style>
