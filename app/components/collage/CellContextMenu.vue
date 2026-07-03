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

async function run(action?: () => void | Promise<void>) {
  await action?.()
  emit('close')
}

function getFitColor(mode: CollageImageFitMode) {
  return props.fitMode === mode ? 'blue' : 'normal'
}

function getFitEffect(mode: CollageImageFitMode) {
  return {
    color: props.fitMode === mode ? 'normal25' : 'blue50',
  }
}
</script>

<template>
  <el-grid class="collage-cell-context-menu" :gap="10" :p="10">
    <el-flex v-if="title" rules="rsc" :gap="8" :p="[4, 4]">
      <el-icon icon="gallery" :size="18" color="normal55" />
      <el-text class="collage-cell-context-menu__title" :size="12" color="normal60">
        {{ title }}
      </el-text>
    </el-flex>

    <el-flex rules="rsc" :gap="8">
      <el-button
        class="w100"
        :label="replaceLabel"
        icon="refresh-2"
        type="fab"
        mode="flat"
        color="normal"
        :size="13"
        :p="[9, 12]"
        @click="run(onReplace)"
      />

      <el-button
        class="w100"
        :label="pipLabel"
        icon="gallery"
        type="fab"
        mode="flat"
        color="blue"
        :size="13"
        :p="[9, 12]"
        @click="run(onSelectPip)"
      />
    </el-flex>

    <el-flex rules="rsc" :gap="8">
      <el-button
        class="w100"
        :label="coverLabel"
        icon="gallery"
        type="fab"
        mode="flat"
        :color="getFitColor('cover')"
        :effect="getFitEffect('cover')"
        :size="13"
        :p="[9, 12]"
        @click="run(onSetCover)"
      />

      <el-button
        class="w100"
        :label="detailLabel"
        icon="scan"
        type="fab"
        mode="flat"
        :color="getFitColor('detail')"
        :effect="getFitEffect('detail')"
        :size="13"
        :p="[9, 12]"
        @click="run(onSetDetail)"
      />
    </el-flex>

    <el-flex rules="rsc" :gap="8">
      <el-button
        class="w100"
        :label="resetLabel"
        icon="rotate-left"
        type="fab"
        mode="flat"
        color="normal"
        :disable="!canReset"
        :size="13"
        :p="[9, 12]"
        @click="run(onReset)"
      />

      <el-button
        class="w100"
        :label="removeLabel"
        icon="trash"
        type="fab"
        mode="flat"
        color="red"
        :size="13"
        :p="[9, 12]"
        @click="run(onRemove)"
      />
    </el-flex>
  </el-grid>
</template>

<style scoped>
.collage-cell-context-menu {
  width: min(320px, calc(100vw - 24px));
}

.collage-cell-context-menu__title {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
