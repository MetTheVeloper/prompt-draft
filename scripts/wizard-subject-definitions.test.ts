import assert from "node:assert/strict";
import test from "node:test";

import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  createWizardEntity,
  getWizardEntityDisplayLabel,
  resolveWizardEntityVariableValue,
} from "../app/wizard/entities.ts";
import {
  buildPortraitDraftTitle,
  derivePortraitWizardState,
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

function completeRequired(
  session: ReturnType<typeof createFreshWizardSession>,
) {
  let next = answer(session, "portraitIntent", "professional");
  next = answer(next, "framingIntent", "head_shoulders");
  next = answer(next, "environmentType", "studio");
  next = answer(next, "lightingIntent", "clean");
  next = answer(next, "aspectRatio", "4:5");
  return next;
}

test("unnamed Portrait subjects keep unique variable keys and indexed display labels", () => {
  const first = createWizardEntity("person");
  const second = createWizardEntity("person", [first]);
  const third = createWizardEntity("person", [first, second]);

  assert.equal(first.key, "person");
  assert.equal(second.key, "person_2");
  assert.equal(third.key, "person_3");

  assert.equal(getWizardEntityDisplayLabel(first, 0, 3), "Person 1");
  assert.equal(getWizardEntityDisplayLabel(second, 1, 3), "Person 2");
  assert.equal(getWizardEntityDisplayLabel(third, 2, 3), "Person 3");
  assert.equal(
    buildPortraitDraftTitle([first, second, third]),
    "Portrait of Person 1, Person 2, and Person 3",
  );
});

test("image mode subject definitions can use semantics instead of fragile reference order", () => {
  const first = {
    ...createWizardEntity("person"),
    definition: { strategy: "semantic", descriptor: "male_person" } as const,
  };
  const second = {
    ...createWizardEntity("person", [first]),
    definition: { strategy: "semantic", descriptor: "female_person" } as const,
  };

  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = answer(session, "creationMode", "from_image");
  session = answer(session, "subjects", [first, second]);
  session = completeRequired(session);

  const derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.deepEqual(
    derived.value.subjectVariables.map((variable) => variable.value),
    ["male person in {reference}", "female person in {reference}"],
  );
  assert.deepEqual(
    derived.value.subjectVariables.map((variable) => variable.label),
    ["Person 1", "Person 2"],
  );
});

test("image mode custom subject definitions are grounded in the shared reference", () => {
  const subject = {
    ...createWizardEntity("person", [], "Zahra"),
    definition: {
      strategy: "custom",
      custom: "woman with a short black bob and pearl choker",
    } as const,
  };

  assert.equal(
    resolveWizardEntityVariableValue(subject, "image_to_image", 0, 1),
    "woman with a short black bob and pearl choker in {reference}",
  );
});

test("text mode subject definition is independent from the optional variable name", () => {
  const met = {
    ...createWizardEntity("person", [], "Met"),
    definition: { strategy: "semantic", descriptor: "man" } as const,
  };
  const custom = {
    ...createWizardEntity("person", [met], "Companion"),
    definition: {
      strategy: "custom",
      custom: "a black Persian cat with green eyes",
    } as const,
  };

  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = answer(session, "creationMode", "from_description");
  session = answer(session, "subjects", [met, custom]);
  session = completeRequired(session);

  const derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, true);
  if (!derived.ok) return;

  assert.deepEqual(
    derived.value.subjectVariables.map((variable) => [
      variable.key,
      variable.value,
    ]),
    [
      ["met", "an adult man"],
      ["companion", "a black Persian cat with green eyes"],
    ],
  );
});

test("blank custom subject definitions are rejected before canonical mutation planning", () => {
  const subject = {
    ...createWizardEntity("person"),
    definition: { strategy: "custom", custom: "   " } as const,
  };

  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = answer(session, "creationMode", "from_description");
  session = answer(session, "subjects", [subject]);
  session = completeRequired(session);

  const derived = derivePortraitWizardState(session);
  assert.equal(derived.ok, false);
  if (derived.ok) return;
  assert.ok(
    derived.issues.some(
      (item) => item.code === "portrait_subject_definition_required",
    ),
  );
});

test("legacy subject sessions retain their previous variable-value behavior until normalized by the UI", () => {
  const named = createWizardEntity("person", [], "Sarah Connor");
  const unnamed = createWizardEntity("person", [named]);

  assert.equal(
    resolveWizardEntityVariableValue(named, "text_to_image", 0, 2),
    "a person named Sarah Connor",
  );
  assert.equal(
    resolveWizardEntityVariableValue(unnamed, "image_to_image", 1, 2),
    "second person in {reference}",
  );
});
