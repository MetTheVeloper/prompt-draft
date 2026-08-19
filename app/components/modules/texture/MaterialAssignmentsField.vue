<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ColorPaletteTarget,
  MaterialAssignment,
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
} from "../../../modules/types";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const { t } = useI18n();
const { mobile } = useScreen();
const {
  enabledPromptVariables,
  enabledModuleVariableGroups,
} = usePromptVariables();

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: MaterialAssignment[];
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: MaterialAssignment[]): void;
}>();

type TargetOption = {
  value: string;
  label: string;
  description?: string;
  group: string;
  groupLabel: string;
  disabled?: boolean;
  target: ColorPaletteTarget;
};

type MaterialPresetRecipe = Partial<MaterialAssignment> & {
  id: string;
  category?: string;
  categoryLabel?: string;
};

const builtinTargetValues = [
  "all_surfaces",
  "background",
  "subject",
  "outfit",
  "hair",
  "typography",
  "accents",
] as const;

const collapsedAssignmentIds = ref<string[]>([]);
const customTargetDrafts = reactive<Record<string, string>>({});

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

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function configOptions(key: string): ModuleFieldOption[] {
  const options = props.field.config?.[key];
  if (!Array.isArray(options)) return [];

  return options.filter((item): item is ModuleFieldOption => {
    return isRecord(item) && typeof item.value === "string";
  });
}

const materialOptions = computed(() => configOptions("materialOptions"));
const finishOptions = computed(() => configOptions("finishOptions"));
const surfaceTextureOptions = computed(() => configOptions("surfaceTextureOptions"));
const opticalCharacterOptions = computed(() => configOptions("opticalCharacterOptions"));
const textureProminenceOptions = computed(() => configOptions("textureProminenceOptions"));
const conditionOptions = computed(() => configOptions("conditionOptions"));

const presetRecipes = computed<MaterialPresetRecipe[]>(() => {
  const recipes = props.field.config?.presetRecipes;
  if (!Array.isArray(recipes)) return [];

  return recipes.filter((item): item is MaterialPresetRecipe => {
    return isRecord(item) && typeof item.id === "string";
  });
});

function normalizeTarget(value: unknown): ColorPaletteTarget | null {
  if (!isRecord(value) || typeof value.kind !== "string" || typeof value.value !== "string") {
    return null;
  }

  if (
    value.kind !== "builtin" &&
    value.kind !== "user_variable" &&
    value.kind !== "typography_group" &&
    value.kind !== "typography_text" &&
    value.kind !== "custom"
  ) {
    return null;
  }

  return {
    kind: value.kind,
    value: value.value,
    variableId: typeof value.variableId === "string" ? value.variableId : undefined,
    entityId: typeof value.entityId === "string" ? value.entityId : undefined,
    token: typeof value.token === "string" ? value.token : undefined,
    label: typeof value.label === "string" ? value.label : undefined,
    parentLabel: typeof value.parentLabel === "string" ? value.parentLabel : undefined,
  };
}

function normalizeAssignment(value: unknown, index: number): MaterialAssignment | null {
  if (!isRecord(value)) return null;

  const hasExplicitTargets = Array.isArray(value.targets);
  const targets = hasExplicitTargets
    ? value.targets
        .map(normalizeTarget)
        .filter((target): target is ColorPaletteTarget => Boolean(target))
    : [];

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `material-assignment-${index + 1}`,
    presetId: typeof value.presetId === "string" ? value.presetId : undefined,
    material: typeof value.material === "string" ? value.material : "",
    finish: typeof value.finish === "string" ? value.finish : "",
    surfaceTexture:
      typeof value.surfaceTexture === "string" ? value.surfaceTexture : "",
    opticalCharacter:
      typeof value.opticalCharacter === "string" ? value.opticalCharacter : "",
    textureProminence:
      typeof value.textureProminence === "string" ? value.textureProminence : "",
    conditions: Array.isArray(value.conditions)
      ? value.conditions.filter((item): item is string => typeof item === "string")
      : [],
    targets: hasExplicitTargets
      ? targets
      : [{ kind: "builtin", value: "all_surfaces" }],
  };
}

function normalizeAssignments(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeAssignment)
    .filter((item): item is MaterialAssignment => Boolean(item));
}

const assignments = computed(() => normalizeAssignments(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    const source = Array.isArray(value) ? value : [];
    const normalized = normalizeAssignments(source);

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", normalized);
    }
  },
  { immediate: true, deep: true },
);

function setAssignments(nextAssignments: MaterialAssignment[]) {
  emit("update:modelValue", cloneValue(nextAssignments));
}

function assignmentId(assignment: MaterialAssignment, index: number) {
  return assignment.id || `material-assignment-${index + 1}`;
}

function isExpanded(assignment: MaterialAssignment, index: number) {
  return !collapsedAssignmentIds.value.includes(assignmentId(assignment, index));
}

function toggleExpanded(assignment: MaterialAssignment, index: number) {
  const id = assignmentId(assignment, index);

  if (collapsedAssignmentIds.value.includes(id)) {
    collapsedAssignmentIds.value = collapsedAssignmentIds.value.filter((item) => item !== id);
    return;
  }

  collapsedAssignmentIds.value = [...collapsedAssignmentIds.value, id];
}

function createAssignment(): MaterialAssignment {
  return {
    id: createId("material-assignment"),
    material: "",
    finish: "",
    surfaceTexture: "",
    opticalCharacter: "",
    textureProminence: "",
    conditions: [],
    targets: [{ kind: "builtin", value: "all_surfaces" }],
  };
}

function addAssignment() {
  setAssignments([...assignments.value, createAssignment()]);
}

function removeAssignment(index: number) {
  const current = assignments.value[index];
  if (current?.id) {
    collapsedAssignmentIds.value = collapsedAssignmentIds.value.filter((id) => id !== current.id);
    delete customTargetDrafts[current.id];
  }

  setAssignments(assignments.value.filter((_, itemIndex) => itemIndex !== index));
}

function updateAssignment(
  index: number,
  patch: Partial<MaterialAssignment>,
  options: { detachPreset?: boolean } = {},
) {
  const next = assignments.value.map((assignment, itemIndex) => {
    if (itemIndex !== index) return assignment;

    return {
      ...assignment,
      ...patch,
      ...(options.detachPreset ? { presetId: undefined } : {}),
    };
  });

  setAssignments(next);
}

function propertyValue(value: ElDropdownValue) {
  return String(value ?? "");
}

function updateProperty(
  index: number,
  key: "material" | "finish" | "surfaceTexture" | "opticalCharacter" | "textureProminence",
  value: ElDropdownValue,
) {
  updateAssignment(
    index,
    { [key]: propertyValue(value) },
    { detachPreset: true },
  );
}

function updateConditions(index: number, value: ElDropdownValue[]) {
  updateAssignment(
    index,
    { conditions: value.map((item) => String(item)) },
    { detachPreset: true },
  );
}

function applyPreset(index: number, value: ElDropdownValue) {
  const presetId = String(value ?? "");
  const current = assignments.value[index];
  if (!current) return;

  if (!presetId) {
    updateAssignment(index, { presetId: undefined });
    return;
  }

  const recipe = presetRecipes.value.find((item) => item.id === presetId);
  if (!recipe) return;

  updateAssignment(index, {
    presetId,
    material: recipe.material || "",
    finish: recipe.finish || "",
    surfaceTexture: recipe.surfaceTexture || "",
    opticalCharacter: recipe.opticalCharacter || "",
    textureProminence: recipe.textureProminence || "",
    conditions: [...(recipe.conditions || [])],
    targets: current.targets,
  });
}

function variableToken(variable: PromptVariable) {
  return `{${variable.key}}`;
}

function typographyEntityLabel(variable: PromptVariable, fallback: string) {
  const label = variable.label?.trim();
  const value = variable.value?.trim();
  const token = variableToken(variable);

  if (label && label !== token && label !== variable.key) return label;
  if (value && value !== token && value !== variable.key) {
    return value.replace(/^['\"]|['\"]$/g, "").slice(0, 60);
  }

  return fallback;
}

const typographyVariables = computed(() => {
  return (
    enabledModuleVariableGroups.value.find((group) => group.id === "typography")?.variables || []
  );
});

const typographyGroupVariables = computed(() =>
  typographyVariables.value.filter((variable) => variable.entityType === "text_group"),
);

const typographyTextVariables = computed(() =>
  typographyVariables.value.filter((variable) => variable.entityType === "text"),
);

const userTargetVariables = computed(() =>
  enabledPromptVariables.value.filter((variable) => {
    return variable.type === "subject" || variable.type === "object";
  }),
);

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
  translate("modules.texture.fields.materialAssignments.targets.groups.general", "General"),
);
const typographyGroupsLabel = computed(() =>
  translate("modules.texture.fields.materialAssignments.targets.groups.typographyGroups", "Typography Groups"),
);
const typographyTextsLabel = computed(() =>
  translate("modules.texture.fields.materialAssignments.targets.groups.typographyTexts", "Typography Texts"),
);
const userVariablesLabel = computed(() =>
  translate("modules.texture.fields.materialAssignments.targets.groups.userVariables", "User Subject / Object Variables"),
);
const missingReferencesLabel = computed(() =>
  translate("modules.texture.fields.materialAssignments.targets.groups.missing", "Missing References"),
);

const builtinTargetOptions = computed<TargetOption[]>(() =>
  builtinTargetValues.map((value) => ({
    value: `builtin:${value}`,
    label: translate(
      `modules.texture.fields.materialAssignments.targets.builtin.${value}`,
      humanize(value),
    ),
    group: "general",
    groupLabel: generalGroupLabel.value,
    target: { kind: "builtin", value },
  })),
);

const typographyGroupTargetOptions = computed<TargetOption[]>(() =>
  typographyGroupVariables.value.map((variable, index) => {
    const token = variableToken(variable);
    const label = typographyEntityLabel(
      variable,
      `${translate("modules.texture.fields.materialAssignments.targets.typographyGroupFallback", "Text Group")} ${index + 1}`,
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
  }),
);

const typographyTextTargetOptions = computed<TargetOption[]>(() =>
  typographyTextVariables.value.map((variable, index) => {
    const parent = typographyGroupVariables.value.find((item) => item.entityId === variable.parentId);
    const token = variableToken(variable);
    const label = typographyEntityLabel(
      variable,
      `${translate("modules.texture.fields.materialAssignments.targets.typographyTextFallback", "Text")} ${index + 1}`,
    );
    const parentLabel = parent
      ? typographyEntityLabel(parent, translate("modules.texture.fields.materialAssignments.targets.typographyGroupFallback", "Text Group"))
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
  }),
);

const userTargetOptions = computed<TargetOption[]>(() =>
  userTargetVariables.value.map((variable) => ({
    value: `user_variable:${encodeReference(variable.id)}`,
    label: variableToken(variable),
    description: variable.value,
    group: "user_variables",
    groupLabel: userVariablesLabel.value,
    target: {
      kind: "user_variable" as const,
      value: variableToken(variable),
      variableId: variable.id,
      token: variableToken(variable),
      label: variable.label || variable.key,
    },
  })),
);

const availableTargetOptions = computed<TargetOption[]>(() => [
  ...builtinTargetOptions.value,
  ...typographyGroupTargetOptions.value,
  ...typographyTextTargetOptions.value,
  ...userTargetOptions.value,
]);

function isAvailableTargetValue(value: string) {
  return availableTargetOptions.value.some((option) => option.value === value);
}

function missingTargetOptions(assignment: MaterialAssignment): TargetOption[] {
  return assignment.targets
    .filter((target) => target.kind !== "custom")
    .map((target) => ({ value: targetOptionValue(target), target }))
    .filter(({ value }) => Boolean(value) && !isAvailableTargetValue(value))
    .map(({ value, target }) => ({
      value,
      label: `${translate("modules.texture.fields.materialAssignments.targets.missing", "Missing")} — ${target.label || target.token || target.value}`,
      description: target.token || target.value,
      group: "missing",
      groupLabel: missingReferencesLabel.value,
      disabled: true,
      target,
    }));
}

function targetItems(assignment: MaterialAssignment) {
  return [...availableTargetOptions.value, ...missingTargetOptions(assignment)];
}

function targetSelectValues(assignment: MaterialAssignment) {
  return assignment.targets
    .filter((target) => target.kind !== "custom")
    .map(targetOptionValue)
    .filter(Boolean);
}

function targetFromSelection(
  selection: string,
  current: MaterialAssignment,
): ColorPaletteTarget | null {
  const available = targetItems(current).find((option) => option.value === selection);
  if (available) return { ...available.target };

  const [kind, encoded = ""] = selection.split(":");
  const reference = decodeReference(encoded);

  return (
    current.targets.find((target) => {
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
    }) || null
  );
}

function updateTargets(index: number, values: ElDropdownValue[]) {
  const current = assignments.value[index];
  if (!current) return;

  const customTargets = current.targets.filter((target) => target.kind === "custom");
  const selectedTargets = values
    .map((value) => targetFromSelection(String(value), current))
    .filter((target): target is ColorPaletteTarget => Boolean(target));

  updateAssignment(index, {
    targets: [...selectedTargets, ...customTargets],
  });
}

function customTargets(assignment: MaterialAssignment) {
  return assignment.targets.filter((target) => target.kind === "custom");
}

function missingTargets(assignment: MaterialAssignment) {
  const missingValues = new Set(missingTargetOptions(assignment).map((option) => option.value));
  return assignment.targets.filter((target) => {
    return target.kind !== "custom" && missingValues.has(targetOptionValue(target));
  });
}

function addCustomTarget(index: number) {
  const current = assignments.value[index];
  if (!current) return;

  const id = assignmentId(current, index);
  const value = (customTargetDrafts[id] || "").trim();
  if (!value) return;

  const exists = current.targets.some((target) => {
    return target.kind === "custom" && target.value.trim().toLowerCase() === value.toLowerCase();
  });

  if (!exists) {
    updateAssignment(index, {
      targets: [...current.targets, { kind: "custom", value }],
    });
  }

  customTargetDrafts[id] = "";
}

function removeTarget(index: number, targetToRemove: ColorPaletteTarget) {
  const current = assignments.value[index];
  if (!current) return;

  const identity = targetOptionValue(targetToRemove) || `custom:${targetToRemove.value}`;
  updateAssignment(index, {
    targets: current.targets.filter((target) => {
      const targetIdentity = targetOptionValue(target) || `custom:${target.value}`;
      return targetIdentity !== identity;
    }),
  });
}

function optionLabel(axis: string, option: ModuleFieldOption) {
  const path =
    axis === "material"
      ? `modules.texture.fields.material.options.${option.value}`
      : `modules.texture.fields.materialAssignments.${axis}.options.${option.value}`;

  return translate(path, humanize(option.value));
}

function optionItems(axis: string, options: ModuleFieldOption[]) {
  return options.map((option) => ({
    ...option,
    label: optionLabel(axis, option),
    group: option.category || "",
    groupLabel: option.categoryLabel || option.category || "",
  }));
}

const presetItems = computed(() =>
  (props.field.options || []).map((option) => ({
    ...option,
    label: translate(
      `modules.texture.presets.${option.value}.label`,
      humanize(option.value),
    ),
    description: translate(
      `modules.texture.presets.${option.value}.description`,
      "",
    ),
    group: option.category || "",
    groupLabel: option.categoryLabel || option.category || "",
  })),
);

function materialTags(assignment: MaterialAssignment) {
  return materialOptions.value.find((option) => option.value === assignment.material)?.tags || [];
}

function hasTagMatch(first: string[] = [], second: string[] = []) {
  return first.some((tag) => second.includes(tag));
}

function optionWarning(assignment: MaterialAssignment, option?: ModuleFieldOption) {
  if (!option?.compatibility?.discouragedTags?.length) return "";
  if (!hasTagMatch(materialTags(assignment), option.compatibility.discouragedTags)) return "";

  if (option.compatibility.warningKey) {
    return translate(
      option.compatibility.warningKey,
      translate(
        "modules.texture.fields.materialAssignments.warnings.unusualCombination",
        "This property is unusual for the selected material, but it is kept as an intentional creative choice.",
      ),
    );
  }

  return translate(
    "modules.texture.fields.materialAssignments.warnings.unusualCombination",
    "This property is unusual for the selected material, but it is kept as an intentional creative choice.",
  );
}

function assignmentWarnings(assignment: MaterialAssignment) {
  const candidates = [
    finishOptions.value.find((option) => option.value === assignment.finish),
    surfaceTextureOptions.value.find((option) => option.value === assignment.surfaceTexture),
    opticalCharacterOptions.value.find((option) => option.value === assignment.opticalCharacter),
    ...(assignment.conditions || []).map((value) =>
      conditionOptions.value.find((option) => option.value === value),
    ),
  ];

  return Array.from(
    new Set(
      candidates
        .map((option) => optionWarning(assignment, option))
        .filter(Boolean),
    ),
  );
}

function assignmentSummary(assignment: MaterialAssignment) {
  const material = assignment.material
    ? optionLabel("material", { value: assignment.material })
    : translate("modules.texture.fields.materialAssignments.summary.noMaterial", "No material");
  const targetCount = assignment.targets.length;

  return `${material} · ${targetCount} ${targetCount === 1 ? "target" : "targets"}`;
}
</script>

<template>
  <el-grid :cols="1" :gap="16" class="w100">
    <el-grid
      v-for="(assignment, assignmentIndex) in assignments"
      :key="assignmentId(assignment, assignmentIndex)"
      :radius="24"
      :br="2"
      :bc="isExpanded(assignment, assignmentIndex) ? 'blue45' : 'normal10'"
      :p="12"
      :gap="12"
      class="w100 material-assignment"
    >
      <el-flex
        rules="rbc"
        :gap="8"
        class="crp w100"
        role="button"
        tabindex="0"
        @click="toggleExpanded(assignment, assignmentIndex)"
        @keydown.enter.prevent="toggleExpanded(assignment, assignmentIndex)"
        @keydown.space.prevent="toggleExpanded(assignment, assignmentIndex)"
      >
        <el-flex rules="ccs" :gap="1" class="minw0">
          <el-text :size="14" :weight="400" icon="texture">
            {{
              translate(
                "modules.texture.fields.materialAssignments.assignmentTitle",
                "Material Assignment {index}",
              ).replace("{index}", String(assignmentIndex + 1))
            }}
          </el-text>
          <el-text :size="9" color="normal45">
            {{ assignmentSummary(assignment) }}
          </el-text>
        </el-flex>

        <el-flex rules="rcc" :gap="6">
          <el-icon
            :icon="isExpanded(assignment, assignmentIndex) ? 'expand_less' : 'expand_more'"
            :size="14"
          />
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="delete"
            :label="translate('modules.texture.fields.materialAssignments.actions.remove', 'Remove')"
            :size="14"
            :p="8"
            @click.stop="removeAssignment(assignmentIndex)"
          />
        </el-flex>
      </el-flex>

      <el-grid
        v-show="isExpanded(assignment, assignmentIndex)"
        :gap="12"
        class="w100"
      >
        <el-flex rules="ccs" :gap="5" class="w100">
          <el-text :size="10" color="normal50">
            {{ translate("modules.texture.fields.materialAssignments.preset.label", "Material Preset") }}
          </el-text>
          <el-dropdown
            :model-value="assignment.presetId || ''"
            :items="presetItems"
            item-label="label"
            item-value="value"
            item-description="description"
            item-group="group"
            item-group-label="groupLabel"
            :placeholder="t('panel.none')"
            clearable
            @update:model-value="applyPreset(assignmentIndex, $event)"
          />
        </el-flex>

        <el-flex rules="ccs" :gap="5" class="w100">
          <el-text :size="10" color="normal50">
            {{ translate("modules.texture.fields.materialAssignments.targets.label", "Apply To") }}
          </el-text>
          <el-multi-select
            :model-value="targetSelectValues(assignment)"
            :items="targetItems(assignment)"
            item-label="label"
            item-value="value"
            item-description="description"
            item-group="group"
            item-group-label="groupLabel"
            item-disabled="disabled"
            :exclusive-values="['builtin:all_surfaces']"
            :placeholder="translate('modules.texture.fields.materialAssignments.targets.placeholder', 'Select material targets')"
            @update:model-value="updateTargets(assignmentIndex, $event)"
          />
        </el-flex>

        <el-grid :cols="mobile ? 1 : 2" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("modules.texture.fields.materialAssignments.material.label", "Material") }}
            </el-text>
            <el-dropdown
              :model-value="assignment.material || ''"
              :items="optionItems('material', materialOptions)"
              item-label="label"
              item-value="value"
              item-group="group"
              item-group-label="groupLabel"
              :placeholder="t('panel.none')"
              clearable
              @update:model-value="updateProperty(assignmentIndex, 'material', $event)"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("modules.texture.fields.materialAssignments.finish.label", "Finish") }}
            </el-text>
            <el-dropdown
              :model-value="assignment.finish || ''"
              :items="optionItems('finish', finishOptions)"
              item-label="label"
              item-value="value"
              :placeholder="t('panel.none')"
              clearable
              @update:model-value="updateProperty(assignmentIndex, 'finish', $event)"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("modules.texture.fields.materialAssignments.surfaceTexture.label", "Surface Texture") }}
            </el-text>
            <el-dropdown
              :model-value="assignment.surfaceTexture || ''"
              :items="optionItems('surfaceTexture', surfaceTextureOptions)"
              item-label="label"
              item-value="value"
              :placeholder="t('panel.none')"
              clearable
              @update:model-value="updateProperty(assignmentIndex, 'surfaceTexture', $event)"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("modules.texture.fields.materialAssignments.opticalCharacter.label", "Optical Character") }}
            </el-text>
            <el-dropdown
              :model-value="assignment.opticalCharacter || ''"
              :items="optionItems('opticalCharacter', opticalCharacterOptions)"
              item-label="label"
              item-value="value"
              :placeholder="t('panel.none')"
              clearable
              @update:model-value="updateProperty(assignmentIndex, 'opticalCharacter', $event)"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("modules.texture.fields.materialAssignments.textureProminence.label", "Texture Prominence") }}
            </el-text>
            <el-dropdown
              :model-value="assignment.textureProminence || ''"
              :items="optionItems('textureProminence', textureProminenceOptions)"
              item-label="label"
              item-value="value"
              :placeholder="t('panel.none')"
              clearable
              @update:model-value="updateProperty(assignmentIndex, 'textureProminence', $event)"
            />
          </el-flex>
        </el-grid>

        <el-flex rules="ccs" :gap="5" class="w100">
          <el-text :size="10" color="normal50">
            {{ translate("modules.texture.fields.materialAssignments.conditions.label", "Condition / Imperfections") }}
          </el-text>
          <el-multi-select
            :model-value="assignment.conditions || []"
            :items="optionItems('conditions', conditionOptions)"
            item-label="label"
            item-value="value"
            :exclusive-values="['clean']"
            :placeholder="translate('modules.texture.fields.materialAssignments.conditions.placeholder', 'Select surface conditions')"
            @update:model-value="updateConditions(assignmentIndex, $event)"
          />
        </el-flex>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="10" color="normal50">
            {{ translate("modules.texture.fields.materialAssignments.targets.customLabel", "Custom Targets") }}
          </el-text>
          <el-flex :rules="mobile ? 'ccs' : 'rbc'" :gap="8" class="w100">
            <el-text-field
              v-model="customTargetDrafts[assignmentId(assignment, assignmentIndex)]"
              type="text"
              support-variables
              :placeholder="translate('modules.texture.fields.materialAssignments.targets.customPlaceholder', 'Example: dragon costume scales')"
              class="fg100"
            />
            <el-button
              :label="translate('modules.texture.fields.materialAssignments.targets.addCustom', 'Add custom target')"
              icon="add"
              color="blue"
              :size="12"
              :p="[8, 12]"
              @click="addCustomTarget(assignmentIndex)"
            />
          </el-flex>

          <el-flex v-if="customTargets(assignment).length" rules="rsc" class="fw w100" :gap="4">
            <el-flex
              v-for="target in customTargets(assignment)"
              :key="`custom:${target.value}`"
              rules="rcc"
              :gap="4"
              :p="[4, 8]"
              :radius="50"
              bg="normal5"
            >
              <el-text :size="10">{{ target.value }}</el-text>
              <el-button
                type="fab"
                mode="flat"
                color="red"
                icon="close"
                :size="10"
                :p="4"
                :label="translate('modules.texture.fields.materialAssignments.actions.remove', 'Remove')"
                @click="removeTarget(assignmentIndex, target)"
              />
            </el-flex>
          </el-flex>
        </el-flex>

        <el-flex
          v-if="missingTargets(assignment).length"
          rules="ccs"
          :gap="4"
          class="w100"
        >
          <el-text :size="10" color="orange" icon="warning" icon-color="orange">
            {{ translate("modules.texture.fields.materialAssignments.targets.missingHelp", "Some referenced targets no longer exist. They remain preserved until you remove them.") }}
          </el-text>
          <el-flex rules="rsc" class="fw w100" :gap="4">
            <el-flex
              v-for="target in missingTargets(assignment)"
              :key="targetOptionValue(target)"
              rules="rcc"
              :gap="4"
              :p="[4, 8]"
              :radius="50"
              bg="orange5"
            >
              <el-text :size="10" color="orange">
                {{ target.label || target.token || target.value }}
              </el-text>
              <el-button
                type="fab"
                mode="flat"
                color="red"
                icon="close"
                :size="10"
                :p="4"
                :label="translate('modules.texture.fields.materialAssignments.actions.remove', 'Remove')"
                @click="removeTarget(assignmentIndex, target)"
              />
            </el-flex>
          </el-flex>
        </el-flex>

        <el-text
          v-for="warning in assignmentWarnings(assignment)"
          :key="warning"
          :size="10"
          color="orange"
          icon="warning"
          icon-color="orange"
        >
          {{ warning }}
        </el-text>
      </el-grid>
    </el-grid>

    <el-button
      :label="translate('modules.texture.fields.materialAssignments.actions.add', 'Add Material / Texture')"
      icon="add"
      color="blue"
      :size="14"
      :p="[8, 12]"
      class="w100"
      @click="addAssignment"
    />
  </el-grid>
</template>

<style scoped>
.material-assignment {
  width: 100%;
  align-self: stretch;
}
</style>
