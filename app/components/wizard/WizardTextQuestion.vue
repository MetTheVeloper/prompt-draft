<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: unknown;
    placeholder?: string;
    rows?: number;
  }>(),
  {
    rows: 4,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <el-text-field
    type="textarea"
    :rows="props.rows"
    :actions="false"
    :model-value="typeof props.modelValue === 'string' ? props.modelValue : ''"
    :placeholder="props.placeholder || ''"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
