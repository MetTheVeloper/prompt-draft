import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerColorPaletteActions } from "../app/actions/colorPalette.ts";
import {
  addPromptColorSwatch,
  applyPromptColorAssignmentPreset,
  createPromptColorAssignment,
  deletePromptColorAssignment,
  deletePromptColorSwatch,
  setPromptColorAssignmentScope,
  setPromptColorSwatchLiteral,
  setPromptColorSwatchVariable,
} from "../app/domain/colorPalette.ts";
import { ColorPaletteModule } from "../app/modules/colorPalette.module.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["colorPalette", "variables"],
    moduleValues: {
      colorPalette: {
        paletteAssignments: [],
        extraDetails: "",
        customText: "",
      },
      variables: {
        variables: [
          {
            id: "color-brand",
            key: "brandColor",
            value: "#ff5500",
            type: "color",
            enabled: true,
          },
          {
            id: "text-note",
            key: "note",
            value: "hello",
            type: "text",
            enabled: true,
          },
          {
            id: "color-disabled",
            key: "disabledColor",
            value: "#000000",
            type: "color",
            enabled: false,
          },
        ],
      },
    },
    modulePanelStates: {
      colorPalette: { isCustomMode: false, activePresetId: null },
      variables: { isCustomMode: false, activePresetId: null },
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
  return draft.moduleValues.colorPalette?.paletteAssignments as any[];
}

function createAssignmentFixture() {
  const created = createPromptColorAssignment(
    createDraft(),
    ColorPaletteModule,
    { createAssignmentId: () => "color-rule-a" },
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create color fixture");
  return created.value.draft;
}

function semanticSource(): SemanticReferenceCatalogSource {
  return {
    label: "Outfit",
    target: {
      kind: "module_output",
      value: "outfit",
      moduleKey: "outfit",
      variableId: "module:outfit",
      token: "{outfit}",
      label: "Outfit",
    },
  };
}

test("color assignment create uses stable ID, canonical default scope, and preserves caller", () => {
  const original = createDraft();
  const result = createPromptColorAssignment(original, ColorPaletteModule, {
    createAssignmentId: () => "color-rule-a",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "color-rule-a");
  assert.deepEqual(result.value.assignment?.targets, [
    { kind: "builtin", value: "overall" },
  ]);
  assert.deepEqual(result.value.assignment?.colors, []);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(result.value.draft).length, 1);
});

test("color assignment scope uses shared semantic rules and live source upgrades", () => {
  const draft = createAssignmentFixture();
  const result = setPromptColorAssignmentScope(
    draft,
    ColorPaletteModule,
    "color-rule-a",
    {
      targets: [
        { kind: "builtin", value: "background" },
        { kind: "builtin", value: "outfit" },
      ],
      exceptions: [{ kind: "custom", value: "logo" }],
    },
    { semanticSources: [semanticSource()] },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.value.assignment?.targets.map((target) => target.kind),
    ["builtin", "module_output"],
  );
  assert.equal(result.value.assignment?.targets[1]?.variableId, "module:outfit");
  assert.equal(result.value.assignment?.exceptions?.[0]?.value, "logo");

  const exclusive = setPromptColorAssignmentScope(
    result.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    {
      targets: [
        { kind: "builtin", value: "subject" },
        { kind: "builtin", value: "overall" },
      ],
    },
  );
  assert.equal(exclusive.ok, true);
  if (!exclusive.ok) return;
  assert.deepEqual(exclusive.value.assignment?.targets, [
    { kind: "builtin", value: "overall" },
  ]);
});

test("palette preset replaces colors with stable swatches while preserving scope", () => {
  const draft = createAssignmentFixture();
  const scoped = setPromptColorAssignmentScope(
    draft,
    ColorPaletteModule,
    "color-rule-a",
    { targets: [{ kind: "builtin", value: "subject" }] },
  );
  assert.equal(scoped.ok, true);
  if (!scoped.ok) return;

  let index = 0;
  const result = applyPromptColorAssignmentPreset(
    scoped.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "soft_pastel_palette",
    { createSwatchId: () => `preset-swatch-${++index}` },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "soft_pastel_palette");
  assert.deepEqual(result.value.assignment?.targets, [
    { kind: "builtin", value: "subject" },
  ]);
  assert.equal(result.value.assignment?.colors.length, 5);
  assert.deepEqual(
    result.value.assignment?.colors.map((swatch) => swatch.id),
    [
      "preset-swatch-1",
      "preset-swatch-2",
      "preset-swatch-3",
      "preset-swatch-4",
      "preset-swatch-5",
    ],
  );

  const cleared = applyPromptColorAssignmentPreset(
    result.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.assignment?.presetId, undefined);
  assert.equal(cleared.value.assignment?.colors.length, 5);
});

test("swatch add, literal update, and delete detach active preset", () => {
  const draft = createAssignmentFixture();
  let presetIndex = 0;
  const preset = applyPromptColorAssignmentPreset(
    draft,
    ColorPaletteModule,
    "color-rule-a",
    "grayscale_neutral_palette",
    { createSwatchId: () => `preset-${++presetIndex}` },
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const added = addPromptColorSwatch(
    preset.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "#123456",
    { createSwatchId: () => "manual-swatch" },
  );
  assert.equal(added.ok, true);
  if (!added.ok) return;
  assert.equal(added.value.assignment?.presetId, undefined);
  assert.equal(added.value.swatch?.id, "manual-swatch");

  const literal = setPromptColorSwatchLiteral(
    added.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "manual-swatch",
    "not-hex-but-authored",
  );
  assert.equal(literal.ok, true);
  if (!literal.ok) return;
  assert.deepEqual(literal.value.swatch, {
    id: "manual-swatch",
    kind: "literal",
    value: "not-hex-but-authored",
  });

  const deleted = deletePromptColorSwatch(
    literal.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "manual-swatch",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.equal(
    deleted.value.assignment?.colors.some((swatch) => swatch.id === "manual-swatch"),
    false,
  );
});

test("swatch variable binding accepts one exact enabled user Color variable only", () => {
  const draft = createAssignmentFixture();
  const added = addPromptColorSwatch(
    draft,
    ColorPaletteModule,
    "color-rule-a",
    "#000000",
    { createSwatchId: () => "swatch-a" },
  );
  assert.equal(added.ok, true);
  if (!added.ok) return;

  const bound = setPromptColorSwatchVariable(
    added.value.draft,
    ColorPaletteModule,
    "color-rule-a",
    "swatch-a",
    "color-brand",
  );
  assert.equal(bound.ok, true);
  if (!bound.ok) return;
  assert.deepEqual(bound.value.swatch, {
    id: "swatch-a",
    kind: "variable",
    value: "{brandColor}",
    variableId: "color-brand",
    token: "{brandColor}",
    label: "brandColor",
  });

  for (const variableId of ["text-note", "color-disabled", "missing-color"]) {
    const rejected = setPromptColorSwatchVariable(
      added.value.draft,
      ColorPaletteModule,
      "color-rule-a",
      "swatch-a",
      variableId,
    );
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.issues[0]?.code, "color_variable_unavailable");
    }
  }
});

test("color assignment mutations use exact stable IDs and reject missing or duplicate identities", () => {
  const draft = createAssignmentFixture();
  const missing = deletePromptColorAssignment(
    draft,
    ColorPaletteModule,
    "missing-rule",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "color_assignment_not_found");
  }

  const duplicate = createPromptColorAssignment(draft, ColorPaletteModule, {
    createAssignmentId: () => "color-rule-a",
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(duplicate.issues[0]?.code, "color_assignment_identity_conflict");
  }
});

test("legacy color assignment shape is normalized before exact domain mutation", () => {
  const draft = createDraft();
  draft.moduleValues.colorPalette = {
    paletteAssignments: [
      {
        preset: "teal_and_orange_palette",
        usage: "background",
        colors: ["#111111", "#222222"],
      },
    ] as any,
    extraDetails: "",
    customText: "",
  };

  const result = deletePromptColorAssignment(
    draft,
    ColorPaletteModule,
    "color-rule-1",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.assignments, []);
});

test("registered Color Palette actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerColorPaletteActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "colorPalette.assignment.create",
      "colorPalette.assignment.delete",
      "colorPalette.assignment.scope.set",
      "colorPalette.assignment.applyPreset",
      "colorPalette.swatch.add",
      "colorPalette.swatch.setLiteral",
      "colorPalette.swatch.setVariable",
      "colorPalette.swatch.delete",
    ],
  );

  const original = createDraft();
  const created = await registry.execute(
    "colorPalette.assignment.create",
    {
      draft: original,
      modules: [ColorPaletteModule],
      idFactory: { colorAssignment: () => "action-rule" },
    },
    {},
  );
  assert.equal(created.ok, true);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(created.draft).length, 1);

  const failed = await registry.execute(
    "colorPalette.swatch.setVariable",
    {
      draft: created.draft,
      modules: [ColorPaletteModule],
    },
    {
      assignmentId: "action-rule",
      swatchId: "missing-swatch",
      variableId: "color-brand",
    },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, created.draft);
});
