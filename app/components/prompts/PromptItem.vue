<script setup lang="ts">
import { AUTH_PERMISSIONS } from '~/config/authorization'
import type { PromptArchiveListItem } from '~/types/promptArchive'

type PromptItemView = 'grid' | 'list'

const props = withDefaults(
  defineProps<{
    item: PromptArchiveListItem
    view?: PromptItemView
  }>(),
  {
    view: 'grid',
  },
)

const emit = defineEmits<{
  (event: 'telegram', item: PromptArchiveListItem): void
}>()

const auth = useAuth()
const { t, locale } = useI18n()
const { mobile } = useScreen()
const hovered = ref(false)

const isGrid = computed(() => props.view === 'grid')
const canManageArchive = computed(() => auth.can(AUTH_PERMISSIONS.ARCHIVE_MANAGE))
const hasTelegram = computed(() => Boolean(props.item.telegramUrl))

const primaryImage = computed(() => {
  return props.item.coverImage?.thumbnailUrl || props.item.coverImage?.fullUrl || ''
})
const secondaryImage = computed(() => {
  return props.item.secondaryImage?.thumbnailUrl || props.item.secondaryImage?.fullUrl || ''
})
const hasSecondaryImage = computed(() => Boolean(secondaryImage.value))
const detailUrl = computed(() => `/prompts?id=${props.item.id}`)
const manageEditUrl = computed(() => `/manage/archive?edit=${props.item.id}`)
const localizedTitle = computed(() => {
  return locale.value === 'fa' ? props.item.title.fa : props.item.title.en
})

const visibleTagLimit = computed(() => {
  if (isGrid.value) return mobile.value ? 2 : 3
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

const listRootAttrs = computed(() => ({
  rules: 'rbc',
  gap: mobile.value ? 8 : 12,
  p: mobile.value ? 7 : 9,
  radius: 14,
  br: 1,
  bc: 'normal10',
  bg: 'surface',
  class: 'prompt-item prompt-item--list w100 ofh',
}))

const listMediaStyle = computed(() => ({
  width: `${mobile.value ? 78 : 112}px`,
  height: `${mobile.value ? 78 : 84}px`,
}))

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function openTelegram() {
  if (!props.item.telegramUrl) return
  emit('telegram', props.item)
}
</script>

<template>
  <el-flex
    v-if="isGrid"
    rules="ccs"
    class="prompt-item prompt-item--grid w100"
    :class="{ 'has-secondary': hasSecondaryImage }"
    :gap="0"
    :radius="18"
    :br="1"
    :bc="hovered ? 'normal50' : 'normal15'"
    :effect="{ color: 'normal15' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false">
    <template v-if="primaryImage">
      <img
        :src="primaryImage"
        :alt="localizedTitle"
        class="prompt-item__bg prompt-item__bg--primary"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      <img
        v-if="secondaryImage"
        :src="secondaryImage"
        :alt="localizedTitle"
        class="prompt-item__bg prompt-item__bg--secondary"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </template>
    <div v-else class="prompt-item__bg-fallback" />
    <div class="prompt-item__shade pen" />

    <el-flex
      rules="rbc"
      class="prompt-item__topbar w100"
      :gap="8">
      <el-flex rules="rsc" class="fg100" :gap="8">
        <el-flex rules="rsc" :gap="0" bd="b8" :radius="100" bg="surface10">
          <el-button
            type="fab"
            :to="detailUrl"
            :label="t('prompts.actions.view')"
            icon="visibility"
            mode="flat"
            color="normal"
            :tooltip="t('prompts.actions.view')"
          />
          <el-button
            v-if="hasTelegram"
            type="fab"
            :label="t('prompts.actions.telegram')"
            icon="send"
            mode="flat"
            color="blue"
            :tooltip="t('prompts.actions.telegram')"
            @click="openTelegram"
          />
          <el-button
            v-if="canManageArchive"
            type="fab"
            :to="manageEditUrl"
            :label="t('manage.archive.actions.edit')"
            icon="edit"
            mode="flat"
            color="normal"
            :tooltip="t('manage.archive.actions.edit')"
          />
        </el-flex>
      </el-flex>

      <el-flex
        v-if="item.imageCount"
        rules="rcc"
        class="prompt-item__media-count"
        :p="[5, 8]"
        :radius="100"
        bg="surface75"
        bd="b6">
        <el-text :size="10" :weight="800">
          {{ t('prompts.card.imageCount', { count: item.imageCount }) }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex rules="ccs" class="prompt-item__content w100" :gap="12">
      <el-flex rules="rsc" :gap="8" wrap class="w100 fw">
        <el-text
          :size="11"
          :weight="800"
          :marker="modelMarker"
          color="white"
          :p="[4, 7]"
          :radius="100"
          class="wsnw">
          {{ modelLabel }}
        </el-text>
        <el-text
          :size="11"
          :weight="800"
          marker="surface"
          color="normal"
          :p="[4, 7]"
          :radius="100"
          class="wsnw">
          #{{ item.id }}
        </el-text>
      </el-flex>

      <el-flex v-if="item.tags.length" rules="rsc" :gap="7" wrap class="w100 fw prompt-item__tags">
        <el-text
          v-for="tag in visibleTags"
          :key="tag"
          :size="10"
          marker="surface75"
          color="white"
          :p="[3, 6]"
          :radius="100"
          class="wsnw">
          {{ formatTag(tag) }}
        </el-text>
        <el-text
          v-if="hiddenTagCount"
          :size="10"
          marker="surface75"
          color="white"
          :p="[3, 6]"
          :radius="100"
          class="wsnw">
          +{{ hiddenTagCount }}
        </el-text>
      </el-flex>

      <el-text
        type="h3"
        :size="mobile ? 38 : 46"
        :weight="650"
        color="white"
        class="prompt-item__title">
        {{ localizedTitle }}
      </el-text>

      <el-flex rules="rsc" :gap="12" wrap class="prompt-item__meta w100 fw">
        <el-text
          :size="mobile ? 11 : 12"
          color="white"
          icon="calendar_month"
          icon-color="white">
          {{ formattedDate }}
        </el-text>
        <el-text
          v-if="item.imageCount"
          :size="mobile ? 11 : 12"
          color="white"
          icon="photo_library"
          icon-color="white">
          {{ t('prompts.card.imageCount', { count: item.imageCount }) }}
        </el-text>
      </el-flex>
    </el-flex>
  </el-flex>

  <el-flex v-else v-bind="listRootAttrs">
    <div class="prompt-item__media prompt-item__media--list ofh" :style="listMediaStyle">
      <img
        v-if="primaryImage"
        :src="primaryImage"
        :alt="localizedTitle"
        class="prompt-item__image w100 h100"
        loading="lazy"
        decoding="async"
      />
      <el-flex v-else rules="ccc" class="w100 h100" bg="normal5">
        <el-icon icon="hide_image" :size="mobile ? 22 : 28" color="normal30" />
      </el-flex>
    </div>

    <el-flex rules="csc" :gap="mobile ? 6 : 8" class="prompt-item__body fg100">
      <el-text type="h3" :size="mobile ? 12 : 14" :weight="800" class="prompt-item__list-title w100">
        {{ localizedTitle }}
      </el-text>

      <el-flex v-if="item.tags.length" rules="rsc" :gap="8" wrap class="w100">
        <el-text
          v-for="tag in visibleTags"
          :key="tag"
          :size="9"
          :p="4"
          :radius="100"
          marker="normal5"
          class="wsnw">
          {{ formatTag(tag) }}
        </el-text>
        <el-text
          v-if="hiddenTagCount"
          :size="9"
          :p="4"
          :radius="100"
          marker="normal5"
          class="wsnw">
          +{{ hiddenTagCount }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex :rules="mobile ? 'ccc' : 'rcc'" :gap="5" class="prompt-item__actions">
      <el-button
        v-if="hasTelegram"
        type="fab"
        :label="t('prompts.actions.telegram')"
        icon="send"
        color="blue"
        :size="12"
        :p="mobile ? 8 : 9"
        @click="openTelegram"
      />
      <el-button
        type="fab"
        :to="detailUrl"
        :label="t('prompts.actions.view')"
        icon="visibility"
        mode="flat"
        color="normal"
        :size="12"
        :p="mobile ? 8 : 9"
      />
      <el-button
        v-if="canManageArchive"
        type="fab"
        :to="manageEditUrl"
        :label="t('manage.archive.actions.edit')"
        icon="edit"
        mode="flat"
        color="normal"
        :size="12"
        :p="mobile ? 8 : 9"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.prompt-item {
  min-width: 0;
  overflow: hidden;
}

.prompt-item--grid {
  position: relative;
  aspect-ratio: 1 / 1;
  isolation: isolate;
  background: var(--themeBackground);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.22);
  transition: transform 260ms ease, border-color 220ms ease, box-shadow 260ms ease;
}

.prompt-item--grid:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.prompt-item--grid :deep(.effect) {
  z-index: 4;
  mix-blend-mode: soft-light;
}

.prompt-item__bg,
.prompt-item__bg-fallback,
.prompt-item__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.prompt-item__bg {
  z-index: 1;
  display: block;
  object-fit: cover;
  object-position: center;
  user-select: none;
  pointer-events: none;
  transition: opacity 420ms ease, transform 700ms cubic-bezier(.2, .7, .2, 1);
}

.prompt-item__bg--primary { opacity: 1; }
.prompt-item__bg--secondary { opacity: 0; transform: scale(1.035); }
.prompt-item--grid:hover .prompt-item__bg { transform: scale(1.025); }
.prompt-item--grid.has-secondary:hover .prompt-item__bg--primary { opacity: 0; }
.prompt-item--grid.has-secondary:hover .prompt-item__bg--secondary { opacity: 1; transform: scale(1.025); }

.prompt-item__bg-fallback {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 18%, var(--primary35), transparent 42%),
    radial-gradient(circle at 82% 22%, var(--themePurple25), transparent 46%),
    linear-gradient(145deg, var(--themeSurface20), var(--themeBackground));
}

.prompt-item__shade {
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, transparent 30%, rgba(0, 0, 0, 0.08) 48%, rgba(0, 0, 0, 0.86) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.18) 0%, transparent 54%);
}

.prompt-item__topbar {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 6;
  padding: 14px;
}

.prompt-item__media-count {
  flex: 0 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.prompt-item__content {
  position: absolute;
  inset-inline-start: 0;
  inset-block-end: 0;
  z-index: 6;
  padding: clamp(18px, 4vw, 26px);
}

.prompt-item__title {
  width: 100%;
  line-height: 1.02 !important;
  letter-spacing: -0.035em;
  text-wrap: balance;
  text-shadow: 0 6px 24px rgba(0, 0, 0, 0.42);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.prompt-item__tags,
.prompt-item__meta {
  opacity: 0.88;
  text-shadow: 0 3px 14px rgba(0, 0, 0, 0.55);
}

.prompt-item__media {
  flex: 0 0 auto;
  overflow: hidden;
  background: var(--normal5, transparent);
}

.prompt-item__media--list {
  border-radius: 10px;
}

.prompt-item__image {
  display: block;
  object-fit: cover;
}

.prompt-item__body {
  min-width: 0;
}

.prompt-item__list-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.prompt-item__actions {
  flex: 0 0 auto;
}
</style>
