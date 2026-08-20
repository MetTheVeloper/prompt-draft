import type { SemanticTargetRef } from "../modules/types";

export type SemanticOutputFormat = "modular" | "natural";

export type SemanticBuiltinTargetDefinition = {
  value: string;
  label: string;
  moduleKey?: string;
};

export function cleanSemanticText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function humanizeSemanticValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function normalizeSemanticTarget(value: unknown): SemanticTargetRef | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Partial<SemanticTargetRef>;
  if (
    item.kind !== "builtin" &&
    item.kind !== "module_output" &&
    item.kind !== "user_variable" &&
    item.kind !== "typography_group" &&
    item.kind !== "typography_text" &&
    item.kind !== "custom"
  ) {
    return null;
  }

  if (typeof item.value !== "string") return null;

  return {
    kind: item.kind,
    value: item.value,
    variableId: item.variableId,
    entityId: item.entityId,
    moduleKey: item.moduleKey,
    token: item.token,
    label: item.label,
    parentLabel: item.parentLabel,
  };
}

export function normalizeSemanticTargets(value: unknown): SemanticTargetRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeSemanticTarget)
    .filter((target): target is SemanticTargetRef => Boolean(target));
}

/**
 * Built-in and linked module-output variants share one slot identity. This lets
 * `Outfit` seamlessly become linked `{outfit}` when that module output exists
 * without creating a duplicate semantic target.
 */
export function semanticTargetIdentity(target: SemanticTargetRef) {
  if (target.kind === "builtin" || target.kind === "module_output") {
    return `slot:${target.value}`;
  }

  if (target.kind === "custom") {
    const value = cleanSemanticText(target.value).toLowerCase();
    return value ? `custom:${value}` : "";
  }

  if (target.kind === "user_variable") {
    return `user:${target.variableId || target.token || target.value}`;
  }

  return `${target.kind}:${target.entityId || target.token || target.value}`;
}

export function sameSemanticTarget(
  first: SemanticTargetRef,
  second: SemanticTargetRef,
) {
  const firstIdentity = semanticTargetIdentity(first);
  return Boolean(firstIdentity && firstIdentity === semanticTargetIdentity(second));
}

/**
 * Compare the complete semantic state of two target refs without depending on
 * object key order. This is intentionally stricter than `sameSemanticTarget`:
 * a builtin target and its linked module-output variant share one identity, but
 * their state is different and the linked metadata must still be persisted.
 */
export function sameSemanticTargetState(
  first: SemanticTargetRef,
  second: SemanticTargetRef,
) {
  return (
    first.kind === second.kind &&
    first.value === second.value &&
    (first.variableId || "") === (second.variableId || "") &&
    (first.entityId || "") === (second.entityId || "") &&
    (first.moduleKey || "") === (second.moduleKey || "") &&
    (first.token || "") === (second.token || "") &&
    (first.label || "") === (second.label || "") &&
    (first.parentLabel || "") === (second.parentLabel || "")
  );
}

export function sameSemanticTargetList(
  first: SemanticTargetRef[],
  second: SemanticTargetRef[],
) {
  if (first.length !== second.length) return false;

  return first.every((target, index) => {
    const candidate = second[index];
    return Boolean(candidate && sameSemanticTargetState(target, candidate));
  });
}

export function semanticTargetToken(target: SemanticTargetRef) {
  return cleanSemanticText(target.token || target.value);
}

export function semanticTargetUiLabel(
  target: SemanticTargetRef,
  builtinLabels: Record<string, string> = {},
) {
  if (target.kind === "builtin") {
    return builtinLabels[target.value] || humanizeSemanticValue(target.value);
  }

  if (target.kind === "module_output") {
    return semanticTargetToken(target) || target.label || humanizeSemanticValue(target.value);
  }

  if (
    target.kind === "user_variable" ||
    target.kind === "typography_group" ||
    target.kind === "typography_text"
  ) {
    return semanticTargetToken(target) || target.label || humanizeSemanticValue(target.value);
  }

  return cleanSemanticText(target.value);
}

function compactLabels(values: string[], limit = 2) {
  const cleaned = values.map(cleanSemanticText).filter(Boolean);
  if (!cleaned.length) return "No targets";
  if (cleaned.length <= limit) return cleaned.join(" + ");
  return `${cleaned.slice(0, limit).join(" + ")} +${cleaned.length - limit}`;
}

export function semanticScopeSummary(
  targets: SemanticTargetRef[],
  exceptions: SemanticTargetRef[] = [],
  builtinLabels: Record<string, string> = {},
) {
  const targetSummary = compactLabels(
    targets.map((target) => semanticTargetUiLabel(target, builtinLabels)),
  );

  if (!exceptions.length) return targetSummary;

  const exceptionSummary = compactLabels(
    exceptions.map((target) => semanticTargetUiLabel(target, builtinLabels)),
    1,
  );

  return `${targetSummary} · except ${exceptionSummary}`;
}

export function formatSemanticTarget(
  target: SemanticTargetRef,
  options: {
    format: SemanticOutputFormat;
    builtinText?: Record<string, string>;
  },
) {
  if (target.kind === "builtin") {
    return (
      options.builtinText?.[target.value] ||
      humanizeSemanticValue(target.value).toLowerCase()
    );
  }

  if (target.kind === "custom") {
    return cleanSemanticText(target.value);
  }

  if (target.kind === "module_output") {
    if (options.format === "modular") {
      return semanticTargetToken(target);
    }

    const label = cleanSemanticText(target.label || target.moduleKey || target.value);
    return `the configured ${humanizeSemanticValue(label).toLowerCase()}`;
  }

  return semanticTargetToken(target);
}

function formatTargetList(
  targets: SemanticTargetRef[],
  options: {
    format: SemanticOutputFormat;
    builtinText?: Record<string, string>;
  },
) {
  return targets
    .map((target) => formatSemanticTarget(target, options))
    .filter(Boolean)
    .join(", ");
}

export function formatSemanticScope(
  targets: SemanticTargetRef[],
  exceptions: SemanticTargetRef[] = [],
  options: {
    format: SemanticOutputFormat;
    builtinText?: Record<string, string>;
  },
) {
  const targetText = formatTargetList(targets, options);
  if (!targetText) return "";

  const exceptionText = formatTargetList(exceptions, options);
  return exceptionText ? `${targetText} except ${exceptionText}` : targetText;
}

export function semanticTargetSpecificity(
  target: SemanticTargetRef,
  broadValue: string,
) {
  if (target.kind === "builtin" && target.value === broadValue) return 0;
  if (target.kind === "builtin") return 1;
  return 2;
}
