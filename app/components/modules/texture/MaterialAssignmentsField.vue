<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  MaterialAssignment,
  ModuleField,
  ModuleFieldOption,
  SemanticTargetRef,
} from "../../../modules/types";
import type { SemanticBuiltinTargetDefinition } from "../../../utils/semanticTargets";
import { normalizeSemanticTargets } from "../../../utils/semanticTargets";
import { useSemanticTargetCatalog } from "~/composables/prompt/useSemanticTargetCatalog";
import AssignmentScopeEditor from "../shared/AssignmentScopeEditor.vue";

const { t } = useI18n();
const { mobile } = useScreen();

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

type MaterialPresetRecipe = Partial<MaterialAssignment> & {
  id: string;
  category?: string;
  categoryLabel?: string;
};

const collapsedAssignmentIds = ref<string[]>([]);

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

const builtinTargets = computed<SemanticBuiltinTargetDefinition[]>(() => [
  {
    value: "all_surfaces",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.all_surfaces",
      "All Scene Surfaces",
    ),
  },
  {
    value: "background",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.background",
      "Background Surface",
    ),
  },
  {
    value: "subject",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.subject",
      "Main Subject",
    ),
  },
  {
    value: "outfit",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.outfit",
      "Outfit",
    ),
    moduleKey: "outfit",
  },
  {
    value: "hair",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.hair",
      "Hair",
    ),
    moduleKey: "hair",
  },
  {
    value: "typography",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.typography",
      "Typography",
    ),
  },
  {
    value: "accents",
    label: translate(
      "modules.texture.fields.materialAssignments.targets.builtin.accents",
      "Accent Elements",
    ),
  },
]);

const semanticCatalog = useSemanticTargetCatalog(
  "material",
  () => builtinTargets.value,
);

function normalizeAssignment(
  value: unknown,
  index: number,
): MaterialAssignment | null {
  if (!isRecord(value)) return null;

  const hasExplicitTargets = Array.isArray(value.targets);
  const targets = hasExplicitTargets
    ? normalizeSemanticTargets(value.targets)
    : [{ kind: "builtin", value: "all_surfaces" } as SemanticTargetRef];
  const exceptions = normalizeSemanticTargets(value.exceptions);

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
    targets,
    exceptions,
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
  collapsedAssignmentIds.value = collapsedAssignmentIds.value.includes(id)
    ? collapsedAssignmentIds.value.filter((item) => item !== id)
    : [...collapsedAssignmentIds.value, id];
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
    exceptions: [],
  };
}

function addAssignment() {
  setAssignments([...assignments.value, createAssignment()]);
}

function removeAssignment(index: number) {
  const current = assignments.value[index];
  if (current?.id) {
    collapsedAssignmentIds.value = collapsedAssignmentIds.value.filter(
      (id) => id !== current.id,
    );
  }
  setAssignments(assignments.value.filter((_, itemIndex) => itemIndex !== index));
}

function updateAssignment(
  index: number,
  patch: Partial<MaterialAssignment>,
  options: { detachPreset?: boolean } = {},
) {
  setAssignments(
    assignments.value.map((assignment, itemIndex) => {
      if (itemIndex !== index) return assignment;
      return {
        ...assignment,
        ...patch,
        ...(options.detachPreset ? { presetId: undefined } : {}),
      };
    }),
  );
}

function propertyValue(value: ElDropdownValue) {
  return String(value ?? "");
}

function updateProperty(
  index: number,
  key:
    | "material"
    | "finish"
    | "surfaceTexture"
    | "opticalCharacter"
    | "textureProminence",
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
    exceptions: current.exceptions || [],
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
  return (
    materialOptions.value.find((option) => option.value === assignment.material)
      ?.tags || []
  );
}

function hasTagMatch(first: string[] = [], second: string[] = []) {
  return first.some((tag) => second.includes(tag));
}

function optionWarning(
  assignment: MaterialAssignment,
  option?: ModuleFieldOption,
) {
  if (!option?.compatibility?.discouragedTags?.length) return "";
  if (!hasTagMatch(materialTags(assignment), option.compatibility.discouragedTags)) {
    return "";
  }

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
    surfaceTextureOptions.value.find(
      (option) => option.value === assignment.surfaceTexture,
    ),
    opticalCharacterOptions.value.find(
      (option) => option.value === assignment.opticalCharacter,
    ),
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

function assignmentTitle(assignment: MaterialAssignment) {
  return semanticCatalog.summarize(
    assignment.targets,
    assignment.exceptions || [],
  );
}

function assignmentSummary(assignment: MaterialAssignment) {
  const parts = [
    assignment.material
      ? optionLabel("material", { value: assignment.material })
      : "",
    assignment.finish
      ? optionLabel("finish", { value: assignment.finish })
      : "",
    assignment.surfaceTexture
      ? optionLabel("surfaceTexture", { value: assignment.surfaceTexture })
      : "",
  ].filter(Boolean);

  return parts.length
    ? parts.join(" · ")
    : translate(
        "modules.texture.fields.materialAssignments.summary.noMaterial",
        "No material properties",
      );
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
          <el-text :size="14" :weight="500" icon="texture">
            {{ assignmentTitle(assignment) }}
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

        <AssignmentScopeEditor
          :model-value="assignment.targets"
          :exceptions="assignment.exceptions || []"
          capability="material"
          :builtins="builtinTargets"
          exclusive-value="all_surfaces"
          @update:model-value="updateAssignment(assignmentIndex, { targets: $event })"
          @update:exceptions="updateAssignment(assignmentIndex, { exceptions: $event })"
        />

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
