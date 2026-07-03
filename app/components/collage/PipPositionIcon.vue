<script setup lang="ts">
import type { CollagePipPosition } from '~/types/collage'

const props = withDefaults(
  defineProps<{
    position: CollagePipPosition
    active?: boolean
    size?: number
  }>(),
  {
    active: false,
    size: 30,
  },
)

const ACTIVE_BORDER_COLOR = 'normal'
const INACTIVE_BORDER_COLOR = 'normal0'

const activeSidesByPosition: Record<CollagePipPosition, Array<'top' | 'right' | 'bottom' | 'left'>> = {
  'top-left': ['top', 'right'],
  'top-center': ['top'],
  'top-right': ['top', 'left'],
  'center-left': ['right'],
  'center-right': ['left'],
  'bottom-left': ['bottom', 'right'],
  'bottom-center': ['bottom'],
  'bottom-right': ['bottom', 'left'],
}

const borderColors = computed(() => {
  const sides = new Set(activeSidesByPosition[props.position] || [])

  return [
    sides.has('top') ? ACTIVE_BORDER_COLOR : INACTIVE_BORDER_COLOR,
    sides.has('left') ? ACTIVE_BORDER_COLOR : INACTIVE_BORDER_COLOR,
    sides.has('bottom') ? ACTIVE_BORDER_COLOR : INACTIVE_BORDER_COLOR,
    sides.has('right') ? ACTIVE_BORDER_COLOR : INACTIVE_BORDER_COLOR,
  ]
})

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))
</script>

<template>
  <el-grid
    rules="ccc"
    class="collage-pip-position-icon"
    :class="{
      'collage-pip-position-icon--active': active,
    }"
    :style="iconStyle"
    :br="2"
    :radius="4"
    :bc="borderColors"
    :p="2"
  >
    <span class="collage-pip-position-icon__dot bg-normal" />
  </el-grid>
</template>

<style scoped>
.collage-pip-position-icon {
  box-sizing: border-box;
  max-width: 16px;
  max-height: 16px;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;
}

.collage-pip-position-icon--active {
  transform: scale(1.04);
}

.collage-pip-position-icon__dot {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  display: block;
}
</style>
