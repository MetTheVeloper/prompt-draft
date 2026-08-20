import type {
  MaterialAssignment,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import {
  cleanSemanticText,
  formatSemanticScope,
  humanizeSemanticValue,
  normalizeSemanticTargets,
  semanticTargetSpecificity,
} from "./semanticTargets";

const MATERIAL_BUILTIN_TARGET_TEXT: Record<string, string> = {
  all_surfaces: "all scene surfaces",
  background: "background surface",
  subject: "main subject",
  outfit: "outfit",
  hair: "hair",
  typography: "typography",
  accents: "accent elements",
};

const FINISH_KEYWORDS: Record<string, string> = {
  semi_gloss: "semi-gloss",
  high_gloss: "high-gloss",
  mirror: "mirror-like",
};

const SURFACE_KEYWORDS: Record<string, string> = {
  grainy: "fine grain",
  brush_marks: "brush marks",
};

const CONDITION_KEYWORDS: Record<string, string> = {
  clean: "clean",
  handmade: "handmade irregularities",
  scratches: "scratches",
  cracks: "cracks",
  dents: "dents",
  chips: "chipped",
  dust: "dusty",
  weathered: "weathered",
  stains: "stained",
  fading: "faded",
  wrinkles: "wrinkled",
  peeling: "peeling",
  corrosion: "corroded",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMaterialAssignment(value: unknown): value is MaterialAssignment {
  return isRecord(value) && Array.isArray(value.targets);
}

function keyword(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? humanizeSemanticValue(cleaned).toLowerCase() : "";
}

function normalizeAssignments(value: unknown): MaterialAssignment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isMaterialAssignment)
    .map((assignment) => ({
      ...assignment,
      material: typeof assignment.material === "string" ? assignment.material : "",
      finish: typeof assignment.finish === "string" ? assignment.finish : "",
      surfaceTexture:
        typeof assignment.surfaceTexture === "string"
          ? assignment.surfaceTexture
          : "",
      opticalCharacter:
        typeof assignment.opticalCharacter === "string"
          ? assignment.opticalCharacter
          : "",
      textureProminence:
        typeof assignment.textureProminence === "string"
          ? assignment.textureProminence
          : "",
      conditions: Array.isArray(assignment.conditions)
        ? assignment.conditions.filter((item): item is string => typeof item === "string")
        : [],
      targets: normalizeSemanticTargets(assignment.targets),
      exceptions: normalizeSemanticTargets(assignment.exceptions),
    }));
}

function surfaceKeywords(assignment: MaterialAssignment) {
  const properties = [
    FINISH_KEYWORDS[assignment.finish || ""] || keyword(assignment.finish),
    SURFACE_KEYWORDS[assignment.surfaceTexture || ""] ||
      keyword(assignment.surfaceTexture),
    keyword(assignment.opticalCharacter),
    assignment.textureProminence
      ? `${keyword(assignment.textureProminence)} texture`
      : "",
    ...(assignment.conditions || []).map(
      (value) => CONDITION_KEYWORDS[value] || keyword(value),
    ),
  ].filter(Boolean);

  return Array.from(new Set(properties));
}

function assignmentSpecificity(assignment: MaterialAssignment) {
  if (!assignment.targets.length) return 0;
  return Math.max(
    ...assignment.targets.map((target) =>
      semanticTargetSpecificity(target, "all_surfaces"),
    ),
  );
}

export function compileMaterialAssignment(assignment: MaterialAssignment) {
  const material = keyword(assignment.material);
  const properties = surfaceKeywords(assignment);
  const scope = formatSemanticScope(
    assignment.targets,
    assignment.exceptions || [],
    {
      format: "modular",
      builtinText: MATERIAL_BUILTIN_TARGET_TEXT,
    },
  );

  if ((!material && !properties.length) || !scope) return "";

  const specification = [
    material ? `${material} material` : "",
    properties.length ? properties.join(", ") : "",
  ]
    .filter(Boolean)
    .join("; ");

  return `• ${scope}: ${specification}`;
}

export function compileTextureModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const fields = Object.values(module.fields);
  const overrideFieldId =
    module.compile?.overrideField ||
    fields.find((field) => field.isOverride)?.id;

  if (overrideFieldId) {
    const overrideValue = values[overrideFieldId];
    if (typeof overrideValue === "string" && overrideValue.trim()) {
      return cleanSemanticText(overrideValue);
    }
  }

  const compiledAssignments = normalizeAssignments(values.materialAssignments)
    .map((assignment, index) => ({ assignment, index }))
    .sort((a, b) => {
      const specificity =
        assignmentSpecificity(a.assignment) -
        assignmentSpecificity(b.assignment);
      return specificity || a.index - b.index;
    })
    .map(({ assignment }) => compileMaterialAssignment(assignment))
    .filter(Boolean);

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanSemanticText(values.extraDetails)
      : "";

  if (extraDetails) {
    compiledAssignments.push(`• ${extraDetails}`);
  }

  return compiledAssignments.join("\n");
}
