import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerEffectsLayerActions } from "../app/actions/effectLayers.ts";
import { registerLightingSourceActions } from "../app/actions/lightingSources.ts";
import {
  createPromptEffectLayer,
  deletePromptEffectLayer,
  updatePromptEffectLayer,
} from "../app/domain/effectLayers.ts";
import {
  createPromptLightingSource,
  deletePromptLightingSource,
  updatePromptLightingSource,
} from "../app/domain/lightingSources.ts";
import { EffectsModule } from "../app/modules/effects.module.ts";
import { LightingModule } from "../app/modules/lighting.module.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { EffectLayer, LightingSource, ModuleValues } from "../app/modules/types.ts";
import { getModulePresetValues } from "../app/utils/compileModules.ts";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDraft(
  moduleKey: "lighting" | "effects",
  values: ModuleValues,
  activePresetId: string | null = null,
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: [moduleKey],
    moduleValues: {
      [moduleKey]: clone(values),
    },
    modulePanelStates: activePresetId
      ? {
          [moduleKey]: {
            isCustomMode: false,
            activePresetId,
          },
        }
      : {},
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

function lightingSource(
  id: string | undefined,
  overrides: Partial<LightingSource> = {},
): LightingSource {
  return {
    ...(id ? { id } : {}),
    role: "key",
    sourceType: "softbox",
    direction: "front",
    quality: "soft",
    intensity: "balanced",
    color: "neutral",
    customColor: "",
    features: [],
    ...overrides,
  };
}

function effectLayer(
  id: string | undefined,
  overrides: Partial<EffectLayer> = {},
): EffectLayer {
  return {
    ...(id ? { id } : {}),
    effectType: "vignette",
    customEffect: "",
    intensity: "balanced",
    details: "",
    ...overrides,
  };
}

test("lighting source create uses deterministic stable ID and preserves caller", () => {
  const original = createDraft("lighting", { lightSources: [] });
  const result = createPromptLightingSource(original, LightingModule, {
    createSourceId: () => "light-new",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.source?.id, "light-new");
  assert.deepEqual(result.value.source, {
    id: "light-new",
    role: "",
    sourceType: "",
    direction: "",
    quality: "",
    intensity: "",
    color: "",
    customColor: "",
    features: [],
  });
  assert.deepEqual(original.moduleValues.lighting?.lightSources, []);
});

test("lighting source create enforces configured maxSources", () => {
  const original = createDraft("lighting", {
    lightSources: [
      lightingSource("l1"),
      lightingSource("l2"),
      lightingSource("l3"),
    ],
  });
  const result = createPromptLightingSource(original, LightingModule, {
    createSourceId: () => "l4",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "lighting_source_limit_reached");
    assert.equal(result.issues[0]?.details?.maxSources, 3);
  }
});

test("lighting source update applies canonical custom-color transitions", () => {
  const original = createDraft("lighting", {
    lightSources: [
      lightingSource("l1", {
        color: "custom",
        customColor: "#123456",
      }),
    ],
  });

  const warm = updatePromptLightingSource(
    original,
    LightingModule,
    "l1",
    { color: "warm" },
  );
  assert.equal(warm.ok, true);
  if (!warm.ok) return;
  assert.equal(warm.value.source?.color, "warm");
  assert.equal(warm.value.source?.customColor, "");

  const custom = updatePromptLightingSource(
    warm.value.draft,
    LightingModule,
    "l1",
    { color: "custom" },
  );
  assert.equal(custom.ok, true);
  if (!custom.ok) return;
  assert.equal(custom.value.source?.customColor, "#ffffff");

  const invalidHex = updatePromptLightingSource(
    custom.value.draft,
    LightingModule,
    "l1",
    { customColor: "not-a-color" },
  );
  assert.equal(invalidHex.ok, true);
  if (invalidHex.ok) {
    assert.equal(invalidHex.value.source?.customColor, "#ffffff");
  }
});

test("lighting source update validates catalog values and detaches preset only on mismatch", () => {
  const presetValues = getModulePresetValues(LightingModule, "soft_diffused");
  const original = createDraft("lighting", presetValues, "soft_diffused");

  const unchanged = updatePromptLightingSource(
    original,
    LightingModule,
    "soft-key",
    { role: "key" },
  );
  assert.equal(unchanged.ok, true);
  if (!unchanged.ok) return;
  assert.equal(
    unchanged.value.draft.modulePanelStates.lighting?.activePresetId,
    "soft_diffused",
  );

  const changed = updatePromptLightingSource(
    unchanged.value.draft,
    LightingModule,
    "soft-key",
    { intensity: "bright" },
  );
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.equal(
    changed.value.draft.modulePanelStates.lighting?.activePresetId,
    null,
  );

  const invalid = updatePromptLightingSource(
    original,
    LightingModule,
    "soft-key",
    { sourceType: "imaginary_lamp" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(invalid.issues[0]?.code, "lighting_source_invalid_option");
    assert.equal(invalid.issues[0]?.path, "sourceType");
  }
});

test("lighting mutations normalize legacy IDs and reject exact identity conflicts", () => {
  const legacy = createDraft("lighting", {
    lightSources: [lightingSource(undefined)],
  });
  const updated = updatePromptLightingSource(
    legacy,
    LightingModule,
    "light-1",
    { intensity: "bright" },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.source?.id, "light-1");

  const deleted = deletePromptLightingSource(
    updated.value.draft,
    LightingModule,
    "light-1",
  );
  assert.equal(deleted.ok, true);
  if (deleted.ok) assert.equal(deleted.value.sources.length, 0);

  const missing = deletePromptLightingSource(
    legacy,
    LightingModule,
    "missing",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "lighting_source_not_found");

  const conflict = createDraft("lighting", {
    lightSources: [
      lightingSource("light-2"),
      lightingSource(undefined),
    ],
  });
  const conflictResult = updatePromptLightingSource(
    conflict,
    LightingModule,
    "light-2",
    { intensity: "bright" },
  );
  assert.equal(conflictResult.ok, false);
  if (!conflictResult.ok) {
    assert.equal(conflictResult.issues[0]?.code, "lighting_source_identity_conflict");
  }
});

test("registered Lighting actions expose stable IDs and failures stay atomic", async () => {
  const registry = registerLightingSourceActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((action) => action.id),
    [
      "lighting.source.create",
      "lighting.source.update",
      "lighting.source.delete",
    ],
  );

  const original = createDraft("lighting", { lightSources: [] });
  original.selectedModuleKeys = [];
  const failed = await registry.execute(
    "lighting.source.create",
    {
      draft: original,
      modules: [LightingModule],
      idFactory: { lightingSource: () => "should-not-write" },
    },
    {},
  );
  assert.equal(failed.ok, false);
  assert.equal(failed.draft, original);
  assert.deepEqual(original.moduleValues.lighting?.lightSources, []);
});

test("effects layer create uses deterministic stable ID and preserves caller", () => {
  const original = createDraft("effects", { effectLayers: [] });
  const result = createPromptEffectLayer(original, EffectsModule, {
    createLayerId: () => "effect-new",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.layer, {
    id: "effect-new",
    effectType: "",
    customEffect: "",
    intensity: "",
    details: "",
  });
  assert.deepEqual(original.moduleValues.effects?.effectLayers, []);
});

test("effects layer create enforces configured maxLayers", () => {
  const layers = Array.from({ length: 8 }, (_, index) =>
    effectLayer(`e${index + 1}`),
  );
  const original = createDraft("effects", { effectLayers: layers });
  const result = createPromptEffectLayer(original, EffectsModule, {
    createLayerId: () => "e9",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "effect_layer_limit_reached");
    assert.equal(result.issues[0]?.details?.maxLayers, 8);
  }
});

test("effects layer update applies canonical custom-effect transitions", () => {
  const original = createDraft("effects", {
    effectLayers: [
      effectLayer("e1", {
        effectType: "custom",
        customEffect: "hand-painted aura",
      }),
    ],
  });

  const known = updatePromptEffectLayer(
    original,
    EffectsModule,
    "e1",
    { effectType: "vignette" },
  );
  assert.equal(known.ok, true);
  if (!known.ok) return;
  assert.equal(known.value.layer?.customEffect, "");

  const custom = updatePromptEffectLayer(
    known.value.draft,
    EffectsModule,
    "e1",
    { effectType: "custom", customEffect: "prismatic haze" },
  );
  assert.equal(custom.ok, true);
  if (custom.ok) {
    assert.equal(custom.value.layer?.effectType, "custom");
    assert.equal(custom.value.layer?.customEffect, "prismatic haze");
  }
});

test("effects layer update validates catalog values and detaches preset only on mismatch", () => {
  const presetValues = getModulePresetValues(EffectsModule, "subtle_post_finish");
  const original = createDraft("effects", presetValues, "subtle_post_finish");

  const unchanged = updatePromptEffectLayer(
    original,
    EffectsModule,
    "finish-vignette",
    { intensity: "subtle" },
  );
  assert.equal(unchanged.ok, true);
  if (!unchanged.ok) return;
  assert.equal(
    unchanged.value.draft.modulePanelStates.effects?.activePresetId,
    "subtle_post_finish",
  );

  const changed = updatePromptEffectLayer(
    unchanged.value.draft,
    EffectsModule,
    "finish-vignette",
    { details: "stronger edge falloff" },
  );
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.equal(
    changed.value.draft.modulePanelStates.effects?.activePresetId,
    null,
  );

  const invalid = updatePromptEffectLayer(
    original,
    EffectsModule,
    "finish-vignette",
    { effectType: "unknown_fx" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(invalid.issues[0]?.code, "effect_layer_invalid_option");
    assert.equal(invalid.issues[0]?.path, "effectType");
  }
});

test("effects mutations normalize legacy IDs and reject exact identity conflicts", () => {
  const legacy = createDraft("effects", {
    effectLayers: [effectLayer(undefined)],
  });
  const updated = updatePromptEffectLayer(
    legacy,
    EffectsModule,
    "effect-1",
    { intensity: "strong" },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.layer?.id, "effect-1");

  const deleted = deletePromptEffectLayer(
    updated.value.draft,
    EffectsModule,
    "effect-1",
  );
  assert.equal(deleted.ok, true);
  if (deleted.ok) assert.equal(deleted.value.layers.length, 0);

  const missing = deletePromptEffectLayer(
    legacy,
    EffectsModule,
    "missing",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "effect_layer_not_found");

  const conflict = createDraft("effects", {
    effectLayers: [
      effectLayer("effect-2"),
      effectLayer(undefined),
    ],
  });
  const conflictResult = updatePromptEffectLayer(
    conflict,
    EffectsModule,
    "effect-2",
    { intensity: "strong" },
  );
  assert.equal(conflictResult.ok, false);
  if (!conflictResult.ok) {
    assert.equal(conflictResult.issues[0]?.code, "effect_layer_identity_conflict");
  }
});

test("registered Effects actions expose stable IDs and failures stay atomic", async () => {
  const registry = registerEffectsLayerActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((action) => action.id),
    [
      "effects.layer.create",
      "effects.layer.update",
      "effects.layer.delete",
    ],
  );

  const original = createDraft("effects", { effectLayers: [] });
  original.selectedModuleKeys = [];
  const failed = await registry.execute(
    "effects.layer.create",
    {
      draft: original,
      modules: [EffectsModule],
      idFactory: { effectLayer: () => "should-not-write" },
    },
    {},
  );
  assert.equal(failed.ok, false);
  assert.equal(failed.draft, original);
  assert.deepEqual(original.moduleValues.effects?.effectLayers, []);
});
