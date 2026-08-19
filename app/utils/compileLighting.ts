import type {
  LightingSource,
  ModuleField,
  ModuleFieldOption,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isModuleFieldOption(value: unknown): value is ModuleFieldOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return typeof (value as ModuleFieldOption).value === "string";
}

function getConfigOptions(field: ModuleField, key: string): ModuleFieldOption[] {
  const value = field.config?.[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isModuleFieldOption);
}

function getConfigOptionPromptText(
  field: ModuleField,
  key: string,
  value?: string,
) {
  const cleanedValue = value?.trim();

  if (!cleanedValue) return "";

  const option = getConfigOptions(field, key).find((item) => {
    return item.value === cleanedValue;
  });

  return option?.promptText || cleanedValue.replace(/[_-]+/g, " ");
}

function getFieldOptionPromptText(field: ModuleField | undefined, value: unknown) {
  if (!field || typeof value !== "string") return "";

  const cleanedValue = value.trim();

  if (!cleanedValue) return "";

  return (
    field.options?.find((option) => option.value === cleanedValue)?.promptText ||
    cleanedValue.replace(/[_-]+/g, " ")
  );
}

function formatFeatureList(items: string[]) {
  const values = items.map(cleanPromptPart).filter(Boolean);

  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function isLightingSource(value: unknown): value is LightingSource {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizeLightingSources(value: unknown, maxSources = 3) {
  if (!Array.isArray(value)) return [];

  return value.filter(isLightingSource).slice(0, maxSources);
}

export function compileLightingSource(
  field: ModuleField,
  source: LightingSource,
  sourceIndex = 0,
) {
  const role = getConfigOptionPromptText(field, "roleOptions", source.role);
  const sourceType = getConfigOptionPromptText(
    field,
    "sourceTypeOptions",
    source.sourceType,
  );
  const direction = getConfigOptionPromptText(
    field,
    "directionOptions",
    source.direction,
  );
  const quality = getConfigOptionPromptText(
    field,
    "qualityOptions",
    source.quality,
  );
  const intensity = getConfigOptionPromptText(
    field,
    "intensityOptions",
    source.intensity,
  );

  let color = "";

  if (source.color === "custom") {
    const customColor = source.customColor?.trim();
    color = customColor ? `${customColor} illumination` : "";
  } else {
    color = getConfigOptionPromptText(field, "colorOptions", source.color);
  }

  const features = (source.features || [])
    .map((value) => getConfigOptionPromptText(field, "featureOptions", value))
    .filter(Boolean);

  if (
    !role &&
    !sourceType &&
    !direction &&
    !quality &&
    !intensity &&
    !color &&
    !features.length
  ) {
    return "";
  }

  const identity = role || `light source ${sourceIndex + 1}`;
  const parts: string[] = [identity];

  if (sourceType) {
    parts.push(`using ${sourceType}`);
  }

  if (direction) {
    parts.push(direction);
  }

  if (quality) {
    parts.push(`with ${quality} light quality`);
  }

  if (intensity) {
    parts.push(`at ${intensity} light intensity`);
  }

  if (color) {
    parts.push(`with ${color}`);
  }

  if (features.length) {
    parts.push(`featuring ${formatFeatureList(features)}`);
  }

  return cleanPromptPart(parts.join(" "));
}

export function compileLightingSourcesField(
  field: ModuleField,
  value: unknown,
) {
  const configuredMax = Number(field.config?.maxSources || 3);
  const maxSources = Number.isFinite(configuredMax)
    ? Math.max(1, Math.min(3, configuredMax))
    : 3;

  return normalizeLightingSources(value, maxSources)
    .map((source, index) => compileLightingSource(field, source, index))
    .filter(Boolean)
    .join("; ");
}

export function compileLightingModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;

  if (overrideFieldId) {
    const overrideValue = values[overrideFieldId];

    if (typeof overrideValue === "string" && overrideValue.trim()) {
      return cleanPromptPart(overrideValue);
    }
  }

  const sourcesField = module.fields.lightSources;
  const sourceText = sourcesField
    ? compileLightingSourcesField(sourcesField, values.lightSources)
    : "";

  const ambientText = getFieldOptionPromptText(
    module.fields.ambientLevel,
    values.ambientLevel,
  );
  const contrastText = getFieldOptionPromptText(
    module.fields.overallContrast,
    values.overallContrast,
  );
  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanPromptPart(values.extraDetails)
      : "";

  return [sourceText, ambientText, contrastText, extraDetails]
    .filter(Boolean)
    .map(cleanPromptPart)
    .join(", ");
}
