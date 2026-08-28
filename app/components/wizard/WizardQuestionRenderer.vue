<script setup lang="ts">
import type { PromptVariable } from "~/modules/types";
import type { WizardQuestionDefinition } from "~/wizard/definition";
import WizardEntityQuestion from "./WizardEntityQuestion.vue";

const props = withDefaults(
  defineProps<{
    question: WizardQuestionDefinition;
    modelValue?: unknown;
    variables?: PromptVariable[];
  }>(),
  {
    variables: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void;
}>();
</script>

<template>
  <el-grid :gap="10" class="w100">
    <el-grid :gap="4">
      <el-text :size="16" :weight="700">{{ props.question.title }}</el-text>
      <el-text v-if="props.question.description" :size="12" color="normal55">
        {{ props.question.description }}
      </el-text>
    </el-grid>

    <WizardChoiceGroup
      v-if="props.question.type === 'singleChoice'"
      :options="props.question.options"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <WizardTextQuestion
      v-else-if="props.question.type === 'text'"
      :model-value="props.modelValue"
      :placeholder="props.question.placeholder"
      :rows="props.question.rows"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <WizardEntityQuestion
      v-else-if="props.question.type === 'entityCollection'"
      :question="props.question"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <WizardVariableQuestion
      v-else-if="props.question.type === 'variablePicker'"
      :model-value="props.modelValue"
      :variables="props.variables"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </el-grid>
</template>
