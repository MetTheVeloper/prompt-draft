import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerVariableActions } from "../app/actions/variables.ts";
import {
  createPromptVariable,
  deletePromptVariable,
  duplicatePromptVariable,
  setPromptVariableEnabled,
  updatePromptVariable,
} from "../app/domain/variables.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptVariable } from "../app/modules/types.ts";

function variable(
  id: string,
  key: string,
  overrides: Partial<PromptVariable> = {},
): PromptVariable {
  return {
    id,
    key,
    value: `${key} value`,
    description: "",
    type: "text",
    enabled: true,
    ...overrides,
  };
}

function createDraft(
  variables: PromptVariable[] = [],
  selectedModuleKeys: string[] = [],
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys,
    moduleValues: variables.length
      ? {
          variables: {
            variables,
          },
        }
      : {},
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

function draftVariables(draft: PromptDraftState) {
  const value = draft.moduleValues.variables?.variables;
  return Array.isArray(value) ? (value as PromptVariable[]) : [];
}

test("variable service creates normalized variables with deterministic IDs", () => {
  const result = createPromptVariable(
    [],
    {
      key: "Main Subject",
      value: "portrait subject",
      type: "subject",
    },
    {
      createId: () => "variable-1",
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value.variable, {
    id: "variable-1",
    key: "main_Subject",
    value: "portrait subject",
    description: "",
    type: "subject",
    enabled: true,
  });
  assert.equal(result.value.variables.length, 1);
});

test("user key collisions are auto-uniqued but system collisions are rejected", () => {
  const existing = [variable("v1", "subject")];

  const duplicateUser = createPromptVariable(
    existing,
    { key: "subject" },
    { createId: () => "v2" },
  );

  assert.equal(duplicateUser.ok, true);
  if (duplicateUser.ok) {
    assert.equal(duplicateUser.value.variable.key, "subject_2");
  }

  const blockedSystem = createPromptVariable(
    existing,
    { key: "reference" },
    {
      blockedKeys: ["REFERENCE"],
      createId: () => "v3",
    },
  );

  assert.equal(blockedSystem.ok, false);
  if (!blockedSystem.ok) {
    assert.equal(blockedSystem.issues[0]?.code, "variable_system_key_conflict");
    assert.equal(blockedSystem.issues[0]?.path, "key");
  }
});

test("reserved keys are rejected by the canonical service", () => {
  const result = createPromptVariable(
    [],
    { key: "scene_hero" },
    { createId: () => "v1" },
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "variable_reserved_key");
  }
});

test("variable update preserves stable ID and applies user-key uniqueness", () => {
  const source = [
    variable("v1", "primary"),
    variable("v2", "secondary"),
  ];

  const result = updatePromptVariable(
    source,
    "v1",
    {
      key: "secondary",
      value: "updated",
      type: "object",
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.variable.id, "v1");
  assert.equal(result.value.variable.key, "secondary_2");
  assert.equal(result.value.variable.value, "updated");
  assert.equal(result.value.variable.type, "object");
  assert.equal(source[0]?.key, "primary");
});

test("variable duplication uses a new ID, unique key, and adjacent placement", () => {
  const source = [
    variable("v1", "subject"),
    variable("v2", "other"),
  ];

  const result = duplicatePromptVariable(
    source,
    "v1",
    { createId: () => "v-copy" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.variable.id, "v-copy");
  assert.equal(result.value.variable.key, "subject_2");
  assert.deepEqual(
    result.value.variables.map((item) => item.id),
    ["v1", "v-copy", "v2"],
  );
  assert.deepEqual(
    source.map((item) => item.id),
    ["v1", "v2"],
  );
});

test("delete and setEnabled target one exact stable variable ID", () => {
  const source = [
    variable("v1", "first"),
    variable("v2", "second"),
  ];

  const disabled = setPromptVariableEnabled(source, "v2", false);
  assert.equal(disabled.ok, true);
  if (!disabled.ok) return;

  assert.equal(disabled.value.variable.id, "v2");
  assert.equal(disabled.value.variable.enabled, false);
  assert.equal(source[1]?.enabled, true);

  const deleted = deletePromptVariable(disabled.value.variables, "v1");
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;

  assert.equal(deleted.value.removed.id, "v1");
  assert.deepEqual(
    deleted.value.variables.map((item) => item.id),
    ["v2"],
  );
});

test("missing variable mutations return structured domain failures", () => {
  const update = updatePromptVariable([], "missing", { value: "x" });
  const duplicate = duplicatePromptVariable([], "missing");
  const remove = deletePromptVariable([], "missing");
  const enabled = setPromptVariableEnabled([], "missing", false);

  for (const result of [update, duplicate, remove, enabled]) {
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "variable_not_found");
    }
  }
});

test("variable.create action activates Variables and writes canonical state", async () => {
  const registry = registerVariableActions(new ActionRegistry());
  const original = createDraft([], ["camera"]);

  const result = await registry.execute<{ variable: PromptVariable }>(
    "variable.create",
    {
      draft: original,
      modules: [],
      environment: {
        activeSystemVariableKeys: ["reference"],
      },
      idFactory: {
        variable: () => "action-variable-1",
      },
    },
    {
      key: "hero subject",
      value: "a person",
      type: "subject",
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.draft.selectedModuleKeys, ["variables", "camera"]);
  assert.equal(result.data?.variable.id, "action-variable-1");
  assert.equal(result.data?.variable.key, "hero_subject");
  assert.deepEqual(
    draftVariables(result.draft).map((item) => item.id),
    ["action-variable-1"],
  );
  assert.deepEqual(original.selectedModuleKeys, ["camera"]);
  assert.deepEqual(original.moduleValues, {});
});

test("variable action failures are atomic and preserve the caller draft", async () => {
  const registry = registerVariableActions(new ActionRegistry());
  const original = createDraft([], ["camera"]);

  const blocked = await registry.execute(
    "variable.create",
    {
      draft: original,
      modules: [],
      environment: {
        activeSystemVariableKeys: ["reference"],
      },
      idFactory: {
        variable: () => "should-not-matter",
      },
    },
    {
      key: "reference",
    },
  );

  assert.equal(blocked.ok, false);
  assert.equal(blocked.draft, original);
  assert.deepEqual(original.selectedModuleKeys, ["camera"]);
  assert.deepEqual(original.moduleValues, {});
  if (!blocked.ok) {
    assert.equal(blocked.issues[0]?.code, "variable_system_key_conflict");
  }

  const missing = await registry.execute(
    "variable.update",
    {
      draft: original,
      modules: [],
    },
    {
      variableId: "missing",
      value: "x",
    },
  );

  assert.equal(missing.ok, false);
  assert.equal(missing.draft, original);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "variable_not_found");
  }
});

test("registered variable actions expose stable discovery IDs", () => {
  const registry = registerVariableActions(new ActionRegistry());

  assert.deepEqual(
    registry.list().map((action) => action.id),
    [
      "variable.create",
      "variable.update",
      "variable.duplicate",
      "variable.delete",
      "variable.setEnabled",
    ],
  );
});
