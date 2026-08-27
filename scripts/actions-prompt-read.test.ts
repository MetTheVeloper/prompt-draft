import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerPromptReadActions } from "../app/actions/promptRead.ts";
import {
  buildPromptReadModel,
  validatePromptDraft,
} from "../app/domain/promptRead.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type {
  PromptKeyModule,
  PromptVariable,
} from "../app/modules/types.ts";

const styleModule: PromptKeyModule = {
  key: "style",
  fields: {
    finish: {
      id: "finish",
      type: "select",
      default: "",
      options: [
        { value: "soft", promptText: "soft focus" },
        { value: "sharp", promptText: "crisp detail" },
      ],
    },
    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      isOverride: true,
    },
  },
  compile: {
    overrideField: "customText",
  },
};

const variablesModule: PromptKeyModule = {
  key: "variables",
  fields: {
    variables: {
      id: "variables",
      type: "variables",
      default: [],
    },
  },
};

const detailModule: PromptKeyModule = {
  key: "details",
  fields: {
    text: {
      id: "text",
      type: "text",
      default: "",
    },
  },
};

function createTestPromptSettings(): PromptDraftState["promptSettings"] {
  return {
    mode: "image_to_image",
    idea: "",
    subject: "",
    subjectType: "unspecified",
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
  };
}

function createDraft(
  overrides: Partial<PromptDraftState> = {},
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: [],
    moduleValues: {},
    modulePanelStates: {},
    promptSettings: createTestPromptSettings(),
    outputFormat: "modular",
    ...overrides,
  };
}

function variable(
  id: string,
  key: string,
  value: string,
): PromptVariable {
  return {
    id,
    key,
    value,
    type: "text",
    source: "user",
    enabled: true,
  };
}

test("prompt read model compiles only active modules from canonical values", () => {
  const draft = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: { finish: "soft" },
      details: { text: "inactive detail" },
    },
  });

  const result = buildPromptReadModel(draft, [styleModule, detailModule]);
  assert.deepEqual(result.modules.map((module) => module.key), ["style"]);
  assert.equal(result.outputs.style, "soft focus");
  assert.equal(result.outputs.details, undefined);
});

test("prompt read model mirrors persisted custom-mode override semantics", () => {
  const draft = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: {
        finish: "soft",
        customText: "authored custom look",
      },
    },
    modulePanelStates: {
      style: { isCustomMode: true },
    },
  });

  const result = buildPromptReadModel(draft, [styleModule]);
  assert.equal(result.outputs.style, "authored custom look");
  assert.deepEqual(result.moduleIssues, []);

  const empty = buildPromptReadModel(
    {
      ...draft,
      moduleValues: { style: { finish: "soft", customText: "" } },
    },
    [styleModule],
  );
  assert.equal(empty.outputs.style, "");
  assert.equal(empty.moduleIssues[0]?.code, "custom_override_empty");
  assert.equal(empty.moduleIssues[0]?.level, "error");
});

test("prompt validation reports global setup errors from canonical draft", () => {
  const draft = createDraft({
    promptSettings: {
      ...createTestPromptSettings(),
      mode: "text_to_image",
      idea: "",
      subject: "",
    },
  });

  const result = validatePromptDraft(draft, [styleModule]);
  assert.equal(result.valid, false);
  assert.equal(result.hasErrors, true);
  assert.deepEqual(
    result.issues
      .filter((issue) => issue.level === "error")
      .map((issue) => issue.code),
    ["no_modules_selected", "text_to_image_missing_context"],
  );
});

test("prompt validation derives variable reference warnings from module outputs", () => {
  const draft = createDraft({
    selectedModuleKeys: ["variables", "details"],
    moduleValues: {
      variables: {
        variables: [variable("var-1", "unusedValue", "unused")],
      },
      details: {
        text: "use {missingValue}",
      },
    },
    promptSettings: {
      ...createTestPromptSettings(),
      idea: "reference test",
    },
  });

  const result = validatePromptDraft(draft, [variablesModule, detailModule]);
  const codes = result.issues.map((issue) => issue.code);
  assert.equal(codes.includes("undefined_variable_reference"), true);
  assert.equal(codes.includes("unused_variable"), true);
  assert.equal(
    result.issues.find((issue) => issue.code === "undefined_variable_reference")?.variableKey,
    "missingValue",
  );
});

test("prompt.validate returns validation as read data without mutating caller draft", async () => {
  const registry = registerPromptReadActions(new ActionRegistry());
  const original = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: { style: { finish: "sharp" } },
    promptSettings: {
      ...createTestPromptSettings(),
      idea: "portrait",
    },
  });
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = await registry.execute(
    "prompt.validate",
    {
      draft: original,
      modules: [styleModule],
    },
    {},
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const data = result.data as ReturnType<typeof validatePromptDraft>;
  assert.equal(data.valid, true);
  assert.equal(data.outputs.style, "crisp detail");
  assert.deepEqual(original, snapshot);
  assert.notEqual(result.draft, original);
});

test("registered prompt read action has stable discovery ID and invalid input is atomic", async () => {
  const registry = registerPromptReadActions(new ActionRegistry());
  assert.deepEqual(registry.list().map((action) => action.id), ["prompt.validate"]);

  const original = createDraft();
  const result = await registry.execute(
    "prompt.validate",
    {
      draft: original,
      modules: [styleModule],
    },
    { unexpected: true },
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "action_input_unknown_property");
  }
});
