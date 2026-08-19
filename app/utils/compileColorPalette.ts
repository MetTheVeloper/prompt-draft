import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ColorPaletteTarget,
  ModuleField,
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

function isPaletteSwatch(value: unknown): value is ColorPaletteSwatch {
  return (
    isRecord(value) &&
    (value.kind === "literal" || value.kind === "variable") &&
    typeof value.value === "string"
  );
}

function isPaletteTarget(value: unknown): value is ColorPaletteTarget {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    typeof value.value === "string"
  );
}

function isPaletteRule(value: unknown): value is ColorPaletteRule {
  return (
    isRecord(value) &&
    Array.isArray(value.colors) &&
    Array.isArray(value.targets)
  );
}

function presetOption(field: ModuleField, presetId?: string) {
  if (!presetId) return undefined;
  return field.options?.find((option) => option.value === presetId);
}

function literalSwatch(value: string): ColorPaletteSwatch {
  return {
    kind: "literal",
    value,
  };
}

function legacyTarget(value?: string): ColorPaletteTarget {
  const target = value?.trim() || "overall";
  const builtins = new Set([
    "overall",
    "background",
    "subject",
    "outfit",
    "hair",
    "typography",
    "accents",
  ]);

  if (builtins.has(target)) {
    return {
      kind: "builtin",
      value: target,
    };
  }

  return {
    kind: "custom",
    value: target === "lighting" ? "lighting (legacy color target)" : target,
  };
}

function normalizeLegacyRule(
  field: ModuleField,
  value: Record<string, unknown>,
  index: number,
): ColorPaletteRule | null {
  const presetId = typeof value.preset === "string" ? value.preset.trim() : "";
  const option = presetOption(field, presetId);
  const legacyColors = Array.isArray(value.colors)
    ? value.colors.filter((item): item is string => typeof item === "string")
    : [];
  const colors = (legacyColors.length ? legacyColors : option?.colors || [])
    .map((color) => color.trim())
    .filter(Boolean)
    .map(literalSwatch);

  if (!colors.length) return null;

  return {
    id: `legacy-color-rule-${index + 1}`,
    presetId: presetId || undefined,
    colors,
    targets: [
      legacyTarget(typeof value.usage === "string" ? value.usage : "overall"),
    ],
  };
}

export function normalizeColorPaletteRules(
  field: ModuleField,
  value: unknown,
): ColorPaletteRule[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (isPaletteRule(item)) {
        const colors = item.colors.filter(isPaletteSwatch);
        const targets = item.targets.filter(isPaletteTarget);

        return {
          ...item,
          colors,
          targets,
        } as ColorPaletteRule;
      }

      return isRecord(item) ? normalizeLegacyRule(field, item, index) : null;
    })
    .filter((item): item is ColorPaletteRule => Boolean(item));
}

function formatSwatch(swatch: ColorPaletteSwatch) {
  if (swatch.kind === "variable") {
    return cleanPromptPart(swatch.token || swatch.value);
  }

  return cleanPromptPart(swatch.value);
}

function formatPalette(field: ModuleField, rule: ColorPaletteRule) {
  const colors = rule.colors.map(formatSwatch).filter(Boolean);
  if (!colors.length) return "";

  const option = presetOption(field, rule.presetId);
  const paletteName = option?.promptText?.trim() || "custom color palette";

  return `${paletteName} (${colors.join(" / ")})`;
}

function builtinTargetText(value: string) {
  const map: Record<string, string> = {
    overall: "the overall image",
    background: "the background",
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
    const descriptor = [
      "typography text",
      label,
      parent ? `in group ${parent}` : "",
      token && `(${token})`,
    ];

    return descriptor.filter(Boolean).join(" ");
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
  if (target.value === "overall") return 0;
  return 1;
}

function ruleSpecificity(rule: ColorPaletteRule) {
  if (!rule.targets.length) return 0;
  return Math.max(...rule.targets.map(targetSpecificity));
}

export function compileColorPaletteRule(
  field: ModuleField,
  rule: ColorPaletteRule,
) {
  const paletteText = formatPalette(field, rule);
  const targetText = formatTargets(rule.targets);

  if (!paletteText || !targetText) return "";

  return `${paletteText} assigned to ${targetText}`;
}

export function compileColorPaletteModule(
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

  const rulesField = module.fields.paletteAssignments;
  if (!rulesField) return "";

  const rules = normalizeColorPaletteRules(
    rulesField,
    values.paletteAssignments,
  )
    .map((rule, index) => ({ rule, index }))
    .sort((a, b) => {
      const specificity = ruleSpecificity(a.rule) - ruleSpecificity(b.rule);
      return specificity || a.index - b.index;
    })
    .map(({ rule }) => compileColorPaletteRule(rulesField, rule))
    .filter(Boolean);

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanPromptPart(values.extraDetails)
      : "";

  return [rules.join("; "), extraDetails]
    .filter(Boolean)
    .join(", ");
}
