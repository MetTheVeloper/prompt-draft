import type {
  ExpressionAssignment,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import {
  cleanSemanticText,
  formatSemanticScope,
  humanizeSemanticValue,
  normalizeSemanticTargets,
} from "./semanticTargets";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function keyword(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? humanizeSemanticValue(cleaned).toLowerCase() : "";
}

function normalizeAssignments(value: unknown): ExpressionAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((assignment) => ({
      id: typeof assignment.id === "string" ? assignment.id : undefined,
      presetId: typeof assignment.presetId === "string" ? assignment.presetId : undefined,
      coreExpression:
        typeof assignment.coreExpression === "string" ? assignment.coreExpression : "",
      intensity: typeof assignment.intensity === "string" ? assignment.intensity : "",
      eyeState: typeof assignment.eyeState === "string" ? assignment.eyeState : "",
      browState: typeof assignment.browState === "string" ? assignment.browState : "",
      mouthState: typeof assignment.mouthState === "string" ? assignment.mouthState : "",
      additionalDetails:
        typeof assignment.additionalDetails === "string" ? assignment.additionalDetails : "",
      targets: normalizeSemanticTargets(assignment.targets),
    }));
}

export function compileExpressionAssignment(
  assignment: ExpressionAssignment,
  options: { replaceSource?: boolean } = {},
) {
  const scope = formatSemanticScope(assignment.targets, [], { format: "modular" });
  if (!scope) return "";

  const parts = [
    assignment.coreExpression ? `${keyword(assignment.coreExpression)} expression` : "",
    assignment.intensity ? `${keyword(assignment.intensity)} intensity` : "",
    assignment.eyeState ? `${keyword(assignment.eyeState)} eyes` : "",
    assignment.browState ? `${keyword(assignment.browState)} brows` : "",
    assignment.mouthState ? keyword(assignment.mouthState) : "",
    cleanSemanticText(assignment.additionalDetails),
  ].filter(Boolean);

  const specification = Array.from(new Set(parts)).join("; ");
  if (!specification) return "";

  const prefix = options.replaceSource
    ? "replace the source/reference facial expression with "
    : "";
  return `• ${scope}: ${prefix}${specification}`;
}

export function compileExpressionModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: { replaceSource?: boolean } = {},
) {
  const overrideFieldId = module.compile?.overrideField || "customText";
  const override = values[overrideFieldId];
  if (typeof override === "string" && override.trim()) {
    return cleanSemanticText(override);
  }

  return normalizeAssignments(values.expressionAssignments)
    .map((assignment) => compileExpressionAssignment(assignment, options))
    .filter(Boolean)
    .join("\n");
}
