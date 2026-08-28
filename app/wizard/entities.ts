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

export type WizardEntityAnswer = {
  id: string;
  kind: WizardEntityKind;
  label: string;
  key: string;
};

export type WizardEntityVariableOptions = {
  value?: string;
  description?: string;
};

const ENTITY_FALLBACK_LABELS: Record<WizardEntityKind, string> = {
  person: "Person",
  animal: "Animal",
  object: "Object",
  product: "Product",
  vehicle: "Vehicle",
  building: "Building",
};

function createEntityId() {
  return `wizard-entity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWizardEntityFallbackLabel(kind: WizardEntityKind) {
  return ENTITY_FALLBACK_LABELS[kind];
}

export function getWizardEntityDisplayLabel(entity: WizardEntityAnswer) {
  return entity.label.trim() || getWizardEntityFallbackLabel(entity.kind);
}

export function formatWizardEntityLabelList(
  entities: readonly WizardEntityAnswer[],
) {
  const labels = entities.map(getWizardEntityDisplayLabel).filter(Boolean);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
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
  const label = getWizardEntityDisplayLabel(entity);
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
    Boolean(item.key.trim())
  );
}

export function normalizeWizardEntityAnswers(value: unknown) {
  return Array.isArray(value) ? value.filter(isWizardEntityAnswer) : [];
}
