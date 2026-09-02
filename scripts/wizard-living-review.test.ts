import assert from "node:assert/strict";
import test from "node:test";

import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  beginPortraitLivingReviewEdit,
  completePortraitLivingReviewConfirmation,
  getPortraitLivingReviewEditContext,
  resizePortraitLivingReviewSubjects,
  resolvePortraitLivingReviewChoice,
} from "../app/wizard/portraitLivingReviewPresentation.ts";
import {
  createPortraitLivingSubjects,
  getPortraitLivingCompositionPhase,
  getPortraitLivingPeopleState,
} from "../app/wizard/portraitLivingPresentation.ts";
import { getPortraitLivingFinalPhase } from "../app/wizard/portraitLivingFinalPresentation.ts";
import { getPortraitLivingScenePhase } from "../app/wizard/portraitLivingScenePresentation.ts";
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

function reviewSession(mode: "from_image" | "from_description") {
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
  session = answer(session, "aspectRatio", "4:5");
  if (mode === "from_image") {
    session = answer(session, "referenceUsage", "balanced");
    session = answer(session, "transformationStrength", "balanced");
  }
  return { ...session, currentStepId: "review" };
}

test("Living Review targets the exact Look micro-state instead of replaying the chapter", () => {
  let session = reviewSession("from_image");
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "hairIntent",
    stepId: "appearance",
  });

  assert.equal(session.currentStepId, "appearance");
  assert.deepEqual(session.derived.livingUi, {
    lookDomain: "hair",
    lookPhase: "choice",
  });
  assert.equal(getPortraitLivingReviewEditContext(session)?.originAnswerId, "hairIntent");

  session = answer(session, "hairIntent", "editorial");
  session = resolvePortraitLivingReviewChoice(session, "hairIntent");
  assert.equal(session.currentStepId, "review");
  assert.equal(getPortraitLivingReviewEditContext(session), null);
});

test("Headshot to body framing asks only the newly relevant Pose before returning to Review", () => {
  let session = reviewSession("from_image");
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "framingIntent",
    stepId: "composition",
  });
  session = answer(session, "framingIntent", "half_body");
  session = resolvePortraitLivingReviewChoice(session, "framingIntent");

  assert.equal(session.currentStepId, "composition");
  assert.equal(getPortraitLivingCompositionPhase(session), "pose-choice");
  assert.equal(getPortraitLivingReviewEditContext(session)?.pending, "pose");
  assert.equal(session.answers.poseIntent, undefined);

  session = answer(session, "poseIntent", "natural");
  session = resolvePortraitLivingReviewChoice(session, "poseIntent");
  assert.equal(session.currentStepId, "review");
});

test("Transform to Create removes transform-only answers and returns directly to Review", () => {
  let session = reviewSession("from_image");
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "creationMode",
    stepId: "start",
  });
  session = answer(session, "creationMode", "from_description");
  session = resolvePortraitLivingReviewChoice(session, "creationMode");

  assert.equal(session.currentStepId, "review");
  assert.equal(session.answers.referenceUsage, undefined);
  assert.equal(session.answers.transformationStrength, undefined);
});

test("Create to Transform resolves Reference Fidelity then Transformation Strength only", () => {
  let session = reviewSession("from_description");
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "creationMode",
    stepId: "start",
  });
  session = answer(session, "creationMode", "from_image");
  session = resolvePortraitLivingReviewChoice(session, "creationMode");

  assert.equal(session.currentStepId, "final-settings");
  assert.equal(getPortraitLivingFinalPhase(session), "reference-fidelity");
  assert.equal(getPortraitLivingReviewEditContext(session)?.pending, "reference");

  session = answer(session, "referenceUsage", "strict");
  session = resolvePortraitLivingReviewChoice(session, "referenceUsage");
  assert.equal(getPortraitLivingFinalPhase(session), "transformation-strength");
  assert.equal(getPortraitLivingReviewEditContext(session)?.pending, "strength");

  session = answer(session, "transformationStrength", "strong");
  session = resolvePortraitLivingReviewChoice(session, "transformationStrength");
  assert.equal(session.currentStepId, "review");
});

test("One Person to Multiple preserves the existing Subject and asks count configuration only", () => {
  let session = reviewSession("from_description");
  const original = createPortraitLivingSubjects(1, "text_to_image")[0]!;
  session = answer(session, "subjects", [original]);
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "subjects",
    stepId: "subjects",
  });

  const resized = resizePortraitLivingReviewSubjects(
    [original],
    3,
    "text_to_image",
  );
  assert.equal(resized[0]?.id, original.id);
  assert.equal(resized.length, 3);

  session = answer(session, "subjects", resized);
  session = resolvePortraitLivingReviewChoice(session, "subjects");
  assert.equal(session.currentStepId, "subjects");
  assert.equal(getPortraitLivingPeopleState(session), "configure");
  assert.equal(getPortraitLivingReviewEditContext(session)?.pending, "people-config");

  session = completePortraitLivingReviewConfirmation(session);
  assert.equal(session.currentStepId, "review");
});

test("Scene type edits keep the contextual detail state before returning to Review", () => {
  let session = reviewSession("from_image");
  session = beginPortraitLivingReviewEdit(session, {
    answerId: "environmentType",
    stepId: "environment",
  });
  session = answer(session, "environmentType", "outdoor");
  session = resolvePortraitLivingReviewChoice(session, "environmentType");

  assert.equal(session.currentStepId, "environment");
  assert.equal(getPortraitLivingScenePhase(session), "environment-detail");
  assert.equal(getPortraitLivingReviewEditContext(session)?.pending, "environment-confirm");

  session = completePortraitLivingReviewConfirmation(session);
  assert.equal(session.currentStepId, "review");
});
