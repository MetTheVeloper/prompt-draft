import assert from "node:assert/strict";
import test from "node:test";

import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptVariable } from "../app/modules/types.ts";
import { promptModules } from "../app/modules/registry.ts";
import { completeWizardSession } from "../app/wizard/completion.ts";
import { portraitWizardV1Definition } from "../app/wizard/definition.ts";
import { completePortraitWizard } from "../app/wizard/portraitCompletion.ts";
import { buildPortraitWizardReview } from "../app/wizard/portraitReview.ts";
import {
  createWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

const subjectVariable: PromptVariable = {
  id: "subject-var-review-1",
  key: "person",
  value: "portrait subject",
  label: "Person",
  type: "subject",
  enabled: true,
  source: "user",
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

function answer(
  session: ReturnType<typeof createWizardSession>,
  id: string,
  value: unknown,
) {
  return setWizardUserAnswer(session, id, value);
}

function createPortraitSession(intent: "professional" | "cinematic" = "professional") {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());
  session = answer(session, "subjectReference", subjectVariable);
  session = answer(session, "portraitIntent", intent);
  return session;
}

function hostContext() {
  return {
    modules: promptModules,
  };
}

test("Portrait review resolves semantic labels and deterministic defaults without exposing implementation IDs", () => {
  let session = createPortraitSession("cinematic");
  session = answer(session, "environmentType", "outdoor");
  session = answer(session, "outdoorSetting", "rainy city street");

  const review = buildPortraitWizardReview(session);
  assert.equal(review.ok, true);
  if (!review.ok) return;

  assert.deepEqual(
    review.items.map((item) => [item.id, item.value, item.source]),
    [
      ["subjectReference", "Person", "user"],
      ["portraitIntent", "Cinematic", "user"],
      ["framingIntent", "Head and shoulders", "default"],
      ["environmentType", "Outdoor", "user"],
      ["outdoorSetting", "rainy city street", "user"],
      ["lightingIntent", "Dramatic", "default"],
    ],
  );

  const serialized = JSON.stringify(review.items);
  assert.equal(serialized.includes("low_key"), false);
  assert.equal(serialized.includes("module.activate"), false);
});

test("Portrait review preserves an explicit user lighting override over the Cinematic recommendation", () => {
  let session = createPortraitSession("cinematic");
  session = answer(session, "lightingIntent", "clean");

  const review = buildPortraitWizardReview(session);
  assert.equal(review.ok, true);
  if (!review.ok) return;

  const lighting = review.items.find((item) => item.id === "lightingIntent");
  assert.deepEqual(lighting, {
    id: "lightingIntent",
    stepId: "lighting",
    label: "Lighting mood",
    value: "Clean",
    source: "user",
    answerId: "lightingIntent",
  });
});

test("generic Wizard completion stops after canonical validation errors and never compiles", async () => {
  const session = createWizardSession(portraitWizardV1Definition, createDraft());
  const before = JSON.parse(JSON.stringify(session.workingDraft));

  const completion = await completeWizardSession(session, hostContext());
  assert.equal(completion.ok, false);
  if (completion.ok) return;

  assert.equal(completion.stage, "validation");
  assert.deepEqual(
    completion.actions.map((action) => action.actionId),
    ["prompt.validate"],
  );
  assert.ok(
    completion.validationIssues?.some(
      (issue) => issue.code === "no_modules_selected",
    ),
  );
  assert.deepEqual(session.workingDraft, before);
});

test("Portrait completion maps, validates, compiles, and leaves the original Active Draft untouched", async () => {
  const activeDraft = createDraft();
  const activeSnapshot = JSON.parse(JSON.stringify(activeDraft));
  let session = createWizardSession(portraitWizardV1Definition, activeDraft);
  session = answer(session, "subjectReference", subjectVariable);
  session = answer(session, "portraitIntent", "cinematic");
  session = answer(session, "environmentType", "outdoor");
  session = answer(session, "outdoorSetting", "rainy city street at night");

  const result = await completePortraitWizard(session, hostContext());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(activeDraft, activeSnapshot);
  assert.equal(result.completion.validation.valid, true);
  assert.equal(result.completion.validation.hasErrors, false);
  assert.equal(result.completion.compilation.format, "modular");
  assert.ok(result.completion.compilation.output.includes("cinematic portrait"));
  assert.deepEqual(
    result.completion.actions.map((action) => action.actionId),
    ["prompt.validate", "prompt.compile"],
  );

  assert.deepEqual(
    result.completion.finalDraft,
    result.mapping.session.workingDraft,
  );
  assert.notEqual(
    result.completion.finalDraft,
    result.mapping.session.workingDraft,
  );
  assert.ok(result.completion.finalDraft.selectedModuleKeys.includes("framing"));
  assert.ok(result.completion.finalDraft.selectedModuleKeys.includes("background"));
  assert.ok(result.completion.finalDraft.selectedModuleKeys.includes("lighting"));
});

test("completion format override affects only the read result and does not rewrite persisted outputFormat", async () => {
  const session = createPortraitSession("professional");
  const result = await completePortraitWizard(
    session,
    hostContext(),
    { format: "natural" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.completion.compilation.format, "natural");
  assert.equal(result.completion.finalDraft.outputFormat, "modular");
  assert.deepEqual(result.completion.actions[1], {
    actionId: "prompt.compile",
    input: { format: "natural" },
  });
});

test("Portrait completion never enters validation/compile when mapping fails", async () => {
  const session = createWizardSession(portraitWizardV1Definition, createDraft());
  const result = await completePortraitWizard(session, hostContext());

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.stage, "mapping");
  assert.deepEqual(result.mapping.actions, []);
  assert.ok(
    result.mapping.issues.some(
      (issue) => issue.code === "portrait_subject_reference_required",
    ),
  );
});
