import type {
  ModuleField,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import { resolveModuleFieldPromptTexts } from "./moduleFieldValues";

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripTerminalPunctuation(value: string) {
  return cleanPromptPart(value).replace(/[.,;:!?]+$/g, "");
}

function capitalize(value: string) {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function joinNaturalList(items: string[]) {
  const cleanItems = items.map(stripTerminalPunctuation).filter(Boolean);

  if (cleanItems.length <= 1) return cleanItems[0] || "";
  if (cleanItems.length === 2) return `${cleanItems[0]} and ${cleanItems[1]}`;

  return `${cleanItems.slice(0, -1).join(", ")}, and ${cleanItems.at(-1)}`;
}

function getField(module: PromptKeyModule, fieldId: string) {
  return module.fields[fieldId] as ModuleField | undefined;
}

function getFieldParts(
  module: PromptKeyModule,
  values: ModuleValues,
  fieldId: string,
) {
  const field = getField(module, fieldId);
  if (!field) return [];

  return resolveModuleFieldPromptTexts(field, values[fieldId], values)
    .map(stripTerminalPunctuation)
    .filter(Boolean);
}

function getSingleFieldPart(
  module: PromptKeyModule,
  values: ModuleValues,
  fieldId: string,
) {
  return getFieldParts(module, values, fieldId)[0] || "";
}

function getOverrideValue(module: PromptKeyModule, values: ModuleValues) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;

  if (!overrideFieldId) return "";

  const value = values[overrideFieldId];
  return typeof value === "string" ? cleanPromptPart(value) : "";
}

export function compileBackgroundModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideValue = getOverrideValue(module, values);
  if (overrideValue) return overrideValue;

  const concept = getSingleFieldPart(module, values, "backgroundConcept");
  const backgroundType = getSingleFieldPart(module, values, "backgroundType");
  const setting = getSingleFieldPart(module, values, "setting");
  const spatialStructure = getSingleFieldPart(module, values, "spatialStructure");
  const backgroundMaterial = getSingleFieldPart(module, values, "backgroundMaterial");
  const detailDensity = getSingleFieldPart(module, values, "detailDensity");
  const backgroundElements = getFieldParts(module, values, "backgroundElements");
  const extraDetails = getSingleFieldPart(module, values, "extraDetails");

  const clauses: string[] = [];

  if (backgroundType) {
    clauses.push(backgroundType);
  }

  if (setting) {
    clauses.push(`set in ${setting}`);
  }

  if (spatialStructure) {
    clauses.push(`with ${spatialStructure}`);
  }

  if (backgroundMaterial) {
    clauses.push(`using ${backgroundMaterial} as the visible background material`);
  }

  if (detailDensity) {
    clauses.push(detailDensity);
  }

  if (backgroundElements.length) {
    clauses.push(
      `including ${joinNaturalList(backgroundElements)} as secondary background elements`,
    );
  }

  const output: string[] = [];

  if (concept) {
    output.push(`Background concept: ${concept}.`);
  } else if (clauses.length || extraDetails) {
    output.push("Background.");
  }

  if (clauses.length) {
    output.push(`${capitalize(clauses.join(", "))}.`);
  }

  if (extraDetails) {
    output.push(`Additional background details: ${extraDetails}.`);
  }

  return output.join(" ");
}