import assert from "node:assert/strict";
import test from "node:test";

import {
  assertWizardDefinition,
  portraitWizardV1Definition,
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
