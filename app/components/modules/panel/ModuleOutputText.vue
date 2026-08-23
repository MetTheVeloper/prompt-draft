<template>
  <el-text
    v-if="text"
    type="span"
    :size="size"
    :weight="weight"
    :color="color"
    class="module-output-text w100"
  >
    {{ text }}
  </el-text>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ModuleOutputValue } from "~/utils/compilePrompt";

const props = withDefaults(
  defineProps<{
    value?: ModuleOutputValue | null;
    size?: number;
    weight?: number;
    color?: string;
  }>(),
  {
    value: "",
    size: 12,
    weight: 300,
    color: "normal50",
  },
);

const text = computed(() => {
  if (props.value === undefined || props.value === null) return "";
  return typeof props.value === "string"
    ? props.value
    : JSON.stringify(props.value, null, 2);
});
</script>

<style scoped>
.module-output-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.5;
}
</style>
