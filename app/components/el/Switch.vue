<template>
  <el-flex
    rules="rsc"
    class="crp"
    role="switch"
    tabindex="0"
    :aria-checked="checked"
    :aria-disabled="isDisabled"
    @click.stop="handleClick"
    @keydown.enter.prevent.stop="handleClick"
    @keydown.space.prevent.stop="handleClick"
  >
    <div
      v-if="(icon !== undefined || label !== undefined) && !$slots.label"
      class="frsc fg100 fgp8"
    >
      <el-icon
        v-if="icon"
        :icon="icon"
        :size="iconSize || 24"
        :color="iconColor"
      />
      <el-text v-if="label" :size="size" :weight="400" class="fg100">
        {{ label }}
      </el-text>
    </div>

    <div v-if="$slots.label" class="fg100">
      <slot name="label" />
    </div>

    <div
      class="switch br64 frsc tne100"
      :class="{
        'o80 pen': isDisabled,
        'bg-prim': checked,
        'bg-normal40': !checked,
        'wp44 mnwp44 hp22 pl2 pr2': size === undefined || size === 'default',
        'wp28 mnwp28 hp16 pl2 pr2': size === 'mini',
      }"
    >
      <div
        class="bg-white br64 bsh4 tne200"
        :class="{
          'wp18 mnwp18 hp18': size === undefined || size === 'default',
          'wp12 mnwp12 hp12': size === 'mini',
          mr22: !checked && size !== 'mini',
          mr12: !checked && size === 'mini',
          ml22: checked && size !== 'mini',
          ml12: checked && size === 'mini',
        }"
      />
    </div>
  </el-flex>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
  },
  size: {
    type: [String, Number],
    required: false,
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

function handleClick(event) {
  if (isDisabled.value) return

  emit('update:modelValue', !checked.value)
  emit('click', event)
}
</script>
