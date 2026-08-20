<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ModuleField,
  ModuleFieldOption,
  SemanticTargetRef,
} from "../../../modules/types";
import type { SemanticBuiltinTargetDefinition } from "../../../utils/semanticTargets";
import {
  normalizeSemanticTarget,
  semanticTargetIdentity,
} from "../../../utils/semanticTargets";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { useSemanticTargetCatalog } from "~/composables/prompt/useSemanticTargetCatalog";
import AssignmentScopeEditor from "../shared/AssignmentScopeEditor.vue";

const { t } = useI18n();
const { enabledPromptVariables } = usePromptVariables();

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
  disabled?: boolean;
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

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const builtinTargets = computed<SemanticBuiltinTargetDefinition[]>(() => [
  {
    value: "overall",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.overall",
      "Overall",
    ),
  },
  {
    value: "background",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.background",
      "Background",
    ),
  },
  {
    value: "subject",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.subject",
      "Main Subject",
    ),
  },
  {
    value: "outfit",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.outfit",
      "Outfit",
    ),
    moduleKey: "outfit",
  },
  {
    value: "hair",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.hair",
      "Hair",
    ),
    moduleKey: "hair",
  },
  {
    value: "typography",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.typography",
      "Typography",
    ),
  },
  {
    value: "accents",
    label: translate(
      "modules.colorPalette.fields.paletteAssignments.targets.builtin.accents",
      "Accent Elements",
    ),
  },
]);

const semanticCatalog = useSemanticTargetCatalog(
  "color",
  () => builtinTargets.value,
);

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
  return getColorPalettePresetOptions().filter(
    (option) => option.category === category,
  );
}

function getColorPalettePresetDropdownOptions() {
  const categories = getColorPalettePresetCategories();
  if (!categories.length) return getColorPalettePresetOptions();

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
  return getColorPalettePresetOptions().find(
    (option) => option.value === presetId,
  );
}

function literalSwatch(
  value = "#000000",
  id = createId("color"),
): ColorPaletteSwatch {
  return { id, kind: "literal", value };
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

function legacyTarget(value: unknown): SemanticTargetRef {
  const usage =
    typeof value === "string" && value.trim() ? value.trim() : "overall";

  if (
    builtinTargetValues.includes(
      usage as (typeof builtinTargetValues)[number],
    )
  ) {
    return { kind: "builtin", value: usage };
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
    colors = (presetOption(presetId)?.colors || []).map((color, colorIndex) =>
      literalSwatch(color, `color-${ruleIndex + 1}-${colorIndex + 1}`),
    );
  }

  const hasExplicitTargets = Array.isArray(item.targets);
  const targets = hasExplicitTargets
    ? (item.targets as unknown[])
        .map(normalizeSemanticTarget)
        .filter((target): target is SemanticTargetRef => Boolean(target))
    : [legacyTarget(item.usage)];
  const exceptions = Array.isArray(item.exceptions)
    ? item.exceptions
        .map(normalizeSemanticTarget)
        .filter((target): target is SemanticTargetRef => Boolean(target))
    : [];

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `color-rule-${ruleIndex + 1}`,
    presetId: presetId || undefined,
    colors,
    targets,
    exceptions,
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

function isColorAssignmentExpanded(rule: ColorPaletteRule, index: number) {
  return !collapsedRuleIds.value.includes(ruleId(rule, index));
}

function toggleColorAssignment(rule: ColorPaletteRule, index: number) {
  const id = ruleId(rule, index);
  collapsedRuleIds.value = collapsedRuleIds.value.includes(id)
    ? collapsedRuleIds.value.filter((item) => item !== id)
    : [...collapsedRuleIds.value, id];
}

function createColorAssignment(): ColorPaletteRule {
  return {
    id: createId("color-rule"),
    colors: [],
    targets: [{ kind: "builtin", value: "overall" }],
    exceptions: [],
  };
}

function addColorAssignment() {
  setAssignments([...assignments.value, createColorAssignment()]);
}

function removeColorAssignment(index: number) {
  const current = assignments.value[index];
  if (current?.id) {
    collapsedRuleIds.value = collapsedRuleIds.value.filter(
      (id) => id !== current.id,
    );
  }
  setAssignments(assignments.value.filter((_, itemIndex) => itemIndex !== index));
}

function updateRule(index: number, patch: Partial<ColorPaletteRule>) {
  setAssignments(
    assignments.value.map((assignment, itemIndex) =>
      itemIndex === index ? { ...assignment, ...patch } : assignment,
    ),
  );
}

function detachPreset(rule: ColorPaletteRule) {
  return rule.presetId ? { ...rule, presetId: undefined } : rule;
}

function updateColorAssignmentPreset(index: number, value: ElDropdownValue) {
  const current = assignments.value[index];
  if (!current) return;

  const presetId = String(value || "");
  if (!presetId) {
    updateRule(index, { presetId: undefined });
    return;
  }

  const option = presetOption(presetId);
  if (!option) return;

  updateRule(index, {
    presetId,
    colors: (option.colors || []).map((color) => literalSwatch(color)),
  });
}

function addColorAssignmentColor(index: number) {
  const current = assignments.value[index];
  if (!current) return;
  const detached = detachPreset(current);
  updateRule(index, {
    presetId: detached.presetId,
    colors: [...detached.colors, literalSwatch()],
  });
}

function removeColorAssignmentColor(index: number, colorIndex: number) {
  const current = assignments.value[index];
  if (!current) return;
  const detached = detachPreset(current);
  updateRule(index, {
    presetId: detached.presetId,
    colors: detached.colors.filter((_, itemIndex) => itemIndex !== colorIndex),
  });
}

function updateSwatch(
  index: number,
  colorIndex: number,
  swatch: ColorPaletteSwatch,
) {
  const current = assignments.value[index];
  if (!current) return;
  const detached = detachPreset(current);
  const colors = [...detached.colors];
  colors[colorIndex] = swatch;
  updateRule(index, { presetId: detached.presetId, colors });
}

function updateColorAssignmentColorValue(
  index: number,
  colorIndex: number,
  value: string,
) {
  const swatch = assignments.value[index]?.colors[colorIndex];
  if (!swatch) return;
  updateSwatch(index, colorIndex, {
    ...swatch,
    kind: "literal",
    value,
    variableId: undefined,
    token: undefined,
    label: undefined,
  });
}

function updateColorAssignmentColor(
  index: number,
  colorIndex: number,
  event: Event,
) {
  const target = event.target as HTMLInputElement | null;
  updateColorAssignmentColorValue(
    index,
    colorIndex,
    target?.value || "#000000",
  );
}

function variableToken(key: string) {
  return `{${key}}`;
}

const colorVariables = computed(() =>
  enabledPromptVariables.value.filter((variable) => variable.type === "color"),
);

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
      label: variableToken(variable.key),
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
  index: number,
  colorIndex: number,
  value: ElDropdownValue,
) {
  const swatch = assignments.value[index]?.colors[colorIndex];
  if (!swatch) return;

  const selected = String(value || "literal");
  if (selected === "literal") {
    updateSwatch(index, colorIndex, {
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

  const token = variableToken(variable.key);
  updateSwatch(index, colorIndex, {
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

const targetConflictCounts = computed(() => {
  const counts = new Map<string, number>();
  assignments.value.forEach((rule) => {
    rule.targets.forEach((target) => {
      const key = semanticTargetIdentity(target);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return counts;
});

function hasTargetConflict(rule: ColorPaletteRule) {
  return rule.targets.some((target) => {
    const key = semanticTargetIdentity(target);
    return key ? (targetConflictCounts.value.get(key) || 0) > 1 : false;
  });
}

function ruleTitle(rule: ColorPaletteRule) {
  return semanticCatalog.summarize(rule.targets, rule.exceptions || []);
}

function ruleSummary(rule: ColorPaletteRule) {
  return `${rule.colors.length} ${rule.colors.length === 1 ? "color" : "colors"}`;
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
        <el-flex rules="ccs" :gap="1" class="minw0">
          <el-text
            :key="`color-title:${ruleTitle(assignment)}`"
            :size="14"
            :weight="500"
            icon="palette"
          >
            {{ ruleTitle(assignment) }}
          </el-text>
          <el-text
            :key="`color-summary:${ruleSummary(assignment)}`"
            :size="9"
            color="normal45"
          >
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

        <AssignmentScopeEditor
          :model-value="assignment.targets"
          :exceptions="assignment.exceptions || []"
          capability="color"
          :builtins="builtinTargets"
          exclusive-value="overall"
          @update:model-value="updateRule(assignmentIndex, { targets: $event })"
          @update:exceptions="updateRule(assignmentIndex, { exceptions: $event })"
        />

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
.module-field__color-row {
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