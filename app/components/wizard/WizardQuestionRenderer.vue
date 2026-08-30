<script setup lang="ts">
import type { PromptVariable } from "~/modules/types";
import type { WizardQuestionDefinition } from "~/wizard/definition";
import WizardEntityQuestion from "./WizardEntityQuestion.vue";
import WizardModalOptionsQuestion from "./WizardModalOptionsQuestion.vue";
import WizardSubjectOverridesQuestion from "./WizardSubjectOverridesQuestion.vue";

const props = withDefaults(
  defineProps<{
    question: WizardQuestionDefinition;
    modelValue?: unknown;
    variables?: PromptVariable[];
    answerValues?: Record<string, unknown>;
    questions?: readonly WizardQuestionDefinition[];
  }>(),
  {
    variables: () => [],
    answerValues: () => ({}),
    questions: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void;
}>();
</script>

<template>
  <el-grid :gap="10" class="w100">
    <el-grid
      v-if="props.question.type !== 'modalOptions' && props.question.type !== 'subjectOverrides'"
      :gap="4">
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

    <WizardModalOptionsQuestion
      v-else-if="props.question.type === 'modalOptions'"
      :question="props.question"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <WizardSubjectOverridesQuestion
      v-else-if="props.question.type === 'subjectOverrides'"
      :question="props.question"
      :model-value="props.modelValue"
      :answer-values="props.answerValues"
      :questions="props.questions"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <WizardEntityQuestion
      v-else-if="props.question.type === 'entityCollection'"
      :question="props.question"
      :model-value="props.modelValue"
      :creation-mode="props.answerValues.creationMode"
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
