import assert from "node:assert/strict";
import test from "node:test";

import type { PromptVariable } from "../app/modules/types.ts";
import { promptModules } from "../app/modules/registry.ts";
import { createPromptDraftState } from "../app/utils/promptDraftState.ts";
import { createDefaultPromptSettings } from "../app/utils/compilePromptCore.ts";
import { portraitWizardV1Definition } from "../app/wizard/definition.ts";
import { executePortraitWizardMapping } from "../app/wizard/portrait.ts";
import {
  createWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

const subjectVariable: PromptVariable = {
  id: "lighting-env-subject",
  key: "person",
  value: "portrait subject",
  label: "Person",
  type: "subject",
  enabled: true,
  source: "user",
};

function answer(
  session: ReturnType<typeof createWizardSession>,
  id: string,
  value: unknown,
) {
  return setWizardUserAnswer(session, id, value);
}

test("Outdoor Moody lighting does not compile through a studio-specific light source", async () => {
  let session = createWizardSession(
    portraitWizardV1Definition,
    createPromptDraftState(createDefaultPromptSettings()),
  );

  session = answer(session, "subjectReference", subjectVariable);
  session = answer(session, "portraitIntent", "cinematic");
  session = answer(session, "framingIntent", "headshot");
  session = answer(session, "environmentType", "outdoor");
  session = answer(session, "outdoorSetting", "brutalist urban courtyard");
  session = answer(session, "lightingIntent", "moody");

  const mapping = await executePortraitWizardMapping(session, {
    modules: promptModules,
  });

  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const lightSources = mapping.session.workingDraft.moduleValues.lighting
    ?.lightSources as Array<Record<string, unknown>>;

  assert.equal(mapping.derived.lightingPresetId, "moody_side");
  assert.equal(lightSources[0]?.sourceType, "spotlight");
  assert.notEqual(lightSources[0]?.sourceType, "studio");
  assert.equal(
    mapping.session.workingDraft.moduleValues.lighting?.overallContrast,
    "high",
  );
});
