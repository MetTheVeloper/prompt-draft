import type { PromptVariable } from "../modules/types";
import {
  createUniqueVariableKey,
  normalizeVariableKey,
} from "../utils/promptVariables";

export type WizardEntityKind =
  | "person"
  | "animal"
  | "object"
  | "product"
  | "vehicle"
  | "building";

export type WizardEntityPromptMode = "image_to_image" | "text_to_image";

export type WizardEntitySemanticDescriptor =
  | "person"
  | "male_person"
  | "female_person"
  | "man"
  | "woman"
  | "boy"
  | "girl";

export type WizardEntityDefinition =
  | { strategy: "sequence" }
  | { strategy: "semantic"; descriptor: WizardEntitySemanticDescriptor }
  | { strategy: "custom"; custom: string };

export type WizardEntityAnswer = {
  id: string;
  kind: WizardEntityKind;
  label: string;
  key: string;
  /**
   * Optional for backward compatibility with persisted Wizard sessions created
   * before subject definitions were introduced. New Portrait sessions populate
   * this explicitly in the Subjects UI.
   */
  definition?: WizardEntityDefinition;
};

export type WizardEntityVariableOptions = {
  value?: string;
  description?: string;
  label?: string;
};

const ENTITY_FALLBACK_LABELS: Record<WizardEntityKind, string> = {
  person: "Person",
  animal: "Animal",
  object: "Object",
  product: "Product",
  vehicle: "Vehicle",
  building: "Building",
};

const SUBJECT_ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
] as const;

function createEntityId() {
  return `wizard-entity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function subjectOrdinal(index: number) {
  return SUBJECT_ORDINALS[index] || `${index + 1}th`;
}

function semanticReferenceDescriptor(descriptor: WizardEntitySemanticDescriptor) {
  const map: Record<WizardEntitySemanticDescriptor, string> = {
    person: "person",
    male_person: "male person",
    female_person: "female person",
    man: "man",
    woman: "woman",
    boy: "boy",
    girl: "girl",
  };
  return map[descriptor];
}

function semanticTextDescriptor(descriptor: WizardEntitySemanticDescriptor) {
  const map: Record<WizardEntitySemanticDescriptor, string> = {
    person: "a person",
    male_person: "an adult man",
    female_person: "an adult woman",
    man: "an adult man",
    woman: "an adult woman",
    boy: "a boy",
    girl: "a girl",
  };
  return map[descriptor];
}

export function getWizardEntityFallbackLabel(kind: WizardEntityKind) {
  return ENTITY_FALLBACK_LABELS[kind];
}

export function getWizardEntityDisplayLabel(
  entity: WizardEntityAnswer,
  index?: number,
  total?: number,
) {
  const explicitLabel = entity.label.trim();
  if (explicitLabel) return explicitLabel;

  const fallback = getWizardEntityFallbackLabel(entity.kind);
  return typeof index === "number" && (total || 0) > 1
    ? `${fallback} ${index + 1}`
    : fallback;
}

export function formatWizardEntityLabelList(
  entities: readonly WizardEntityAnswer[],
) {
  const labels = entities
    .map((entity, index) =>
      getWizardEntityDisplayLabel(entity, index, entities.length),
    )
    .filter(Boolean);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function defaultWizardEntityDefinition(
  mode: WizardEntityPromptMode,
): WizardEntityDefinition {
  return mode === "image_to_image"
    ? { strategy: "sequence" }
    : { strategy: "semantic", descriptor: "person" };
}

export function normalizeWizardEntityDefinitionForMode(
  entity: WizardEntityAnswer,
  mode: WizardEntityPromptMode,
): WizardEntityDefinition {
  const definition = entity.definition;
  if (!definition) return defaultWizardEntityDefinition(mode);

  if (definition.strategy === "custom") {
    return { strategy: "custom", custom: cleanText(definition.custom) };
  }

  if (mode === "image_to_image") {
    if (definition.strategy === "sequence") return definition;
    if (definition.descriptor === "male_person") return definition;
    if (definition.descriptor === "female_person") return definition;
    if (definition.descriptor === "man" || definition.descriptor === "boy") {
      return { strategy: "semantic", descriptor: "male_person" };
    }
    if (definition.descriptor === "woman" || definition.descriptor === "girl") {
      return { strategy: "semantic", descriptor: "female_person" };
    }
    return { strategy: "sequence" };
  }

  if (definition.strategy === "sequence") {
    return { strategy: "semantic", descriptor: "person" };
  }
  if (definition.descriptor === "male_person") {
    return { strategy: "semantic", descriptor: "man" };
  }
  if (definition.descriptor === "female_person") {
    return { strategy: "semantic", descriptor: "woman" };
  }
  return definition;
}

export function resolveWizardEntityVariableValue(
  entity: WizardEntityAnswer,
  mode: WizardEntityPromptMode,
  index: number,
  total: number,
) {
  const definition = entity.definition;

  // Preserve exact behavior for older persisted sessions that predate explicit
  // subject definitions. New sessions are normalized by the Subjects UI.
  if (!definition) {
    if (mode === "image_to_image") {
      return total > 1
        ? `${subjectOrdinal(index)} person in {reference}`
        : "person in {reference}";
    }
    const explicitLabel = cleanText(entity.label);
    return explicitLabel ? `a person named ${explicitLabel}` : "a person";
  }

  const normalized = normalizeWizardEntityDefinitionForMode(entity, mode);

  if (normalized.strategy === "custom") {
    const custom = cleanText(normalized.custom);
    if (!custom) {
      return mode === "image_to_image"
        ? total > 1
          ? `${subjectOrdinal(index)} person in {reference}`
          : "person in {reference}"
        : "a person";
    }
    if (mode === "text_to_image") return custom;
    return custom.includes("{reference}") ? custom : `${custom} in {reference}`;
  }

  if (normalized.strategy === "semantic") {
    return mode === "image_to_image"
      ? `${semanticReferenceDescriptor(normalized.descriptor)} in {reference}`
      : semanticTextDescriptor(normalized.descriptor);
  }

  return total > 1
    ? `${subjectOrdinal(index)} person in {reference}`
    : "person in {reference}";
}

export function isWizardEntityDefinitionComplete(
  entity: WizardEntityAnswer,
  mode: WizardEntityPromptMode,
) {
  const definition = normalizeWizardEntityDefinitionForMode(entity, mode);
  return definition.strategy !== "custom" || Boolean(cleanText(definition.custom));
}

export function createWizardEntity(
  kind: WizardEntityKind,
  existing: readonly WizardEntityAnswer[] = [],
  label = "",
): WizardEntityAnswer {
  const fallback = getWizardEntityFallbackLabel(kind);
  const requestedKey = normalizeVariableKey(label || fallback.toLowerCase());
  const existingKeys = existing.map((item) => item.key).filter(Boolean);

  return {
    id: createEntityId(),
    kind,
    label: label.trim(),
    key: createUniqueVariableKey(requestedKey, existingKeys),
  };
}

export function renameWizardEntity(
  entity: WizardEntityAnswer,
  label: string,
  siblings: readonly WizardEntityAnswer[] = [],
): WizardEntityAnswer {
  const cleanLabel = label.trim();
  const fallback = getWizardEntityFallbackLabel(entity.kind);
  const existingKeys = siblings
    .filter((item) => item.id !== entity.id)
    .map((item) => item.key)
    .filter(Boolean);
  const requestedKey = normalizeVariableKey(cleanLabel || fallback.toLowerCase());

  return {
    ...entity,
    label: cleanLabel,
    key: createUniqueVariableKey(requestedKey, existingKeys),
  };
}

export function wizardEntityToPromptVariable(
  entity: WizardEntityAnswer,
  options: WizardEntityVariableOptions = {},
): PromptVariable {
  const label = options.label?.trim() || getWizardEntityDisplayLabel(entity);
  const value = options.value?.trim() || label;
  const description =
    options.description?.trim() || `${label} created by the Wizard`;

  return {
    id: entity.id,
    key: entity.key,
    value,
    label,
    description,
    type: entity.kind === "person" || entity.kind === "animal" ? "subject" : "object",
    enabled: true,
  };
}

function isWizardEntityDefinition(value: unknown): value is WizardEntityDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.strategy === "sequence") return true;
  if (record.strategy === "custom") return typeof record.custom === "string";
  if (record.strategy !== "semantic" || typeof record.descriptor !== "string") {
    return false;
  }
  return [
    "person",
    "male_person",
    "female_person",
    "man",
    "woman",
    "boy",
    "girl",
  ].includes(record.descriptor);
}

export function isWizardEntityAnswer(value: unknown): value is WizardEntityAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<WizardEntityAnswer>;
  return (
    typeof item.id === "string" &&
    Boolean(item.id.trim()) &&
    typeof item.kind === "string" &&
    item.kind in ENTITY_FALLBACK_LABELS &&
    typeof item.label === "string" &&
    typeof item.key === "string" &&
    Boolean(item.key.trim()) &&
    (item.definition === undefined || isWizardEntityDefinition(item.definition))
  );
}

export function normalizeWizardEntityAnswers(value: unknown) {
  return Array.isArray(value) ? value.filter(isWizardEntityAnswer) : [];
}
