import assert from "node:assert/strict";
import test from "node:test";

import { promptModules } from "../app/modules/registry.ts";
import type { SemanticTargetRef } from "../app/modules/types.ts";
import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  createWizardEntity,
  wizardEntityToPromptVariable,
} from "../app/wizard/entities.ts";
import { normalizePortraitSubjectReference } from "../app/wizard/portrait.ts";
import { executePortraitWizardMappingWithSubjectOverrides } from "../app/wizard/portraitSubjectOverrides.ts";
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

function createMultiSubjectSession() {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const met = createWizardEntity("person", [], "Met");
  const zahra = createWizardEntity("person", [met], "Zahra");

  session = answer(session, "creationMode", "from_image");
  session = answer(session, "subjects", [met, zahra]);
  session = answer(session, "portraitIntent", "fashion");
  session = answer(session, "expressionIntent", "natural");
  session = answer(session, "hairIntent", "natural");
  session = answer(session, "outfitIntent", "professional");
  session = answer(session, "framingIntent", "head_shoulders");
  session = answer(session, "poseIntent", "natural");
  session = answer(session, "environmentType", "studio");
  session = answer(session, "lightingIntent", "soft");
  session = answer(session, "aspectRatio", "4:5");

  return { session, met, zahra };
}

function multiHostContext(
  entities: ReturnType<typeof createWizardEntity>[],
) {
  const variables = entities.map(wizardEntityToPromptVariable);
  const targets = variables.map((variable) => {
    const target = normalizePortraitSubjectReference(variable);
    assert.ok(target);
    return { variable, target };
  });

  let variableIndex = 0;
  let expressionIndex = 0;
  let poseIndex = 0;
  let hairIndex = 0;
  let outfitSetIndex = 0;
  let outfitItemIndex = 0;

  return {
    modules: promptModules,
    environment: {
      subjectAssignmentTargets: targets.map(({ variable, target }) => ({
        label: variable.label || variable.key,
        target,
      })),
    },
    idFactory: {
      variable: () => variables[variableIndex++]?.id || `variable-${variableIndex}`,
      expressionAssignment: () => `expression-${++expressionIndex}`,
      poseAssignment: () => `pose-${++poseIndex}`,
      hairStyle: () => `hair-${++hairIndex}`,
      outfitSet: () => `outfit-set-${++outfitSetIndex}`,
      outfitItem: () => `outfit-item-${++outfitItemIndex}`,
    },
  };
}

function targetIds(value: unknown) {
  const targets = (value as { targets?: SemanticTargetRef[] }).targets || [];
  return targets.map((target) => target.variableId);
}

test("Portrait v2 splits shared Look and Pose settings into per-subject canonical assignments/configurations", async () => {
  let { session, met, zahra } = createMultiSubjectSession();

  session = answer(session, "expressionSubjectOverrides", {
    [zahra.id]: {
      intent: "serious",
      options: { mouthState: "smirk" },
    },
  });
  session = answer(session, "hairSubjectOverrides", {
    [zahra.id]: {
      intent: "editorial",
      options: { curlPattern: "curly" },
    },
  });
  session = answer(session, "outfitSubjectOverrides", {
    [zahra.id]: {
      intent: "fashion",
      options: { fitDirection: "tailored" },
    },
  });
  session = answer(session, "poseSubjectOverrides", {
    [zahra.id]: {
      intent: "dynamic",
      options: {},
    },
  });

  const mapping = await executePortraitWizardMappingWithSubjectOverrides(
    session,
    multiHostContext([met, zahra]),
  );
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const expressionAssignments = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Array<Record<string, unknown>>;
  assert.equal(expressionAssignments.length, 2);
  const metExpression = expressionAssignments.find((item) =>
    targetIds(item).includes(met.id),
  );
  const zahraExpression = expressionAssignments.find((item) =>
    targetIds(item).includes(zahra.id),
  );
  assert.deepEqual(targetIds(metExpression), [met.id]);
  assert.deepEqual(targetIds(zahraExpression), [zahra.id]);
  assert.equal(zahraExpression?.coreExpression, "serious");
  assert.equal(zahraExpression?.mouthState, "smirk");

  const hairStyles = mapping.session.workingDraft.moduleValues.hair
    ?.hairStyles as Array<Record<string, unknown>>;
  assert.equal(hairStyles.length, 2);
  const metHair = hairStyles.find((item) => targetIds(item).includes(met.id));
  const zahraHair = hairStyles.find((item) => targetIds(item).includes(zahra.id));
  assert.deepEqual(targetIds(metHair), [met.id]);
  assert.deepEqual(targetIds(zahraHair), [zahra.id]);
  assert.equal(zahraHair?.name, "Zahra Hair");
  const zahraHairProperties = zahraHair?.properties as Record<string, unknown>;
  assert.deepEqual(zahraHairProperties.stylingState, {
    mode: "custom",
    value: "editorial styling",
  });
  assert.deepEqual(zahraHairProperties.curlPattern, {
    mode: "option",
    value: "curly",
  });

  const outfitSets = mapping.session.workingDraft.moduleValues.outfit
    ?.outfitSets as Array<{ name?: string; targets?: SemanticTargetRef[]; items: Array<Record<string, unknown>> }>;
  assert.equal(outfitSets.length, 2);
  const metOutfit = outfitSets.find((item) => targetIds(item).includes(met.id));
  const zahraOutfit = outfitSets.find((item) => targetIds(item).includes(zahra.id));
  assert.deepEqual(targetIds(metOutfit), [met.id]);
  assert.deepEqual(targetIds(zahraOutfit), [zahra.id]);
  assert.equal(zahraOutfit?.name, "Zahra Outfit");
  assert.equal(zahraOutfit?.items[0]?.customType, "fashion-forward attire");
  assert.equal(zahraOutfit?.items[0]?.additionalDetails, "tailored fit");

  const poseAssignments = mapping.session.workingDraft.moduleValues.pose
    ?.poseAssignments as Array<Record<string, unknown>>;
  assert.equal(poseAssignments.length, 2);
  const metPose = poseAssignments.find((item) => targetIds(item).includes(met.id));
  const zahraPose = poseAssignments.find((item) => targetIds(item).includes(zahra.id));
  assert.deepEqual(targetIds(metPose), [met.id]);
  assert.deepEqual(targetIds(zahraPose), [zahra.id]);
  assert.equal(metPose?.presetId, "relaxed_standing");
  assert.equal(zahraPose?.presetId, "action_ready");
});

test("Portrait v2 per-subject keep-reference removes that person from the shared Outfit Set", async () => {
  let { session, met, zahra } = createMultiSubjectSession();
  session = answer(session, "outfitIntent", "fashion");
  session = answer(session, "outfitSubjectOverrides", {
    [zahra.id]: { intent: "keep_reference", options: {} },
  });

  const mapping = await executePortraitWizardMappingWithSubjectOverrides(
    session,
    multiHostContext([met, zahra]),
  );
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const outfitSets = mapping.session.workingDraft.moduleValues.outfit
    ?.outfitSets as Array<Record<string, unknown>>;
  assert.equal(outfitSets.length, 1);
  assert.deepEqual(targetIds(outfitSets[0]), [met.id]);
});
