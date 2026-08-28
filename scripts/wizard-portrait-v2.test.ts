import assert from "node:assert/strict";
import test from "node:test";

import { promptModules } from "../app/modules/registry.ts";
import type { SemanticTargetRef } from "../app/modules/types.ts";
import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  createWizardEntity,
  wizardEntityToPromptVariable,
} from "../app/wizard/entities.ts";
import {
  derivePortraitWizardState,
  executePortraitWizardMapping,
  normalizePortraitSubjectReference,
} from "../app/wizard/portrait.ts";
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

function createV2Session() {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const person = createWizardEntity("person", [], "Sarah Connor");

  session = answer(session, "creationMode", "from_description");
  session = answer(session, "subjects", [person]);
  session = answer(session, "portraitIntent", "professional");
  session = answer(session, "expressionIntent", "natural");
  session = answer(session, "hairIntent", "polished");
  session = answer(session, "outfitIntent", "professional");
  session = answer(session, "framingIntent", "head_shoulders");
  session = answer(session, "poseIntent", "formal");
  session = answer(session, "environmentType", "studio");
  session = answer(session, "studioDirection", "soft gray studio");
  session = answer(session, "lightingIntent", "clean");
  session = answer(session, "aspectRatio", "4:5");

  return { session, person };
}

function v2HostContext(person: ReturnType<typeof createWizardEntity>) {
  const variable = wizardEntityToPromptVariable(person);
  const target = normalizePortraitSubjectReference(variable);
  assert.ok(target);

  return {
    modules: promptModules,
    environment: {
      subjectAssignmentTargets: [
        {
          label: variable.value || variable.key,
          target,
        },
      ],
    },
    idFactory: {
      variable: () => variable.id,
      expressionAssignment: () => "expr-v2-1",
      poseAssignment: () => "pose-v2-1",
      hairStyle: () => "hair-v2-1",
      outfitSet: () => "outfit-set-v2-1",
      outfitItem: () => "outfit-item-v2-1",
    },
  };
}

test("Portrait v2 derives Wizard-owned subject identity and deterministic fallback idea", () => {
  const { session } = createV2Session();
  const derived = derivePortraitWizardState(session);

  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.equal(derived.value.promptMode, "text_to_image");
  assert.equal(derived.value.subjectTokens.length, 1);
  assert.equal(derived.value.subjectToken, "{sarah_Connor}");
  assert.equal(
    derived.value.promptIdea,
    "Create a professional portrait featuring {sarah_Connor}",
  );
  assert.equal(derived.value.aspectRatio, "4:5");
});

test("Portrait v2 mapping creates its subject variable inside the isolated Working Draft", async () => {
  const { session, person } = createV2Session();
  const original = JSON.parse(JSON.stringify(session.workingDraft));
  const mapping = await executePortraitWizardMapping(
    session,
    v2HostContext(person),
  );

  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  assert.deepEqual(session.workingDraft, original);
  assert.equal(mapping.session.workingDraft.promptSettings.mode, "text_to_image");
  assert.equal(mapping.session.workingDraft.promptSettings.aspectRatio, "4:5");
  assert.equal(
    mapping.session.workingDraft.promptSettings.idea,
    "Create a professional portrait featuring {sarah_Connor}",
  );
  assert.ok(mapping.session.workingDraft.selectedModuleKeys.includes("variables"));

  const variables = mapping.session.workingDraft.moduleValues.variables
    ?.variables as Array<{ id: string; key: string; type: string }>;
  assert.equal(variables.length, 1);
  assert.equal(variables[0]?.id, person.id);
  assert.equal(variables[0]?.key, person.key);
  assert.equal(variables[0]?.type, "subject");

  const expression = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Array<{ targets: SemanticTargetRef[] }>;
  assert.equal(expression[0]?.targets[0]?.variableId, person.id);
});
