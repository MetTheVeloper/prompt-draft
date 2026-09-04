<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number | string;
    icon: string;
    color?: string;
    helper?: string;
  }>(),
  {
    color: "prim",
    helper: "",
  },
);

const markerColor = computed(() => `${props.color}15`);
</script>

<template>
  <el-flex
    rules="ccs"
    :gap="10"
    class="w100"
    bg="surface"
    :p="16"
    :radius="14"
    :br="1"
    bc="normal15">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="rcc" :bg="markerColor" :radius="100" :p="8">
        <el-icon :icon="icon" :color="color" :size="20" />
      </el-flex>
      <el-text :size="26" :weight="800" :localize="true">{{ value }}</el-text>
    </el-flex>

    <el-text :size="13" :weight="700">{{ label }}</el-text>
    <el-text v-if="helper" :size="11" color="normal45">{{ helper }}</el-text>
  </el-flex>
</template>
