<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number | string;
    icon: string;
    color?: string;
    helper?: string;
    large?: boolean;
  }>(),
  {
    color: "prim",
    helper: "",
    large: false,
  },
);

const { locale } = useI18n();
const markerColor = computed(() => `${props.color}15`);
const iconSize = computed(() => (props.large ? 30 : 28));
const valueSize = computed(() => (props.large ? 34 : 32));
const labelSize = computed(() => (props.large ? 20 : 18));
const helperSize = computed(() => (props.large ? 16 : 14));
const formattedValue = computed(() => {
  return typeof props.value === "number"
    ? new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(props.value)
    : props.value;
});
</script>

<template>
  <el-flex
    rules="cbs"
    :gap="12"
    class="w100"
    bg="surface"
    :p="16"
    :radius="14"
    :br="1"
    bc="normal15">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="rcc" :bg="markerColor" :radius="100" :p="8">
        <el-icon :icon="icon" :color="color" :size="iconSize" />
      </el-flex>
      <el-text :size="valueSize" :weight="800">{{ formattedValue }}</el-text>
    </el-flex>

    <el-flex rules="ces" :gap="4" class="w100">
      <el-text v-if="helper" :size="helperSize" color="normal45">{{ helper }}</el-text>
      <el-text :size="labelSize" :weight="700">{{ label }}</el-text>
    </el-flex>
  </el-flex>
</template>
