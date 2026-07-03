<template>
  <el-flex v-bind="rootAttrs" @click.stop="handleClick" @keydown.enter.prevent.stop="handleClick"
    @keydown.space.prevent.stop="handleClick">
    <el-flex v-if="(icon !== undefined || label !== undefined) && !$slots.label" v-bind="labelWrapperAttrs">
      <el-icon v-if="icon" :icon="icon" :size="resolvedIconSize" :color="iconColor" />

      <el-text v-if="label" v-bind="labelAttrs">
        {{ label }}
      </el-text>
    </el-flex>

    <el-flex v-if="$slots.label" v-bind="slotWrapperAttrs">
      <slot name="label" />
    </el-flex>

    <el-flex v-bind="switchButtonAttrs">
      <el-flex v-bind="thumbAttrs" />
    </el-flex>
  </el-flex>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
  },
  size: {
    type: [Number, String],
    required: false,
    default: 16,
  },
  value: {
    type: Boolean,
    required: false,
  },
  disable: {
    type: Boolean,
    required: false,
  },
  loading: {
    type: Boolean,
    required: false,
  },
  invert: {
    type: Boolean,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  iconSize: {
    type: Number,
    required: false,
  },
  iconColor: {
    type: String,
    required: false,
  },
})

const emit = defineEmits(['update:modelValue', 'click'])

const checked = computed(() => {
  if (typeof props.modelValue === 'boolean') return props.modelValue

  return !!props.value
})

const isDisabled = computed(() => !!props.disable || !!props.loading)

const switchSize = computed(() => normalizeSize(props.size))

const switchGeometry = computed(() => {
  const padding = fixNumber(switchSize.value * 0.25)
  const height = fixNumber(switchSize.value + (padding * 2))
  const width = fixNumber(height * 1.75)
  const thumbSize = fixNumber(switchSize.value)
  const borderRadius = fixNumber(height)

  return {
    height,
    padding,
    width,
    thumbSize,
    borderRadius,
  }
})

const resolvedIconSize = computed(() => props.iconSize || switchSize.value)

const rootAttrs = computed(() => ({
  rules: 'rsc',
  role: 'switch',
  tabindex: isDisabled.value ? -1 : 0,
  'aria-checked': checked.value,
  'aria-disabled': isDisabled.value,
  class: ['switch-root', isDisabled.value ? 'o80' : 'crp'],
  gap: fixNumber(switchSize.value * 0.5),
  style: {
    flexDirection: props.invert ? 'row-reverse' : 'row',
  },
}))

const labelWrapperAttrs = computed(() => ({
  rules: 'rsc',
  class: 'fg100',
  gap: fixNumber(switchSize.value * 0.5),
}))

const slotWrapperAttrs = computed(() => ({
  rules: 'rsc',
  class: 'fg100',
}))

const labelAttrs = computed(() => ({
  size: switchSize.value,
  weight: 400,
  class: 'fg100',
}))

const switchButtonAttrs = computed(() => {
  const { width, height, padding, borderRadius } = switchGeometry.value

  return {
    rules: 'rsc',
    bg: checked.value ? 'prim' : 'normal40',
    bc: checked.value ? 'prim' : 'normal40',
    br: fixNumber(switchSize.value * 0.2),
    radius: borderRadius,
    p: padding,
    class: ['switch-button', 'tne100', isDisabled.value ? 'o80 pen' : 'crp'],
    'data-state': checked.value ? 'checked' : 'unchecked',
    'data-loading': props.loading ? 'true' : 'false',
    style: {
      width: `${width}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`,
      paddingInline: `${padding}px`,
      boxSizing: 'border-box',
      justifyContent: checked.value ? 'flex-end' : 'flex-start',
      transition: 'background-color 160ms ease, border-color 160ms ease, opacity 160ms ease',
    },
  }
})

const thumbAttrs = computed(() => {
  const { thumbSize } = switchGeometry.value

  return {
    bg: 'white',
    radius: thumbSize,
    class: 'switch-thumb bsh4',
    style: {
      width: `${thumbSize}px`,
      minWidth: `${thumbSize}px`,
      height: `${thumbSize}px`,
      transition: 'transform 200ms ease',
    },
  }
})

function normalizeSize(value) {
  if (value === 'mini') return 16
  if (value === 'default') return 22

  const parsed = Number.parseFloat(value)

  if (!Number.isFinite(parsed) || parsed <= 0) return 16

  return fixNumber(parsed)
}

function handleClick(event) {
  if (isDisabled.value) return

  emit('update:modelValue', !checked.value)
  emit('click', event)
}
</script>
