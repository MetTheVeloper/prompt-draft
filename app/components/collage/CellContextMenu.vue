<script setup lang="ts">
import type { CollageImageFitMode } from '~/types/collage'

const props = withDefaults(
  defineProps<{
    title?: string
    fitMode?: CollageImageFitMode
    canReset?: boolean

    replaceLabel: string
    pipLabel: string
    coverLabel: string
    detailLabel: string
    resetLabel: string
    removeLabel: string

    onReplace?: () => void | Promise<void>
    onSelectPip?: () => void | Promise<void>
    onSetCover?: () => void | Promise<void>
    onSetDetail?: () => void | Promise<void>
    onReset?: () => void | Promise<void>
    onRemove?: () => void | Promise<void>
  }>(),
  {
    title: '',
    fitMode: 'cover',
    canReset: false,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

function shortenFileName(value?: string, maxLength = 16) {
  const input = String(value || '').trim()

  if (!input || input.length <= maxLength) return input

  const colonIndex = input.lastIndexOf(': ')
  const prefix = colonIndex >= 0 ? input.slice(0, colonIndex + 2) : ''
  const name = colonIndex >= 0 ? input.slice(colonIndex + 2) : input
  const lastDotIndex = name.lastIndexOf('.')

  if (lastDotIndex <= 0 || lastDotIndex === name.length - 1) {
    return `${prefix}${name.slice(0, Math.max(1, maxLength - 1))}…`
  }

  const extension = name.slice(lastDotIndex + 1)
  const suffix = `….${extension}`
  const availableBaseLength = Math.max(1, maxLength - suffix.length)

  return `${prefix}${name.slice(0, availableBaseLength)}${suffix}`
}

const shortTitle = computed(() => shortenFileName(props.title))
const isCoverMode = computed(() => props.fitMode === 'cover')

async function run(action?: () => void | Promise<void>) {
  await action?.()
  emit('close')
}

async function toggleFitMode() {
  if (isCoverMode.value) {
    await props.onSetDetail?.()
  } else {
    await props.onSetCover?.()
  }

  emit('close')
}
</script>

<template>
  <el-flex rules="css" class="collage-cell-context-menu" :gap="8" :p="10">
    <el-flex v-if="shortTitle" rules="rsc" :gap="8" :p="[2, 4]">
      <el-icon icon="gallery" :size="16" color="normal55" />
      <el-text class="collage-cell-context-menu__title" :size="12" color="normal60">
        {{ shortTitle }}
      </el-text>
    </el-flex>

    <el-flex rules="rsc" class="collage-cell-context-menu__row" :gap="8">
      <el-button
        :label="pipLabel"
        icon="gallery-add"
        mode="flat"
        color="blue"
        :size="13"
        :p="[8, 10]"
        @click="run(onSelectPip)"
      />

      <el-divider direction="vertical" :height="16" />

      <el-switch
        :size="14"
        v-model="isCoverMode"
        :label="coverLabel"
        @click="toggleFitMode"
      />

      <el-divider direction="vertical" :height="16" />

      <el-button
        :label="replaceLabel"
        icon="refresh-2"
        type="fab"
        mode="flat"
        color="normal"
        :size="13"
        :p="[8, 10]"
        @click="run(onReplace)"
      />

      <el-button
        :label="resetLabel"
        icon="rotate-left"
        type="fab"
        mode="flat"
        color="normal"
        :disable="!canReset"
        :size="13"
        :p="[8, 10]"
        @click="run(onReset)"
      />

      <el-button
        :label="removeLabel"
        icon="trash"
        type="fab"
        mode="flat"
        color="red"
        :size="13"
        :p="[8, 10]"
        @click="run(onRemove)"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.collage-cell-context-menu {
  width: max-content;
  max-width: calc(100vw - 24px);
}

.collage-cell-context-menu__row {
  width: max-content;
  max-width: calc(100vw - 44px);
  flex-wrap: wrap;
}

.collage-cell-context-menu__title {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
