<script setup lang="ts">
import type { PromptArchiveItem } from '~/types/promptArchive'

const props = defineProps<{
  item: PromptArchiveItem
}>()

const emit = defineEmits<{
  (event: 'telegram', item: PromptArchiveItem): void
}>()

const { t, locale } = useI18n()

const coverImage = computed(() => props.item.images[0] || '')
const visibleTags = computed(() => props.item.tags.slice(0, 3))
const hiddenTagCount = computed(() => Math.max(0, props.item.tags.length - visibleTags.value.length))

const modelLabel = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? t('prompts.models.gptImage1')
    : t('prompts.models.dallE')
})

const modelMarker = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? 'green15'
    : 'blue15'
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

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}
</script>

<template>
  <el-flex
    rules="cbs"
    class="prompt-card w100 h100 ofha"
    :gap="0"
    :radius="16"
    :br="1"
    bc="normal10"
    bg="surface">
    <div class="prompt-card__media w100 por ofha">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="item.title"
        class="prompt-card__image w100 h100"
        loading="lazy"
        decoding="async"
      />

      <el-flex
        v-else
        rules="ccc"
        class="w100 h100"
        bg="normal5">
        <el-icon icon="gallery-slash" :size="42" color="normal30" />
        <el-text :size="11" color="normal40">
          {{ t('prompts.card.noPreview') }}
        </el-text>
      </el-flex>

      <el-flex
        rules="rbc"
        class="poa t0 l0 r0"
        :p="10"
        :gap="6">
        <el-text
          :size="10"
          :weight="700"
          :p="[5, 8]"
          :radius="100"
          :marker="modelMarker">
          {{ modelLabel }}
        </el-text>

        <el-text
          :size="10"
          :weight="700"
          :p="[5, 8]"
          :radius="100"
          marker="normal20">
          #{{ item.id }}
        </el-text>
      </el-flex>
    </div>

    <el-flex rules="cbs" class="fg100 w100" :gap="14" :p="16">
      <el-grid :gap="7" class="w100">
        <el-text type="h2" :size="16" :weight="800" class="prompt-card__title">
          {{ item.title }}
        </el-text>

        <el-flex rules="rsc" :gap="8" wrap>
          <el-text :size="11" color="normal50" icon="calendar-1">
            {{ formattedDate }}
          </el-text>

          <el-text
            v-if="item.images.length"
            :size="11"
            color="normal50"
            icon="gallery">
            {{ t('prompts.card.imageCount', { count: item.images.length }) }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-flex v-if="item.tags.length" rules="rsc" :gap="6" wrap class="w100">
        <el-text
          v-for="tag in visibleTags"
          :key="tag"
          :size="10"
          :p="[4, 7]"
          :radius="100"
          marker="normal10">
          {{ formatTag(tag) }}
        </el-text>

        <el-text
          v-if="hiddenTagCount"
          :size="10"
          :p="[4, 7]"
          :radius="100"
          marker="normal10">
          +{{ hiddenTagCount }}
        </el-text>
      </el-flex>

      <el-button
        class="w100"
        :label="t('prompts.actions.telegram')"
        icon="send-2"
        mode="flat"
        color="blue"
        :size="12"
        :p="[10, 12]"
        @click="emit('telegram', item)"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.prompt-card {
  min-width: 0;
}

.prompt-card__media {
  aspect-ratio: 4 / 3;
  min-height: 180px;
  background: var(--normal5, transparent);
}

.prompt-card__image {
  display: block;
  object-fit: cover;
  transition: transform 450ms ease;
}

.prompt-card:hover .prompt-card__image {
  transform: scale(1.025);
}

.prompt-card__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  min-height: 2.55em;
}
</style>
