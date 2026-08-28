<script setup lang="ts">
import type { PromptVariable } from "~/modules/types";
import { resolveWizardRuntime } from "~/wizard/registry";
import {
  createWizardSession,
  getWizardVisibleQuestions,
  goToNextWizardStep,
  goToPreviousWizardStep,
  setWizardUserAnswer,
  type WizardSession,
} from "~/wizard/session";
import {
  commitWizardFinalDraft,
  loadActiveDraftForWizard,
} from "~/wizard/hostDraft";
import type { PortraitWizardReview } from "~/wizard/portraitReview";
import type { PortraitWizardCompletionResult } from "~/wizard/portraitCompletion";

const route = useRoute();
const router = useRouter();
const wizardId = computed(() => String(route.params.wizardId || ""));
const runtime = computed(() => resolveWizardRuntime(wizardId.value));

const session = ref<WizardSession | null>(null);
const review = ref<PortraitWizardReview | null>(null);
const issueMessage = ref("");
const isBusy = ref(false);

const currentStep = computed(() => {
  const active = session.value;
  const entry = runtime.value;
  if (!active || !entry) return null;
  return entry.definition.steps.find((step) => step.id === active.currentStepId) || null;
});

const visibleQuestions = computed(() => {
  if (!session.value || !runtime.value || currentStep.value?.kind === "review") return [];
  return getWizardVisibleQuestions(runtime.value.definition, session.value);
});

const visibleSteps = computed(() => {
  if (!session.value || !runtime.value) return [];
  return runtime.value.definition.steps.filter((step) => {
    if (!step.visibleWhen) return true;
    const answer = session.value?.answers[step.visibleWhen.answerId];
    if (!answer) return false;
    const matches = Object.is(answer.value, step.visibleWhen.value);
    return step.visibleWhen.operator === "equals" ? matches : !matches;
  });
});

const currentStepIndex = computed(() => {
  return visibleSteps.value.findIndex((step) => step.id === session.value?.currentStepId);
});

const progress = computed(() => {
  if (!visibleSteps.value.length) return 0;
  return (currentStepIndex.value + 1) / visibleSteps.value.length;
});

const subjectVariables = computed<PromptVariable[]>(() => {
  const raw = session.value?.workingDraft.moduleValues.variables?.variables;
  if (!Array.isArray(raw)) return [];
  return (raw as PromptVariable[]).filter(
    (variable) => variable.type === "subject" && variable.enabled !== false,
  );
});

function isAnswered(questionId: string) {
  const answer = session.value?.answers[questionId];
  if (!answer) return false;
  if (typeof answer.value === "string") return Boolean(answer.value.trim());
  return answer.value !== null && answer.value !== undefined;
}

function setAnswer(questionId: string, value: unknown) {
  if (!session.value) return;
  session.value = setWizardUserAnswer(session.value, questionId, value);
  issueMessage.value = "";
}

function ensureCurrentStepValid() {
  const missing = visibleQuestions.value.find(
    (question) => question.required && !isAnswered(question.id),
  );
  if (!missing) return true;
  issueMessage.value = `Please answer “${missing.title}” before continuing.`;
  return false;
}

function next() {
  if (!session.value || !runtime.value || !ensureCurrentStepValid()) return;
  session.value = goToNextWizardStep(session.value, runtime.value.definition);
  refreshReview();
}

function back() {
  if (!session.value || !runtime.value) return;
  session.value = goToPreviousWizardStep(session.value, runtime.value.definition);
  issueMessage.value = "";
  refreshReview();
}

function editStep(stepId: string) {
  if (!session.value) return;
  session.value = { ...session.value, currentStepId: stepId };
  issueMessage.value = "";
}

function refreshReview() {
  if (!session.value || !runtime.value || currentStep.value?.kind !== "review") {
    review.value = null;
    return;
  }
  review.value = runtime.value.buildReview(session.value) as PortraitWizardReview;
  if (review.value.ok) session.value = review.value.session;
}

async function finish() {
  if (!session.value || !runtime.value) return;
  isBusy.value = true;
  issueMessage.value = "";

  try {
    const result = (await runtime.value.complete(session.value)) as PortraitWizardCompletionResult;
    if (!result.ok) {
      issueMessage.value =
        result.stage === "mapping"
          ? "Some portrait choices could not be applied. Review your answers and try again."
          : "The generated draft could not be validated or compiled. Review the Wizard choices and try again.";
      return;
    }

    const committed = commitWizardFinalDraft(result.completion.finalDraft);
    if (!committed) {
      issueMessage.value = "The portrait was completed, but the active draft could not be updated.";
      return;
    }

    await router.push("/create");
  } finally {
    isBusy.value = false;
  }
}

function cancel() {
  router.push("/create");
}

onMounted(() => {
  const entry = runtime.value;
  const activeDraft = loadActiveDraftForWizard();

  if (!entry || !activeDraft) {
    issueMessage.value = !entry
      ? `Unknown Wizard: ${wizardId.value}`
      : "No active draft is available. Open Create first, then launch the Wizard.";
    return;
  }

  session.value = createWizardSession(entry.definition, activeDraft);
});

watch(
  () => session.value?.currentStepId,
  () => refreshReview(),
);
</script>

<template>
  <WizardShell
    v-if="runtime && session && currentStep"
    :title="runtime.definition.title"
    :step-title="currentStep.title"
    :step-description="currentStep.description"
    :progress="progress"
    :can-go-back="currentStepIndex > 0"
    :is-review="currentStep.kind === 'review'"
    :is-busy="isBusy"
    @back="back"
    @next="next"
    @finish="finish"
    @cancel="cancel"
  >
    <el-grid v-if="currentStep.kind !== 'review'" :gap="20">
      <WizardQuestionRenderer
        v-for="question in visibleQuestions"
        :key="question.id"
        :question="question"
        :model-value="session.answers[question.id]?.value"
        :variables="subjectVariables"
        @update:model-value="setAnswer(question.id, $event)"
      />
    </el-grid>

    <WizardReview
      v-else-if="review?.ok"
      :items="review.items"
      @edit="editStep"
    />

    <el-text v-if="issueMessage" :size="12" color="red">
      {{ issueMessage }}
    </el-text>
  </WizardShell>

  <el-grid v-else rules="csc" :gap="12" style="max-width: 720px; margin: 40px auto; padding: 16px">
    <el-text :size="20" :weight="700">Wizard unavailable</el-text>
    <el-text :size="13" color="normal55">{{ issueMessage || 'Loading Wizard…' }}</el-text>
    <el-button label="Back to Create" color="blue" @click="cancel" />
  </el-grid>
</template>
