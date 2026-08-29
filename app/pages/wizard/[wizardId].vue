<script setup lang="ts">
import type { PromptDraftState } from "~/modules/promptDraft.types";
import {
  resolveWizardRuntime,
  type WizardRuntimeReview,
} from "~/wizard/registry";
import {
  createFreshWizardSession,
  getWizardCurrentStep,
  getWizardVisibleQuestions,
  getWizardVisibleSteps,
  goToNextWizardStep,
  goToPreviousWizardStep,
  setWizardUserAnswer,
  type WizardSession,
} from "~/wizard/session";
import {
  clearWizardSession,
  loadWizardSession,
  saveWizardSession,
} from "~/wizard/sessionPersistence";
import { normalizeWizardEntityAnswers } from "~/wizard/entities";
import { addWizardDraftToCreate } from "~/wizard/hostDraft";
import { usePromptTemplateUi } from "~/composables/usePromptTemplateUi";

const route = useRoute();
const router = useRouter();
const wizardId = computed(() => String(route.params.wizardId || ""));
const runtime = computed(() => resolveWizardRuntime(wizardId.value));
const { openSaveDraftAsTemplate } = usePromptTemplateUi();

const session = ref<WizardSession | null>(null);
const resumeCandidate = ref<WizardSession | null>(null);
const review = ref<WizardRuntimeReview | null>(null);
const completedDraft = ref<PromptDraftState | null>(null);
const issueMessage = ref("");
const isBusy = ref(false);
const isSaved = ref(false);
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const currentStep = computed(() => {
  if (!session.value || !runtime.value) return null;
  return getWizardCurrentStep(runtime.value.definition, session.value);
});

const visibleQuestions = computed(() => {
  if (!session.value || !runtime.value || currentStep.value?.kind === "review") {
    return [];
  }
  return getWizardVisibleQuestions(runtime.value.definition, session.value);
});

const allQuestions = computed(() =>
  runtime.value?.definition.steps.flatMap((step) => [...step.questions]) || [],
);

const answerValues = computed<Record<string, unknown>>(() => {
  const result: Record<string, unknown> = {};
  for (const [answerId, answer] of Object.entries(session.value?.answers || {})) {
    result[answerId] = answer.value;
  }
  return result;
});

const visibleSteps = computed(() => {
  if (!session.value || !runtime.value) return [];
  return getWizardVisibleSteps(runtime.value.definition, session.value);
});

const currentStepIndex = computed(() =>
  visibleSteps.value.findIndex((step) => step.id === session.value?.currentStepId),
);

const currentStageId = computed(() => currentStep.value?.stageId || "");

function isAnswered(question: (typeof visibleQuestions.value)[number]) {
  const answer = session.value?.answers[question.id];
  if (!answer) return false;

  if (question.type === "entityCollection") {
    const entities = normalizeWizardEntityAnswers(answer.value);
    return entities.length >= Math.max(question.min || 0, 1);
  }

  if (typeof answer.value === "string") return Boolean(answer.value.trim());
  return answer.value !== null && answer.value !== undefined;
}

function setAnswer(questionId: string, value: unknown) {
  if (!session.value || !runtime.value) return;
  const answered = setWizardUserAnswer(session.value, questionId, value);
  session.value = runtime.value.resolveSession(answered);
  issueMessage.value = "";
}

function ensureCurrentStepValid() {
  const missing = visibleQuestions.value.find(
    (question) => question.required && !isAnswered(question),
  );
  if (!missing) return true;
  issueMessage.value = `Please answer “${missing.title}” before continuing.`;
  return false;
}

function next() {
  if (!session.value || !runtime.value || !ensureCurrentStepValid()) return;
  session.value = goToNextWizardStep(session.value, runtime.value.definition);
  issueMessage.value = "";
}

function back() {
  if (!session.value || !runtime.value) return;
  session.value = goToPreviousWizardStep(session.value, runtime.value.definition);
  issueMessage.value = "";
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
  review.value = runtime.value.buildReview(session.value);
  session.value = review.value.session;
}

function beginFresh() {
  const entry = runtime.value;
  if (!entry) return;
  clearWizardSession(entry.id);
  completedDraft.value = null;
  resumeCandidate.value = null;
  session.value = entry.resolveSession(createFreshWizardSession(entry.definition));
  issueMessage.value = "";
  isSaved.value = false;
}

function resumeSaved() {
  if (!resumeCandidate.value || !runtime.value) return;
  session.value = runtime.value.resolveSession(resumeCandidate.value);
  resumeCandidate.value = null;
  issueMessage.value = "";
  isSaved.value = true;
}

function restart() {
  beginFresh();
}

async function finish() {
  if (!session.value || !runtime.value) return;
  isBusy.value = true;
  issueMessage.value = "";

  try {
    const result = await runtime.value.complete(session.value);
    if (!result.ok) {
      issueMessage.value =
        result.stage === "mapping"
          ? "Some choices could not be applied. Review your answers and try again."
          : "The generated prompt could not be validated or compiled. Review the Wizard choices and try again.";
      return;
    }

    completedDraft.value = result.finalDraft;
    clearWizardSession(runtime.value.id);
    isSaved.value = false;
  } finally {
    isBusy.value = false;
  }
}

function saveCompletedAsTemplate() {
  if (!completedDraft.value || !runtime.value || !session.value) return;

  openSaveDraftAsTemplate(completedDraft.value, {
    defaultTitle: runtime.value.draftTitle(session.value),
    description: `Saved from ${runtime.value.definition.title}.`,
    source: {
      kind: "wizard",
      wizardId: runtime.value.id,
      wizardVersion: runtime.value.definition.version,
    },
  });
}

async function continueInCreate() {
  if (!completedDraft.value || !runtime.value || !session.value) return;
  const created = addWizardDraftToCreate(
    completedDraft.value,
    runtime.value.draftTitle(session.value),
  );
  if (!created) {
    issueMessage.value = "The finished prompt could not be added to Create.";
    return;
  }
  await router.push("/create");
}

async function exitWizard() {
  await router.push("/create");
}

function scheduleSave() {
  if (!session.value || completedDraft.value) return;
  if (saveTimer) clearTimeout(saveTimer);
  isSaved.value = false;
  saveTimer = setTimeout(() => {
    if (!session.value || completedDraft.value) return;
    saveWizardSession(session.value);
    isSaved.value = true;
  }, 180);
}

onMounted(() => {
  const entry = runtime.value;
  if (!entry) {
    issueMessage.value = `Unknown Wizard: ${wizardId.value}`;
    return;
  }

  const persisted = loadWizardSession(entry.definition);
  if (persisted) {
    resumeCandidate.value = persisted;
    return;
  }

  beginFresh();
});

watch(
  session,
  () => {
    scheduleSave();
    refreshReview();
  },
  { deep: true },
);

watch(
  () => session.value?.currentStepId,
  () => refreshReview(),
);

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer);
  if (session.value && !completedDraft.value) saveWizardSession(session.value);
});
</script>

<template>
  <el-grid
    v-if="resumeCandidate && runtime"
    rules="csc"
    :gap="18"
    :p="24"
    :radius="20"
    :br="1"
    bc="normal10"
    bg="surface"
    style="max-width: 560px; margin: auto">
    <el-icon icon="history" :size="28" color="prim" />
    <el-grid :gap="6">
      <el-text :size="22" :weight="800">Continue your {{ runtime.definition.title }}?</el-text>
      <el-text :size="12" color="normal50">
        Your previous Wizard session was saved on this device. Continue where you left off or start again.
      </el-text>
    </el-grid>
    <el-flex rules="rsc" :gap="8">
      <el-button label="Start over" mode="flat" color="normal" @click="beginFresh" />
      <el-button label="Continue" icon="arrow_forward" :invert="true" color="blue" @click="resumeSaved" />
    </el-flex>
  </el-grid>

  <el-grid
    v-else-if="completedDraft && runtime"
    rules="csc"
    :gap="20"
    :p="28"
    :radius="22"
    :br="1"
    bc="normal10"
    bg="surface"
    style="max-width: 620px; margin: auto">
    <el-icon icon="check_circle" :size="34" color="green" />
    <el-grid :gap="6">
      <el-text :size="24" :weight="800">Your portrait prompt is ready</el-text>
      <el-text :size="12" color="normal50">
        The Wizard completed successfully. Nothing in Create has been changed.
      </el-text>
    </el-grid>
    <el-flex rules="rsc" :gap="8">
      <el-button
        label="Save as template"
        icon="bookmark_add"
        mode="outline"
        color="blue"
        @click="saveCompletedAsTemplate"
      />
      <el-button label="Start another" mode="flat" color="normal" @click="beginFresh" />
      <el-button
        label="Continue editing in Create"
        icon="edit"
        :invert="true"
        color="blue"
        @click="continueInCreate"
      />
    </el-flex>
    <el-text v-if="issueMessage" :size="11" color="red">{{ issueMessage }}</el-text>
  </el-grid>

  <WizardShell
    v-else-if="runtime && session && currentStep"
    :title="runtime.definition.title"
    :step-title="currentStep.title"
    :step-description="currentStep.description"
    :stages="runtime.definition.stages || []"
    :current-stage-id="currentStageId"
    :can-go-back="currentStepIndex > 0"
    :is-review="currentStep.kind === 'review'"
    :is-busy="isBusy"
    :is-saved="isSaved"
    @back="back"
    @next="next"
    @finish="finish"
    @exit="exitWizard"
    @restart="restart"
  >
    <el-grid v-if="currentStep.kind !== 'review'" :gap="24" class="w100">
      <WizardQuestionRenderer
        v-for="question in visibleQuestions"
        :key="question.id"
        :question="question"
        :model-value="session.answers[question.id]?.value"
        :answer-values="answerValues"
        :questions="allQuestions"
        @update:model-value="setAnswer(question.id, $event)"
      />
    </el-grid>

    <WizardReview
      v-else-if="review?.ok"
      :items="review.items"
      :definition="runtime.definition"
      @edit="editStep"
    />

    <el-text v-if="review && !review.ok" :size="12" color="red">
      Some required Wizard information is still missing.
    </el-text>

    <el-text v-if="issueMessage" :size="12" color="red">
      {{ issueMessage }}
    </el-text>
  </WizardShell>

  <el-grid
    v-else
    rules="csc"
    :gap="12"
    style="max-width: 720px; margin: 40px auto; padding: 16px">
    <el-text :size="20" :weight="700">Wizard unavailable</el-text>
    <el-text :size="13" color="normal55">{{ issueMessage || 'Loading Wizard…' }}</el-text>
    <el-button label="Back to Create" color="blue" @click="exitWizard" />
  </el-grid>
</template>
