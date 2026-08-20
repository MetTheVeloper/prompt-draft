import type { ModuleValues, PoseAssignment, PromptKeyModule } from "../modules/types";
import {
  cleanSemanticText,
  formatSemanticScope,
  humanizeSemanticValue,
  normalizeSemanticTargets,
} from "./semanticTargets";

const POSE_KEYWORDS: Record<string, Record<string, string>> = {
  weightBalance: {
    even: "evenly balanced weight",
    shifted: "weight shifted to one side",
    single_side_support: "supported mainly on one side",
    off_balance: "intentionally off-balance",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function keyword(axis: string, value?: string) {
  const cleaned = value?.trim();
  if (!cleaned) return "";
  return POSE_KEYWORDS[axis]?.[cleaned] || humanizeSemanticValue(cleaned).toLowerCase();
}

function normalizeAssignments(value: unknown): PoseAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((assignment) => ({
      id: typeof assignment.id === "string" ? assignment.id : undefined,
      presetId: typeof assignment.presetId === "string" ? assignment.presetId : undefined,
      basePosture: typeof assignment.basePosture === "string" ? assignment.basePosture : "",
      torsoPosture: typeof assignment.torsoPosture === "string" ? assignment.torsoPosture : "",
      weightBalance: typeof assignment.weightBalance === "string" ? assignment.weightBalance : "",
      bodyTension: typeof assignment.bodyTension === "string" ? assignment.bodyTension : "",
      locomotion: typeof assignment.locomotion === "string" ? assignment.locomotion : "",
      gestures: Array.isArray(assignment.gestures)
        ? assignment.gestures.filter((item): item is string => typeof item === "string")
        : [],
      interactionDetails:
        typeof assignment.interactionDetails === "string" ? assignment.interactionDetails : "",
      additionalDetails:
        typeof assignment.additionalDetails === "string" ? assignment.additionalDetails : "",
      targets: normalizeSemanticTargets(assignment.targets),
    }));
}

export function compilePoseAssignment(
  assignment: PoseAssignment,
  options: { replaceSource?: boolean } = {},
) {
  const scope = formatSemanticScope(assignment.targets, [], { format: "modular" });
  if (!scope) return "";

  const parts = [
    keyword("basePosture", assignment.basePosture),
    keyword("torsoPosture", assignment.torsoPosture),
    keyword("weightBalance", assignment.weightBalance),
    keyword("bodyTension", assignment.bodyTension),
    keyword("locomotion", assignment.locomotion),
    ...(assignment.gestures || []).map((value) => keyword("gestures", value)),
    cleanSemanticText(assignment.interactionDetails),
    cleanSemanticText(assignment.additionalDetails),
  ].filter(Boolean);

  const specification = Array.from(new Set(parts)).join("; ");
  if (!specification) return "";

  const prefix = options.replaceSource ? "replace the source/reference pose with " : "";
  return `• ${scope}: ${prefix}${specification}`;
}

export function compilePoseModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: { replaceSource?: boolean } = {},
) {
  const overrideFieldId = module.compile?.overrideField || "customText";
  const override = values[overrideFieldId];
  if (typeof override === "string" && override.trim()) {
    return cleanSemanticText(override);
  }

  return normalizeAssignments(values.poseAssignments)
    .map((assignment) => compilePoseAssignment(assignment, options))
    .filter(Boolean)
    .join("\n");
}
