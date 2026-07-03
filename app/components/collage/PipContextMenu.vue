<script setup lang="ts">
import type { CollagePipPosition, CollagePipSize } from '~/types/collage'

type PipMenuOption<T extends string> = {
  value: T
  label: string
  active?: boolean
}

const props = withDefaults(
  defineProps<{
    title?: string

    replaceLabel: string
    removeLabel: string
    positionLabel: string
    sizeLabel: string

    positionOptions: PipMenuOption<CollagePipPosition>[]
    sizeOptions: PipMenuOption<CollagePipSize>[]

    onReplace?: () => void | Promise<void>
    onRemove?: () => void | Promise<void>
    onSetPosition?: (position: CollagePipPosition) => void | Promise<void>
    onSetSize?: (size: CollagePipSize) => void | Promise<void>
  }>(),
  {
    title: '',
    positionOptions: () => [],
    sizeOptions: () => [],
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

async function run(action?: () => void | Promise<void>) {
  await action?.()
  emit('close')
}

async function setPosition(position: CollagePipPosition) {
  await props.onSetPosition?.(position)
  emit('close')
}

async function setSize(size: CollagePipSize) {
  await props.onSetSize?.(size)
  emit('close')
}

function getOptionColor(active?: boolean) {
  return active ? 'blue' : 'normal'
}

function getOptionEffect(active?: boolean) {
  return {
    color: active ? 'normal25' : 'blue50',
  }
}
</script>

<template>
  <el-grid class="collage-pip-context-menu" :gap="12" :p="10">
    <el-flex v-if="title" rules="rsc" :gap="8" :p="[4, 4]">
      <el-icon icon="gallery" :size="18" color="normal55" />
      <el-text class="collage-pip-context-menu__title" :size="12" color="normal60">
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

    <el-grid :gap="8">
      <el-text :size="11" color="normal45">
        {{ positionLabel }}
      </el-text>

      <el-grid :cols="3" :gap="6">
        <el-button
          v-for="option in positionOptions"
          :key="option.value"
          :label="option.label"
          icon="grid-1"
          type="fab"
          mode="flat"
          :color="getOptionColor(option.active)"
          :effect="getOptionEffect(option.active)"
          :size="11"
          :p="[8, 8]"
          @click="setPosition(option.value)"
        />
      </el-grid>
    </el-grid>

    <el-grid :gap="8">
      <el-text :size="11" color="normal45">
        {{ sizeLabel }}
      </el-text>

      <el-flex rules="rsc" :gap="6">
        <el-button
          v-for="option in sizeOptions"
          :key="option.value"
          class="w100"
          :label="option.label"
          icon="maximize-3"
          type="fab"
          mode="flat"
          :color="getOptionColor(option.active)"
          :effect="getOptionEffect(option.active)"
          :size="12"
          :p="[8, 8]"
          @click="setSize(option.value)"
        />
      </el-flex>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.collage-pip-context-menu {
  width: min(340px, calc(100vw - 24px));
}

.collage-pip-context-menu__title {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
