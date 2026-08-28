<script setup lang="ts">
import type { WizardQuestionOption } from "~/wizard/definition";

const props = defineProps<{
  options: readonly WizardQuestionOption[];
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <el-grid :cols="['1fr', '1fr 1fr']" :gap="10">
    <el-button
      v-for="option in props.options"
      :key="option.value"
      :label="option.label"
      :mode="props.modelValue === option.value ? 'solid' : 'outline'"
      color="blue"
      rules="rsc"
      :p="[12, 14]"
      @click="emit('update:modelValue', option.value)"
    />
  </el-grid>
</template>
