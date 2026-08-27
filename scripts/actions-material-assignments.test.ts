import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerTextureAssignmentActions } from "../app/actions/materialAssignments.ts";
import {
  applyPromptMaterialAssignmentPreset,
  createPromptMaterialAssignment,
  deletePromptMaterialAssignment,
  setPromptMaterialAssignmentConditions,
  setPromptMaterialAssignmentProperty,
  setPromptMaterialAssignmentScope,
} from "../app/domain/materialAssignments.ts";
import { TextureModule } from "../app/modules/texture.freeform.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["texture"],
    moduleValues: {
      texture: {
        materialAssignments: [],
        extraDetails: "",
        customText: "",
      },
    },
    modulePanelStates: {
      texture: { isCustomMode: false, activePresetId: null },
    },
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

function assignments(draft: PromptDraftState) {
  return draft.moduleValues.texture?.materialAssignments as any[];
}

function createAssignmentFixture() {
  const created = createPromptMaterialAssignment(
    createDraft(),
    TextureModule,
    { createAssignmentId: () => "material-a" },
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create material fixture");
  return created.value.draft;
}

function materialSource(): SemanticReferenceCatalogSource {
  return {
    label: "Hair component",
    target: {
      kind: "module_output",
      value: "{hair_component_a}",
      moduleKey: "hair",
      entityId: "hair-component-a",
      token: "{hair_component_a}",
      label: "Hair Component A",
    },
  };
}

test("material assignment create uses stable ID, canonical default scope, and preserves caller", () => {
  const original = createDraft();
  const result = createPromptMaterialAssignment(original, TextureModule, {
    createAssignmentId: () => "material-a",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "material-a");
  assert.deepEqual(result.value.assignment?.targets, [
    { kind: "builtin", value: "all_surfaces" },
  ]);
  assert.deepEqual(result.value.assignment?.conditions, []);
  assert.equal(result.value.assignment?.material, "");
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(result.value.draft).length, 1);
});

test("material assignment scope uses shared semantic rules and live source upgrades", () => {
  const draft = createAssignmentFixture();
  const result = setPromptMaterialAssignmentScope(
    draft,
    TextureModule,
    "material-a",
    {
      targets: [
        { kind: "builtin", value: "background" },
        {
          kind: "module_output",
          value: "{hair_component_a}",
          moduleKey: "hair",
          entityId: "hair-component-a",
          token: "{hair_component_a}",
        },
      ],
      exceptions: [{ kind: "custom", value: "metal logo" }],
    },
    { semanticSources: [materialSource()] },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.value.assignment?.targets.map((target) => target.kind),
    ["builtin", "module_output"],
  );
  assert.equal(result.value.assignment?.targets[1]?.entityId, "hair-component-a");
  assert.equal(result.value.assignment?.exceptions?.[0]?.value, "metal logo");

  const exclusive = setPromptMaterialAssignmentScope(
    result.value.draft,
    TextureModule,
    "material-a",
    {
      targets: [
        { kind: "builtin", value: "subject" },
        { kind: "builtin", value: "all_surfaces" },
      ],
    },
  );
  assert.equal(exclusive.ok, true);
  if (!exclusive.ok) return;
  assert.deepEqual(exclusive.value.assignment?.targets, [
    { kind: "builtin", value: "all_surfaces" },
  ]);
});

test("material preset replaces payload while preserving exact semantic scope", () => {
  const draft = createAssignmentFixture();
  const scoped = setPromptMaterialAssignmentScope(
    draft,
    TextureModule,
    "material-a",
    {
      targets: [{ kind: "builtin", value: "subject" }],
      exceptions: [{ kind: "custom", value: "eyes" }],
    },
  );
  assert.equal(scoped.ok, true);
  if (!scoped.ok) return;

  const result = applyPromptMaterialAssignmentPreset(
    scoped.value.draft,
    TextureModule,
    "material-a",
    "frosted_glass",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "frosted_glass");
  assert.equal(result.value.assignment?.material, "glass");
  assert.equal(result.value.assignment?.finish, "matte");
  assert.equal(result.value.assignment?.surfaceTexture, "smooth");
  assert.equal(result.value.assignment?.opticalCharacter, "frosted");
  assert.equal(result.value.assignment?.textureProminence, "subtle");
  assert.deepEqual(result.value.assignment?.conditions, ["clean"]);
  assert.deepEqual(result.value.assignment?.targets, [
    { kind: "builtin", value: "subject" },
  ]);
  assert.deepEqual(result.value.assignment?.exceptions, [
    { kind: "custom", value: "eyes" },
  ]);

  const cleared = applyPromptMaterialAssignmentPreset(
    result.value.draft,
    TextureModule,
    "material-a",
    "",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.assignment?.presetId, undefined);
  assert.equal(cleared.value.assignment?.material, "glass");
});

test("material property mutation detaches preset and preserves authored freeform values", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptMaterialAssignmentPreset(
    draft,
    TextureModule,
    "material-a",
    "smooth_vinyl",
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const result = setPromptMaterialAssignmentProperty(
    preset.value.draft,
    TextureModule,
    "material-a",
    "surfaceTexture",
    "hand-carved micro grooves",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, undefined);
  assert.equal(
    result.value.assignment?.surfaceTexture,
    "hand-carved micro grooves",
  );
  assert.equal(result.value.assignment?.material, "vinyl");
});

test("material conditions mutation detaches preset and keeps authored condition strings", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptMaterialAssignmentPreset(
    draft,
    TextureModule,
    "material-a",
    "aged_wood",
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const result = setPromptMaterialAssignmentConditions(
    preset.value.draft,
    TextureModule,
    "material-a",
    ["scratches", "salt crystallization"],
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, undefined);
  assert.deepEqual(result.value.assignment?.conditions, [
    "scratches",
    "salt crystallization",
  ]);
});

test("material assignment mutations use exact stable IDs and reject missing or duplicate identities", () => {
  const draft = createAssignmentFixture();

  const missing = deletePromptMaterialAssignment(
    draft,
    TextureModule,
    "missing-material",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "material_assignment_not_found");
  }

  const duplicate = createPromptMaterialAssignment(draft, TextureModule, {
    createAssignmentId: () => "material-a",
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(
      duplicate.issues[0]?.code,
      "material_assignment_identity_conflict",
    );
  }

  const unknownPreset = applyPromptMaterialAssignmentPreset(
    draft,
    TextureModule,
    "material-a",
    "does-not-exist",
  );
  assert.equal(unknownPreset.ok, false);
  if (!unknownPreset.ok) {
    assert.equal(unknownPreset.issues[0]?.code, "material_preset_not_found");
  }
});

test("legacy material assignment shape is normalized before exact domain mutation", () => {
  const draft = createDraft();
  draft.moduleValues.texture = {
    materialAssignments: [
      {
        material: "oak",
        finish: "matte",
        conditions: ["weathered"],
      },
    ] as any,
    extraDetails: "",
    customText: "",
  };

  const result = setPromptMaterialAssignmentProperty(
    draft,
    TextureModule,
    "material-assignment-1",
    "finish",
    "satin",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "material-assignment-1");
  assert.deepEqual(result.value.assignment?.targets, [
    { kind: "builtin", value: "all_surfaces" },
  ]);
  assert.equal(result.value.assignment?.finish, "satin");
});

test("registered Texture assignment actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerTextureAssignmentActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "texture.assignment.create",
      "texture.assignment.delete",
      "texture.assignment.scope.set",
      "texture.assignment.applyPreset",
      "texture.assignment.property.set",
      "texture.assignment.conditions.set",
    ],
  );

  const original = createDraft();
  const created = await registry.execute(
    "texture.assignment.create",
    {
      draft: original,
      modules: [TextureModule],
      idFactory: { materialAssignment: () => "action-material" },
    },
    {},
  );
  assert.equal(created.ok, true);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(created.draft).length, 1);

  const failed = await registry.execute(
    "texture.assignment.property.set",
    {
      draft: created.draft,
      modules: [TextureModule],
    },
    {
      assignmentId: "missing-material",
      property: "material",
      value: "glass",
    },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, created.draft);
});
