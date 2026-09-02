<script setup lang="ts">
import type { PromptDraftState } from "~/modules/promptDraft.types";
import WizardDirectionReady from "~/components/wizard/living/WizardDirectionReady.vue";
import WizardLivingAction from "~/components/wizard/living/WizardLivingAction.vue";
import WizardLivingComposition from "~/components/wizard/living/WizardLivingComposition.vue";
import WizardLivingEntry from "~/components/wizard/living/WizardLivingEntry.vue";
import WizardLivingFinal from "~/components/wizard/living/WizardLivingFinal.vue";
import WizardLivingLook from "~/components/wizard/living/WizardLivingLook.vue";
import WizardLivingPeople from "~/components/wizard/living/WizardLivingPeople.vue";
import WizardLivingPortrait from "~/components/wizard/living/WizardLivingPortrait.vue";
import WizardLivingReview from "~/components/wizard/living/WizardLivingReview.vue";
import WizardLivingScene from "~/components/wizard/living/WizardLivingScene.vue";
import WizardLivingShell from "~/components/wizard/living/WizardLivingShell.vue";
import WizardLivingSubjectConfig from "~/components/wizard/living/WizardLivingSubjectConfig.vue";
import WizardResumeGateway from "~/components/wizard/living/WizardResumeGateway.vue";
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
  getPortraitLivingSubjectDisplayLabel,
  localizePortraitLivingQuestion,
  localizePortraitLivingSentenceParams,
  localizePortraitLivingValue,
  type PortraitLivingUiLocalizer,
} from "~/wizard/portraitLivingLocalization";
import {
  getPortraitLivingFinalPhase,
  getPortraitLivingFinalProgress,
  isPortraitLivingTransformMode,
  setPortraitLivingFinalPhase,
  type PortraitLivingFinalPhase,
} from "~/wizard/portraitLivingFinalPresentation";
import {
  beginPortraitLivingChapterEdit,
  beginPortraitLivingReviewEdit,
  completePortraitLivingReviewConfirmation,
  getPortraitLivingReviewEditContext,
  isPortraitLivingReviewEditing,
  resizePortraitLivingReviewSubjects,
  resolvePortraitLivingReviewChoice,
  returnToPortraitLivingEditAnchor,
  type PortraitLivingReviewEditTarget,
} from "~/wizard/portraitLivingReviewPresentation";
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
const { t, te, locale } = useI18n();
const wizardId = computed(() => String(route.params.wizardId || ""));
const runtime = computed(() => resolveWizardRuntime(wizardId.value));
const { openSaveDraftAsTemplate } = usePromptTemplateUi();

const session = ref<WizardSession | null>(null);
const resumeCandidate = ref<WizardSession | null>(null);
const review = ref<WizardRuntimeReview | null>(null);
const completedDraft = ref<PromptDraftState | null>(null);
const completedPromptPreview = ref("");
const issueMessage = ref("");
const isBusy = ref(false);
const isSaved = ref(false);
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const livingUiLocalizer = computed<PortraitLivingUiLocalizer>(() => ({
  t: (key, params) => t(key, params || {}),
  te: (key) => te(key),
}));

const livingLocalizer = computed<WizardLivingLocalizer>(() => ({
  t: (key, params) => {
    const nextParams = locale.value === "fa"
      ? localizePortraitLivingSentenceParams(livingUiLocalizer.value, key, params)
      : params;
    return t(key, nextParams || {});
  },
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
const isLivingReview = computed(() =>
  isPortraitLivingRuntime.value && currentStep.value?.kind === "review",
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
const livingReviewEditContext = computed(() =>
  session.value ? getPortraitLivingReviewEditContext(session.value) : null,
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
const livingPresentationSubjects = computed(() =>
  livingSubjects.value.map((subject, index) => ({
    ...subject,
    label: getPortraitLivingSubjectDisplayLabel(
      livingUiLocalizer.value,
      subject,
      index,
      livingSubjects.value.length,
    ),
  })),
);
const livingLookAnswerIds = computed(() =>
  PORTRAIT_LIVING_LOOK_ANSWER_IDS[livingLookState.value.domain],
);

function localizedQuestion<T extends (typeof allQuestions.value)[number]>(question: T) {
  return localizePortraitLivingQuestion(question, livingUiLocalizer.value);
}

function singleChoiceQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "singleChoice" ? localizedQuestion(question) : null;
}

function modalOptionsQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "modalOptions" ? localizedQuestion(question) : null;
}

function subjectOverridesQuestion(id: string) {
  const question = allQuestions.value.find((item) => item.id === id);
  return question?.type === "subjectOverrides" ? localizedQuestion(question) : null;
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

function localizedReviewValue(answerId: string | undefined, fallback: string) {
  if (!answerId || !session.value) return fallback;
  if (answerId === "subjects") {
    const labels = livingSubjects.value.map((subject, index) =>
      getPortraitLivingSubjectDisplayLabel(
        livingUiLocalizer.value,
        subject,
        index,
        livingSubjects.value.length,
      ),
    );
    return labels.length
      ? new Intl.ListFormat(locale.value, { style: "long", type: "conjunction" }).format(labels)
      : fallback;
  }
  if (answerId === "aspectRatio") {
    const raw = String(session.value.answers.aspectRatio?.value || "");
    if (!raw) return fallback;
    const descriptor = raw === "1:1"
      ? "square"
      : raw === "9:16"
        ? "vertical"
        : raw === "4:5" || raw === "3:4"
          ? "portrait"
          : "landscape";
    return t("wizard.living.review.aspectRatioValue", {
      label: t(`wizard.living.final.aspectRatio.descriptors.${descriptor}`),
      value: raw,
    });
  }
  const raw = session.value.answers[answerId]?.value;
  if (typeof raw === "string") {
    return localizePortraitLivingValue(
      livingUiLocalizer.value,
      answerId,
      raw,
      fallback,
    );
  }
  return fallback;
}

const livingReviewItems = computed(() => {
  if (!review.value?.ok) return [];
  return review.value.items.map((entry) => ({
    ...entry,
    value: localizedReviewValue(entry.answerId, entry.value),
  }));
});

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

function applyReviewChoice(nextSession: WizardSession, answerId: string) {
  if (!runtime.value || !isPortraitLivingReviewEditing(nextSession)) return false;
  session.value = runtime.value.resolveSession(
    resolvePortraitLivingReviewChoice(nextSession, answerId),
  );
  issueMessage.value = "";
  return true;
}

function completeReviewConfirmation() {
  if (!session.value || !runtime.value || !isPortraitLivingReviewEditing(session.value)) {
    return false;
  }
  session.value = runtime.value.resolveSession(
    completePortraitLivingReviewConfirmation(session.value),
  );
  issueMessage.value = "";
  return true;
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
  if (applyReviewChoice(nextSession, "creationMode")) return;
  nextSession = setPortraitLivingPeopleState(nextSession, "choice");
  advanceResolvedSession(nextSession);
}

function chooseOnePerson() {
  if (!session.value) return;
  const mode = getPortraitLivingPromptMode(session.value);
  const subjects = livingReviewEditContext.value?.originAnswerId === "subjects"
    ? resizePortraitLivingReviewSubjects(livingSubjects.value, 1, mode)
    : createPortraitLivingSubjects(1, mode);
  let nextSession = setWizardUserAnswer(session.value, "subjects", subjects);
  if (applyReviewChoice(nextSession, "subjects")) return;
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
  const subjects = livingReviewEditContext.value?.originAnswerId === "subjects"
    ? resizePortraitLivingReviewSubjects(livingSubjects.value, value, mode)
    : createPortraitLivingSubjects(value, mode);
  let nextSession = setWizardUserAnswer(session.value, "subjects", subjects);
  nextSession = setPortraitLivingPeopleState(nextSession, "configure");
  if (applyReviewChoice(nextSession, "subjects")) return;
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function continuePeople() {
  if (!ensureCurrentStepValid()) return;
  if (completeReviewConfirmation()) return;
  next();
}

function choosePortraitIntent(value: PortraitIntent) {
  if (!session.value) return;
  let nextSession = setWizardUserAnswer(session.value, "portraitIntent", value);
  if (applyReviewChoice(nextSession, "portraitIntent")) return;
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
  if (applyReviewChoice(nextSession, answerId)) return;
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
  if (completeReviewConfirmation()) return;
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
  if (applyReviewChoice(nextSession, "framingIntent")) return;

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
  if (applyReviewChoice(nextSession, "poseIntent")) return;
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
  if (completeReviewConfirmation()) return;
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
  if (applyReviewChoice(nextSession, "environmentType")) return;
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
  if (completeReviewConfirmation()) return;
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
  if (applyReviewChoice(nextSession, "lightingIntent")) return;
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
  if (applyReviewChoice(nextSession, "aspectRatio")) return;

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
  if (applyReviewChoice(nextSession, "referenceUsage")) return;
  nextSession = setPortraitLivingFinalPhase(nextSession, "transformation-strength");
  session.value = runtime.value.resolveSession(nextSession);
  issueMessage.value = "";
}

function chooseTransformationStrength(value: string) {
  if (!session.value) return;
  const nextSession = setWizardUserAnswer(session.value, "transformationStrength", value);
  if (applyReviewChoice(nextSession, "transformationStrength")) return;
  advanceResolvedSession(nextSession);
}

function ensureCurrentStepValid() {
  const missing = visibleQuestions.value.find(
    (question) => question.required && !isAnswered(question),
  );
  if (!missing) return true;
  issueMessage.value = t("wizard.living.errors.required");
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

  if (isPortraitLivingReviewEditing(session.value)) {
    session.value = runtime.value
      ? runtime.value.resolveSession(returnToPortraitLivingEditAnchor(session.value))
      : returnToPortraitLivingEditAnchor(session.value);
    issueMessage.value = "";
    return;
  }

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

function navigateLivingChapter(chapterId: string) {
  if (!session.value || !runtime.value) return;
  session.value = runtime.value.resolveSession(
    beginPortraitLivingChapterEdit(session.value, chapterId),
  );
  issueMessage.value = "";
}

function editLivingReview(target: PortraitLivingReviewEditTarget) {
  if (!session.value || !runtime.value) return;
  session.value = runtime.value.resolveSession(
    beginPortraitLivingReviewEdit(session.value, target),
  );
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
  completedPromptPreview.value = "";
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
        ? t("wizard.living.errors.mapping")
        : t("wizard.living.errors.compile");
      return;
    }

    completedDraft.value = result.finalDraft;
    completedPromptPreview.value = result.promptPreview;
    saveWizardSession(session.value);
    isSaved.value = true;
  } finally {
    isBusy.value = false;
  }
}

function editCompletedDirection() {
  if (!session.value) return;
  completedDraft.value = null;
  completedPromptPreview.value = "";
  session.value = { ...session.value, currentStepId: "review" };
  issueMessage.value = "";
}

function saveCompletedAsTemplate() {
  if (!completedDraft.value || !runtime.value || !session.value) return;
  openSaveDraftAsTemplate(completedDraft.value, {
    defaultTitle: runtime.value.draftTitle(session.value),
    description: t("wizard.living.fallback.savedFrom", {
      title: t("wizard.living.wizardTitle"),
    }),
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
    issueMessage.value = t("wizard.living.errors.handoff");
    return;
  }

  clearWizardSession(runtime.value.id);
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
    issueMessage.value = t("wizard.living.errors.unknownWizard", { id: wizardId.value });
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
  <WizardResumeGateway
    v-if="resumeCandidate && runtime"
    :title="t('wizard.living.wizardTitle')"
    @continue="resumeSaved"
    @start-over="beginFresh"
  />

  <WizardDirectionReady
    v-else-if="completedDraft && runtime && session"
    :tokens="livingSentenceTokens"
    :prompt-preview="completedPromptPreview"
    :issue="issueMessage"
    :disabled="isBusy"
    @open-create="continueInCreate"
    @save-template="saveCompletedAsTemplate"
    @start-another="beginFresh"
    @edit-direction="editCompletedDirection"
  />

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingEntry"
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    current-chapter-id="start"
    :sentence-tokens="livingSentenceTokens"
    :can-go-back="Boolean(livingReviewEditContext)"
    :is-saved="isSaved"
    :is-busy="isBusy"
    :show-nav="Boolean(livingReviewEditContext)"
    :show-sentence="Boolean(livingReviewEditContext)"
    @chapter="navigateLivingChapter"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingEntry :disabled="isBusy" @choose="chooseCreationMode" />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingPeople"
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
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
        <WizardLivingAction
          :label="t('wizard.living.people.continue')"
          :disabled="isBusy"
          @click="continuePeople"
        />
      </el-flex>
    </template>
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingPortrait"
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingPortrait :mode="livingPromptMode" :disabled="isBusy" @choose="choosePortraitIntent" />
  </WizardLivingShell>

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingLook && livingLookIntentQuestion"
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
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
      :subjects="livingPresentationSubjects"
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
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingComposition
      :phase="livingCompositionPhase"
      :framing-question="livingFramingQuestion"
      :pose-question="livingPoseQuestion"
      :pose-options-question="livingPoseOptionsQuestion"
      :pose-override-question="livingPoseOverrideQuestion"
      :subjects="livingPresentationSubjects"
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
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
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
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    :current-chapter-id="currentStageId"
    :sentence-tokens="livingSentenceTokens"
    :chapter-progress="livingChapterProgress"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    @chapter="navigateLivingChapter"
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

  <WizardLivingShell
    v-else-if="runtime && session && currentStep && isLivingReview && review?.ok"
    :title="t('wizard.living.wizardTitle')"
    :chapters="livingChapters"
    current-chapter-id="review"
    :sentence-tokens="livingSentenceTokens"
    :can-go-back="true"
    :is-saved="isSaved"
    :is-busy="isBusy"
    :show-sentence="false"
    @chapter="navigateLivingChapter"
    @back="livingBack"
    @restart="restart"
    @exit="exitWizard">
    <WizardLivingReview
      :tokens="livingSentenceTokens"
      :items="livingReviewItems"
      :mode="livingPromptMode"
      :disabled="isBusy"
      @edit="editLivingReview"
      @finish="finish"
    />
  </WizardLivingShell>

  <WizardShell
    v-else-if="runtime && session && currentStep"
    :title="t('wizard.living.wizardTitle')"
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
      {{ t('wizard.living.errors.missingReview') }}
    </el-text>
    <el-text v-if="issueMessage" :size="12" color="red">{{ issueMessage }}</el-text>
  </WizardShell>

  <el-grid
    v-else
    rules="csc"
    :gap="12"
    style="max-width: 720px; margin: 40px auto; padding: 16px">
    <el-text :size="20" :weight="700">{{ t('wizard.living.fallback.unavailable') }}</el-text>
    <el-text :size="13" color="normal55">{{ issueMessage || t('wizard.living.fallback.loading') }}</el-text>
    <el-button :label="t('wizard.living.fallback.backToCreate')" color="blue" @click="exitWizard" />
  </el-grid>
</template>