import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ModuleField,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import {
  cleanSemanticText,
  formatSemanticScope,
  normalizeSemanticTargets,
  semanticTargetSpecificity,
} from "./semanticTargets";

const COLOR_BUILTIN_TARGET_TEXT: Record<string, string> = {
  overall: "overall image",
  background: "background",
  subject: "main subject",
  outfit: "outfit",
  hair: "hair",
  typography: "typography",
  accents: "accent elements",
};

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
  return { kind: "literal", value };
}

function legacyTarget(value?: string): SemanticTargetRef {
  const target = value?.trim() || "overall";
  if (Object.prototype.hasOwnProperty.call(COLOR_BUILTIN_TARGET_TEXT, target)) {
    return { kind: "builtin", value: target };
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
    exceptions: [],
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
        return {
          ...item,
          colors: item.colors.filter(isPaletteSwatch),
          targets: normalizeSemanticTargets(item.targets),
          exceptions: normalizeSemanticTargets(item.exceptions),
        } as ColorPaletteRule;
      }

      return isRecord(item) ? normalizeLegacyRule(field, item, index) : null;
    })
    .filter((item): item is ColorPaletteRule => Boolean(item));
}

function formatSwatch(swatch: ColorPaletteSwatch) {
  if (swatch.kind === "variable") {
    return cleanSemanticText(swatch.token || swatch.value);
  }
  return cleanSemanticText(swatch.value);
}

function ruleSpecificity(rule: ColorPaletteRule) {
  if (!rule.targets.length) return 0;
  return Math.max(
    ...rule.targets.map((target) =>
      semanticTargetSpecificity(target, "overall"),
    ),
  );
}

export function compileColorPaletteRule(rule: ColorPaletteRule) {
  const colors = rule.colors.map(formatSwatch).filter(Boolean);
  const scope = formatSemanticScope(
    rule.targets,
    rule.exceptions || [],
    {
      format: "modular",
      builtinText: COLOR_BUILTIN_TARGET_TEXT,
    },
  );

  if (!colors.length || !scope) return "";
  return `• Assign ${colors.join(", ")} to ${scope}`;
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
      return cleanSemanticText(overrideValue);
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
    .map(({ rule }) => compileColorPaletteRule(rule))
    .filter(Boolean);

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanSemanticText(values.extraDetails)
      : "";

  if (extraDetails) {
    rules.push(`• ${extraDetails}`);
  }

  return rules.join("\n");
}
