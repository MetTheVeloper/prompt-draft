import type {
  LightingSource,
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

export type LightingSourcePatch = {
  role?: string;
  sourceType?: string;
  direction?: string;
  quality?: string;
  intensity?: string;
  color?: string;
  customColor?: string;
  features?: string[];
};

export type LightingSourceMutationOptions = {
  createSourceId?: () => string;
};

export type LightingSourceMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  panelState: ModulePanelState;
  sources: LightingSource[];
  source?: LightingSource;
};

type LightingTarget = {
  values: ModuleValues;
  field: ModuleField;
};

const SELECT_KEYS = [
  "role",
  "sourceType",
  "direction",
  "quality",
  "intensity",
  "color",
] as const satisfies readonly (keyof LightingSourcePatch)[];

const CONFIG_OPTION_KEYS: Record<(typeof SELECT_KEYS)[number], string> = {
  role: "roleOptions",
  sourceType: "sourceTypeOptions",
  direction: "directionOptions",
  quality: "qualityOptions",
  intensity: "intensityOptions",
  color: "colorOptions",
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
    return `light_${crypto.randomUUID()}`;
  }
  return `light_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateLightingTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<LightingTarget> {
  if (module.key !== "lighting") {
    return domainFailure({
      code: "lighting_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.lightSources;
  if (!field || field.type !== "lightSources") {
    return domainFailure({
      code: "lighting_sources_field_missing",
      details: { moduleKey: module.key, fieldId: "lightSources" },
    });
  }

  return domainSuccess({
    values: currentModuleValues(draft, module),
    field,
  });
}

function normalizeSource(value: unknown, index: number): LightingSource | null {
  if (!isRecord(value)) return null;

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `light-${index + 1}`,
    role: typeof value.role === "string" ? value.role : "",
    sourceType: typeof value.sourceType === "string" ? value.sourceType : "",
    direction: typeof value.direction === "string" ? value.direction : "",
    quality: typeof value.quality === "string" ? value.quality : "",
    intensity: typeof value.intensity === "string" ? value.intensity : "",
    color: typeof value.color === "string" ? value.color : "",
    customColor: typeof value.customColor === "string" ? value.customColor : "",
    features: Array.isArray(value.features)
      ? value.features.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function normalizeSources(value: unknown): LightingSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeSource(item, index))
    .filter((item): item is LightingSource => Boolean(item));
}

function validateStableIdentities(
  sources: readonly LightingSource[],
): DomainResult<true> {
  const ids = new Set<string>();

  for (const source of sources) {
    const sourceId = String(source.id || "").trim();
    if (!sourceId || ids.has(sourceId)) {
      return domainFailure({
        code: "lighting_source_identity_conflict",
        details: { sourceId },
      });
    }
    ids.add(sourceId);
  }

  return domainSuccess(true);
}

function readSources(values: ModuleValues): DomainResult<LightingSource[]> {
  const sources = normalizeSources(values.lightSources);
  const identities = validateStableIdentities(sources);
  if (!identities.ok) return identities;
  return domainSuccess(sources);
}

function sourceIndexById(
  sources: readonly LightingSource[],
  sourceId: string,
) {
  return sources.findIndex((source) => source.id === sourceId);
}

function sourceNotFound(sourceId: string) {
  return domainFailure({
    code: "lighting_source_not_found",
    path: "sourceId",
    details: { sourceId },
  });
}

function configuredMaxSources(field: ModuleField) {
  const configured = Number(field.config?.maxSources || 3);
  if (!Number.isFinite(configured)) return 3;
  return Math.max(1, Math.min(3, Math.trunc(configured)));
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
  property: (typeof SELECT_KEYS)[number],
  value: string,
): DomainResult<string> {
  if (!value) return domainSuccess(value);

  const allowed = configOptions(field, CONFIG_OPTION_KEYS[property]);
  if (allowed.some((option) => option.value === value)) {
    return domainSuccess(value);
  }

  return domainFailure({
    code: "lighting_source_invalid_option",
    path: property,
    details: { property, value },
  });
}

function validateFeatures(
  field: ModuleField,
  features: readonly string[],
): DomainResult<string[]> {
  const allowed = new Set(
    configOptions(field, "featureOptions").map((option) => option.value),
  );
  const invalid = features.find((feature) => !allowed.has(feature));

  if (invalid !== undefined) {
    return domainFailure({
      code: "lighting_source_invalid_feature",
      path: "features",
      details: { value: invalid },
    });
  }

  return domainSuccess([...features]);
}

function normalizeCustomColor(value?: string) {
  const cleaned = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(cleaned) ? cleaned : "#ffffff";
}

function valuesEqual(first: unknown, second: unknown) {
  try {
    return JSON.stringify(first) === JSON.stringify(second);
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

function withSources(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  sources: readonly LightingSource[],
  source?: LightingSource,
): DomainResult<LightingSourceMutation> {
  const nextSources = cloneValue(sources);
  const nextModuleValues: ModuleValues = {
    ...cloneValue(values),
    lightSources: nextSources,
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
    sources: cloneValue(nextSources),
    source: source ? cloneValue(source) : undefined,
  });
}

export function createPromptLightingSource(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: LightingSourceMutationOptions = {},
): DomainResult<LightingSourceMutation> {
  const target = validateLightingTarget(draft, module);
  if (!target.ok) return target;

  const sourcesResult = readSources(target.value.values);
  if (!sourcesResult.ok) return sourcesResult;

  const sources = sourcesResult.value;
  const maxSources = configuredMaxSources(target.value.field);
  if (sources.length >= maxSources) {
    return domainFailure({
      code: "lighting_source_limit_reached",
      details: { maxSources },
    });
  }

  const source: LightingSource = {
    id: (options.createSourceId || randomId)(),
    role: "",
    sourceType: "",
    direction: "",
    quality: "",
    intensity: "",
    color: "",
    customColor: "",
    features: [],
  };

  if (sources.some((item) => item.id === source.id)) {
    return domainFailure({
      code: "lighting_source_identity_conflict",
      details: { sourceId: source.id },
    });
  }

  return withSources(
    draft,
    module,
    target.value.values,
    [...sources, source],
    source,
  );
}

export function updatePromptLightingSource(
  draft: PromptDraftState,
  module: PromptKeyModule,
  sourceId: string,
  patch: LightingSourcePatch,
): DomainResult<LightingSourceMutation> {
  const target = validateLightingTarget(draft, module);
  if (!target.ok) return target;

  const sourcesResult = readSources(target.value.values);
  if (!sourcesResult.ok) return sourcesResult;
  const sources = sourcesResult.value;
  const index = sourceIndexById(sources, sourceId);
  if (index < 0) return sourceNotFound(sourceId);

  for (const property of SELECT_KEYS) {
    const value = patch[property];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return domainFailure({
        code: "lighting_source_invalid_value",
        path: property,
        details: { property, expected: "string" },
      });
    }
    const optionResult = validateOption(target.value.field, property, value);
    if (!optionResult.ok) return optionResult;
  }

  if (
    patch.features !== undefined &&
    (!Array.isArray(patch.features) ||
      patch.features.some((feature) => typeof feature !== "string"))
  ) {
    return domainFailure({
      code: "lighting_source_invalid_value",
      path: "features",
      details: { expected: "string[]" },
    });
  }

  const featuresResult = patch.features === undefined
    ? domainSuccess<string[] | undefined>(undefined)
    : validateFeatures(target.value.field, patch.features);
  if (!featuresResult.ok) return featuresResult;

  const current = cloneValue(sources[index]);
  const next: LightingSource = {
    ...current,
    ...(patch.role !== undefined ? { role: patch.role } : {}),
    ...(patch.sourceType !== undefined ? { sourceType: patch.sourceType } : {}),
    ...(patch.direction !== undefined ? { direction: patch.direction } : {}),
    ...(patch.quality !== undefined ? { quality: patch.quality } : {}),
    ...(patch.intensity !== undefined ? { intensity: patch.intensity } : {}),
    ...(patch.color !== undefined ? { color: patch.color } : {}),
    ...(featuresResult.value !== undefined
      ? { features: cloneValue(featuresResult.value) }
      : {}),
  };

  const finalColor = next.color || "";
  if (patch.color !== undefined) {
    next.customColor = finalColor === "custom"
      ? normalizeCustomColor(
          patch.customColor !== undefined ? patch.customColor : current.customColor,
        )
      : "";
  } else if (patch.customColor !== undefined) {
    next.customColor = finalColor === "custom"
      ? normalizeCustomColor(patch.customColor)
      : "";
  }

  const updated = cloneValue(sources);
  updated[index] = next;

  return withSources(
    draft,
    module,
    target.value.values,
    updated,
    next,
  );
}

export function deletePromptLightingSource(
  draft: PromptDraftState,
  module: PromptKeyModule,
  sourceId: string,
): DomainResult<LightingSourceMutation> {
  const target = validateLightingTarget(draft, module);
  if (!target.ok) return target;

  const sourcesResult = readSources(target.value.values);
  if (!sourcesResult.ok) return sourcesResult;
  const sources = sourcesResult.value;
  const index = sourceIndexById(sources, sourceId);
  if (index < 0) return sourceNotFound(sourceId);

  return withSources(
    draft,
    module,
    target.value.values,
    sources.filter((_, sourceIndex) => sourceIndex !== index),
    cloneValue(sources[index]),
  );
}
