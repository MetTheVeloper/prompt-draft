<script setup lang="ts">
import { computed, reactive } from "vue";
import { useModal } from "~/composables/useModal";
import type {
  WizardModalOptionsQuestionDefinition,
  WizardQuestionDefinition,
  WizardSingleChoiceQuestionDefinition,
  WizardSubjectOverridesQuestionDefinition,
} from "~/wizard/definition";
import { normalizeWizardEntityAnswers } from "~/wizard/entities";
import WizardSubjectOverridesModal from "./WizardSubjectOverridesModal.vue";

type SubjectOverrideState = Record<
  string,
  {
    intent?: string;
    options?: Record<string, string>;
  }
>;

const props = withDefaults(
  defineProps<{
    question: WizardSubjectOverridesQuestionDefinition;
    modelValue?: unknown;
    answerValues?: Record<string, unknown>;
    questions?: readonly WizardQuestionDefinition[];
  }>(),
  {
    answerValues: () => ({}),
    questions: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: SubjectOverrideState): void;
}>();

const modal = useModal();

const subjects = computed(() =>
  normalizeWizardEntityAnswers(props.answerValues[props.question.subjectsAnswerId]),
);

const intentQuestion = computed(() =>
  props.questions.find(
    (question): question is WizardSingleChoiceQuestionDefinition =>
      question.id === props.question.sharedIntentAnswerId &&
      question.type === "singleChoice",
  ),
);

const optionsQuestion = computed(() =>
  props.questions.find(
    (question): question is WizardModalOptionsQuestionDefinition =>
      question.id === props.question.sharedOptionsAnswerId &&
      question.type === "modalOptions",
  ),
);

function cleanStringMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && item.trim()) result[key] = item;
  }
  return result;
}

function currentValue(): SubjectOverrideState {
  if (!props.modelValue || typeof props.modelValue !== "object" || Array.isArray(props.modelValue)) {
    return {};
  }

  const validSubjectIds = new Set(subjects.value.map((subject) => subject.id));
  const result: SubjectOverrideState = {};
  for (const [subjectId, raw] of Object.entries(props.modelValue as Record<string, unknown>)) {
    if (!validSubjectIds.has(subjectId) || !raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const intent = typeof record.intent === "string" && record.intent.trim()
      ? record.intent
      : undefined;
    const options = cleanStringMap(record.options);
    if (intent || Object.keys(options).length) {
      result[subjectId] = {
        ...(intent ? { intent } : {}),
        options,
      };
    }
  }
  return result;
}

const overrideCount = computed(() => Object.keys(currentValue()).length);
const buttonLabel = computed(() => {
  const base = props.question.buttonLabel || "Customize per subject";
  return overrideCount.value ? `${base} · ${overrideCount.value} custom` : base;
});

function openOverrides() {
  if (!intentQuestion.value || !optionsQuestion.value || subjects.value.length < 2) return;

  const state = reactive<SubjectOverrideState>(structuredClone(currentValue()));
  const sharedIntentRaw = props.answerValues[props.question.sharedIntentAnswerId];
  const sharedIntent = typeof sharedIntentRaw === "string" ? sharedIntentRaw : undefined;
  const sharedOptions = cleanStringMap(
    props.answerValues[props.question.sharedOptionsAnswerId],
  );

  modal.open({
    header: {
      icon: "group",
      title: props.question.modalTitle || props.question.title,
      subtitle:
        props.question.description ||
        "Keep the shared look for everyone, or customize only the people who should differ.",
      color: "blue",
      closeButton: true,
    },
    component: WizardSubjectOverridesModal,
    props: {
      question: props.question,
      subjects: subjects.value,
      state,
      sharedIntent,
      sharedOptions,
      intentQuestion: intentQuestion.value,
      optionsQuestion: optionsQuestion.value,
    },
    actions: [
      {
        label: "Cancel",
        mode: "flat",
        color: "normal",
        close: true,
      },
      {
        label: "Apply subject settings",
        icon: "check",
        color: "blue",
        close: true,
        handler: () => emit("update:modelValue", structuredClone(state)),
      },
    ],
    options: {
      width: 820,
      maxHeight: "86vh",
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}
</script>

<template>
  <el-button
    v-if="subjects.length > 1 && intentQuestion && optionsQuestion"
    :label="buttonLabel"
    icon="group"
    mode="outline"
    color="blue"
    class="w100"
    @click="openOverrides"
  />
</template>
