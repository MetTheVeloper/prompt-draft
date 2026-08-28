<script setup lang="ts">
const props = defineProps<{
  modelValue?: unknown;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <el-text-field
    type="textarea"
    :rows="4"
    :model-value="typeof props.modelValue === 'string' ? props.modelValue : ''"
    :placeholder="props.placeholder || ''"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
