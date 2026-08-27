import type {
  EffectLayer,
  ModuleField,
  ModuleFieldOption,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModulePanelState,
  PromptDraftState,
} from "../modules/promptDraft.types";
import {
  createDefaultModuleValues,
  getModulePresetValues,
} from "../utils/compileModules";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type EffectLayerPatch = {
  effectType?: string;
  customEffect?: string;
  intensity?: string;
  details?: string;
};

export type EffectLayerMutationOptions = {
  createLayerId?: () => string;
};

export type EffectLayerMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  panelState: ModulePanelState;
  layers: EffectLayer[];
  layer?: EffectLayer;
};

type EffectsTarget = {
  values: ModuleValues;
  field: ModuleField;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `effect_${crypto.randomUUID()}`;
  }
  return `effect_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateEffectsTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<EffectsTarget> {
  if (module.key !== "effects") {
    return domainFailure({
      code: "effects_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.effectLayers;
  if (!field || field.type !== "effectLayers") {
    return domainFailure({
      code: "effect_layers_field_missing",
      details: { moduleKey: module.key, fieldId: "effectLayers" },
    });
  }

  return domainSuccess({
    values: currentModuleValues(draft, module),
    field,
  });
}

function normalizeLayer(value: unknown, index: number): EffectLayer | null {
  if (!isRecord(value)) return null;

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `effect-${index + 1}`,
    effectType: typeof value.effectType === "string" ? value.effectType : "",
    customEffect: typeof value.customEffect === "string" ? value.customEffect : "",
    intensity: typeof value.intensity === "string" ? value.intensity : "",
    details: typeof value.details === "string" ? value.details : "",
  };
}

function normalizeLayers(value: unknown): EffectLayer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeLayer(item, index))
    .filter((item): item is EffectLayer => Boolean(item));
}

function validateStableIdentities(
  layers: readonly EffectLayer[],
): DomainResult<true> {
  const ids = new Set<string>();

  for (const layer of layers) {
    const layerId = String(layer.id || "").trim();
    if (!layerId || ids.has(layerId)) {
      return domainFailure({
        code: "effect_layer_identity_conflict",
        details: { layerId },
      });
    }
    ids.add(layerId);
  }

  return domainSuccess(true);
}

function readLayers(values: ModuleValues): DomainResult<EffectLayer[]> {
  const layers = normalizeLayers(values.effectLayers);
  const identities = validateStableIdentities(layers);
  if (!identities.ok) return identities;
  return domainSuccess(layers);
}

function layerIndexById(
  layers: readonly EffectLayer[],
  layerId: string,
) {
  return layers.findIndex((layer) => layer.id === layerId);
}

function layerNotFound(layerId: string) {
  return domainFailure({
    code: "effect_layer_not_found",
    path: "layerId",
    details: { layerId },
  });
}

function configuredMaxLayers(field: ModuleField) {
  const configured = Number(field.config?.maxLayers || 8);
  if (!Number.isFinite(configured)) return 8;
  return Math.max(1, Math.min(12, Math.trunc(configured)));
}

function configOptions(field: ModuleField, key: string): ModuleFieldOption[] {
  const value = field.config?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ModuleFieldOption => {
    return Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as ModuleFieldOption).value === "string",
    );
  });
}

function validateOption(
  field: ModuleField,
  configKey: "effectTypeOptions" | "intensityOptions",
  path: "effectType" | "intensity",
  value: string,
): DomainResult<string> {
  if (!value) return domainSuccess(value);

  const allowed = configOptions(field, configKey);
  if (allowed.some((option) => option.value === value)) {
    return domainSuccess(value);
  }

  return domainFailure({
    code: "effect_layer_invalid_option",
    path,
    details: { property: path, value },
  });
}

function normalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
        .map(([key, item]) => [key, normalizeForComparison(item)]),
    );
  }

  return value;
}

function valuesEqual(first: unknown, second: unknown) {
  try {
    return (
      JSON.stringify(normalizeForComparison(first)) ===
      JSON.stringify(normalizeForComparison(second))
    );
  } catch {
    return first === second;
  }
}

function presetMatchesValues(
  module: PromptKeyModule,
  presetId: string,
  values: ModuleValues,
) {
  const entries = Object.entries(getModulePresetValues(module, presetId));
  if (!entries.length) return false;
  return entries.every(([key, value]) => valuesEqual(values[key], value));
}

function withLayers(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  layers: readonly EffectLayer[],
  layer?: EffectLayer,
): DomainResult<EffectLayerMutation> {
  const nextLayers = cloneValue(layers);
  const nextModuleValues: ModuleValues = {
    ...cloneValue(values),
    effectLayers: nextLayers,
  };
  const nextDraft = cloneValue(draft);
  const panelState: ModulePanelState = cloneValue(
    draft.modulePanelStates[module.key] || {},
  );

  if (
    panelState.activePresetId &&
    !presetMatchesValues(module, panelState.activePresetId, nextModuleValues)
  ) {
    panelState.activePresetId = null;
    nextDraft.modulePanelStates = {
      ...nextDraft.modulePanelStates,
      [module.key]: cloneValue(panelState),
    };
  }

  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    panelState: cloneValue(panelState),
    layers: cloneValue(nextLayers),
    layer: layer ? cloneValue(layer) : undefined,
  });
}

export function createPromptEffectLayer(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: EffectLayerMutationOptions = {},
): DomainResult<EffectLayerMutation> {
  const target = validateEffectsTarget(draft, module);
  if (!target.ok) return target;

  const layersResult = readLayers(target.value.values);
  if (!layersResult.ok) return layersResult;

  const layers = layersResult.value;
  const maxLayers = configuredMaxLayers(target.value.field);
  if (layers.length >= maxLayers) {
    return domainFailure({
      code: "effect_layer_limit_reached",
      details: { maxLayers },
    });
  }

  const layer: EffectLayer = {
    id: (options.createLayerId || randomId)(),
    effectType: "",
    customEffect: "",
    intensity: "",
    details: "",
  };

  if (layers.some((item) => item.id === layer.id)) {
    return domainFailure({
      code: "effect_layer_identity_conflict",
      details: { layerId: layer.id },
    });
  }

  return withLayers(
    draft,
    module,
    target.value.values,
    [...layers, layer],
    layer,
  );
}

export function updatePromptEffectLayer(
  draft: PromptDraftState,
  module: PromptKeyModule,
  layerId: string,
  patch: EffectLayerPatch,
): DomainResult<EffectLayerMutation> {
  const target = validateEffectsTarget(draft, module);
  if (!target.ok) return target;

  const layersResult = readLayers(target.value.values);
  if (!layersResult.ok) return layersResult;
  const layers = layersResult.value;
  const index = layerIndexById(layers, layerId);
  if (index < 0) return layerNotFound(layerId);

  if (patch.effectType !== undefined) {
    if (typeof patch.effectType !== "string") {
      return domainFailure({
        code: "effect_layer_invalid_value",
        path: "effectType",
        details: { expected: "string" },
      });
    }
    const typeResult = validateOption(
      target.value.field,
      "effectTypeOptions",
      "effectType",
      patch.effectType,
    );
    if (!typeResult.ok) return typeResult;
  }

  if (patch.intensity !== undefined) {
    if (typeof patch.intensity !== "string") {
      return domainFailure({
        code: "effect_layer_invalid_value",
        path: "intensity",
        details: { expected: "string" },
      });
    }
    const intensityResult = validateOption(
      target.value.field,
      "intensityOptions",
      "intensity",
      patch.intensity,
    );
    if (!intensityResult.ok) return intensityResult;
  }

  if (patch.customEffect !== undefined && typeof patch.customEffect !== "string") {
    return domainFailure({
      code: "effect_layer_invalid_value",
      path: "customEffect",
      details: { expected: "string" },
    });
  }

  if (patch.details !== undefined && typeof patch.details !== "string") {
    return domainFailure({
      code: "effect_layer_invalid_value",
      path: "details",
      details: { expected: "string" },
    });
  }

  const current = cloneValue(layers[index]);
  const next: EffectLayer = {
    ...current,
    ...(patch.effectType !== undefined ? { effectType: patch.effectType } : {}),
    ...(patch.intensity !== undefined ? { intensity: patch.intensity } : {}),
    ...(patch.details !== undefined ? { details: patch.details } : {}),
  };

  const finalType = next.effectType || "";
  if (patch.effectType !== undefined) {
    next.customEffect = finalType === "custom"
      ? (patch.customEffect !== undefined ? patch.customEffect : current.customEffect || "")
      : "";
  } else if (patch.customEffect !== undefined) {
    next.customEffect = finalType === "custom" ? patch.customEffect : "";
  }

  const updated = cloneValue(layers);
  updated[index] = next;

  return withLayers(
    draft,
    module,
    target.value.values,
    updated,
    next,
  );
}

export function deletePromptEffectLayer(
  draft: PromptDraftState,
  module: PromptKeyModule,
  layerId: string,
): DomainResult<EffectLayerMutation> {
  const target = validateEffectsTarget(draft, module);
  if (!target.ok) return target;

  const layersResult = readLayers(target.value.values);
  if (!layersResult.ok) return layersResult;
  const layers = layersResult.value;
  const index = layerIndexById(layers, layerId);
  if (index < 0) return layerNotFound(layerId);

  return withLayers(
    draft,
    module,
    target.value.values,
    layers.filter((_, layerIndex) => layerIndex !== index),
    cloneValue(layers[index]),
  );
}
