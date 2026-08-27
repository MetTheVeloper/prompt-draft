import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerVariableActions } from "../app/actions/variables.ts";
import {
  createPromptVariable,
  deletePromptVariable,
  duplicatePromptVariable,
  updatePromptVariable,
} from "../app/domain/variables.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";

function createDraft(): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["variables"],
    moduleValues: {
      variables: {
        variables: [],
      },
    },
    modulePanelStates: {},
    promptSettings: {
      mode: "image_to_image",
      idea: "",
      subject: "",
      subjectType: "unspecified",
      aspectRatio: "1:1",
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
  };
}

test("blueprint-style canonical creation preserves internal user source metadata", () => {
  const created = createPromptVariable(
    [],
    {
      key: "hero_subject",
      value: "portrait subject",
      description: "Blueprint-created subject",
      type: "subject",
      enabled: true,
      source: "user",
    },
    { createId: () => "blueprint-variable" },
  );

  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.variable.id, "blueprint-variable");
  assert.equal(created.value.variable.source, "user");

  const updated = updatePromptVariable(
    created.value.variables,
    "blueprint-variable",
    { value: "updated subject", enabled: false },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.variable.source, "user");
  assert.equal(updated.value.variable.enabled, false);

  const duplicated = duplicatePromptVariable(
    updated.value.variables,
    "blueprint-variable",
    { createId: () => "blueprint-copy" },
  );
  assert.equal(duplicated.ok, true);
  if (!duplicated.ok) return;
  assert.equal(duplicated.value.variable.source, "user");
  assert.deepEqual(
    duplicated.value.variables.map((item) => item.id),
    ["blueprint-variable", "blueprint-copy"],
  );

  const deleted = deletePromptVariable(
    duplicated.value.variables,
    "blueprint-variable",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.equal(deleted.value.removed.source, "user");
  assert.deepEqual(
    deleted.value.variables.map((item) => item.id),
    ["blueprint-copy"],
  );
});

test("public variable.create does not expose internal source metadata", async () => {
  const registry = registerVariableActions(new ActionRegistry());
  const draft = createDraft();

  const result = await registry.execute(
    "variable.create",
    {
      draft,
      modules: [],
      idFactory: { variable: () => "should-not-create" },
    },
    {
      key: "hero",
      source: "user",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, draft);
  assert.deepEqual(draft.moduleValues.variables?.variables, []);
});
