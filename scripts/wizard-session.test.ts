import assert from "node:assert/strict";
import test from "node:test";

import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";
import {
  portraitWizardV1Definition,
  portraitWizardV2Definition,
} from "../app/wizard/definition.ts";
import {
  createFreshWizardSession,
  createWizardSession,
  executeWizardAction,
  getWizardCurrentStage,
  getWizardVisibleQuestions,
  goToNextWizardStep,
  hydrateWizardSessionDefaults,
  replaceWizardDerived,
  setWizardDefaultAnswer,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";
import { normalizeWizardEntityAnswers } from "../app/wizard/entities.ts";

const styleModule: PromptKeyModule = {
  key: "style",
  fields: {
    tone: {
      id: "tone",
      type: "text",
      default: "",
    },
  },
};

function createDraft(
  overrides: Partial<PromptDraftState> = {},
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: [],
    moduleValues: {},
    modulePanelStates: {},
    promptSettings: {
      mode: "image_to_image",
      idea: "",
      subject: "",
      subjectType: "person",
      aspectRatio: "common_square",
      globalRules: "",
      imageToImage: {
        referenceUsage: "balanced",
        transformationStrength: "balanced",
        preserveMainSubject: true,
        preserveIdentity: true,
        preservePose: false,
        preserveOutfit: false,
        preserveComposition: true,
        preserveColors: false,
        preserveMaterials: false,
        preserveLighting: false,
      },
    },
    outputFormat: "modular",
    ...overrides,
  };
}

test("WizardSession clones the active draft and keeps defaults, answers, and derived state separate", () => {
  const activeDraft = createDraft();
  const activeSnapshot = JSON.parse(JSON.stringify(activeDraft));
  let session = createWizardSession(portraitWizardV1Definition, activeDraft);

  assert.notEqual(session.workingDraft, activeDraft);
  assert.deepEqual(session.workingDraft, activeDraft);
  assert.deepEqual(activeDraft, activeSnapshot);

  assert.deepEqual(session.answers.portraitIntent, {
    value: "professional",
    source: "default",
  });
  assert.deepEqual(session.answers.environmentType, {
    value: "studio",
    source: "default",
  });
  assert.deepEqual(session.derived, {});

  session = replaceWizardDerived(session, {
    styleIntent: "cinematic",
    poseImportance: "low",
  });

  assert.deepEqual(session.derived, {
    styleIntent: "cinematic",
    poseImportance: "low",
  });
  assert.deepEqual(session.answers.portraitIntent, {
    value: "professional",
    source: "default",
  });
});

test("Portrait v2 starts from a clean independent Draft and derives Stage from current Step", () => {
  const session = createFreshWizardSession(portraitWizardV2Definition);
  const subjects = normalizeWizardEntityAnswers(session.answers.subjects?.value);

  assert.equal(session.wizardVersion, 2);
  assert.equal(session.currentStepId, "start");
  assert.deepEqual(session.workingDraft.selectedModuleKeys, []);
  assert.deepEqual(session.workingDraft.moduleValues, {});
  assert.equal(session.workingDraft.promptSettings.idea, "");
  assert.equal(subjects.length, 1);
  assert.equal(subjects[0]?.kind, "person");
  assert.equal(subjects[0]?.label, "");
  assert.equal(subjects[0]?.key, "person");
  assert.equal(session.answers.subjects?.source, "default");
  assert.equal(
    getWizardCurrentStage(portraitWizardV2Definition, session)?.id,
    "start",
  );
});

test("Portrait v2 repairs an older persisted Session that is missing required entity defaults", () => {
  const session = createFreshWizardSession(portraitWizardV2Definition);
  const stale = {
    ...session,
    currentStepId: "subjects",
    answers: Object.fromEntries(
      Object.entries(session.answers).filter(([key]) => key !== "subjects"),
    ),
  };

  const repaired = hydrateWizardSessionDefaults(portraitWizardV2Definition, stale);
  const subjects = normalizeWizardEntityAnswers(repaired.answers.subjects?.value);

  assert.equal(subjects.length, 1);
  assert.equal(subjects[0]?.kind, "person");
  assert.equal(subjects[0]?.key, "person");
  assert.equal(repaired.answers.subjects?.source, "default");
});

test("rule defaults may replace defaults but never silently overwrite a user answer", () => {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());

  session = setWizardDefaultAnswer(session, "environmentType", "abstract");
  assert.deepEqual(session.answers.environmentType, {
    value: "abstract",
    source: "default",
  });

  session = setWizardUserAnswer(session, "environmentType", "outdoor");
  assert.deepEqual(session.answers.environmentType, {
    value: "outdoor",
    source: "user",
  });

  const unchanged = setWizardDefaultAnswer(
    session,
    "environmentType",
    "studio",
  );

  assert.equal(unchanged, session);
  assert.deepEqual(unchanged.answers.environmentType, {
    value: "outdoor",
    source: "user",
  });
});

test("Portrait conditional questions resolve from answer state without a general expression engine", () => {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());

  const studioQuestions = getWizardVisibleQuestions(
    portraitWizardV1Definition,
    session,
    "environment",
  ).map((question) => question.id);

  assert.deepEqual(studioQuestions, ["environmentType", "studioDirection"]);

  session = setWizardUserAnswer(session, "environmentType", "outdoor");

  const outdoorQuestions = getWizardVisibleQuestions(
    portraitWizardV1Definition,
    session,
    "environment",
  ).map((question) => question.id);

  assert.deepEqual(outdoorQuestions, ["environmentType", "outdoorSetting"]);
});

test("WizardSession navigation remains ordered and definition-driven", () => {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());

  assert.equal(session.currentStepId, "subject");

  session = goToNextWizardStep(session, portraitWizardV1Definition);
  assert.equal(session.currentStepId, "intent");

  session = goToNextWizardStep(session, portraitWizardV1Definition);
  assert.equal(session.currentStepId, "appearance");
});

test("WizardSession consumes the canonical public Actions API against Working Draft only", async () => {
  const activeDraft = createDraft();
  const activeSnapshot = JSON.parse(JSON.stringify(activeDraft));
  const session = createWizardSession(portraitWizardV1Definition, activeDraft);

  const execution = await executeWizardAction(
    session,
    {
      actionId: "module.activate",
      input: { moduleKey: "style" },
    },
    {
      modules: [styleModule],
    },
  );

  assert.equal(execution.result.ok, true);
  if (!execution.result.ok) return;

  assert.deepEqual(activeDraft, activeSnapshot);
  assert.deepEqual(session.workingDraft.selectedModuleKeys, []);
  assert.deepEqual(execution.session.workingDraft.selectedModuleKeys, ["style"]);
  assert.notEqual(execution.session.workingDraft, activeDraft);
});

test("failed canonical Actions do not advance or corrupt the Wizard Working Draft", async () => {
  const session = createWizardSession(
    portraitWizardV1Definition,
    createDraft(),
  );
  const workingSnapshot = JSON.parse(JSON.stringify(session.workingDraft));

  const execution = await executeWizardAction(
    session,
    {
      actionId: "missing.action",
      input: {},
    },
    {
      modules: [styleModule],
    },
  );

  assert.equal(execution.result.ok, false);
  assert.equal(execution.session, session);
  assert.equal(execution.session.workingDraft, session.workingDraft);
  assert.deepEqual(execution.session.workingDraft, workingSnapshot);
});
