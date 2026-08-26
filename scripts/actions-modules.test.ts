import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerModuleActions } from "../app/actions/modules.ts";
import {
  activatePromptModule,
  applyPromptModulePreset,
  deactivatePromptModule,
  setPromptModuleCustomMode,
  setPromptModuleField,
} from "../app/domain/modules.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";

const module: PromptKeyModule = {
  key: "testModule",
  fields: {
    title: {
      id: "title",
      type: "text",
      default: "",
    },
    mode: {
      id: "mode",
      type: "select",
      default: "a",
      options: [
        { value: "a" },
        { value: "b" },
      ],
    },
    freeformAxis: {
      id: "freeformAxis",
      type: "select",
      default: "",
      options: [
        { value: "defined" },
        { value: "freeform", freeform: true },
      ],
    },
    material: {
      id: "material",
      type: "select",
      default: "matte",
      options: [
        { value: "matte" },
        { value: "glossy" },
        { value: "custom" },
      ],
      customInput: {},
    },
    tags: {
      id: "tags",
      type: "multiSelect",
      default: [],
      options: [
        { value: "one" },
        { value: "two" },
      ],
    },
    intensity: {
      id: "intensity",
      type: "range",
      default: 0.5,
      ui: {
        min: 0,
        max: 1,
      },
    },
    sources: {
      id: "sources",
      type: "lightSources",
      default: [],
    },
    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      isOverride: true,
    },
  },
  presets: {
    clean: {
      id: "clean",
      values: {
        title: "Preset title",
        mode: "b",
        material: "matte",
      },
    },
    customMaterial: {
      id: "customMaterial",
      values: {
        material: "custom",
        materialCustom: "brushed ceramic",
      },
    },
  },
};

const moduleWithoutOverride: PromptKeyModule = {
  key: "plain",
  fields: {
    title: {
      id: "title",
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

test("module activation initializes missing canonical state", () => {
  const original = createDraft();
  const result = activatePromptModule(original, module);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value.draft.selectedModuleKeys, ["testModule"]);
  assert.equal(result.value.moduleValues.mode, "a");
  assert.equal(result.value.moduleValues.intensity, 0.5);
  assert.deepEqual(result.value.panelState, {
    isCustomMode: false,
    activePresetId: null,
  });
  assert.deepEqual(original.selectedModuleKeys, []);
  assert.deepEqual(original.moduleValues, {});
});

test("module activation preserves existing inactive state", () => {
  const draft = createDraft({
    moduleValues: {
      testModule: {
        title: "kept",
      },
    },
    modulePanelStates: {
      testModule: {
        isCustomMode: true,
        activePresetId: "old",
      },
    },
  });

  const result = activatePromptModule(draft, module);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value.moduleValues, { title: "kept" });
  assert.equal(result.value.panelState.isCustomMode, true);
  assert.equal(result.value.panelState.activePresetId, "old");
});

test("module deactivation is non-destructive", () => {
  const draft = createDraft({
    selectedModuleKeys: ["testModule"],
    moduleValues: {
      testModule: { title: "persist me" },
    },
    modulePanelStates: {
      testModule: { isCustomMode: true, activePresetId: null },
    },
  });

  const result = deactivatePromptModule(draft, module);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value.draft.selectedModuleKeys, []);
  assert.equal(result.value.draft.moduleValues.testModule?.title, "persist me");
  assert.equal(
    result.value.draft.modulePanelStates.testModule?.isCustomMode,
    true,
  );
});

test("simple field mutation validates schema and preserves the caller", () => {
  const draft = createDraft({
    selectedModuleKeys: ["testModule"],
    moduleValues: {
      testModule: { title: "old", mode: "a" },
    },
    modulePanelStates: {
      testModule: { isCustomMode: false, activePresetId: null },
    },
  });

  const updated = setPromptModuleField(draft, module, {
    fieldId: "title",
    value: "new",
  });
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.moduleValues.title, "new");
  assert.equal(draft.moduleValues.testModule?.title, "old");

  const invalidOption = setPromptModuleField(draft, module, {
    fieldId: "mode",
    value: "missing",
  });
  assert.equal(invalidOption.ok, false);
  if (!invalidOption.ok) {
    assert.equal(invalidOption.issues[0]?.code, "module_field_invalid_option");
  }

  const structured = setPromptModuleField(draft, module, {
    fieldId: "sources",
    value: [],
  });
  assert.equal(structured.ok, false);
  if (!structured.ok) {
    assert.equal(structured.issues[0]?.code, "module_field_structured");
  }

  const range = setPromptModuleField(draft, module, {
    fieldId: "intensity",
    value: 2,
  });
  assert.equal(range.ok, false);
  if (!range.ok) {
    assert.equal(range.issues[0]?.code, "module_field_out_of_range");
  }
});

test("freeform and customInput field semantics remain distinct", () => {
  const draft = createDraft({
    selectedModuleKeys: ["testModule"],
    moduleValues: {
      testModule: {
        freeformAxis: "",
        material: "matte",
      },
    },
  });

  const freeform = setPromptModuleField(draft, module, {
    fieldId: "freeformAxis",
    value: "user authored axis",
  });
  assert.equal(freeform.ok, true);
  if (freeform.ok) {
    assert.equal(
      freeform.value.moduleValues.freeformAxis,
      "user authored axis",
    );
  }

  const custom = setPromptModuleField(draft, module, {
    fieldId: "material",
    value: "custom",
    customText: "oxidized copper",
  });
  assert.equal(custom.ok, true);
  if (custom.ok) {
    assert.equal(custom.value.moduleValues.material, "custom");
    assert.equal(
      custom.value.moduleValues.materialCustom,
      "oxidized copper",
    );
  }

  const inactiveCustomText = setPromptModuleField(draft, module, {
    fieldId: "material",
    value: "matte",
    customText: "should reject",
  });
  assert.equal(inactiveCustomText.ok, false);
  if (!inactiveCustomText.ok) {
    assert.equal(
      inactiveCustomText.issues[0]?.code,
      "module_field_custom_text_inactive",
    );
  }
});

test("field mutation clears active preset only when preset no longer matches", () => {
  const draft = createDraft({
    selectedModuleKeys: ["testModule"],
    moduleValues: {
      testModule: {
        title: "Preset title",
        mode: "b",
        material: "matte",
      },
    },
    modulePanelStates: {
      testModule: { isCustomMode: false, activePresetId: "clean" },
    },
  });

  const unrelated = setPromptModuleField(draft, module, {
    fieldId: "intensity",
    value: 0.8,
  });
  assert.equal(unrelated.ok, true);
  if (unrelated.ok) {
    assert.equal(unrelated.value.panelState.activePresetId, "clean");
  }

  const changed = setPromptModuleField(draft, module, {
    fieldId: "title",
    value: "different",
  });
  assert.equal(changed.ok, true);
  if (changed.ok) {
    assert.equal(changed.value.panelState.activePresetId, null);
  }
});

test("preset apply overlays values, clears stale sidecar, and exits custom mode", () => {
  const draft = createDraft({
    selectedModuleKeys: ["testModule"],
    moduleValues: {
      testModule: {
        title: "keep until overlaid",
        mode: "a",
        material: "custom",
        materialCustom: "old custom",
        intensity: 0.9,
      },
    },
    modulePanelStates: {
      testModule: { isCustomMode: true, activePresetId: null },
    },
  });

  const result = applyPromptModulePreset(draft, module, "clean");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.moduleValues.title, "Preset title");
  assert.equal(result.value.moduleValues.mode, "b");
  assert.equal(result.value.moduleValues.material, "matte");
  assert.equal(result.value.moduleValues.materialCustom, "");
  assert.equal(result.value.moduleValues.intensity, 0.9);
  assert.equal(result.value.panelState.activePresetId, "clean");
  assert.equal(result.value.panelState.isCustomMode, false);

  const custom = applyPromptModulePreset(
    result.value.draft,
    module,
    "customMaterial",
  );
  assert.equal(custom.ok, true);
  if (custom.ok) {
    assert.equal(custom.value.moduleValues.material, "custom");
    assert.equal(
      custom.value.moduleValues.materialCustom,
      "brushed ceramic",
    );
  }
});

test("custom mode requires an override field", () => {
  const active = createDraft({ selectedModuleKeys: ["testModule", "plain"] });

  const supported = setPromptModuleCustomMode(active, module, true);
  assert.equal(supported.ok, true);
  if (supported.ok) {
    assert.equal(supported.value.panelState.isCustomMode, true);
  }

  const unsupported = setPromptModuleCustomMode(
    active,
    moduleWithoutOverride,
    true,
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) {
    assert.equal(
      unsupported.issues[0]?.code,
      "module_custom_mode_unsupported",
    );
  }
});

test("module actions discover stable IDs and keep failures atomic", async () => {
  const registry = registerModuleActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((action) => action.id),
    [
      "module.activate",
      "module.deactivate",
      "module.field.set",
      "module.preset.apply",
      "module.customMode.set",
    ],
  );

  const original = createDraft();
  const missing = await registry.execute(
    "module.activate",
    { draft: original, modules: [module] },
    { moduleKey: "missing" },
  );

  assert.equal(missing.ok, false);
  assert.equal(missing.draft, original);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "module_not_found");
  }

  const inactiveField = await registry.execute(
    "module.field.set",
    { draft: original, modules: [module] },
    { moduleKey: "testModule", fieldId: "title", value: "x" },
  );

  assert.equal(inactiveField.ok, false);
  assert.equal(inactiveField.draft, original);
  if (!inactiveField.ok) {
    assert.equal(inactiveField.issues[0]?.code, "module_not_active");
  }
});
