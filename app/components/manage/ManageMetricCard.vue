<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number | string;
    icon: string;
    color?: string;
    helper?: string;
    large?: boolean;
    unit?: "goin" | null;
  }>(),
  {
    color: "prim",
    helper: "",
    large: false,
    unit: null,
  },
);

const { locale } = useI18n();
const markerColor = computed(() => `${props.color}15`);
const iconSize = computed(() => (props.large ? 27 : 25));
const valueSize = computed(() => (props.large ? 30 : 28));
const labelSize = computed(() => (props.large ? 17 : 16));
const helperSize = computed(() => (props.large ? 13 : 12));
const formattedValue = computed(() => {
  return typeof props.value === "number"
    ? new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(props.value)
    : props.value;
});
</script>

<template>
  <el-flex
    rules="cbs"
    :gap="10"
    class="manage-metric-card w100"
    bg="surface"
    :p="14"
    :radius="14"
    :br="1"
    bc="normal15">
    <el-flex rules="rbc" class="w100" :gap="10">
      <el-flex rules="rcc" :bg="markerColor" :radius="100" :p="7">
        <el-icon :icon="icon" :color="color" :size="iconSize" />
      </el-flex>
      <EconomyGoinAmount
        v-if="unit === 'goin'"
        class="manage-metric-card__value"
        :value="value"
        :size="valueSize"
        :weight="800"
      />
      <el-text
        v-else
        class="manage-metric-card__value"
        :size="valueSize"
        :weight="800">
        {{ formattedValue }}
      </el-text>
    </el-flex>

    <el-flex rules="ces" :gap="3" class="w100">
      <el-text
        v-if="helper"
        class="manage-metric-card__helper"
        :size="helperSize"
        color="normal45">
        {{ helper }}
      </el-text>
      <el-text
        class="manage-metric-card__label"
        :size="labelSize"
        :weight="700">
        {{ label }}
      </el-text>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.manage-metric-card {
  min-height: 126px;
}

.manage-metric-card__value {
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.manage-metric-card__label {
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.manage-metric-card__helper {
  line-height: 1.4;
  overflow-wrap: anywhere;
}
</style>
