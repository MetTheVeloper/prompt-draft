import type { ModuleOutputValue, PromptOutputFormat } from "./compilePrompt";
import { compileLayoutNaturalBlock } from "./compileLayoutNatural";
import { compileTypographyNaturalBlock } from "./compileTypographyNatural";
import { variableDefinitionsToRecord, VARIABLES_MODULE_KEY } from "./promptVariables";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyOutput(value: ModuleOutputValue, pretty = true) {
  return typeof value === "string"
    ? value.trim()
    : JSON.stringify(value, null, pretty ? 2 : undefined);
}

function formatDefinition(moduleKey: string, value: ModuleOutputValue) {
  if (moduleKey === VARIABLES_MODULE_KEY) {
    return stringifyOutput(value);
  }

  const text = stringifyOutput(value, false);
  if (!text) return "";

  return text.includes("\n") || text.startsWith("•")
    ? `{${moduleKey}} =\n${text}`
    : `{${moduleKey}} = ${text}`;
}

function humanizeModuleKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function typographyKeys(output: Record<string, unknown>) {
  const referencedGroupKeys = new Set<string>();
  const referencedTextKeys = new Set<string>();
  const groups = Array.isArray(output.groups) ? output.groups : [];

  groups.forEach((group) => {
    if (!isRecord(group)) return;

    if (typeof group.key === "string" && group.key.trim()) {
      referencedGroupKeys.add(group.key.trim());
    }

    const texts = Array.isArray(group.texts) ? group.texts : [];
    texts.forEach((text) => {
      if (!isRecord(text)) return;
      if (typeof text.key === "string" && text.key.trim()) {
        referencedTextKeys.add(text.key.trim());
      }
    });
  });

  return { referencedGroupKeys, referencedTextKeys };
}

function naturalPreview(moduleKey: string, value: ModuleOutputValue) {
  if (moduleKey === VARIABLES_MODULE_KEY) {
    return stringifyOutput(value);
  }

  if (moduleKey === "layout" && isRecord(value)) {
    return compileLayoutNaturalBlock(value);
  }

  if (moduleKey === "typography" && isRecord(value)) {
    return compileTypographyNaturalBlock(value, typographyKeys(value));
  }

  if (typeof value !== "string") {
    return JSON.stringify(value, null, 2);
  }

  const text = value.trim();
  if (!text) return "";

  if (text.startsWith("•")) {
    const title = moduleKey === "texture"
      ? "Texture / Material"
      : humanizeModuleKey(moduleKey);
    return `${title}:\n${text}`;
  }

  const cleaned = text.replace(/[.!?]+$/, "");
  return `Apply ${cleaned}.`;
}

function jsonPreview(moduleKey: string, value: ModuleOutputValue) {
  if (moduleKey === VARIABLES_MODULE_KEY && typeof value === "string") {
    return JSON.stringify(
      { variables: variableDefinitionsToRecord(value) },
      null,
      2,
    );
  }

  return JSON.stringify({ [moduleKey]: value }, null, 2);
}

/**
 * Display-only representation of one canonical module output.
 * This must never be fed back into the module-output graph or persisted as module state.
 */
export function formatModuleOutputPreview(
  moduleKey: string,
  value: ModuleOutputValue | undefined,
  format: PromptOutputFormat,
) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" && !value.trim()) return "";

  if (format === "json") return jsonPreview(moduleKey, value);
  if (format === "natural") return naturalPreview(moduleKey, value);
  return formatDefinition(moduleKey, value);
}
