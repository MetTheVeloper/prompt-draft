<template>
  <el-flex rules="rsc" class="crp">
    <div
      class="frsc fg100 fgp8"
      v-if="(icon !== undefined || label !== undefined) && !$slots.label"
    >
      <el-icon v-if="icon" :icon="icon" :size="iconSize || 24" :color="iconColor" />
      <el-text :size="size" :weight="400" class="fg100" v-if="label">
        {{ label }}
      </el-text>
    </div>
    <div class="fg100" v-if="$slots.label">
      <slot name="label"></slot>
    </div>
    <div
      class="switch br64 frsc tne100"
      v-bind:class="{
        'o80 pen': disable,
        'bg-prim': value,
        'bg-normal40': !value,
        'wp44 mnwp44 hp22 pl2 pr2': size === undefined || size === 'default',
        'wp28 mnwp28 hp16 pl2 pr2': size === 'mini',
      }"
    >
      <div
        class="bg-white br64 bsh4 tne200"
        v-bind:class="{
          'wp18 mnwp18 hp18': size === undefined || size === 'default',
          'wp12 mnwp12 hp12': size === 'mini',
          mr22: !value && size !== 'mini',
          mr12: !value && size === 'mini',
          ml22: value && size !== 'mini',
          ml12: value && size === 'mini',
        }"
      ></div>
    </div>
  </el-flex>
</template>

<script setup>
const props = defineProps({
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
});
</script>
