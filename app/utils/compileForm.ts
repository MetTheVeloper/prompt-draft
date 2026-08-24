import type {
  ModuleField,
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModuleEntityPayload,
  TargetedModuleEntity,
} from "../modules/entityContracts";
import {
  getGlobalModuleValues,
  getModuleEntities,
  resolveModuleEntityValues,
} from "../modules/entityContracts";
import {
  cleanSemanticText,
  formatSemanticScope,
  normalizeSemanticTargets,
} from "./semanticTargets";

function isEmptyValue(value: ModuleFieldValue) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function compileColorField(field: ModuleField, value: ModuleFieldValue) {
  if (typeof value !== "string") return "";

  const colorValue = value.trim();
  if (!colorValue) return "";

  const fieldName = field.id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return `the ${fieldName} must be ${colorValue}`;
}

function getOptionPromptText(field: ModuleField, value: string) {
  const option = field.options?.find((item) => item.value === value);
  return option?.promptText || value;
}

function compileField(field: ModuleField, value: ModuleFieldValue) {
  if (isEmptyValue(value)) return "";

  if (field.type === "color") {
    return compileColorField(field, value);
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => getOptionPromptText(field, item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    if (field.options?.length) {
      return getOptionPromptText(field, value);
    }

    return value;
  }

  if (typeof value === "boolean") {
    return value ? field.promptText || "" : "";
  }

  return String(value);
}

function sortModuleFieldsForCompile(
  module: PromptKeyModule,
  fields: ModuleField[],
) {
  const explicitOrder = module.compile?.fieldOrder || [];

  if (!explicitOrder.length) {
    return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const rank = new Map(
    explicitOrder.map((fieldId, index) => [fieldId, index]),
  );

  return [...fields].sort((a, b) => {
    const aRank = rank.get(a.id);
    const bRank = rank.get(b.id);

    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;

    return (a.order ?? 0) - (b.order ?? 0);
  });
}

function uniquePromptParts(parts: string[]) {
  const seen = new Set<string>();

  return parts.filter((part) => {
    const normalized = part.toLowerCase();
    if (seen.has(normalized)) return false;

    seen.add(normalized);
    return true;
  });
}

/**
 * Scalar Form compiler intentionally mirrors the generic compileModules path.
 * Keeping this isolated makes entity-specific output possible without changing
 * legacy Form output when no named entities exist.
 */
export function compileFormScalar(
  module: PromptKeyModule,
  values: ModuleValues,
  options: { allowOverride?: boolean } = {},
) {
  const fields = Object.values(module.fields);
  const allowOverride = options.allowOverride !== false;

  if (allowOverride) {
    const overrideFieldId =
      module.compile?.overrideField ||
      fields.find((field) => field.isOverride)?.id;

    if (overrideFieldId) {
      const overrideValue = values[overrideFieldId];
      if (typeof overrideValue === "string" && overrideValue.trim()) {
        return cleanPromptPart(overrideValue);
      }
    }
  }

  const sortedFields = sortModuleFieldsForCompile(
    module,
    fields.filter((field) => !field.isOverride),
  );

  let parts = sortedFields
    .map((field) => compileField(field, values[field.id]))
    .filter(Boolean)
    .map(cleanPromptPart);

  if (module.compile?.removeDuplicates !== false) {
    parts = uniquePromptParts(parts);
  }

  return parts.join(module.compile?.separator || ", ");
}

function normalizeFormEntities(values: ModuleValues) {
  return getModuleEntities<ModuleEntityPayload>(values).map((entity) => {
    return {
      ...entity,
      targets: normalizeSemanticTargets(
        (entity as Partial<TargetedModuleEntity<ModuleEntityPayload>>).targets,
      ),
    } satisfies TargetedModuleEntity<ModuleEntityPayload>;
  });
}

function compileFormEntity(
  module: PromptKeyModule,
  values: ModuleValues,
  entity: TargetedModuleEntity<ModuleEntityPayload>,
) {
  if (entity.enabled === false) return "";

  const scope = formatSemanticScope(entity.targets, [], { format: "modular" });
  if (!scope) return "";

  const resolvedValues = resolveModuleEntityValues(values, entity);
  const specification = compileFormScalar(module, resolvedValues, {
    allowOverride: false,
  });

  if (!specification) return "";
  return `• ${scope}: ${specification}`;
}

export function compileFormModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: { customMode?: boolean } = {},
) {
  const globalValues = getGlobalModuleValues(values);

  if (options.customMode) {
    const overrideFieldId =
      module.compile?.overrideField ||
      Object.values(module.fields).find((field) => field.isOverride)?.id;
    const override = overrideFieldId ? globalValues[overrideFieldId] : "";
    return typeof override === "string" ? cleanSemanticText(override) : "";
  }

  const globalOutput = compileFormScalar(module, globalValues, {
    allowOverride: false,
  });

  const entityLines = normalizeFormEntities(values)
    .map((entity) => compileFormEntity(module, values, entity))
    .filter(Boolean);

  // Preserve byte-equivalent scalar behavior for legacy/no-entity drafts.
  if (!entityLines.length) return globalOutput;

  return [
    globalOutput ? `• Global/default form: ${globalOutput}` : "",
    ...entityLines,
  ]
    .filter(Boolean)
    .join("\n");
}
