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
  applyPortraitWizardRules,
  buildPortraitDraftTitle,
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

function completeRequiredAnswers(
  session: ReturnType<typeof createFreshWizardSession>,
) {
  let next = answer(session, "portraitIntent", "professional");
  next = answer(next, "expressionIntent", "natural");
  next = answer(next, "hairIntent", "polished");
  next = answer(next, "outfitIntent", "professional");
  next = answer(next, "framingIntent", "head_shoulders");
  next = answer(next, "poseIntent", "formal");
  next = answer(next, "environmentType", "studio");
  next = answer(next, "studioDirection", "soft gray studio");
  next = answer(next, "lightingIntent", "clean");
  next = answer(next, "aspectRatio", "4:5");
  return next;
}

function completeRequiredAnswersWithoutLook(
  session: ReturnType<typeof createFreshWizardSession>,
) {
  let next = answer(session, "portraitIntent", "professional");
  next = answer(next, "framingIntent", "head_shoulders");
  next = answer(next, "poseIntent", "formal");
  next = answer(next, "environmentType", "studio");
  next = answer(next, "lightingIntent", "clean");
  next = answer(next, "aspectRatio", "4:5");
  return next;
}

function createV2Session() {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const person = createWizardEntity("person", [], "Sarah Connor");

  session = answer(session, "creationMode", "from_description");
  session = answer(session, "subjects", [person]);
  session = completeRequiredAnswers(session);

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
          label: variable.label || variable.value || variable.key,
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
    derived.value.subjectVariables[0]?.value,
    "a person named Sarah Connor",
  );
  assert.equal(
    derived.value.promptIdea,
    "A professional portrait of {sarah_Connor} with the following settings",
  );
  assert.equal(derived.value.aspectRatio, "common_portrait_4_5");
});

test("Portrait v2 keeps generated idea as a replaceable default until the user edits it", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const met = createWizardEntity("person", [], "Met");
  const zahra = createWizardEntity("person", [met], "Zahra");

  session = answer(session, "creationMode", "from_image");
  session = answer(session, "subjects", [met, zahra]);
  session = answer(session, "portraitIntent", "fashion");
  session = applyPortraitWizardRules(session);

  assert.deepEqual(session.answers.idea, {
    value:
      "A fashion portrait of {met} and {zahra} together, with the following settings",
    source: "default",
  });

  session = answer(
    session,
    "idea",
    "A custom editorial portrait of {met} and {zahra} together",
  );
  session = answer(session, "portraitIntent", "cinematic");
  session = applyPortraitWizardRules(session);

  assert.deepEqual(session.answers.idea, {
    value: "A custom editorial portrait of {met} and {zahra} together",
    source: "user",
  });
});

test("Portrait v2 image mode grounds multiple named subjects by reference position", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const met = createWizardEntity("person", [], "Met");
  const zahra = createWizardEntity("person", [met], "Zahra");

  session = answer(session, "creationMode", "from_image");
  session = answer(session, "subjects", [met, zahra]);
  session = completeRequiredAnswers(session);

  const derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.deepEqual(
    derived.value.subjectVariables.map((variable) => variable.value),
    ["first person in {reference}", "second person in {reference}"],
  );
  assert.equal(
    derived.value.promptIdea,
    "A professional portrait of {met} and {zahra} together, with the following settings",
  );
  assert.equal(buildPortraitDraftTitle([met, zahra]), "Portrait of Met and Zahra");
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
  assert.equal(
    mapping.session.workingDraft.promptSettings.aspectRatio,
    "common_portrait_4_5",
  );
  assert.equal(
    mapping.session.workingDraft.promptSettings.idea,
    "A professional portrait of {sarah_Connor} with the following settings",
  );
  assert.ok(mapping.session.workingDraft.selectedModuleKeys.includes("variables"));

  const variables = mapping.session.workingDraft.moduleValues.variables
    ?.variables as Array<{ id: string; key: string; value: string; type: string }>;
  assert.equal(variables.length, 1);
  assert.equal(variables[0]?.id, person.id);
  assert.equal(variables[0]?.key, person.key);
  assert.equal(variables[0]?.value, "a person named Sarah Connor");
  assert.equal(variables[0]?.type, "subject");

  const expression = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Array<{ targets: SemanticTargetRef[] }>;
  assert.equal(expression[0]?.targets[0]?.variableId, person.id);
});

test("Portrait v2 Look more-options refine canonical Expression Hair and Outfit state", async () => {
  let { session, person } = createV2Session();

  session = answer(session, "expressionOptions", {
    intensity: "pronounced",
    eyeState: "narrowed",
    browState: "raised",
    mouthState: "smirk",
  });
  session = answer(session, "hairOptions", {
    length: "shoulder_length",
    curlPattern: "wavy",
    volume: "full",
    parting: "side",
  });
  session = answer(session, "outfitOptions", {
    fitDirection: "tailored",
    accessoryDirection: "minimal",
    additionalDetails: "structured shoulders",
  });

  const derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.deepEqual(derived.value.expressionOptions, {
    intensity: "pronounced",
    eyeState: "narrowed",
    browState: "raised",
    mouthState: "smirk",
  });
  assert.deepEqual(derived.value.hairOptions, {
    length: "shoulder_length",
    curlPattern: "wavy",
    volume: "full",
    parting: "side",
  });
  assert.deepEqual(derived.value.outfitOptions, {
    fitDirection: "tailored",
    accessoryDirection: "minimal",
    additionalDetails: "structured shoulders",
  });

  const mapping = await executePortraitWizardMapping(
    session,
    v2HostContext(person),
  );
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const expression = mapping.session.workingDraft.moduleValues.expression
    ?.expressionAssignments as Array<Record<string, unknown>>;
  assert.equal(expression[0]?.intensity, "pronounced");
  assert.equal(expression[0]?.eyeState, "narrowed");
  assert.equal(expression[0]?.browState, "raised");
  assert.equal(expression[0]?.mouthState, "smirk");

  const hair = mapping.session.workingDraft.moduleValues.hair
    ?.hairStyles as Array<Record<string, unknown>>;
  const properties = hair[0]?.properties as Record<string, unknown>;
  assert.deepEqual(properties.stylingState, {
    mode: "option",
    value: "controlled",
  });
  assert.deepEqual(properties.length, {
    mode: "option",
    value: "shoulder_length",
  });
  assert.deepEqual(properties.curlPattern, {
    mode: "option",
    value: "wavy",
  });
  assert.deepEqual(properties.volume, {
    mode: "option",
    value: "full",
  });
  assert.deepEqual(properties.parting, {
    mode: "option",
    value: "side",
  });

  const sets = mapping.session.workingDraft.moduleValues.outfit
    ?.outfitSets as Array<{ items: Array<Record<string, unknown>> }>;
  const outfitItem = sets[0]?.items[0];
  assert.equal(outfitItem?.customType, "professional attire");
  assert.equal(
    outfitItem?.additionalDetails,
    "tailored fit; minimal accessories; structured shoulders",
  );
});

test("Portrait v2 empty modal option records do not activate optional Look modules", async () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const person = createWizardEntity("person", [], "Sarah");

  session = answer(session, "creationMode", "from_description");
  session = answer(session, "subjects", [person]);
  session = completeRequiredAnswersWithoutLook(session);
  session = answer(session, "expressionOptions", {});
  session = answer(session, "hairOptions", {});
  session = answer(session, "outfitOptions", {});

  const mapping = await executePortraitWizardMapping(
    session,
    v2HostContext(person),
  );
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  assert.equal(mapping.session.workingDraft.selectedModuleKeys.includes("expression"), false);
  assert.equal(mapping.session.workingDraft.selectedModuleKeys.includes("hair"), false);
  assert.equal(mapping.session.workingDraft.selectedModuleKeys.includes("outfit"), false);
});

test("Portrait v2 never turns setup preserve options on, including keep-reference choices", async () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const person = createWizardEntity("person", [], "Sarah");
  session = answer(session, "creationMode", "from_image");
  session = answer(session, "subjects", [person]);
  session = completeRequiredAnswers(session);
  session = answer(session, "hairIntent", "keep_reference");
  session = answer(session, "outfitIntent", "keep_reference");

  const mapping = await executePortraitWizardMapping(
    session,
    v2HostContext(person),
  );
  assert.equal(mapping.ok, true);
  if (!mapping.ok) return;

  const imageSettings = mapping.session.workingDraft.promptSettings.imageToImage;
  assert.equal(imageSettings.preserveMainSubject, false);
  assert.equal(imageSettings.preserveIdentity, false);
  assert.equal(imageSettings.preservePose, false);
  assert.equal(imageSettings.preserveOutfit, false);
  assert.equal(imageSettings.preserveComposition, false);
  assert.equal(imageSettings.preserveColors, false);
  assert.equal(imageSettings.preserveMaterials, false);
  assert.equal(imageSettings.preserveLighting, false);
});
