<script setup lang="ts">
import type { CollagePipPosition, CollagePipSize } from '~/types/collage'
import PipPositionIcon from '~/components/collage/PipPositionIcon.vue'

type PipMenuOption<T extends string> = {
  value: T
  label: string
  active?: boolean
}

type PositionGridItem =
  | {
      type: 'position'
      value: CollagePipPosition
    }
  | {
      type: 'spacer'
      key: string
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

const positionGridItems: PositionGridItem[] = [
  { type: 'position', value: 'top-left' },
  { type: 'position', value: 'top-center' },
  { type: 'position', value: 'top-right' },
  { type: 'position', value: 'center-left' },
  { type: 'spacer', key: 'center' },
  { type: 'position', value: 'center-right' },
  { type: 'position', value: 'bottom-left' },
  { type: 'position', value: 'bottom-center' },
  { type: 'position', value: 'bottom-right' },
]

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

function getPositionOption(position: CollagePipPosition) {
  return props.positionOptions.find((option) => option.value === position)
}

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

function getSizeIconSize(size: CollagePipSize) {
  if (size === 'small') return 12
  if (size === 'medium') return 16

  return 20
}
</script>

<template>
  <el-grid class="collage-pip-context-menu" :gap="10" :p="10">
    <el-flex v-if="shortTitle" rules="rsc" :gap="8" :p="[2, 4]">
      <el-icon icon="photo_library" :size="16" color="normal55" />
      <el-text class="collage-pip-context-menu__title" :size="12" color="normal60">
        {{ shortTitle }}
      </el-text>
    </el-flex>

    <el-grid :gap="0">
      <el-button
        :label="replaceLabel"
        icon="refresh"
        rules="rsc"
        :effect="{ color: 'normal15' }"
        mode="flat"
        color="normal"
        :size="13"
        :p="[12, 10]"
        @click="run(onReplace)"
      />

      <el-button
        :label="removeLabel"
        icon="delete"
        rules="rsc"
        :effect="{ color: 'red25' }"
        mode="flat"
        color="red"
        :size="13"
        :p="[12, 10]"
        @click="run(onRemove)"
      />
    </el-grid>

    <el-grid :gap="8">
      <el-text :size="11" color="normal45">
        {{ positionLabel }}
      </el-text>

      <div class="collage-pip-context-menu__position-grid">
        <template v-for="item in positionGridItems" :key="item.type === 'position' ? item.value : item.key">
          <button
            v-if="item.type === 'position'"
            class="collage-pip-context-menu__position-button"
            :class="{
              'collage-pip-context-menu__position-button--active': getPositionOption(item.value)?.active,
            }"
            type="button"
            :title="getPositionOption(item.value)?.label"
            @click="setPosition(item.value)"
          >
            <PipPositionIcon
              :position="item.value"
              :active="!!getPositionOption(item.value)?.active"
            />
          </button>

          <div
            v-else
            class="collage-pip-context-menu__position-spacer"
            aria-hidden="true"
          />
        </template>
      </div>
    </el-grid>

    <el-grid :gap="8">
      <el-text :size="11" color="normal45">
        {{ sizeLabel }}
      </el-text>

      <el-flex rules="rsc" :gap="6">
        <button
          v-for="option in sizeOptions"
          :key="option.value"
          class="collage-pip-context-menu__size-button bg-normal5"
          :class="{
            'collage-pip-context-menu__size-button--active bg-blue5': option.active,
          }"
          type="button"
          :title="option.label"
          @click="setSize(option.value)"
        >
          <span
            class="collage-pip-context-menu__size-preview bc-normal bg-normal"
            :style="{
              width: `${getSizeIconSize(option.value)}px`,
              height: `${getSizeIconSize(option.value)}px`,
            }"
          />
        </button>
      </el-flex>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.collage-pip-context-menu {
  width: max-content;
  max-width: calc(100vw - 24px);
}

.collage-pip-context-menu__title {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collage-pip-context-menu__position-grid {
  display: grid;
  grid-template-columns: repeat(3, 34px);
  gap: 0px;
  width: max-content;
  direction: ltr;
}

.collage-pip-context-menu__position-button,
.collage-pip-context-menu__size-button {
  appearance: none;
  border: 0;
  outline: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 10px;
  transition:
    transform 0.16s ease,
    background-color 0.16s ease,
    opacity 0.16s ease;
}

.collage-pip-context-menu__position-button {
  width: 34px;
  height: 34px;
}

.collage-pip-context-menu__position-button:hover,
.collage-pip-context-menu__size-button:hover {
  transform: translateY(-1px);
}

.collage-pip-context-menu__position-button--active {
  background: rgb(72 158 197 / 16%);
}

.collage-pip-context-menu__position-spacer {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  opacity: 0.3;
}

.collage-pip-context-menu__size-button {
  width: 34px;
  height: 34px;
}

.collage-pip-context-menu__size-button--active {
  transform: scale(1.04);
}

.collage-pip-context-menu__size-preview {
  display: block;
  border-radius: 5px;
  box-sizing: border-box;
}
</style>
