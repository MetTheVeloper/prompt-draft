import assert from "node:assert/strict";
import test from "node:test";

import {
  assertWizardDefinition,
  portraitWizardV1Definition,
  portraitWizardV2Definition,
  type WizardDefinition,
} from "../app/wizard/definition.ts";

test("Portrait Wizard v1 definition stays semantic and validates as a minimal data-driven flow", () => {
  assert.doesNotThrow(() => assertWizardDefinition(portraitWizardV1Definition));

  assert.equal(portraitWizardV1Definition.id, "portrait");
  assert.equal(portraitWizardV1Definition.version, 1);
  assert.deepEqual(
    portraitWizardV1Definition.steps.map((step) => step.id),
    [
      "subject",
      "intent",
      "appearance",
      "composition",
      "environment",
      "lighting",
      "review",
    ],
  );

  const serialized = JSON.stringify(portraitWizardV1Definition);
  assert.equal(serialized.includes('"actionId"'), false);
  assert.equal(serialized.includes('"moduleKey"'), false);
  assert.equal(serialized.includes('"presetId"'), false);
});

test("Portrait Wizard v2 validates with lightweight Stage -> Step -> Question grouping", () => {
  assert.doesNotThrow(() => assertWizardDefinition(portraitWizardV2Definition));
  assert.equal(portraitWizardV2Definition.version, 2);
  assert.deepEqual(
    portraitWizardV2Definition.stages.map((stage) => stage.id),
    [
      "start",
      "subjects",
      "portrait",
      "appearance",
      "composition",
      "scene",
      "final",
      "review",
    ],
  );
  assert.ok(
    portraitWizardV2Definition.steps.every((step) =>
      portraitWizardV2Definition.stages.some((stage) => stage.id === step.stageId),
    ),
  );

  const subjectQuestion = portraitWizardV2Definition.steps
    .find((step) => step.id === "subjects")
    ?.questions[0];
  assert.equal(subjectQuestion?.type, "entityCollection");

  const startStep = portraitWizardV2Definition.steps.find(
    (step) => step.id === "start",
  );
  const appearanceStep = portraitWizardV2Definition.steps.find(
    (step) => step.id === "appearance",
  );
  const finalStep = portraitWizardV2Definition.steps.find(
    (step) => step.id === "final-settings",
  );

  assert.deepEqual(startStep?.questions.map((question) => question.id), [
    "creationMode",
  ]);
  assert.equal(finalStep?.questions[0]?.id, "idea");
  assert.equal(finalStep?.questions[0]?.type, "text");

  const modalQuestions = appearanceStep?.questions.filter(
    (question) => question.type === "modalOptions",
  );
  assert.deepEqual(
    modalQuestions?.map((question) => question.id),
    ["expressionOptions", "hairOptions", "outfitOptions"],
  );
  assert.deepEqual(
    modalQuestions?.map((question) => question.fields.map((field) => field.id)),
    [
      ["intensity", "eyeState", "browState", "mouthState"],
      ["length", "curlPattern", "volume", "parting"],
      ["fitDirection", "accessoryDirection", "additionalDetails"],
    ],
  );

  const serialized = JSON.stringify(portraitWizardV2Definition);
  assert.equal(serialized.includes('"actionId"'), false);
  assert.equal(serialized.includes('"moduleKey"'), false);
  assert.equal(serialized.includes('"presetId"'), false);
});

test("WizardDefinition rejects duplicate answer ids because session answers are globally keyed", () => {
  const invalidDefinition: WizardDefinition = {
    id: "invalid",
    version: 1,
    title: "Invalid",
    steps: [
      {
        id: "one",
        title: "One",
        questions: [
          {
            id: "duplicate",
            type: "text",
            title: "First",
          },
        ],
      },
      {
        id: "two",
        title: "Two",
        questions: [
          {
            id: "duplicate",
            type: "text",
            title: "Second",
          },
        ],
      },
    ],
  };

  assert.throws(
    () => assertWizardDefinition(invalidDefinition),
    /Duplicate Wizard question id: duplicate/,
  );
});

test("WizardDefinition rejects duplicate modal field ids", () => {
  const invalidDefinition: WizardDefinition = {
    id: "invalid-modal",
    version: 1,
    title: "Invalid modal",
    steps: [
      {
        id: "one",
        title: "One",
        questions: [
          {
            id: "details",
            type: "modalOptions",
            title: "Details",
            fields: [
              {
                id: "same",
                type: "text",
                title: "First",
              },
              {
                id: "same",
                type: "text",
                title: "Second",
              },
            ],
          },
        ],
      },
    ],
  };

  assert.throws(
    () => assertWizardDefinition(invalidDefinition),
    /Duplicate modal field id "same"/,
  );
});

test("WizardDefinition rejects conditions that reference unknown answers", () => {
  const invalidDefinition: WizardDefinition = {
    id: "invalid-condition",
    version: 1,
    title: "Invalid condition",
    steps: [
      {
        id: "one",
        title: "One",
        visibleWhen: {
          answerId: "missing",
          operator: "equals",
          value: "yes",
        },
        questions: [],
      },
    ],
  };

  assert.throws(
    () => assertWizardDefinition(invalidDefinition),
    /Wizard condition references unknown answer id: missing/,
  );
});

test("WizardDefinition rejects a step that points at an unknown stage", () => {
  const invalidDefinition: WizardDefinition = {
    id: "invalid-stage",
    version: 1,
    title: "Invalid stage",
    stages: [{ id: "start", title: "Start" }],
    steps: [
      {
        id: "one",
        stageId: "missing",
        title: "One",
        questions: [],
      },
    ],
  };

  assert.throws(
    () => assertWizardDefinition(invalidDefinition),
    /references unknown stage: missing/,
  );
});
