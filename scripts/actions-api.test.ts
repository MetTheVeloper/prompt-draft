import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import {
  clonePromptDraftState,
  normalizePromptDraftState,
} from "../app/utils/promptDraftState.ts";

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
    ...overrides,
  };
}

function createContext(draft = createDraft()) {
  return {
    draft,
    modules: [],
  };
}

test("normalizes canonical draft state without persistence metadata", () => {
  const defaults = createDraft().promptSettings;
  const state = normalizePromptDraftState(
    {
      version: 99,
      selectedModuleKeys: ["camera", "missing", 42],
      moduleValues: {
        camera: { lens: "85mm" },
      },
      modulePanelStates: {
        camera: { isCustomMode: true },
      },
      promptSettings: {
        idea: "Macro portrait",
      },
      outputFormat: "invalid",
      updatedAt: "should-not-enter-domain-state",
    },
    {
      validModuleKeys: ["camera", "style"],
      defaultPromptSettings: defaults,
    },
  );

  assert.equal(state.version, 1);
  assert.deepEqual(state.selectedModuleKeys, ["camera"]);
  assert.deepEqual(state.moduleValues.camera, { lens: "85mm" });
  assert.deepEqual(state.modulePanelStates.camera, { isCustomMode: true });
  assert.equal(state.promptSettings.idea, "Macro portrait");
  assert.equal(state.promptSettings.mode, defaults.mode);
  assert.equal(state.outputFormat, "modular");
  assert.equal("updatedAt" in state, false);
});

test("clonePromptDraftState deep-clones nested canonical state", () => {
  const source = createDraft({
    selectedModuleKeys: ["camera"],
    moduleValues: {
      camera: { lens: "85mm" },
    },
  });
  const cloned = clonePromptDraftState(source);

  cloned.selectedModuleKeys.push("style");
  cloned.moduleValues.camera.lens = "35mm";
  cloned.promptSettings.imageToImage.preserveIdentity = false;

  assert.deepEqual(source.selectedModuleKeys, ["camera"]);
  assert.equal(source.moduleValues.camera.lens, "85mm");
  assert.equal(source.promptSettings.imageToImage.preserveIdentity, true);
});

test("registry discovers registered actions and rejects duplicate IDs", () => {
  const registry = new ActionRegistry();

  registry.register({
    id: "test.noop",
    description: "No-op action",
    inputSchema: {
      type: "object",
      additionalProperties: false,
    },
    execute: ({ draft }) => ({ ok: true, draft }),
  });

  assert.equal(registry.has("test.noop"), true);
  assert.equal(registry.get("test.noop")?.id, "test.noop");
  assert.deepEqual(registry.list(), [
    {
      id: "test.noop",
      description: "No-op action",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
    },
  ]);

  assert.throws(
    () =>
      registry.register({
        id: "test.noop",
        description: "Duplicate",
        execute: ({ draft }) => ({ ok: true, draft }),
      }),
    /Duplicate action id/,
  );
});

test("successful action execution cannot mutate the caller draft", async () => {
  const registry = new ActionRegistry();
  const original = createDraft();

  registry.register<{ format: "natural" | "json" }, { previous: string }>({
    id: "test.setFormat",
    description: "Set output format",
    inputSchema: {
      type: "object",
      required: ["format"],
      additionalProperties: false,
      properties: {
        format: {
          type: "string",
          enum: ["natural", "json"],
        },
      },
    },
    execute: (context, input) => {
      const previous = context.draft.outputFormat;
      context.draft.outputFormat = input.format;
      return {
        ok: true,
        draft: context.draft,
        data: { previous },
      };
    },
  });

  const result = await registry.execute<{ previous: string }>(
    "test.setFormat",
    createContext(original),
    { format: "natural" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.draft.outputFormat, "natural");
  assert.equal(result.data?.previous, "modular");
  assert.equal(original.outputFormat, "modular");
  assert.notEqual(result.draft, original);
});

test("invalid action input returns structured issues without execution", async () => {
  const registry = new ActionRegistry();
  const original = createDraft();
  let called = false;

  registry.register<{ count: number }>({
    id: "test.count",
    description: "Validate numeric input",
    inputSchema: {
      type: "object",
      required: ["count"],
      additionalProperties: false,
      properties: {
        count: { type: "number", min: 1, max: 3 },
      },
    },
    execute: ({ draft }) => {
      called = true;
      return { ok: true, draft };
    },
  });

  const result = await registry.execute(
    "test.count",
    createContext(original),
    { count: 8, extra: true },
  );

  assert.equal(result.ok, false);
  assert.equal(called, false);
  assert.equal(result.draft, original);
  if (result.ok) return;

  assert.deepEqual(
    result.issues.map((issue) => issue.code).sort(),
    ["action_input_number_too_large", "action_input_unknown_property"],
  );
});

test("canExecute rejection is atomic and returns the original draft", async () => {
  const registry = new ActionRegistry();
  const original = createDraft();

  registry.register({
    id: "test.blocked",
    description: "Blocked action",
    canExecute: (context) => {
      context.draft.selectedModuleKeys.push("mutated-only-inside-clone");
      return {
        allowed: false,
        issues: [{ code: "test_blocked" }],
      };
    },
    execute: ({ draft }) => ({ ok: true, draft }),
  });

  const result = await registry.execute(
    "test.blocked",
    createContext(original),
    {},
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  assert.deepEqual(original.selectedModuleKeys, []);
  if (!result.ok) assert.equal(result.issues[0]?.code, "test_blocked");
});

test("failed action result is normalized back to the original draft", async () => {
  const registry = new ActionRegistry();
  const original = createDraft();

  registry.register({
    id: "test.reject",
    description: "Reject after attempted mutation",
    execute: (context) => {
      context.draft.selectedModuleKeys.push("camera");
      return {
        ok: false,
        draft: context.draft,
        issues: [{ code: "test_rejected" }],
      };
    },
  });

  const result = await registry.execute(
    "test.reject",
    createContext(original),
    {},
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  assert.deepEqual(original.selectedModuleKeys, []);
});

test("unknown and thrown actions return structured runtime failures", async () => {
  const registry = new ActionRegistry();
  const original = createDraft();

  const unknown = await registry.execute(
    "missing.action",
    createContext(original),
    {},
  );

  assert.equal(unknown.ok, false);
  assert.equal(unknown.draft, original);
  if (!unknown.ok) assert.equal(unknown.issues[0]?.code, "action_not_found");

  registry.register({
    id: "test.throw",
    description: "Throw action",
    execute: () => {
      throw new Error("boom");
    },
  });

  const thrown = await registry.execute(
    "test.throw",
    createContext(original),
    {},
  );

  assert.equal(thrown.ok, false);
  assert.equal(thrown.draft, original);
  if (!thrown.ok) {
    assert.equal(thrown.issues[0]?.code, "action_execution_error");
    assert.equal(thrown.issues[0]?.details?.error, "boom");
  }
});
