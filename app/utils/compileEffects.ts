import type {
  EffectLayer,
  ModuleField,
  ModuleFieldOption,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripTerminalPunctuation(value: string) {
  return cleanPromptPart(value).replace(/[.,;:!?]+$/g, "");
}

function getConfigOptions(field: ModuleField, key: string): ModuleFieldOption[] {
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

function getConfigPromptText(
  field: ModuleField,
  key: string,
  value?: string,
) {
  const cleanedValue = String(value || "").trim();
  if (!cleanedValue) return "";

  const option = getConfigOptions(field, key).find(
    (item) => item.value === cleanedValue,
  );

  return stripTerminalPunctuation(option?.promptText || cleanedValue);
}

function isEffectLayer(value: unknown): value is EffectLayer {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getEffectText(field: ModuleField, layer: EffectLayer) {
  const type = String(layer.effectType || "").trim();
  if (!type) return "";

  if (type === "custom") {
    return stripTerminalPunctuation(String(layer.customEffect || ""));
  }

  return getConfigPromptText(field, "effectTypeOptions", type);
}

function compileLayer(field: ModuleField, layer: EffectLayer) {
  const effectText = getEffectText(field, layer);
  if (!effectText) return "";

  const intensity = getConfigPromptText(
    field,
    "intensityOptions",
    layer.intensity,
  );
  const details = stripTerminalPunctuation(String(layer.details || ""));

  let output = intensity ? `${intensity} ${effectText}` : effectText;

  if (details) {
    output += `, ${details}`;
  }

  return output;
}

function getOverrideValue(module: PromptKeyModule, values: ModuleValues) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;

  if (!overrideFieldId) return "";

  const value = values[overrideFieldId];
  return typeof value === "string" ? cleanPromptPart(value) : "";
}

export function compileEffectsModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideValue = getOverrideValue(module, values);
  if (overrideValue) return overrideValue;

  const field = module.fields.effectLayers;
  const layers = Array.isArray(values.effectLayers)
    ? values.effectLayers.filter(isEffectLayer)
    : [];

  const seen = new Set<string>();
  const compiledLayers = field
    ? layers
        .map((layer) => compileLayer(field, layer))
        .filter(Boolean)
        .filter((part) => {
          const normalized = part.toLowerCase();
          if (seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        })
    : [];

  const extraDetails =
    typeof values.extraDetails === "string"
      ? stripTerminalPunctuation(values.extraDetails)
      : "";

  const output: string[] = [];

  if (compiledLayers.length) {
    output.push(`Effects: ${compiledLayers.join("; ")}.`);
  }

  if (extraDetails) {
    output.push(`Additional effects direction: ${extraDetails}.`);
  }

  return output.join(" ");
}
