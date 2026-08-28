<script setup lang="ts">
import type { PromptVariable } from "~/modules/types";
import { useVariablePickerModal } from "~/composables/prompt/useVariablePickerModal";

const props = defineProps<{
  modelValue?: unknown;
  variables: PromptVariable[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: PromptVariable): void;
}>();

const { openVariablePicker } = useVariablePickerModal();

const selected = computed(() => {
  const value = props.modelValue as Partial<PromptVariable> | undefined;
  return value?.label || value?.key || "Select subject";
});

function openPicker() {
  openVariablePicker({
    variables: props.variables,
    systemVariables: [],
    force: true,
    insertOnSelect: false,
    closeOnSelect: true,
    onSelect: (variable) => emit("update:modelValue", variable),
  });
}
</script>

<template>
  <el-button
    icon="person"
    color="blue"
    rules="rsc"
    :label="selected"
    :p="[12, 14]"
    @click="openPicker"
  />
</template>
