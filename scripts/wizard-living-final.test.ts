import assert from "node:assert/strict";
import test from "node:test";

import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import { derivePortraitWizardState } from "../app/wizard/portrait.ts";
import {
  getPortraitLivingFinalPhase,
  getPortraitLivingFinalProgress,
  setPortraitLivingFinalPhase,
} from "../app/wizard/portraitLivingFinalPresentation.ts";
import { createPortraitLivingSubjects } from "../app/wizard/portraitLivingPresentation.ts";
import {
  createFreshWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

function answer(
  session: ReturnType<typeof createFreshWizardSession>,
  id: string,
  value: unknown,
) {
  return setWizardUserAnswer(session, id, value);
}

function baseFinalSession(mode: "from_image" | "from_description") {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = answer(session, "creationMode", mode);
  session = answer(
    session,
    "subjects",
    createPortraitLivingSubjects(
      1,
      mode === "from_image" ? "image_to_image" : "text_to_image",
    ),
  );
  session = answer(session, "portraitIntent", "professional");
  session = answer(session, "framingIntent", "headshot");
  session = answer(session, "environmentType", "studio");
  session = answer(session, "lightingIntent", "soft");
  return { ...session, currentStepId: "final-settings" };
}

test("Portrait Final definition exposes the accepted seven aspect ratios", () => {
  const step = portraitWizardV2Definition.steps.find(
    (item) => item.id === "final-settings",
  );
  const question = step?.questions.find((item) => item.id === "aspectRatio");
  assert.equal(question?.type, "singleChoice");
  if (question?.type !== "singleChoice") return;

  assert.deepEqual(
    question.options.map((option) => option.value),
    ["1:1", "4:5", "5:4", "3:4", "4:3", "9:16", "16:9"],
  );
});

test("Create Final contains only the Aspect Ratio presentation state", () => {
  let session = baseFinalSession("from_description");

  assert.equal(getPortraitLivingFinalPhase(session), "aspect-ratio");
  assert.equal(getPortraitLivingFinalProgress(session), 0);

  session = setPortraitLivingFinalPhase(session, "transformation-strength");
  assert.equal(getPortraitLivingFinalPhase(session), "aspect-ratio");
});

test("Transform Final progress follows Aspect Ratio Reference Fidelity and Transformation Strength", () => {
  let session = baseFinalSession("from_image");

  assert.equal(getPortraitLivingFinalPhase(session), "aspect-ratio");
  assert.equal(getPortraitLivingFinalProgress(session), 0);

  session = setPortraitLivingFinalPhase(session, "reference-fidelity");
  assert.equal(getPortraitLivingFinalProgress(session), 1 / 3);

  session = setPortraitLivingFinalPhase(session, "transformation-strength");
  assert.equal(getPortraitLivingFinalProgress(session), 2 / 3);
});

test("Transform Final recovers from user-owned answers when persisted micro-state metadata is absent", () => {
  let session = baseFinalSession("from_image");
  session = answer(session, "aspectRatio", "4:5");

  assert.equal(getPortraitLivingFinalPhase(session), "reference-fidelity");

  session = answer(session, "referenceUsage", "strict");
  assert.equal(getPortraitLivingFinalPhase(session), "transformation-strength");
});

test("Portrait canonical mapping supports accepted 5:4 and 4:3 landscape ratios", () => {
  let session = baseFinalSession("from_description");
  session = answer(session, "aspectRatio", "5:4");

  let derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;
  assert.equal(derived.value.aspectRatio, "common_landscape_5_4");

  session = answer(session, "aspectRatio", "4:3");
  derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;
  assert.equal(derived.value.aspectRatio, "common_landscape_4_3");
});
