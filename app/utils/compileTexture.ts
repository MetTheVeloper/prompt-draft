import type {
  ColorPaletteTarget,
  MaterialAssignment,
  ModuleField,
  ModuleFieldOption,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function humanizeValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTarget(value: unknown): value is ColorPaletteTarget {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    typeof value.value === "string"
  );
}

function isMaterialAssignment(value: unknown): value is MaterialAssignment {
  return isRecord(value) && Array.isArray(value.targets);
}

function getConfigOptions(field: ModuleField, key: string): ModuleFieldOption[] {
  const options = field.config?.[key];
  if (!Array.isArray(options)) return [];

  return options.filter((item): item is ModuleFieldOption => {
    return isRecord(item) && typeof item.value === "string";
  });
}

function optionPromptText(field: ModuleField, key: string, value?: string) {
  const cleaned = value?.trim();
  if (!cleaned) return "";

  const option = getConfigOptions(field, key).find((item) => item.value === cleaned);
  return cleanPromptPart(option?.promptText || humanizeValue(cleaned));
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
      targets: assignment.targets.filter(isTarget),
    }));
}

function builtinTargetText(value: string) {
  const map: Record<string, string> = {
    all_surfaces: "all scene surfaces",
    background: "the background surface",
    subject: "the main subject",
    outfit: "the outfit",
    hair: "the hair",
    typography: "typography",
    accents: "accent elements",
  };

  return map[value] || humanizeValue(value);
}

function quotedLabel(value?: string) {
  const label = value?.trim();
  return label ? `\"${label.replace(/\"/g, "\\\"")}\"` : "";
}

function formatTarget(target: ColorPaletteTarget) {
  if (target.kind === "builtin") {
    return builtinTargetText(target.value);
  }

  if (target.kind === "custom") {
    return cleanPromptPart(target.value);
  }

  const token = cleanPromptPart(target.token || target.value);
  const label = quotedLabel(target.label);

  if (target.kind === "typography_group") {
    return ["typography group", label, token && `(${token})`]
      .filter(Boolean)
      .join(" ");
  }

  if (target.kind === "typography_text") {
    const parent = quotedLabel(target.parentLabel);

    return [
      "typography text",
      label,
      parent ? `in group ${parent}` : "",
      token && `(${token})`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return ["user target", label, token && `(${token})`]
    .filter(Boolean)
    .join(" ");
}

function formatTargets(targets: ColorPaletteTarget[]) {
  const values = targets.map(formatTarget).filter(Boolean);

  if (!values.length) return "";
  if (values.length === 1) return values[0];
  return values.join(" and ");
}

function targetSpecificity(target: ColorPaletteTarget) {
  if (target.kind !== "builtin") return 2;
  if (target.value === "all_surfaces") return 0;
  return 1;
}

function assignmentSpecificity(assignment: MaterialAssignment) {
  if (!assignment.targets.length) return 0;
  return Math.max(...assignment.targets.map(targetSpecificity));
}

export function compileMaterialAssignment(
  field: ModuleField,
  assignment: MaterialAssignment,
) {
  const properties = [
    optionPromptText(field, "materialOptions", assignment.material),
    optionPromptText(field, "finishOptions", assignment.finish),
    optionPromptText(field, "surfaceTextureOptions", assignment.surfaceTexture),
    optionPromptText(field, "opticalCharacterOptions", assignment.opticalCharacter),
    optionPromptText(field, "textureProminenceOptions", assignment.textureProminence),
  ].filter(Boolean);

  const conditions = (assignment.conditions || [])
    .map((value) => optionPromptText(field, "conditionOptions", value))
    .filter(Boolean);

  if (conditions.length) {
    properties.push(conditions.join(" and "));
  }

  const targetText = formatTargets(assignment.targets);
  if (!properties.length || !targetText) return "";

  return `${properties.join(" with ")} assigned to ${targetText}`;
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
      return cleanPromptPart(overrideValue);
    }
  }

  const assignmentField = module.fields.materialAssignments;
  if (!assignmentField) return "";

  const compiledAssignments = normalizeAssignments(values.materialAssignments)
    .map((assignment, index) => ({ assignment, index }))
    .sort((a, b) => {
      const specificity =
        assignmentSpecificity(a.assignment) -
        assignmentSpecificity(b.assignment);

      return specificity || a.index - b.index;
    })
    .map(({ assignment }) => compileMaterialAssignment(assignmentField, assignment))
    .filter(Boolean);

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanPromptPart(values.extraDetails)
      : "";

  return [compiledAssignments.join("; "), extraDetails]
    .filter(Boolean)
    .join(", ");
}
