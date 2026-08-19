<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ColorPaletteTarget,
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
} from "../../../modules/types";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const { t } = useI18n();
const {
  enabledPromptVariables,
  enabledModuleVariableGroups,
} = usePromptVariables();

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: ColorPaletteRule[];
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ColorPaletteRule[]): void;
}>();

type DropdownItem = {
  value: string;
  label: string;
  description?: string;
  group?: string;
  groupLabel?: string;
  color?: string;
  disabled?: boolean;
};

type TargetOption = DropdownItem & {
  target: ColorPaletteTarget;
};

const builtinTargetValues = [
  "overall",
  "background",
  "subject",
  "outfit",
  "hair",
  "typography",
  "accents",
] as const;

const collapsedRuleIds = ref<string[]>([]);
const customTargetDrafts = ref<Record<string, string>>({});

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function variableToken(variable: PromptVariable) {
  return `{${variable.key}}`;
}

function isTokenLike(value?: string) {
  return /^\{[^{}]+\}$/.test(String(value || "").trim());
}

function meaningfulVariableText(value?: string) {
  const cleaned = String(value || "").trim();
  return cleaned && !isTokenLike(cleaned) ? cleaned : "";
}

function typographyEntityLabel(
  variable: PromptVariable,
  fallback: string,
) {
  const token = variableToken(variable);
  const label = meaningfulVariableText(variable.label);

  if (label && label !== variable.key && label !== token) return label;

  const value = meaningfulVariableText(variable.value);
  if (value && value !== variable.key && value.length <= 72) return value;

  return fallback;
}

function getColorPalettePresetOptions() {
  return props.field.options || [];
}

function getColorPalettePresetCategories() {
  const categories = new Map<string, string>();

  getColorPalettePresetOptions().forEach((option) => {
    if (!option.category) return;
    categories.set(option.category, option.categoryLabel || option.category);
  });

  return Array.from(categories.entries()).map(([value, label]) => ({
    value,
    label,
  }));
}

function getColorPalettePresetsByCategory(category: string) {
  return getColorPalettePresetOptions().filter((option) => {
    return option.category === category;
  });
}

function getColorPalettePresetDropdownOptions() {
  const categories = getColorPalettePresetCategories();

  if (!categories.length) {
    return getColorPalettePresetOptions();
  }

  return categories.flatMap((category) => {
    return getColorPalettePresetsByCategory(category.value).map((option) => ({
      ...option,
      category: category.value,
      categoryLabel: category.label,
    }));
  });
}

function colorPalettePresetLabel(option: ModuleFieldOption) {
  return humanize(option.value);
}

function presetOption(presetId?: string) {
  return getColorPalettePresetOptions().find((option) => {
    return option.value === presetId;
  });
}

function literalSwatch(
  value = "#000000",
  id = createId("color"),
): ColorPaletteSwatch {
  return {
    id,
    kind: "literal",
    value,
  };
}

function normalizeSwatch(
  value: unknown,
  ruleIndex: number,
  colorIndex: number,
): ColorPaletteSwatch | null {
  if (typeof value === "string") {
    return literalSwatch(value, `color-${ruleIndex + 1}-${colorIndex + 1}`);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Partial<ColorPaletteSwatch>;
  if (item.kind !== "literal" && item.kind !== "variable") return null;
  if (typeof item.value !== "string") return null;

  return {
    id: item.id || `color-${ruleIndex + 1}-${colorIndex + 1}`,
    kind: item.kind,
    value: item.value,
    variableId: item.variableId,
    token: item.token,
    label: item.label,
  };
}

function normalizeTarget(value: unknown): ColorPaletteTarget | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Partial<ColorPaletteTarget>;
  if (
    item.kind !== "builtin" &&
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
    token: item.token,
    label: item.label,
    parentLabel: item.parentLabel,
  };
}

function legacyTarget(value: unknown): ColorPaletteTarget {
  const usage =
    typeof value === "string" && value.trim() ? value.trim() : "overall";

  if (
    builtinTargetValues.includes(
      usage as (typeof builtinTargetValues)[number],
    )
  ) {
    return {
      kind: "builtin",
      value: usage,
    };
  }

  return {
    kind: "custom",
    value: usage === "lighting" ? "lighting (legacy color target)" : usage,
  };
}

function normalizeRule(
  value: unknown,
  ruleIndex: number,
): ColorPaletteRule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Record<string, unknown>;
  const presetId =
    typeof item.presetId === "string"
      ? item.presetId
      : typeof item.preset === "string"
        ? item.preset
        : "";

  const rawColors = Array.isArray(item.colors) ? item.colors : [];
  let colors = rawColors
    .map((color, colorIndex) => normalizeSwatch(color, ruleIndex, colorIndex))
    .filter((color): color is ColorPaletteSwatch => Boolean(color));

  if (!colors.length && presetId) {
    colors = (presetOption(presetId)?.colors || []).map((color, colorIndex) => {
      return literalSwatch(color, `color-${ruleIndex + 1}-${colorIndex + 1}`);
    });
  }

  const rawTargets = Array.isArray(item.targets) ? item.targets : [];
  const targets = rawTargets.length
    ? rawTargets
        .map(normalizeTarget)
        .filter((target): target is ColorPaletteTarget => Boolean(target))
    : [legacyTarget(item.usage)];

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `color-rule-${ruleIndex + 1}`,
    presetId: presetId || undefined,
    colors,
    targets,
  };
}

function normalizeRules(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeRule)
    .filter((rule): rule is ColorPaletteRule => Boolean(rule));
}

const assignments = computed(() => normalizeRules(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    const source = Array.isArray(value) ? value : [];
    const normalized = normalizeRules(source);

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", normalized);
    }
  },
  { immediate: true, deep: true },
);

function setAssignments(nextAssignments: ColorPaletteRule[]) {
  emit("update:modelValue", nextAssignments);
}

function ruleId(rule: ColorPaletteRule, index: number) {
  return rule.id || `color-rule-${index + 1}`;
}

function isColorAssignmentExpanded(
  rule: ColorPaletteRule,
  assignmentIndex: number,
) {
  return !collapsedRuleIds.value.includes(ruleId(rule, assignmentIndex));
}

function toggleColorAssignment(
  rule: ColorPaletteRule,
  assignmentIndex: number,
) {
  const id = ruleId(rule, assignmentIndex);

  collapsedRuleIds.value = collapsedRuleIds.value.includes(id)
    ? collapsedRuleIds.value.filter((item) => item !== id)
    : [...collapsedRuleIds.value, id];
}

function createColorAssignment(): ColorPaletteRule {
  return {
    id: createId("color-rule"),
    colors: [],
    targets: [{ kind: "builtin", value: "overall" }],
  };
}

function addColorAssignment() {
  setAssignments([...assignments.value, createColorAssignment()]);
}

function removeColorAssignment(assignmentIndex: number) {
  const current = assignments.value[assignmentIndex];

  if (current?.id) {
    collapsedRuleIds.value = collapsedRuleIds.value.filter(
      (id) => id !== current.id,
    );
    delete customTargetDrafts.value[current.id];
  }

  setAssignments(
    assignments.value.filter((_, index) => index !== assignmentIndex),
  );
}

function updateRule(
  assignmentIndex: number,
  patch: Partial<ColorPaletteRule>,
) {
  setAssignments(
    assignments.value.map((assignment, index) => {
      return index === assignmentIndex
        ? { ...assignment, ...patch }
        : assignment;
    }),
  );
}

function detachPreset(rule: ColorPaletteRule) {
  return rule.presetId ? { ...rule, presetId: undefined } : rule;
}

function updateColorAssignmentPreset(
  assignmentIndex: number,
  value: ElDropdownValue,
) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const presetId = String(value || "");
  if (!presetId) {
    updateRule(assignmentIndex, { presetId: undefined });
    return;
  }

  const option = presetOption(presetId);
  if (!option) return;

  updateRule(assignmentIndex, {
    presetId,
    colors: (option.colors || []).map((color) => literalSwatch(color)),
  });
}

function addColorAssignmentColor(assignmentIndex: number) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const detached = detachPreset(current);
  updateRule(assignmentIndex, {
    presetId: detached.presetId,
    colors: [...detached.colors, literalSwatch()],
  });
}

function removeColorAssignmentColor(
  assignmentIndex: number,
  colorIndex: number,
) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const detached = detachPreset(current);
  updateRule(assignmentIndex, {
    presetId: detached.presetId,
    colors: detached.colors.filter((_, index) => index !== colorIndex),
  });
}

function updateSwatch(
  assignmentIndex: number,
  colorIndex: number,
  swatch: ColorPaletteSwatch,
) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const detached = detachPreset(current);
  const colors = [...detached.colors];
  colors[colorIndex] = swatch;

  updateRule(assignmentIndex, {
    presetId: detached.presetId,
    colors,
  });
}

function updateColorAssignmentColorValue(
  assignmentIndex: number,
  colorIndex: number,
  value: string,
) {
  const current = assignments.value[assignmentIndex];
  const swatch = current?.colors[colorIndex];
  if (!swatch) return;

  updateSwatch(assignmentIndex, colorIndex, {
    ...swatch,
    kind: "literal",
    value,
    variableId: undefined,
    token: undefined,
    label: undefined,
  });
}

function updateColorAssignmentColor(
  assignmentIndex: number,
  colorIndex: number,
  event: Event,
) {
  const target = event.target as HTMLInputElement | null;
  updateColorAssignmentColorValue(
    assignmentIndex,
    colorIndex,
    target?.value || "#000000",
  );
}

const colorVariables = computed(() => {
  return enabledPromptVariables.value.filter((variable) => {
    return variable.type === "color";
  });
});

function swatchSourceValue(swatch: ColorPaletteSwatch) {
  if (swatch.kind !== "variable") return "literal";
  return `variable:${swatch.variableId || swatch.token || swatch.value}`;
}

function swatchSourceItems(swatch: ColorPaletteSwatch): DropdownItem[] {
  const manualLabel = translate(
    "modules.colorPalette.fields.paletteAssignments.colors.groups.manual",
    "Manual",
  );
  const variableLabel = translate(
    "modules.colorPalette.fields.paletteAssignments.colors.groups.variables",
    "Color Variables",
  );

  const items: DropdownItem[] = [
    {
      value: "literal",
      label: translate(
        "modules.colorPalette.fields.paletteAssignments.colors.literal",
        "Custom Color",
      ),
      group: "manual",
      groupLabel: manualLabel,
    },
    ...colorVariables.value.map((variable) => ({
      value: `variable:${variable.id}`,
      label: variableToken(variable),
      description: variable.value,
      group: "variable",
      groupLabel: variableLabel,
    })),
  ];

  if (
    swatch.kind === "variable" &&
    swatch.variableId &&
    !colorVariables.value.some((variable) => variable.id === swatch.variableId)
  ) {
    items.push({
      value: `variable:${swatch.variableId}`,
      label: `${translate("modules.colorPalette.fields.paletteAssignments.missing", "Missing")} — ${swatch.token || swatch.label || swatch.value}`,
      description: swatch.token || swatch.value,
      group: "variable",
      groupLabel: variableLabel,
      disabled: true,
    });
  }

  return items;
}

function updateSwatchSource(
  assignmentIndex: number,
  colorIndex: number,
  value: ElDropdownValue,
) {
  const current = assignments.value[assignmentIndex];
  const swatch = current?.colors[colorIndex];
  if (!swatch) return;

  const selected = String(value || "literal");

  if (selected === "literal") {
    updateSwatch(assignmentIndex, colorIndex, {
      id: swatch.id,
      kind: "literal",
      value: swatch.kind === "literal" ? swatch.value : "#000000",
    });
    return;
  }

  if (!selected.startsWith("variable:")) return;

  const variableId = selected.slice("variable:".length);
  const variable = colorVariables.value.find((item) => item.id === variableId);
  if (!variable) return;

  const token = variableToken(variable);
  updateSwatch(assignmentIndex, colorIndex, {
    id: swatch.id,
    kind: "variable",
    value: token,
    variableId: variable.id,
    token,
    label: variable.label || variable.key,
  });
}

function normalizePickerColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : "#000000";
}

const typographyVariables = computed(() => {
  const group = enabledModuleVariableGroups.value.find((item) => {
    return item.id === "typography";
  });

  return group?.variables || [];
});

const typographyGroupVariables = computed(() => {
  return typographyVariables.value.filter((variable) => {
    return variable.entityType === "text_group";
  });
});

const typographyTextVariables = computed(() => {
  return typographyVariables.value.filter((variable) => {
    return variable.entityType === "text";
  });
});

const userTargetVariables = computed(() => {
  return enabledPromptVariables.value.filter((variable) => {
    return variable.type === "subject" || variable.type === "object";
  });
});

function encodeReference(value: string) {
  return encodeURIComponent(value);
}

function decodeReference(value: string) {
  return decodeURIComponent(value);
}

function targetOptionValue(target: ColorPaletteTarget) {
  if (target.kind === "builtin") return `builtin:${target.value}`;
  if (target.kind === "custom") return "";
  if (target.kind === "user_variable") {
    return `user_variable:${encodeReference(target.variableId || target.value)}`;
  }
  if (target.kind === "typography_group") {
    return `typography_group:${encodeReference(target.entityId || target.value)}`;
  }
  return `typography_text:${encodeReference(target.entityId || target.value)}`;
}

const generalGroupLabel = computed(() =>
  translate(
    "modules.colorPalette.fields.paletteAssignments.targets.groups.general",
    "General",
  ),
);

const typographyGroupsLabel = computed(() =>
  translate(
    "modules.colorPalette.fields.paletteAssignments.targets.groups.typographyGroups",
    "Typography Groups",
  ),
);

const typographyTextsLabel = computed(() =>
  translate(
    "modules.colorPalette.fields.paletteAssignments.targets.groups.typographyTexts",
    "Typography Texts",
  ),
);

const userVariablesLabel = computed(() =>
  translate(
    "modules.colorPalette.fields.paletteAssignments.targets.groups.userVariables",
    "User Subject / Object Variables",
  ),
);

const missingReferencesLabel = computed(() =>
  translate(
    "modules.colorPalette.fields.paletteAssignments.targets.groups.missing",
    "Missing References",
  ),
);

const builtinTargetOptions = computed<TargetOption[]>(() => {
  return builtinTargetValues.map((value) => ({
    value: `builtin:${value}`,
    label: translate(
      `modules.colorPalette.fields.paletteAssignments.targets.builtin.${value}`,
      humanize(value),
    ),
    group: "general",
    groupLabel: generalGroupLabel.value,
    target: {
      kind: "builtin",
      value,
    },
  }));
});

const typographyGroupTargetOptions = computed<TargetOption[]>(() => {
  return typographyGroupVariables.value.map((variable, index) => {
    const token = variableToken(variable);
    const label = typographyEntityLabel(
      variable,
      `${translate("modules.colorPalette.fields.paletteAssignments.targets.typographyGroupFallback", "Text Group")} ${index + 1}`,
    );

    return {
      value: `typography_group:${encodeReference(variable.entityId || variable.id)}`,
      label,
      description: token,
      group: "typography_groups",
      groupLabel: typographyGroupsLabel.value,
      target: {
        kind: "typography_group" as const,
        value: token,
        entityId: variable.entityId || variable.id,
        token,
        label,
      },
    };
  });
});

const typographyTextTargetOptions = computed<TargetOption[]>(() => {
  return typographyTextVariables.value.map((variable, index) => {
    const parent = typographyGroupVariables.value.find((groupVariable) => {
      return groupVariable.entityId === variable.parentId;
    });
    const token = variableToken(variable);
    const label = typographyEntityLabel(
      variable,
      `${translate("modules.colorPalette.fields.paletteAssignments.targets.typographyTextFallback", "Text")} ${index + 1}`,
    );
    const parentLabel = parent
      ? typographyEntityLabel(parent, translate(
          "modules.colorPalette.fields.paletteAssignments.targets.typographyGroupFallback",
          "Text Group",
        ))
      : "";

    return {
      value: `typography_text:${encodeReference(variable.entityId || variable.id)}`,
      label,
      description: [token, parentLabel].filter(Boolean).join(" · "),
      group: "typography_texts",
      groupLabel: typographyTextsLabel.value,
      target: {
        kind: "typography_text" as const,
        value: token,
        entityId: variable.entityId || variable.id,
        token,
        label,
        parentLabel,
      },
    };
  });
});

const userTargetOptions = computed<TargetOption[]>(() => {
  return userTargetVariables.value.map((variable) => ({
    value: `user_variable:${encodeReference(variable.id)}`,
    label: variableToken(variable),
    description: variable.value,
    group: "user_variables",
    groupLabel: userVariablesLabel.value,
    target: {
      kind: "user_variable",
      value: variableToken(variable),
      variableId: variable.id,
      token: variableToken(variable),
      label: variable.label || variable.key,
    },
  }));
});

const allTargetOptions = computed<TargetOption[]>(() => [
  ...builtinTargetOptions.value,
  ...typographyGroupTargetOptions.value,
  ...typographyTextTargetOptions.value,
  ...userTargetOptions.value,
]);

function targetSelectValues(rule: ColorPaletteRule) {
  return rule.targets
    .filter((target) => target.kind !== "custom")
    .map(targetOptionValue)
    .filter(Boolean);
}

function targetFromSelection(
  selection: string,
  currentRule: ColorPaletteRule,
): ColorPaletteTarget | null {
  const option = allTargetOptions.value.find((item) => item.value === selection);
  if (option) return { ...option.target };

  const [kind, encoded = ""] = selection.split(":");
  const reference = decodeReference(encoded);
  const existing = currentRule.targets.find((target) => {
    if (kind === "user_variable" && target.kind === "user_variable") {
      return (target.variableId || target.value) === reference;
    }

    if (kind === "typography_group" && target.kind === "typography_group") {
      return (target.entityId || target.value) === reference;
    }

    if (kind === "typography_text" && target.kind === "typography_text") {
      return (target.entityId || target.value) === reference;
    }

    return false;
  });

  return existing ? { ...existing } : null;
}

function isTargetOptionAvailable(value: string) {
  return allTargetOptions.value.some((option) => option.value === value);
}

function missingTargetOptions(rule: ColorPaletteRule): TargetOption[] {
  return rule.targets
    .filter((target) => target.kind !== "custom")
    .map((target) => ({
      value: targetOptionValue(target),
      target,
    }))
    .filter(({ value }) => value && !isTargetOptionAvailable(value))
    .map(({ value, target }) => ({
      value,
      label: `${translate("modules.colorPalette.fields.paletteAssignments.missing", "Missing")} — ${target.label || target.token || target.value}`,
      description: target.token || target.value,
      group: "missing",
      groupLabel: missingReferencesLabel.value,
      color: "orange",
      target,
    }));
}

function targetItems(rule: ColorPaletteRule) {
  return [
    ...allTargetOptions.value,
    ...missingTargetOptions(rule),
  ];
}

function updateColorAssignmentTargets(
  assignmentIndex: number,
  values: ElDropdownValue[],
) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const selectedValues = values.map((value) => String(value));
  const hasOverall = selectedValues.includes("builtin:overall");
  const selectedTargets = selectedValues
    .map((value) => targetFromSelection(value, current))
    .filter((target): target is ColorPaletteTarget => Boolean(target));
  const customTargets = hasOverall
    ? []
    : current.targets.filter((target) => target.kind === "custom");

  updateRule(assignmentIndex, {
    targets: [...selectedTargets, ...customTargets],
  });
}

function customTargets(rule: ColorPaletteRule) {
  return rule.targets.filter((target) => target.kind === "custom");
}

function customTargetDraftKey(rule: ColorPaletteRule, assignmentIndex: number) {
  return ruleId(rule, assignmentIndex);
}

function customTargetDraft(rule: ColorPaletteRule, assignmentIndex: number) {
  return customTargetDrafts.value[customTargetDraftKey(rule, assignmentIndex)] || "";
}

function updateCustomTargetDraft(
  rule: ColorPaletteRule,
  assignmentIndex: number,
  value: string,
) {
  customTargetDrafts.value = {
    ...customTargetDrafts.value,
    [customTargetDraftKey(rule, assignmentIndex)]: value,
  };
}

function addCustomTarget(assignmentIndex: number) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  const key = customTargetDraftKey(current, assignmentIndex);
  const value = String(customTargetDrafts.value[key] || "").trim();
  if (!value) return;

  const exists = current.targets.some((target) => {
    return target.kind === "custom" && target.value.trim().toLowerCase() === value.toLowerCase();
  });

  if (!exists) {
    updateRule(assignmentIndex, {
      targets: [
        ...current.targets.filter((target) => {
          return !(target.kind === "builtin" && target.value === "overall");
        }),
        { kind: "custom", value },
      ],
    });
  }

  customTargetDrafts.value = {
    ...customTargetDrafts.value,
    [key]: "",
  };
}

function removeCustomTarget(assignmentIndex: number, targetIndex: number) {
  const current = assignments.value[assignmentIndex];
  if (!current) return;

  let customIndex = -1;
  updateRule(assignmentIndex, {
    targets: current.targets.filter((target) => {
      if (target.kind !== "custom") return true;
      customIndex += 1;
      return customIndex !== targetIndex;
    }),
  });
}

function targetIdentity(target: ColorPaletteTarget) {
  if (target.kind === "builtin") return `builtin:${target.value}`;
  if (target.kind === "custom") {
    return target.value.trim()
      ? `custom:${target.value.trim().toLowerCase()}`
      : "";
  }
  if (target.kind === "user_variable") {
    return `user:${target.variableId || target.token || target.value}`;
  }
  return `${target.kind}:${target.entityId || target.token || target.value}`;
}

const targetConflictCounts = computed(() => {
  const counts = new Map<string, number>();

  assignments.value.forEach((rule) => {
    rule.targets.forEach((target) => {
      const key = targetIdentity(target);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return counts;
});

function hasTargetConflict(rule: ColorPaletteRule) {
  return rule.targets.some((target) => {
    const key = targetIdentity(target);
    return key ? (targetConflictCounts.value.get(key) || 0) > 1 : false;
  });
}

function ruleSummary(rule: ColorPaletteRule) {
  return translate(
    "modules.colorPalette.fields.paletteAssignments.ruleSummary",
    `${rule.colors.length} colors · ${rule.targets.length} targets`,
  )
    .replace("{colors}", String(rule.colors.length))
    .replace("{targets}", String(rule.targets.length));
}
</script>

<template>
  <el-grid rules="csc" :gap="16" :cols="1" class="w100">
    <el-grid
      v-for="(assignment, assignmentIndex) in assignments"
      :key="ruleId(assignment, assignmentIndex)"
      :radius="24"
      :br="2"
      :bc="isColorAssignmentExpanded(assignment, assignmentIndex) ? 'blue45' : 'normal10'"
      :p="12"
      :gap="12"
      class="module-field__assignment-card w100"
    >
      <el-flex
        rules="rbc"
        :gap="8"
        class="crp"
        role="button"
        tabindex="0"
        @click="toggleColorAssignment(assignment, assignmentIndex)"
        @keydown.enter.prevent="toggleColorAssignment(assignment, assignmentIndex)"
        @keydown.space.prevent="toggleColorAssignment(assignment, assignmentIndex)"
      >
        <el-flex rules="ccs" :gap="1">
          <el-text :size="14" :weight="300" icon="palette">
            {{ t("modules.colorPalette.fields.paletteAssignments.ruleTitle", { index: assignmentIndex + 1 }) }}
          </el-text>
          <el-text :size="9" color="normal45">
            {{ ruleSummary(assignment) }}
          </el-text>
        </el-flex>

        <el-flex rules="rcc" :gap="6">
          <el-icon
            :icon="isColorAssignmentExpanded(assignment, assignmentIndex) ? 'expand_less' : 'expand_more'"
            :size="14"
          />
          <el-button
            :label="t('modules.colorPalette.fields.paletteAssignments.actions.remove')"
            icon="delete"
            :p="8"
            @click.stop="removeColorAssignment(assignmentIndex)"
            mode="flat"
            color="red"
            type="fab"
            :size="14"
          />
        </el-flex>
      </el-flex>

      <el-grid
        v-show="isColorAssignmentExpanded(assignment, assignmentIndex)"
        :gap="12"
        class="w100"
      >
        <label class="module-field__control">
          <el-text :size="10" color="normal50">
            {{ translate("modules.colorPalette.fields.paletteAssignments.preset.label", "Palette Preset") }}
          </el-text>
          <el-dropdown
            :model-value="assignment.presetId || ''"
            :items="getColorPalettePresetDropdownOptions()"
            :item-label="(option) => colorPalettePresetLabel(option)"
            item-value="value"
            item-group="category"
            :item-group-label="(option) => option.categoryLabel || option.category || ''"
            :placeholder="t('panel.none')"
            clearable
            @update:model-value="updateColorAssignmentPreset(assignmentIndex, $event)"
          />
        </label>

        <label class="module-field__control">
          <el-text :size="10" color="normal50">
            {{ translate("modules.colorPalette.fields.paletteAssignments.targets.label", "Apply To") }}
          </el-text>
          <el-multi-select
            :model-value="targetSelectValues(assignment)"
            :items="targetItems(assignment)"
            item-label="label"
            item-value="value"
            item-description="description"
            item-group="group"
            item-group-label="groupLabel"
            item-color="color"
            item-disabled="disabled"
            :exclusive-values="['builtin:overall']"
            :placeholder="t('panel.none')"
            @update:model-value="updateColorAssignmentTargets(assignmentIndex, $event)"
          />
        </label>

        <el-grid :gap="6" class="module-field__custom-target-editor">
          <el-text :size="10" color="normal50">
            {{ translate("modules.colorPalette.fields.paletteAssignments.targets.customLabel", "Custom targets") }}
          </el-text>

          <el-flex rules="rsc" :gap="8" class="w100">
            <el-text-field
              class="fg100"
              :model-value="customTargetDraft(assignment, assignmentIndex)"
              type="text"
              support-variables
              :placeholder="translate('modules.colorPalette.fields.paletteAssignments.targets.customPlaceholder', 'Example: dragon costume scales')"
              @update:model-value="updateCustomTargetDraft(assignment, assignmentIndex, $event)"
              @keydown.enter.prevent="addCustomTarget(assignmentIndex)"
            />
            <el-button
              icon="add"
              :label="translate('modules.colorPalette.fields.paletteAssignments.targets.addCustom', 'Add custom target')"
              color="blue"
              :size="12"
              :p="[8, 12]"
              @click="addCustomTarget(assignmentIndex)"
            />
          </el-flex>

          <el-flex
            v-if="customTargets(assignment).length"
            rules="rsc"
            :gap="6"
            class="fw w100"
          >
            <el-flex
              v-for="(target, targetIndex) in customTargets(assignment)"
              :key="`${ruleId(assignment, assignmentIndex)}-custom-${targetIndex}`"
              rules="rcc"
              :gap="4"
              :p="[4, 8]"
              :radius="20"
              bg="normal5"
              :br="1"
              bc="normal10"
            >
              <el-text :size="10">{{ target.value }}</el-text>
              <el-button
                type="fab"
                mode="flat"
                color="red"
                icon="close"
                :size="10"
                :p="4"
                :label="t('modules.colorPalette.fields.paletteAssignments.actions.remove')"
                @click="removeCustomTarget(assignmentIndex, targetIndex)"
              />
            </el-flex>
          </el-flex>
        </el-grid>

        <el-text
          v-if="hasTargetConflict(assignment)"
          :size="10"
          color="orange"
          icon="warning"
          icon-color="orange"
        >
          {{ translate(
            "modules.colorPalette.fields.paletteAssignments.warnings.duplicateTarget",
            "Another palette rule also targets at least one of these exact elements. Both rules are kept."
          ) }}
        </el-text>

        <el-flex rules="csc" :gap="8" class="module-field__assignment-body">
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="11" :weight="600" icon="palette">
              {{ translate("modules.colorPalette.fields.paletteAssignments.colors.label", "Palette Colors") }}
            </el-text>
            <el-text :size="9" color="normal45">
              {{ translate(
                "modules.colorPalette.fields.paletteAssignments.colors.description",
                "Preset colors stay editable and can be replaced with Color variables."
              ) }}
            </el-text>
          </el-flex>

          <el-flex
            v-for="(swatch, colorIndex) in assignment.colors"
            :key="swatch.id || `${ruleId(assignment, assignmentIndex)}-color-${colorIndex}`"
            rules="rbc"
            :gap="8"
            class="module-field__color-row"
          >
            <el-dropdown
              class="module-field__color-source"
              :model-value="swatchSourceValue(swatch)"
              :items="swatchSourceItems(swatch)"
              item-label="label"
              item-value="value"
              item-description="description"
              item-group="group"
              item-group-label="groupLabel"
              item-disabled="disabled"
              @update:model-value="updateSwatchSource(assignmentIndex, colorIndex, $event)"
            />

            <template v-if="swatch.kind === 'literal'">
              <input
                type="color"
                :value="normalizePickerColor(swatch.value)"
                @input="updateColorAssignmentColor(assignmentIndex, colorIndex, $event)"
              />
              <el-text-field
                :model-value="swatch.value"
                type="text"
                :placeholder="t('modules.colorPalette.fields.paletteAssignments.controls.color.placeholder')"
                @update:model-value="updateColorAssignmentColorValue(assignmentIndex, colorIndex, $event)"
              />
            </template>

            <el-flex v-else rules="ccs" :gap="0" class="fg100 minw0">
              <el-text marker="blue15" color="blue" :size="11" :weight="700">
                {{ swatch.token || swatch.value }}
              </el-text>
              <el-text :size="9" color="normal45">
                {{ colorVariables.find((variable) => variable.id === swatch.variableId)?.value || swatch.label || translate('modules.colorPalette.fields.paletteAssignments.missing', 'Missing') }}
              </el-text>
            </el-flex>

            <el-button
              :label="t('modules.colorPalette.fields.paletteAssignments.actions.remove')"
              icon="delete"
              :p="8"
              @click="removeColorAssignmentColor(assignmentIndex, colorIndex)"
              mode="flat"
              color="red"
              type="fab"
              :size="14"
            />
          </el-flex>

          <el-button
            :label="t('modules.colorPalette.fields.paletteAssignments.actions.addColor')"
            mode="outline"
            color="blue"
            :size="14"
            :p="[8, 12]"
            class="w100"
            @click="addColorAssignmentColor(assignmentIndex)"
          />
        </el-flex>
      </el-grid>
    </el-grid>

    <el-flex
      rules="ccc"
      :radius="24"
      :br="2"
      :p="12"
      :gap="12"
      bc="normal10"
      class="w100"
    >
      <el-button
        :label="t('modules.colorPalette.fields.paletteAssignments.actions.addAssignment')"
        color="blue"
        :size="14"
        :p="[8, 12]"
        class="w100"
        @click="addColorAssignment"
      />
    </el-flex>
  </el-grid>
</template>

<style scoped>
.module-field__assignment-card {
  width: 100%;
  align-self: stretch;
}

.module-field__assignment-body,
.module-field__control,
.module-field__color-row,
.module-field__custom-target-editor {
  width: 100%;
}

.module-field__control {
  display: grid;
  gap: 5px;
}

.module-field__color-source {
  width: min(190px, 36%);
  min-width: 130px;
}

.module-field__color-row input[type="color"] {
  width: 38px;
  min-width: 38px;
  height: 38px;
  padding: 3px;
  border-radius: 10px;
}
</style>
