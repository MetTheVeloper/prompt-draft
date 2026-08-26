import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerModuleEntityFieldActions } from "../app/actions/moduleEntityFields.ts";
import {
  applyPromptModuleEntityPreset,
  clearPromptModuleEntityField,
  setPromptModuleEntityField,
} from "../app/domain/moduleEntityFields.ts";
import { withModuleEntityConfig } from "../app/modules/entityContracts.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";

const baseModule: PromptKeyModule = {
  key: "style",
  fields: {
    title: {
      id: "title",
      type: "text",
      default: "",
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
        title: "Clean style",
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

const module = withModuleEntityConfig(baseModule, {
  enabled: true,
  sceneExposable: true,
  allowGlobalInheritanceToggle: true,
});

function createDraft(): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: {
        title: "Global title",
        material: "glossy",
        entities: [
          {
            id: "style-entity-1",
            key: "heroStyle",
            name: "Hero Style",
            enabled: true,
            inheritGlobal: true,
            payload: {
              title: "Local title",
              material: "custom",
              materialCustom: "existing custom",
              untouched: "keep me",
            },
          },
        ],
      },
    },
    modulePanelStates: {
      style: {
        isCustomMode: false,
        activePresetId: null,
      },
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
  };
}

function entityPayload(draft: PromptDraftState) {
  const entities = draft.moduleValues.style?.entities as Array<{
    payload: Record<string, unknown>;
  }>;
  return entities[0]?.payload || {};
}

test("module entity field set writes one local simple override and preserves stable identity", () => {
  const original = createDraft();
  const result = setPromptModuleEntityField(original, module, {
    entityId: "style-entity-1",
    fieldId: "title",
    value: "Updated local",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.entity.id, "style-entity-1");
  assert.equal(result.value.entity.payload.title, "Updated local");
  assert.equal(result.value.entity.payload.untouched, "keep me");
  assert.equal(entityPayload(original).title, "Local title");
});

test("module entity customInput field preserves canonical sidecar rules", () => {
  const original = createDraft();
  const custom = setPromptModuleEntityField(original, module, {
    entityId: "style-entity-1",
    fieldId: "material",
    value: "custom",
    customText: "hand glazed clay",
  });

  assert.equal(custom.ok, true);
  if (!custom.ok) return;
  assert.equal(custom.value.entity.payload.material, "custom");
  assert.equal(custom.value.entity.payload.materialCustom, "hand glazed clay");

  const invalid = setPromptModuleEntityField(original, module, {
    entityId: "style-entity-1",
    fieldId: "material",
    value: "matte",
    customText: "not active",
  });

  assert.equal(invalid.ok, false);
  if (invalid.ok) return;
  assert.equal(invalid.issues[0]?.code, "module_field_custom_text_inactive");
  assert.deepEqual(original, createDraft());
});

test("module entity field clear removes the local override and custom sidecar only", () => {
  const original = createDraft();
  const result = clearPromptModuleEntityField(
    original,
    module,
    "style-entity-1",
    "material",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal("material" in result.value.entity.payload, false);
  assert.equal("materialCustom" in result.value.entity.payload, false);
  assert.equal(result.value.entity.payload.title, "Local title");
  assert.equal(result.value.entity.payload.untouched, "keep me");
});

test("module entity field actions reject structured and override fields", () => {
  const original = createDraft();

  const structured = setPromptModuleEntityField(original, module, {
    entityId: "style-entity-1",
    fieldId: "sources",
    value: [],
  });
  assert.equal(structured.ok, false);
  if (!structured.ok) {
    assert.equal(structured.issues[0]?.code, "module_field_structured");
  }

  const override = setPromptModuleEntityField(original, module, {
    entityId: "style-entity-1",
    fieldId: "customText",
    value: "nope",
  });
  assert.equal(override.ok, false);
  if (!override.ok) {
    assert.equal(
      override.issues[0]?.code,
      "module_entity_field_override_unsupported",
    );
  }

  assert.deepEqual(original, createDraft());
});

test("module entity preset overlays eligible payload and synchronizes sidecars", () => {
  const original = createDraft();
  const clean = applyPromptModuleEntityPreset(
    original,
    module,
    "style-entity-1",
    "clean",
  );

  assert.equal(clean.ok, true);
  if (!clean.ok) return;
  assert.equal(clean.value.entity.payload.title, "Clean style");
  assert.equal(clean.value.entity.payload.material, "matte");
  assert.equal("materialCustom" in clean.value.entity.payload, false);
  assert.equal(clean.value.entity.payload.untouched, "keep me");

  const custom = applyPromptModuleEntityPreset(
    clean.value.draft,
    module,
    "style-entity-1",
    "customMaterial",
  );
  assert.equal(custom.ok, true);
  if (!custom.ok) return;
  assert.equal(custom.value.entity.payload.material, "custom");
  assert.equal(custom.value.entity.payload.materialCustom, "");
});

test("registered module entity field actions expose stable IDs and failures stay atomic", async () => {
  const registry = new ActionRegistry();
  registerModuleEntityFieldActions(registry);

  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "moduleEntity.field.set",
      "moduleEntity.field.clear",
      "moduleEntity.preset.apply",
    ],
  );

  const original = createDraft();
  const result = await registry.execute(
    "moduleEntity.field.set",
    {
      draft: original,
      modules: [module],
    },
    {
      moduleKey: "style",
      entityId: "missing",
      fieldId: "title",
      value: "X",
    },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.issues[0]?.code, "module_entity_not_found");
  assert.deepEqual(result.draft, original);
});
