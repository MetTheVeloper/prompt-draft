import assert from "node:assert/strict";
import test from "node:test";

import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptVariable, SemanticTargetRef } from "../app/modules/types.ts";
import { promptModules } from "../app/modules/registry.ts";
import { portraitWizardV1Definition } from "../app/wizard/definition.ts";
import {
  applyPortraitWizardRules,
  derivePortraitWizardState,
  executePortraitWizardMapping,
  normalizePortraitSubjectReference,
} from "../app/wizard/portrait.ts";
import {
  createWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

const subjectVariable: PromptVariable = {
  id: "subject-var-1",
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

function subjectTarget(): SemanticTargetRef {
  const target = normalizePortraitSubjectReference(subjectVariable);
  assert.ok(target);
  return target;
}

function hostContext(modules = promptModules) {
  const target = subjectTarget();
  return {
    modules,
    environment: {
      subjectAssignmentTargets: [
        {
          label: "Portrait Subject",
          target,
        },
      ],
    },
    idFactory: {
      expressionAssignment: () => "expr-portrait-1",
      poseAssignment: () => "pose-portrait-1",
      hairStyle: () => "hair-portrait-1",
      outfitSet: () => "outfit-set-portrait-1",
      outfitItem: () => "outfit-item-portrait-1",
    },
  };
}

function answer(
  session: ReturnType<typeof createWizardSession>,
  id: string,
  value: unknown,
) {
  return setWizardUserAnswer(session, id, value);
}

function createProfessionalSession() {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());
  session = answer(session, "subjectReference", subjectVariable);
  session = answer(session, "portraitIntent", "professional");
  session = answer(session, "expressionIntent", "natural");
  session = answer(session, "hairIntent", "polished");
  session = answer(session, "outfitIntent", "professional");
  session = answer(session, "framingIntent", "head_shoulders");
  session = answer(session, "poseIntent", "formal");
  session = answer(session, "environmentType", "studio");
  session = answer(session, "studioDirection", "neutral gray portrait studio");
  session = answer(session, "lightingIntent", "clean");
  return session;
}

test("Portrait subject picker values normalize to stable semantic target identity", () => {
  assert.deepEqual(normalizePortraitSubjectReference(subjectVariable), {
    kind: "user_variable",
    value: "{person}",
    variableId: "subject-var-1",
    token: "{person}",
    label: "Person",
  });

  assert.equal(
    normalizePortraitSubjectReference({
      id: "module-variable",
      key: "module_subject",
      source: "module",
    }),
    null,
  );
});

test("Portrait rules replace stale defaults but preserve explicit lighting overrides", () => {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());
  session = answer(session, "portraitIntent", "cinematic");

  let ruled = applyPortraitWizardRules(session);
  assert.deepEqual(ruled.answers.lightingIntent, {
    value: "dramatic",
    source: "default",
  });

  ruled = answer(ruled, "portraitIntent", "professional");
  ruled = applyPortraitWizardRules(ruled);
  assert.deepEqual(ruled.answers.lightingIntent, {
    value: "soft",
    source: "default",
  });

  ruled = answer(ruled, "lightingIntent", "clean");
  ruled = answer(ruled, "portraitIntent", "cinematic");
  ruled = applyPortraitWizardRules(ruled);
  assert.deepEqual(ruled.answers.lightingIntent, {
    value: "clean",
    source: "user",
  });
});

test("Portrait derived state maps semantic answers without leaking actions into the definition", () => {
  const session = createProfessionalSession();
  const derived = derivePortraitWizardState(session);

  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.equal(derived.value.promptIdea, "professional portrait");
  assert.equal(derived.value.subjectToken, "{person}");
  assert.equal(derived.value.framingShotSize, "head_and_shoulders");
  assert.equal(derived.value.posePresetId, "neutral_standing");
  assert.equal(derived.value.backgroundPresetId, "studio_background");
  assert.equal(derived.value.environmentDetails, "neutral gray portrait studio");
  assert.equal(derived.value.lightingPresetId, "clean_studio");
});

test("Professional Portrait mapping produces canonical structured Draft state through public Actions", async () => {
  const session = createProfessionalSession();
  const activeSnapshot = JSON.parse(JSON.stringify(session.workingDraft));
  const mapping = await executePortraitWizardMapping(session, hostContext());

  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  assert.deepEqual(session.workingDraft, activeSnapshot);
  assert.equal(mapping.session.workingDraft.promptSettings.idea, "professional portrait");
  assert.equal(mapping.session.workingDraft.promptSettings.subject, "{person}");
  assert.equal(mapping.session.workingDraft.promptSettings.subjectType, "person");
  assert.equal(
    mapping.session.workingDraft.promptSettings.imageToImage.preserveComposition,
    false,
  );
  assert.equal(
    mapping.session.workingDraft.promptSettings.imageToImage.preserveLighting,
    false,
  );
  assert.equal(
    mapping.session.workingDraft.promptSettings.imageToImage.preserveOutfit,
    false,
  );
  assert.equal(
    mapping.session.workingDraft.promptSettings.imageToImage.preservePose,
    false,
  );

  const selected = mapping.session.workingDraft.selectedModuleKeys;
  for (const key of [
    "expression",
    "hair",
    "outfit",
    "framing",
    "pose",
    "background",
    "lighting",
  ]) {
    assert.ok(selected.includes(key), `expected ${key} to be active`);
  }

  const expression = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Record<string, unknown>[];
  assert.equal(expression[0]?.id, "expr-portrait-1");
  assert.equal(expression[0]?.presetId, "neutral_calm");
  assert.deepEqual(
    (expression[0]?.targets as SemanticTargetRef[])[0],
    subjectTarget(),
  );

  const hair = mapping.session.workingDraft.moduleValues.hair
    ?.hairStyles as Record<string, unknown>[];
  const hairProperties = hair[0]?.properties as Record<string, unknown>;
  assert.deepEqual(hairProperties.stylingState, {
    mode: "option",
    value: "controlled",
  });

  const outfit = mapping.session.workingDraft.moduleValues.outfit
    ?.outfitSets as Record<string, unknown>[];
  const outfitItems = outfit[0]?.items as Record<string, unknown>[];
  assert.equal(outfitItems[0]?.customType, "professional attire");

  assert.equal(
    mapping.session.workingDraft.moduleValues.framing?.shotSize,
    "head_and_shoulders",
  );

  const pose = mapping.session.workingDraft.moduleValues.pose
    ?.poseAssignments as Record<string, unknown>[];
  assert.equal(pose[0]?.presetId, "neutral_standing");

  assert.equal(
    mapping.session.workingDraft.moduleValues.background?.backgroundConcept,
    "studio_background",
  );
  assert.equal(
    mapping.session.workingDraft.moduleValues.background?.extraDetails,
    "neutral gray portrait studio",
  );
  assert.equal(
    mapping.session.workingDraft.moduleValues.lighting?.overallContrast,
    "balanced",
  );

  assert.ok(mapping.actions.every((invocation) => invocation.actionId.length > 0));
});

test("Cinematic outdoor mapping keeps keep-reference Outfit module untouched without enabling setup preserve", async () => {
  let session = createWizardSession(portraitWizardV1Definition, createDraft());
  session = answer(session, "subjectReference", subjectVariable);
  session = answer(session, "portraitIntent", "cinematic");
  session = answer(session, "expressionIntent", "confident");
  session = answer(session, "hairIntent", "editorial");
  session = answer(session, "outfitIntent", "keep_reference");
  session = answer(session, "framingIntent", "full_body");
  session = answer(session, "poseIntent", "dynamic");
  session = answer(session, "environmentType", "outdoor");
  session = answer(session, "outdoorSetting", "rainy city street at night");
  session = answer(session, "lightingIntent", "moody");

  const mapping = await executePortraitWizardMapping(session, hostContext());
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  assert.equal(
    mapping.session.workingDraft.promptSettings.idea,
    "cinematic portrait",
  );
  assert.equal(
    mapping.session.workingDraft.selectedModuleKeys.includes("outfit"),
    false,
  );
  assert.equal(mapping.session.workingDraft.moduleValues.outfit, undefined);
  assert.equal(
    mapping.session.workingDraft.promptSettings.imageToImage.preserveOutfit,
    false,
  );

  const expression = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Record<string, unknown>[];
  assert.equal(expression[0]?.additionalDetails, "confident expression");

  const hair = mapping.session.workingDraft.moduleValues.hair
    ?.hairStyles as Record<string, unknown>[];
  const hairProperties = hair[0]?.properties as Record<string, unknown>;
  assert.deepEqual(hairProperties.stylingState, {
    mode: "custom",
    value: "editorial styling",
  });

  assert.equal(
    mapping.session.workingDraft.moduleValues.framing?.shotSize,
    "full_subject",
  );
  const pose = mapping.session.workingDraft.moduleValues.pose
    ?.poseAssignments as Record<string, unknown>[];
  assert.equal(pose[0]?.presetId, "action_ready");
  assert.equal(
    mapping.session.workingDraft.moduleValues.background?.backgroundConcept,
    "outdoor_environment",
  );
  assert.equal(
    mapping.session.workingDraft.moduleValues.background?.extraDetails,
    "rainy city street at night",
  );
  assert.equal(
    mapping.session.workingDraft.moduleValues.lighting?.overallContrast,
    "high",
  );
});

test("Keep-reference Hair maps to the canonical main-reference source instead of a silent no-op", async () => {
  let session = createProfessionalSession();
  session = answer(session, "hairIntent", "keep_reference");

  const mapping = await executePortraitWizardMapping(session, hostContext());
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const hair = mapping.session.workingDraft.moduleValues.hair
    ?.hairStyles as Record<string, unknown>[];
  assert.deepEqual(hair[0]?.source, {
    mode: "reference",
    reference: {
      token: "{reference}",
      label: "Reference",
      source: "system",
    },
  });
});

test("Portrait mapping rolls the Working Draft back when a later canonical Action fails", async () => {
  const session = createProfessionalSession();
  const before = JSON.parse(JSON.stringify(session.workingDraft));
  const modulesWithoutLighting = promptModules.filter(
    (module) => module.key !== "lighting",
  );

  const mapping = await executePortraitWizardMapping(
    session,
    hostContext(modulesWithoutLighting),
  );

  assert.equal(mapping.ok, false);
  if (mapping.ok) return;

  assert.deepEqual(mapping.session.workingDraft, before);
  assert.deepEqual(session.workingDraft, before);
  assert.equal(mapping.session.derived.promptIdea, "professional portrait");
  assert.ok(
    mapping.actions.some((invocation) => invocation.actionId === "module.activate"),
  );
  assert.ok(mapping.issues.some((item) => item.code === "module_not_found"));
});

test("Portrait derivation rejects missing subject references before any mutation planning", async () => {
  const session = createWizardSession(portraitWizardV1Definition, createDraft());
  const mapping = await executePortraitWizardMapping(session, hostContext());

  assert.equal(mapping.ok, false);
  if (mapping.ok) return;
  assert.deepEqual(mapping.actions, []);
  assert.ok(
    mapping.issues.some(
      (item) => item.code === "portrait_subject_reference_required",
    ),
  );
  assert.deepEqual(mapping.session.workingDraft.selectedModuleKeys, []);
});
