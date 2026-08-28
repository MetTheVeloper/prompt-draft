<script setup lang="ts">
import { computed, reactive } from "vue";
import { useModal } from "~/composables/useModal";
import type { WizardModalOptionsQuestionDefinition } from "~/wizard/definition";
import WizardMoreOptionsModal from "./WizardMoreOptionsModal.vue";

const props = defineProps<{
  question: WizardModalOptionsQuestionDefinition;
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: Record<string, string>): void;
}>();

const modal = useModal();

function currentValue() {
  if (!props.modelValue || typeof props.modelValue !== "object" || Array.isArray(props.modelValue)) {
    return {} as Record<string, string>;
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(props.modelValue as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) result[key] = value;
  }
  return result;
}

const selectedCount = computed(() => Object.keys(currentValue()).length);
const buttonLabel = computed(() => {
  const base = props.question.buttonLabel || "More options";
  return selectedCount.value ? `${base} · ${selectedCount.value} set` : base;
});

function openOptions() {
  const state = reactive<Record<string, string>>({ ...currentValue() });

  modal.open({
    header: {
      icon: "tune",
      title: props.question.modalTitle || props.question.title,
      subtitle: props.question.description || "Optional details for this part of the portrait.",
      color: "blue",
      closeButton: true,
    },
    component: WizardMoreOptionsModal,
    props: {
      question: props.question,
      state,
    },
    actions: [
      {
        label: "Cancel",
        mode: "flat",
        color: "normal",
        close: true,
      },
      {
        label: "Apply options",
        icon: "check",
        color: "blue",
        close: true,
        handler: () => {
          emit("update:modelValue", { ...state });
        },
      },
    ],
    options: {
      width: 760,
      maxHeight: "84vh",
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}
</script>

<template>
  <el-button
    :label="buttonLabel"
    icon="tune"
    mode="outline"
    color="blue"
    class="w100"
    @click="openOptions"
  />
</template>
