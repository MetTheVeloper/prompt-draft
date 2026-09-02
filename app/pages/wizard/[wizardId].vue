<script setup lang="ts">
import type { PromptDraftState } from "~/modules/promptDraft.types";
import WizardLivingComposition from "~/components/wizard/living/WizardLivingComposition.vue";
import WizardLivingEntry from "~/components/wizard/living/WizardLivingEntry.vue";
import WizardLivingFinal from "~/components/wizard/living/WizardLivingFinal.vue";
import WizardLivingLook from "~/components/wizard/living/WizardLivingLook.vue";
import WizardLivingPeople from "~/components/wizard/living/WizardLivingPeople.vue";
import WizardLivingPortrait from "~/components/wizard/living/WizardLivingPortrait.vue";
import WizardLivingScene from "~/components/wizard/living/WizardLivingScene.vue";
import WizardLivingShell from "~/components/wizard/living/WizardLivingShell.vue";
import WizardLivingSubjectConfig from "~/components/wizard/living/WizardLivingSubjectConfig.vue";
import type {
  WizardModalOptionsQuestionDefinition,
  WizardSingleChoiceQuestionDefinition,
  WizardSubjectOverridesQuestionDefinition,
} from "~/wizard/definition";
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
import {
  isWizardEntityDefinitionComplete,
  normalizeWizardEntityAnswers,
} from "~/wizard/entities";
import type { PortraitIntent } from "~/wizard/portrait";
import {
  buildPortraitLivingSentenceTokens,
  clearPortraitLivingPoseAnswers,
  createPortraitLivingSubjects,
  getPortraitLivingChapterProgress,
  getPortraitLivingCompositionPhase,
  getPortraitLivingLookState,
  getPortraitLivingPeopleState,
  getPortraitLivingPromptMode,
  PORTRAIT_LIVING_CHAPTERS,
  PORTRAIT_LIVING_LOOK_ANSWER_IDS,
  setPortraitLivingCompositionPhase,
  setPortraitLivingLookState,
  setPortraitLivingPeopleState,
  type PortraitLivingLookDomain,
  type WizardLivingLocalizer,
} from "~/wizard/portraitLivingPresentation";
import {
  getPortraitLivingFinalPhase,
  getPortraitLivingFinalProgress,
  isPortraitLivingTransformMode,
  setPortraitLivingFinalPhase,
  type PortraitLivingFinalPhase,
} from "~/wizard/portraitLivingFinalPresentation";
import {
  clearPortraitLivingEnvironmentDetailAnswers,
  getPortraitLivingEnvironmentDetail,
  getPortraitLivingScenePhase,
  getPortraitLivingSceneProgress,
  portraitLivingEnvironmentDetailAnswerId,
  setPortraitLivingScenePhase,
  type PortraitLivingScenePhase,
} from "~/wizard/portraitLivingScenePresentation";
import { addWizardDraftToCreate } from "~/wizard/hostDraft";
import { usePromptTemplateUi } from "~/composables/usePromptTemplateUi";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
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

const livingLocalizer = computed<WizardLivingLocalizer>(() => ({
  t: (key, params) => t(key, params || {}),
  list: (items) => new Intl.ListFormat(locale.value, {
    style: "long",
    type: "conjunction",
  }).format([...items]),
}));

const livingChapters = computed(() =>
  PORTRAIT_LIVING_CHAPTERS.map((chapter) => ({
    ...chapter,
    label: t(chapter.label),
  })),
);

const currentStep = computed(() => {
  if (!session.value || !runtime.value) return null;
  return getWizardCurrentStep(runtime.value.definition, session.value);
});

const visibleQuestions = computed(() => {
  if (!session.value || !runtime.value || currentStep.value?.kind === "review") return [];
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
const isPortraitLivingRuntime = computed(() =>
  runtime.value?.id === "portrait" && session.value?.wizardVersion === 2,
);
const isLivingEntry = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "start",
);
const isLivingPeople = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "subjects",
);
const isLivingPortrait = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "intent",
);
const isLivingLook = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "appearance",
);
const isLivingComposition = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "composition",
);
const isLivingScene = computed(() =>
  isPortraitLivingRuntime.value &&
  (currentStep.value?.id === "environment" || currentStep.value?.id === "lighting"),
);
const isLivingFinal = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.id === "final-settings",
);

const livingSentenceTokens = computed(() =>
  session.value
    ? buildPortraitLivingSentenceTokens(session.value, livingLocalizer.value)
    : [],
);
const livingPeopleState = computed(() =>
  session.value ? getPortraitLivingPeopleState(session.value) : "choice",
);
const livingLookState = computed(() =>
  session.value
    ? getPortraitLivingLookState(session.value)
    : ({ domain: "expression", phase: "choice" } as const),
);
const livingCompositionPhase = computed(() =>
  session.value ? getPortraitLivingCompositionPhase(session.value) : "framing",
);
const livingScenePhase = computed(() =>
  session.value ? getPortraitLivingScenePhase(session.value) : "environment-choice",
);
const livingFinalPhase = computed(() =>
  session.value ? getPortraitLivingFinalPhase(session.value) : "aspect-ratio",
);
const livingChapterProgress = computed(() => {
  if (!session.value) return null;
  if (isLivingFinal.value) return getPortraitLivingFinalProgress(session.value);
  if (isLivingScene.value) return getPortraitLivingSceneProgress(session.value);
  return getPortraitLivingChapterProgress(session.value);
});
const livingPromptMode = computed(() =>
  session.value ? getPortraitLivingPromptMode(session.value) : "image_to_image",
);
const livingSubjects = computed(() =>
  normalizeWizardEntityAnswers(session.value?.answers.subjects?.value),
);
const livingLookAnswerIds = computed(() =>
  PORTRAIT_LIVING_LOOK_ANSWER_IDS[livingLookState.value.domain],
);

function singleChoiceQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "singleChoice" ? question : null;
}

function modalOptionsQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "modalOptions" ? question : null;
}

function subjectOverridesQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "subjectOverrides" ? question : null;
}

const livingLookIntentQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion(livingLookAnswerIds.value.intent),
);
const livingLookOptionsQuestion = computed<WizardModalOptionsQuestionDefinition | null>(() =>
  modalOptionsQuestion(livingLookAnswerIds.value.options),
);
const livingLookOverrideQuestion = computed<WizardSubjectOverridesQuestionDefinition | null>(() =>
  subjectOverridesQuestion(livingLookAnswerIds.value.overrides),
);
const livingFramingQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("framingIntent"),
);
const livingPoseQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("poseIntent"),
);
const livingPoseOptionsQuestion = computed<WizardModalOptionsQuestionDefinition | null>(() =>
  modalOptionsQuestion("poseOptions"),
);
const livingPoseOverrideQuestion = computed<WizardSubjectOverridesQuestionDefinition | null>(() =>
  subjectOverridesQuestion("poseSubjectOverrides"),
);
const livingEnvironmentQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("environmentType"),
);
const livingBackgroundOptionsQuestion = computed<WizardModalOptionsQuestionDefinition | null>(() =>
  modalOptionsQuestion("backgroundOptions"),
);
const livingLightingQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("lightingIntent"),
);
const livingAspectRatioQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("aspectRatio"),
);
const livingReferenceUsageQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("referenceUsage"),
);
const livingTransformationStrengthQuestion = computed<WizardSingleChoiceQuestionDefinition | null>(() =>
  singleChoiceQuestion("transformationStrength"),
);

const livingFramingValue = computed(() =>
  session.value?.answers.framingIntent?.source === "user"
    ? session.value.answers.framingIntent.value
    : undefined,
);
const livingPoseValue = computed(() =>
  session.value?.answers.poseIntent?.source === "user"
    ? session.value.answers.poseIntent.value
    : undefined,
);
const livingEnvironmentValue = computed(() =>
  session.value?.answers.environmentType?.source === "user"
    ? session.value.answers.environmentType.value
    : undefined,
);
const livingEnvironmentDetailAnswerId = computed(() =>
  portraitLivingEnvironmentDetailAnswerId(livingEnvironmentValue.value),
);
const livingEnvironmentDetailValue = computed(() =>
  session.value
    ? getPortraitLivingEnvironmentDetail(session.value, livingEnvironmentValue.value)
    : "",
);
const livingLightingValue = computed(() =>
  session.value?.answers.lightingIntent?.source === "user"
    ? session.value.answers.lightingIntent.value
    : undefined,
);
const livingAspectRatioValue = computed(() =>
  session.value?.answers.aspectRatio?.source === "user"
    ? session.value.answers.aspectRatio.value
    : undefined,
);
const livingReferenceUsageValue = computed(() =>
  session.value?.answers.referenceUsage?.source === "user"
    ? session.value.answers.referenceUsage.value
    : undefined,
);
const livingTransformationStrengthValue = computed(() =>
  session.value?.answers.transformationStrength?.source === "user"
    ? session.value.answers.transformationStrength.value
    : undefined,
);

function isAnswered(question: (typeof visibleQuestions.value)[number]) {
  const answer = session.value?.answers[question.id];
  if (!answer) return false;

  if (question.type === "entityCollection") {
    const entities = normalizeWizardEntityAnswers(answer.value);
    if (entities.length < Math.max(question.min || 0, 1)) return false;

    if (
      question.id === "subjects" &&
      session.value?.wizardId === "portrait" &&
      session.value.wizardVersion === 2
    ) {
      const mode = session.value.answers.creationMode?.value === "from_description"
        ? "text_to_image"
        : "image_to_image";
      return entities.every((entity) => isWizardEntityDefinitionComplete(entity, mode));
    }
    return true;
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

function advanceResolvedSession(nextSession: WizardSession) {
  if (!runtime.value) return;
  session.value = goToNextWizardStep(
    runtime.value.resolveSession(nextSession),
    runtime.value.definition,
  );
  issueMessage.value = "";
}

function chooseCreationMode(value: "from_image" | "from_description") {
  if (!session.value) return;
  let nextSession = setWizardUserAnswer(session.value, "creationMode", value);
  nextSession = setPortraitLivingPeopleState(nextSession, "choice");
  advanceResolvedSession(nextSession);
}

function chooseOnePerson() {
  if (!session.value) return;
  const mode = getPortraitLivingPromptMode(session.value);
  let nextSession = setWizardUserAnswer(
    session.value,
    "subjects",
    createPortraitLivingSubjects(1, mode),
  );
  nextSession = setPortraitLivingPeopleState(nextSession, "choice");
  advanceResolvedSession(nextSession);
}

function chooseMultiplePeople() {
  if (!session.value) return;
  session.value = setPortraitLivingPeopleState(session.value, "count");
  issueMessage.value = "";
}

function choosePeopleCount(value: 2 | 3 | 4) {
  if (!session.value || !runtime.value) return;
  const mode = getPortraitLivingPromptMode(session.value);
  let nextSession = setWizardUserAnswer(
    session.value,
    "subjects",
    createPortraitLivingSubjects(value, mode),
  );
  nextSession = setPortraitLivingPeopleState(nextSession, "configure");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function choosePortraitIntent(value: PortraitIntent) {
  if (!session.value) return;
  let nextSession = setWizardUserAnswer(session.value, "portraitIntent", value);
  nextSession = setPortraitLivingLookState(nextSession, {
    domain: "expression",
    phase: "choice",
  });
  advanceResolvedSession(nextSession);
}

function chooseLookIntent(value: string) {
  if (!session.value || !runtime.value) return;
  const domain = livingLookState.value.domain;
  const answerId = PORTRAIT_LIVING_LOOK_ANSWER_IDS[domain].intent;
  let nextSession = setWizardUserAnswer(session.value, answerId, value);
  nextSession = setPortraitLivingLookState(nextSession, { domain, phase: "refine" });
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function updateLookOptions(value: Record<string, string>) {
  setAnswer(livingLookAnswerIds.value.options, value);
}

function updateLookOverrides(
  value: Record<string, { intent?: string; options?: Record<string, string> }>,
) {
  setAnswer(livingLookAnswerIds.value.overrides, value);
}

function setLookMicroState(domain: PortraitLivingLookDomain, phase: "choice" | "refine") {
  if (!session.value) return;
  session.value = setPortraitLivingLookState(session.value, { domain, phase });
  issueMessage.value = "";
}

function continueLook() {
  const state = livingLookState.value;
  if (state.phase !== "refine") return;
  if (state.domain === "expression") {
    setLookMicroState("hair", "choice");
    return;
  }
  if (state.domain === "hair") {
    setLookMicroState("outfit", "choice");
    return;
  }
  next();
}

function chooseFraming(value: string) {
  if (!session.value || !runtime.value) return;
  let nextSession = setWizardUserAnswer(session.value, "framingIntent", value);

  if (value === "headshot") {
    nextSession = clearPortraitLivingPoseAnswers(nextSession);
    nextSession = setPortraitLivingCompositionPhase(nextSession, "framing");
    advanceResolvedSession(nextSession);
    return;
  }

  nextSession = setPortraitLivingCompositionPhase(nextSession, "pose-choice");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function choosePoseIntent(value: string) {
  if (!session.value || !runtime.value) return;
  let nextSession = setWizardUserAnswer(session.value, "poseIntent", value);
  nextSession = setPortraitLivingCompositionPhase(nextSession, "pose-refine");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function updatePoseOptions(value: Record<string, string>) {
  setAnswer("poseOptions", value);
}

function updatePoseOverrides(
  value: Record<string, { intent?: string; options?: Record<string, string> }>,
) {
  setAnswer("poseSubjectOverrides", value);
}

function continueComposition() {
  if (livingCompositionPhase.value !== "pose-refine") return;
  next();
}

function setSceneMicroState(value: PortraitLivingScenePhase) {
  if (!session.value) return;
  session.value = setPortraitLivingScenePhase(session.value, value);
  issueMessage.value = "";
}

function chooseEnvironment(value: string) {
  if (!session.value || !runtime.value) return;
  let nextSession = session.value;
  if (livingEnvironmentValue.value !== value) {
    nextSession = clearPortraitLivingEnvironmentDetailAnswers(nextSession);
  }
  nextSession = setWizardUserAnswer(nextSession, "environmentType", value);
  nextSession = setPortraitLivingScenePhase(nextSession, "environment-detail");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function updateEnvironmentDetail(value: string) {
  const answerId = livingEnvironmentDetailAnswerId.value;
  if (!answerId) return;
  setAnswer(answerId, value);
}

function updateBackgroundOptions(value: Record<string, string>) {
  setAnswer("backgroundOptions", value);
}

function continueEnvironment() {
  if (!session.value || !runtime.value || currentStep.value?.id !== "environment") return;
  const nextSession = setPortraitLivingScenePhase(session.value, "environment-detail");
  session.value = goToNextWizardStep(
    runtime.value.resolveSession(nextSession),
    runtime.value.definition,
  );
  issueMessage.value = "";
}

function chooseLighting(value: string) {
  if (!session.value) return;
  let nextSession = setWizardUserAnswer(session.value, "lightingIntent", value);
  nextSession = setPortraitLivingFinalPhase(nextSession, "aspect-ratio");
  advanceResolvedSession(nextSession);
}

function setFinalMicroState(value: PortraitLivingFinalPhase) {
  if (!session.value) return;
  session.value = setPortraitLivingFinalPhase(session.value, value);
  issueMessage.value = "";
}

function chooseAspectRatio(value: string) {
  if (!session.value || !runtime.value) return;
  let nextSession = setWizardUserAnswer(session.value, "aspectRatio", value);

  if (isPortraitLivingTransformMode(nextSession)) {
    nextSession = setPortraitLivingFinalPhase(nextSession, "reference-fidelity");
    session.value = runtime.value.resolveSession(nextSession);
    issueMessage.value = "";
    return;
  }

  advanceResolvedSession(nextSession);
}

function chooseReferenceUsage(value: string) {
  if (!session.value || !runtime.value) return;
  let nextSession = setWizardUserAnswer(session.value, "referenceUsage", value);
  nextSession = setPortraitLivingFinalPhase(nextSession, "transformation-strength");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function chooseTransformationStrength(value: string) {
  if (!session.value) return;
  const nextSession = setWizardUserAnswer(session.value, "transformationStrength", value);
  advanceResolvedSession(nextSession);
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

function livingBack() {
  if (!session.value) return;

  if (isLivingLook.value) {
    const state = livingLookState.value;
    if (state.phase === "refine") {
      setLookMicroState(state.domain, "choice");
      return;
    }
    if (state.domain === "outfit") {
      setLookMicroState("hair", "refine");
      return;
    }
    if (state.domain === "hair") {
      setLookMicroState("expression", "refine");
      return;
    }
    back();
    return;
  }

  if (isLivingComposition.value) {
    const phase = livingCompositionPhase.value;
    if (phase === "pose-refine") {
      session.value = setPortraitLivingCompositionPhase(session.value, "pose-choice");
      issueMessage.value = "";
      return;
    }
    if (phase === "pose-choice") {
      session.value = setPortraitLivingCompositionPhase(session.value, "framing");
      issueMessage.value = "";
      return;
    }
    back();
    return;
  }

  if (isLivingScene.value) {
    if (currentStep.value?.id === "lighting" && runtime.value) {
      const previous = goToPreviousWizardStep(session.value, runtime.value.definition);
      session.value = setPortraitLivingScenePhase(previous, "environment-detail");
      issueMessage.value = "";
      return;
    }

    const phase = livingScenePhase.value;
    if (phase === "environment-refine") {
      setSceneMicroState("environment-detail");
      return;
    }
    if (phase === "environment-detail") {
      setSceneMicroState("environment-choice");
      return;
    }
    back();
    return;
  }

  if (isLivingFinal.value) {
    const phase = livingFinalPhase.value;
    if (phase === "transformation-strength") {
      setFinalMicroState("reference-fidelity");
      return;
    }
    if (phase === "reference-fidelity") {
      setFinalMicroState("aspect-ratio");
      return;
    }
    back();
    return;
  }

  if (!isLivingPeople.value) {
    back();
    return;
  }

  if (livingPeopleState.value === "configure") {
    session.value = setPortraitLivingPeopleState(session.value, "count");
    issueMessage.value = "";
    return;
  }

  if (livingPeopleState.value === "count") {
    session.value = setPortraitLivingPeopleState(session.value, "choice");
    issueMessage.value = "";
    return;
  }

  back();
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
      issueMessage.value = result.stage === "mapping"
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

watch(session, () => {
  scheduleSave();
  refreshReview();
}, { deep: true });

watch(() => session.value?.currentStepId, () => refreshReview());

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
      <el-button label="Save as template" icon="bookmark_add" mode="outline" color="blue" @click="saveCompletedAsTemplate" />
      <el-button label="Start another" mode="flat" color="normal" @click="beginFresh" />
      <el-button label="Continue editing in Create" icon="edit" :invert="true" color="blue" @click="continueInCreate" />
    </el-flex>
    <el-text v-if="issueMessage" :size="11" color="red">{{ issueMessage }}</el-text>
  </el-grid>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingEntry"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    current-chapter-id="start"
    :sentence-tokens="livingSentenceTokens"
    :can-go-back="false"
    :is-saved="isSaved"
    :is-busy="isBusy"
    :show-nav="false"
    :show-sentence="false">
    <WizardLivingEntry :disabled="isBusy" @choose="chooseCreationMode" />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingPeople"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingPeople
      :state="livingPeopleState"
      :disabled="isBusy"
      @one="chooseOnePerson"
      @multiple="chooseMultiplePeople"
      @count="choosePeopleCount">
      <WizardLivingSubjectConfig
        :subjects="livingSubjects"
        :mode="livingPromptMode"
        :disabled="isBusy"
        @update="setAnswer('subjects', $event)"
      />
      <el-text v-if="issueMessage" :size="12" color="red">{{ issueMessage }}</el-text>
    </WizardLivingPeople>

    <template v-if="livingPeopleState === 'configure'" #footer>
      <el-flex rules="rbc" class="w100">
        <el-text :size="10" color="normal35">{{ t('wizard.living.people.confirmedProgress') }}</el-text>
        <el-button
          :label="t('wizard.living.people.continue')"
          icon="arrow_forward"
          :invert="true"
          color="blue"
          :disable="isBusy"
          @click="next"
        />
      </el-flex>
    </template>
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingPortrait"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingPortrait :mode="livingPromptMode" :disabled="isBusy" @choose="choosePortraitIntent" />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingLook && livingLookIntentQuestion"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingLook
      :domain="livingLookState.domain"
      :phase="livingLookState.phase"
      :mode="livingPromptMode"
      :intent-question="livingLookIntentQuestion"
      :options-question="livingLookOptionsQuestion"
      :override-question="livingLookOverrideQuestion"
      :subjects="livingSubjects"
      :intent-value="session.answers[livingLookAnswerIds.intent]?.value"
      :options-value="session.answers[livingLookAnswerIds.options]?.value"
      :overrides-value="session.answers[livingLookAnswerIds.overrides]?.value"
      :disabled="isBusy"
      @choose-intent="chooseLookIntent"
      @update-options="updateLookOptions"
      @update-overrides="updateLookOverrides"
      @continue="continueLook"
    />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingComposition && livingFramingQuestion && livingPoseQuestion"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingComposition
      :phase="livingCompositionPhase"
      :framing-question="livingFramingQuestion"
      :pose-question="livingPoseQuestion"
      :pose-options-question="livingPoseOptionsQuestion"
      :pose-override-question="livingPoseOverrideQuestion"
      :subjects="livingSubjects"
      :framing-value="livingFramingValue"
      :pose-value="livingPoseValue"
      :pose-options-value="session.answers.poseOptions?.value"
      :pose-overrides-value="session.answers.poseSubjectOverrides?.value"
      :disabled="isBusy"
      @choose-framing="chooseFraming"
      @choose-pose="choosePoseIntent"
      @update-pose-options="updatePoseOptions"
      @update-pose-overrides="updatePoseOverrides"
      @continue="continueComposition"
    />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingScene && livingEnvironmentQuestion && livingLightingQuestion"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingScene
      :step="currentStep.id === 'lighting' ? 'lighting' : 'environment'"
      :phase="livingScenePhase"
      :environment-question="livingEnvironmentQuestion"
      :background-options-question="livingBackgroundOptionsQuestion"
      :lighting-question="livingLightingQuestion"
      :environment-value="livingEnvironmentValue"
      :detail-value="livingEnvironmentDetailValue"
      :background-options-value="session.answers.backgroundOptions?.value"
      :lighting-value="livingLightingValue"
      :disabled="isBusy"
      @choose-environment="chooseEnvironment"
      @update-detail="updateEnvironmentDetail"
      @update-background-options="updateBackgroundOptions"
      @phase="setSceneMicroState"
      @continue-environment="continueEnvironment"
      @choose-lighting="chooseLighting"
    />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingFinal && livingAspectRatioQuestion"
    :title="runtime.definition.title"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingFinal
      :phase="livingFinalPhase"
      :mode="livingPromptMode"
      :aspect-ratio-question="livingAspectRatioQuestion"
      :reference-usage-question="livingReferenceUsageQuestion"
      :transformation-strength-question="livingTransformationStrengthQuestion"
      :aspect-ratio-value="livingAspectRatioValue"
      :reference-usage-value="livingReferenceUsageValue"
      :transformation-strength-value="livingTransformationStrengthValue"
      :disabled="isBusy"
      @choose-aspect-ratio="chooseAspectRatio"
      @choose-reference-usage="chooseReferenceUsage"
      @choose-transformation-strength="chooseTransformationStrength"
    />
  </WizardLivingShell>

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
    @restart="restart">
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
    <el-text v-if="issueMessage" :size="12" color="red">{{ issueMessage }}</el-text>
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
