import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_ACTION_CONTRACT,
  createPublicActionRegistry,
  exportPublicActionManifest,
  invokePublicAction,
  toPublicJsonSchema,
} from "../app/actions/public.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";

const styleModule: PromptKeyModule = {
  key: "style",
  fields: {
    tone: {
      id: "tone",
      type: "text",
      default: "",
    },
  },
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
    },
    outputFormat: "modular",
    ...overrides,
  };
}

test("public registry assembles the complete frozen action surface", () => {
  const registry = createPublicActionRegistry();
  const ids = registry.list().map((action) => action.id);

  assert.equal(ids.length, 99);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.includes("module.activate"), true);
  assert.equal(ids.includes("outfit.relation.update"), true);
  assert.equal(ids.includes("prompt.validate"), true);
  assert.equal(ids.includes("prompt.compile"), true);
  assert.equal(ids.some((id) => id.startsWith("assignment.")), false);
});

test("public manifest is deterministic JSON-safe discovery data", () => {
  const manifest = exportPublicActionManifest();
  const serialized = JSON.stringify(manifest);
  const reparsed = JSON.parse(serialized) as typeof manifest;

  assert.equal(manifest.contract, PUBLIC_ACTION_CONTRACT);
  assert.equal(manifest.actions.length, 99);
  assert.deepEqual(reparsed, manifest);

  const fieldSet = manifest.actions.find(
    (action) => action.id === "module.field.set",
  );
  assert.deepEqual(fieldSet?.inputSchema.properties?.value, {});
});

test("public schema mapper converts internal constraints without changing validator types", () => {
  const schema = toPublicJsonSchema({
    type: "object",
    required: ["value"],
    additionalProperties: false,
    properties: {
      value: { type: "number", min: 1, max: 5 },
      payload: { type: "unknown" },
      tags: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 2 },
      },
    },
  });

  assert.deepEqual(schema, {
    type: "object",
    required: ["value"],
    additionalProperties: false,
    properties: {
      value: { type: "number", minimum: 1, maximum: 5 },
      payload: {},
      tags: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 2 },
      },
    },
  });
});

test("public invoke bridge executes writes with host-owned context and caller isolation", async () => {
  const original = createDraft();
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = await invokePublicAction(
    {
      actionId: "module.activate",
      input: { moduleKey: "style" },
    },
    {
      draft: original,
      modules: [styleModule],
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(original, snapshot);
  assert.notEqual(result.draft, original);
  assert.deepEqual(result.draft.selectedModuleKeys, ["style"]);
});

test("public invoke bridge exposes read actions through the same transport-neutral contract", async () => {
  const original = createDraft();
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = await invokePublicAction(
    { actionId: "prompt.validate", input: {} },
    {
      draft: original,
      modules: [styleModule],
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const data = result.data as { valid: boolean; issues: Array<{ code: string }> };
  assert.equal(data.valid, false);
  assert.equal(data.issues.some((issue) => issue.code === "no_modules_selected"), true);
  assert.deepEqual(original, snapshot);
  assert.notEqual(result.draft, original);
});

test("public invocation rejects host-owned envelope fields and preserves structured runtime failures", async () => {
  const original = createDraft();
  const context = {
    draft: original,
    modules: [styleModule],
  };

  const leakedContext = await invokePublicAction(
    {
      actionId: "module.activate",
      input: { moduleKey: "style" },
      draft: original,
    },
    context,
  );
  assert.equal(leakedContext.ok, false);
  assert.equal(leakedContext.draft, original);
  if (!leakedContext.ok) {
    assert.equal(leakedContext.issues[0]?.code, "public_action_request_invalid");
  }

  const missing = await invokePublicAction(
    { actionId: "missing.action", input: {} },
    context,
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.draft, original);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "action_not_found");
  }
});
