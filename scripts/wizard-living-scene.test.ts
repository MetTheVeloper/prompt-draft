import assert from "node:assert/strict";
import test from "node:test";

import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  clearPortraitLivingEnvironmentDetailAnswers,
  getPortraitLivingEnvironmentDetail,
  getPortraitLivingScenePhase,
  getPortraitLivingSceneProgress,
  portraitLivingEnvironmentDetailAnswerId,
  setPortraitLivingScenePhase,
} from "../app/wizard/portraitLivingScenePresentation.ts";
import {
  createFreshWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

test("Scene presentation ignores the canonical environment default until user intent exists", () => {
  const session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "environment",
  };

  assert.equal(session.answers.environmentType?.source, "default");
  assert.equal(getPortraitLivingScenePhase(session), "environment-choice");
  assert.equal(getPortraitLivingSceneProgress(session), 0);
});

test("Scene progress follows choice detail optional refinement and Lighting", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "environment",
  };

  session = setWizardUserAnswer(session, "environmentType", "outdoor");
  session = setPortraitLivingScenePhase(session, "environment-detail");
  assert.equal(getPortraitLivingSceneProgress(session), 1 / 3);

  session = setPortraitLivingScenePhase(session, "environment-refine");
  assert.equal(getPortraitLivingSceneProgress(session), 1 / 2);

  session = { ...session, currentStepId: "lighting" };
  assert.equal(getPortraitLivingSceneProgress(session), 2 / 3);

  session = setWizardUserAnswer(session, "lightingIntent", "moody");
  assert.equal(getPortraitLivingSceneProgress(session), 1);
});

test("Scene detail answer ids follow the selected canonical environment type", () => {
  assert.equal(portraitLivingEnvironmentDetailAnswerId("studio"), "studioDirection");
  assert.equal(portraitLivingEnvironmentDetailAnswerId("outdoor"), "outdoorSetting");
  assert.equal(portraitLivingEnvironmentDetailAnswerId("abstract"), "abstractDirection");
  assert.equal(portraitLivingEnvironmentDetailAnswerId("unknown"), null);
});

test("Changing the main Scene choice can discard stale contextual detail answers", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = setWizardUserAnswer(session, "studioDirection", "gray cyc wall");
  session = setWizardUserAnswer(session, "outdoorSetting", "riverbank");
  session = setWizardUserAnswer(session, "abstractDirection", "soft geometric void");

  session = clearPortraitLivingEnvironmentDetailAnswers(session);

  assert.equal(session.answers.studioDirection, undefined);
  assert.equal(session.answers.outdoorSetting, undefined);
  assert.equal(session.answers.abstractDirection, undefined);
});

test("Environment refinement and Scene micro-state survive JSON session persistence", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "environment",
  };
  session = setWizardUserAnswer(session, "environmentType", "outdoor");
  session = setWizardUserAnswer(session, "outdoorSetting", "quiet lakeside at dawn");
  session = setWizardUserAnswer(session, "backgroundOptions", {
    setting: "natural",
    spatialStructure: "expansive",
    backgroundMaterial: "stone",
    detailDensity: "restrained",
    backgroundElement: "water",
  });
  session = setPortraitLivingScenePhase(session, "environment-refine");

  const restored = JSON.parse(JSON.stringify(session)) as typeof session;

  assert.equal(getPortraitLivingScenePhase(restored), "environment-refine");
  assert.equal(getPortraitLivingEnvironmentDetail(restored, "outdoor"), "quiet lakeside at dawn");
  assert.deepEqual(restored.answers.backgroundOptions?.value, {
    setting: "natural",
    spatialStructure: "expansive",
    backgroundMaterial: "stone",
    detailDensity: "restrained",
    backgroundElement: "water",
  });
});
