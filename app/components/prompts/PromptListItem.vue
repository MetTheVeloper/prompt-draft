<script setup lang="ts">
import type { PromptArchiveItem } from '~/types/promptArchive'

const props = defineProps<{ item: PromptArchiveItem }>()
const emit = defineEmits<{ (event: 'telegram', item: PromptArchiveItem): void }>()
const { t } = useI18n()
const { mobile } = useScreen()

const coverImage = computed(() => props.item.images[0] || '')
const detailUrl = computed(() => `/prompts?id=${props.item.id}`)
const localizedTitle = computed(() => t(props.item.titleKey))
const visibleTags = computed(() => props.item.tags.slice(0, mobile.value ? 2 : 4))
const hiddenTagCount = computed(() => Math.max(0, props.item.tags.length - visibleTags.value.length))

const mediaStyle = computed(() => ({
  width: `${mobile.value ? 78 : 112}px`,
  height: `${mobile.value ? 78 : 84}px`,
}))

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}
</script>

<template>
  <el-flex
    rules="rbc"
    class="prompt-list-item w100 ofh"
    :gap="mobile ? 8 : 12"
    :p="mobile ? 7 : 9"
    :radius="14"
    :br="1"
    bc="normal10"
    bg="surface">
    <div class="prompt-list-item__media ofh" :style="mediaStyle">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="localizedTitle"
        class="prompt-list-item__image w100 h100"
        loading="lazy"
        decoding="async"
      />
      <el-flex v-else rules="ccc" class="w100 h100" bg="normal5">
        <el-icon icon="gallery-slash" :size="mobile ? 22 : 28" color="normal30" />
      </el-flex>
    </div>

    <el-flex rules="csc" class="prompt-list-item__body fg100" :gap="mobile ? 6 : 8">
      <el-text
        type="h3"
        :size="mobile ? 12 : 14"
        :weight="800"
        class="prompt-list-item__title">
        {{ localizedTitle }}
      </el-text>

      <el-flex v-if="item.tags.length" rules="rsc" :gap="4" wrap class="w100">
        <el-text
          v-for="tag in visibleTags"
          :key="tag"
          :size="9"
          :p="[3, 6]"
          :radius="100"
          marker="normal10"
          class="wsnw">
          {{ formatTag(tag) }}
        </el-text>
        <el-text
          v-if="hiddenTagCount"
          :size="9"
          :p="[3, 6]"
          :radius="100"
          marker="normal10"
          class="wsnw">
          +{{ hiddenTagCount }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex :rules="mobile ? 'ccc' : 'rcc'" :gap="5" class="prompt-list-item__actions">
      <el-button
        type="fab"
        :label="t('prompts.actions.telegram')"
        icon="send-2"
        mode="flat"
        color="blue"
        :size="12"
        :p="mobile ? 8 : 9"
        @click="emit('telegram', item)"
      />
      <el-button
        type="fab"
        :to="detailUrl"
        :label="t('prompts.actions.view')"
        icon="eye"
        mode="flat"
        color="normal"
        :size="12"
        :p="mobile ? 8 : 9"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.prompt-list-item {
  min-width: 0;
  overflow: hidden;
}

.prompt-list-item__media {
  flex: 0 0 auto;
  border-radius: 10px;
  overflow: hidden;
  background: var(--normal5, transparent);
}

.prompt-list-item__image {
  display: block;
  object-fit: cover;
}

.prompt-list-item__body {
  min-width: 0;
}

.prompt-list-item__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.prompt-list-item__actions {
  flex: 0 0 auto;
}
</style>
