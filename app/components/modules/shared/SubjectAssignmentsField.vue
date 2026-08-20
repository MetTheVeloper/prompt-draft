<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ExpressionAssignment,
  ModuleField,
  ModuleFieldOption,
  PoseAssignment,
  SemanticTargetRef,
} from "~/modules/types";
import {
  normalizeSemanticTargets,
  semanticScopeSummary,
  semanticTargetIdentity,
} from "~/utils/semanticTargets";
import { useSubjectAssignmentTargets } from "~/composables/prompt/useSubjectAssignmentTargets";

const { t } = useI18n();
const { mobile } = useScreen();

type AssignmentKind = "pose" | "expression";
type SubjectAssignment = PoseAssignment | ExpressionAssignment;
type EditableAssignment = SubjectAssignment & Record<string, unknown>;

type PresetRecipe = Record<string, unknown> & {
  id: string;
  category?: string;
  categoryLabel?: string;
};

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: SubjectAssignment[];
    kind: AssignmentKind;
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: SubjectAssignment[]): void;
}>();

const targetCatalog = useSubjectAssignmentTargets();
const collapsedAssignmentIds = ref<string[]>([]);

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createId() {
  return `${props.kind}-assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function configRecipes(): PresetRecipe[] {
  const recipes = props.field.config?.presetRecipes;
  if (!Array.isArray(recipes)) return [];

  return recipes.filter((item): item is PresetRecipe => {
    return isRecord(item) && typeof item.id === "string";
  });
}

const presetRecipes = computed(configRecipes);

const basePostureOptions = computed(() => configOptions("basePostureOptions"));
const torsoPostureOptions = computed(() => configOptions("torsoPostureOptions"));
const weightBalanceOptions = computed(() => configOptions("weightBalanceOptions"));
const bodyTensionOptions = computed(() => configOptions("bodyTensionOptions"));
const locomotionOptions = computed(() => configOptions("locomotionOptions"));
const gestureOptions = computed(() => configOptions("gestureOptions"));

const coreExpressionOptions = computed(() => configOptions("coreExpressionOptions"));
const intensityOptions = computed(() => configOptions("intensityOptions"));
const eyeStateOptions = computed(() => configOptions("eyeStateOptions"));
const browStateOptions = computed(() => configOptions("browStateOptions"));
const mouthStateOptions = computed(() => configOptions("mouthStateOptions"));

function normalizeAssignment(value: unknown, index: number): SubjectAssignment | null {
  if (!isRecord(value)) return null;

  const common = {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `${props.kind}-assignment-${index + 1}`,
    presetId: typeof value.presetId === "string" ? value.presetId : undefined,
    targets: normalizeSemanticTargets(value.targets),
    additionalDetails:
      typeof value.additionalDetails === "string" ? value.additionalDetails : "",
  };

  if (props.kind === "pose") {
    return {
      ...common,
      basePosture: typeof value.basePosture === "string" ? value.basePosture : "",
      torsoPosture: typeof value.torsoPosture === "string" ? value.torsoPosture : "",
      weightBalance: typeof value.weightBalance === "string" ? value.weightBalance : "",
      bodyTension: typeof value.bodyTension === "string" ? value.bodyTension : "",
      locomotion: typeof value.locomotion === "string" ? value.locomotion : "",
      gestures: Array.isArray(value.gestures)
        ? value.gestures.filter((item): item is string => typeof item === "string")
        : [],
      interactionDetails:
        typeof value.interactionDetails === "string" ? value.interactionDetails : "",
    } satisfies PoseAssignment;
  }

  return {
    ...common,
    coreExpression:
      typeof value.coreExpression === "string" ? value.coreExpression : "",
    intensity: typeof value.intensity === "string" ? value.intensity : "",
    eyeState: typeof value.eyeState === "string" ? value.eyeState : "",
    browState: typeof value.browState === "string" ? value.browState : "",
    mouthState: typeof value.mouthState === "string" ? value.mouthState : "",
  } satisfies ExpressionAssignment;
}

function normalizeAssignments(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeAssignment)
    .filter((item): item is SubjectAssignment => Boolean(item));
}

const assignments = computed(() => normalizeAssignments(props.modelValue));

watch(
  [() => props.modelValue, targetCatalog.availableOptions],
  () => {
    const source = Array.isArray(props.modelValue) ? props.modelValue : [];
    const normalized = normalizeAssignments(source).map((assignment) => ({
      ...assignment,
      targets: targetCatalog.upgradeTargets(assignment.targets),
    }));

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", normalized);
    }
  },
  { immediate: true, deep: true },
);

function setAssignments(next: SubjectAssignment[]) {
  emit("update:modelValue", cloneValue(next));
}

function assignmentId(assignment: SubjectAssignment, index: number) {
  return assignment.id || `${props.kind}-assignment-${index + 1}`;
}

function isExpanded(assignment: SubjectAssignment, index: number) {
  return !collapsedAssignmentIds.value.includes(assignmentId(assignment, index));
}

function toggleExpanded(assignment: SubjectAssignment, index: number) {
  const id = assignmentId(assignment, index);
  collapsedAssignmentIds.value = collapsedAssignmentIds.value.includes(id)
    ? collapsedAssignmentIds.value.filter((value) => value !== id)
    : [...collapsedAssignmentIds.value, id];
}

function defaultTargets(): SemanticTargetRef[] {
  const first = targetCatalog.availableOptions.value[0]?.target;
  return first ? [{ ...first }] : [];
}

function createAssignment(): SubjectAssignment {
  if (props.kind === "pose") {
    return {
      id: createId(),
      basePosture: "",
      torsoPosture: "",
      weightBalance: "",
      bodyTension: "",
      locomotion: "",
      gestures: [],
      interactionDetails: "",
      additionalDetails: "",
      targets: defaultTargets(),
    };
  }

  return {
    id: createId(),
    coreExpression: "",
    intensity: "",
    eyeState: "",
    browState: "",
    mouthState: "",
    additionalDetails: "",
    targets: defaultTargets(),
  };
}

function addAssignment() {
  setAssignments([...assignments.value, createAssignment()]);
}

function removeAssignment(index: number) {
  setAssignments(assignments.value.filter((_, itemIndex) => itemIndex !== index));
}

function updateAssignment(index: number, patch: Record<string, unknown>, detachPreset = false) {
  setAssignments(
    assignments.value.map((assignment, itemIndex) => {
      if (itemIndex !== index) return assignment;
      return {
        ...(assignment as EditableAssignment),
        ...patch,
        ...(detachPreset ? { presetId: undefined } : {}),
      } as SubjectAssignment;
    }),
  );
}

function updateString(index: number, key: string, value: ElDropdownValue) {
  updateAssignment(index, { [key]: String(value ?? "") }, true);
}

function updateMulti(index: number, key: string, values: ElDropdownValue[]) {
  updateAssignment(
    index,
    { [key]: values.map((value) => String(value ?? "")) },
    true,
  );
}

function updateTargets(index: number, values: ElDropdownValue[]) {
  const current = assignments.value[index];
  if (!current) return;
  updateAssignment(index, {
    targets: targetCatalog.resolveSelections(values, current.targets),
  });
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

  const { id: _id, category: _category, categoryLabel: _categoryLabel, ...payload } = recipe;
  updateAssignment(index, {
    ...payload,
    presetId,
    targets: current.targets,
  });
}

function optionLabel(axis: string, option: ModuleFieldOption) {
  return translate(
    `modules.${props.kind}.fields.assignments.${axis}.options.${option.value}`,
    humanize(option.value),
  );
}

function optionItems(axis: string, options: ModuleFieldOption[]) {
  return options.map((option) => ({
    ...option,
    label: optionLabel(axis, option),
  }));
}

const presetItems = computed(() =>
  (props.field.options || []).map((option) => ({
    ...option,
    label: translate(
      `modules.${props.kind}.presets.${option.value}.label`,
      humanize(option.value),
    ),
    description: translate(
      `modules.${props.kind}.presets.${option.value}.description`,
      "",
    ),
    group: option.category || "",
    groupLabel: option.categoryLabel || option.category || "",
  })),
);

function assignmentTitle(assignment: SubjectAssignment) {
  return semanticScopeSummary(assignment.targets);
}

function valueLabel(axis: string, value: unknown) {
  const text = typeof value === "string" ? value : "";
  return text ? optionLabel(axis, { value: text }) : "";
}

function assignmentSummary(assignment: SubjectAssignment) {
  if (props.kind === "pose") {
    const pose = assignment as PoseAssignment;
    return [
      valueLabel("basePosture", pose.basePosture),
      valueLabel("locomotion", pose.locomotion),
      ...(pose.gestures || []).slice(0, 1).map((value) => optionLabel("gestures", { value })),
    ].filter(Boolean).join(" · ") || translate("modules.pose.fields.assignments.summary.empty", "No pose properties");
  }

  const expression = assignment as ExpressionAssignment;
  return [
    valueLabel("coreExpression", expression.coreExpression),
    valueLabel("intensity", expression.intensity),
    valueLabel("mouthState", expression.mouthState),
  ].filter(Boolean).join(" · ") || translate("modules.expression.fields.assignments.summary.empty", "No expression properties");
}

function duplicateTargetLabels(index: number) {
  const current = assignments.value[index];
  if (!current) return [];

  const otherIdentities = new Set(
    assignments.value
      .filter((_, itemIndex) => itemIndex !== index)
      .flatMap((assignment) => assignment.targets)
      .map(semanticTargetIdentity)
      .filter(Boolean),
  );

  return current.targets
    .filter((target) => otherIdentities.has(semanticTargetIdentity(target)))
    .map((target) => target.token || target.label || target.value);
}

function targetItems(assignment: SubjectAssignment) {
  return targetCatalog.itemsFor(assignment.targets);
}

function targetValues(assignment: SubjectAssignment) {
  return targetCatalog.valuesFor(assignment.targets);
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
      class="w100"
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
          <el-text :size="14" :weight="500" :icon="kind === 'pose' ? 'manage_accounts' : 'sentiment_satisfied'">
            {{ assignmentTitle(assignment) }}
          </el-text>
          <el-text :size="9" color="normal45">
            {{ assignmentSummary(assignment) }}
          </el-text>
        </el-flex>

        <el-flex rules="rcc" :gap="6">
          <el-icon :icon="isExpanded(assignment, assignmentIndex) ? 'expand_less' : 'expand_more'" :size="14" />
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="delete"
            :label="translate(`modules.${kind}.fields.assignments.actions.remove`, 'Remove')"
            :size="14"
            :p="8"
            @click.stop="removeAssignment(assignmentIndex)"
          />
        </el-flex>
      </el-flex>

      <el-grid v-show="isExpanded(assignment, assignmentIndex)" :gap="12" class="w100">
        <el-flex rules="ccs" :gap="5" class="w100">
          <el-text :size="10" color="normal50">
            {{ translate(`modules.${kind}.fields.assignments.preset.label`, `${humanize(kind)} Preset`) }}
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
            {{ translate(`modules.${kind}.fields.assignments.targets.label`, 'Apply To') }}
          </el-text>
          <el-multi-select
            :model-value="targetValues(assignment)"
            :items="targetItems(assignment)"
            item-label="label"
            item-value="value"
            item-description="description"
            item-group="group"
            item-group-label="groupLabel"
            item-color="color"
            item-disabled="disabled"
            :placeholder="translate(`modules.${kind}.fields.assignments.targets.placeholder`, 'Select subject targets')"
            @update:model-value="updateTargets(assignmentIndex, $event)"
          />
        </el-flex>

        <el-text
          v-if="duplicateTargetLabels(assignmentIndex).length"
          :size="10"
          color="orange"
          icon="warning"
          icon-color="orange"
        >
          {{ translate(`modules.${kind}.fields.assignments.warnings.duplicateTarget`, 'One or more subjects are already targeted by another assignment and may receive conflicting instructions.') }}
          {{ duplicateTargetLabels(assignmentIndex).join(', ') }}
        </el-text>

        <template v-if="kind === 'pose'">
          <el-grid :cols="mobile ? 1 : 2" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.basePosture.label', 'Base Posture') }}</el-text>
              <el-dropdown :model-value="(assignment as PoseAssignment).basePosture || ''" :items="optionItems('basePosture', basePostureOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'basePosture', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.torsoPosture.label', 'Torso Posture') }}</el-text>
              <el-dropdown :model-value="(assignment as PoseAssignment).torsoPosture || ''" :items="optionItems('torsoPosture', torsoPostureOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'torsoPosture', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.weightBalance.label', 'Weight / Balance') }}</el-text>
              <el-dropdown :model-value="(assignment as PoseAssignment).weightBalance || ''" :items="optionItems('weightBalance', weightBalanceOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'weightBalance', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.bodyTension.label', 'Body Tension') }}</el-text>
              <el-dropdown :model-value="(assignment as PoseAssignment).bodyTension || ''" :items="optionItems('bodyTension', bodyTensionOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'bodyTension', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.locomotion.label', 'Locomotion') }}</el-text>
              <el-dropdown :model-value="(assignment as PoseAssignment).locomotion || ''" :items="optionItems('locomotion', locomotionOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'locomotion', $event)" />
            </el-flex>
          </el-grid>

          <el-flex rules="ccs" :gap="5">
            <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.gestures.label', 'Gestures') }}</el-text>
            <el-multi-select :model-value="(assignment as PoseAssignment).gestures || []" :items="optionItems('gestures', gestureOptions)" item-label="label" item-value="value" :placeholder="translate('modules.pose.fields.assignments.gestures.placeholder', 'Select gestures')" @update:model-value="updateMulti(assignmentIndex, 'gestures', $event)" />
          </el-flex>

          <el-flex rules="ccs" :gap="5">
            <el-text :size="10" color="normal50">{{ translate('modules.pose.fields.assignments.interactionDetails.label', 'Interaction / Action Details') }}</el-text>
            <el-text-field :model-value="(assignment as PoseAssignment).interactionDetails || ''" type="textarea" :rows="2" support-variables :placeholder="translate('modules.pose.fields.assignments.interactionDetails.placeholder', 'Example: holding {sword}, leaning against {car}')" @update:model-value="updateAssignment(assignmentIndex, { interactionDetails: String($event || '') }, true)" />
          </el-flex>
        </template>

        <template v-else>
          <el-grid :cols="mobile ? 1 : 2" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.expression.fields.assignments.coreExpression.label', 'Core Expression') }}</el-text>
              <el-dropdown :model-value="(assignment as ExpressionAssignment).coreExpression || ''" :items="optionItems('coreExpression', coreExpressionOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'coreExpression', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.expression.fields.assignments.intensity.label', 'Intensity') }}</el-text>
              <el-dropdown :model-value="(assignment as ExpressionAssignment).intensity || ''" :items="optionItems('intensity', intensityOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'intensity', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.expression.fields.assignments.eyeState.label', 'Eye State') }}</el-text>
              <el-dropdown :model-value="(assignment as ExpressionAssignment).eyeState || ''" :items="optionItems('eyeState', eyeStateOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'eyeState', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.expression.fields.assignments.browState.label', 'Brow State') }}</el-text>
              <el-dropdown :model-value="(assignment as ExpressionAssignment).browState || ''" :items="optionItems('browState', browStateOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'browState', $event)" />
            </el-flex>
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">{{ translate('modules.expression.fields.assignments.mouthState.label', 'Mouth State') }}</el-text>
              <el-dropdown :model-value="(assignment as ExpressionAssignment).mouthState || ''" :items="optionItems('mouthState', mouthStateOptions)" item-label="label" item-value="value" clearable :placeholder="t('panel.none')" @update:model-value="updateString(assignmentIndex, 'mouthState', $event)" />
            </el-flex>
          </el-grid>
        </template>

        <el-flex rules="ccs" :gap="5">
          <el-text :size="10" color="normal50">{{ translate(`modules.${kind}.fields.assignments.additionalDetails.label`, 'Additional Details') }}</el-text>
          <el-text-field :model-value="assignment.additionalDetails || ''" type="textarea" :rows="2" support-variables :placeholder="translate(`modules.${kind}.fields.assignments.additionalDetails.placeholder`, 'Add subject-specific details...')" @update:model-value="updateAssignment(assignmentIndex, { additionalDetails: String($event || '') }, true)" />
        </el-flex>
      </el-grid>
    </el-grid>

    <el-button
      color="blue"
      icon="add"
      :label="translate(`modules.${kind}.fields.assignments.actions.add`, `Add ${humanize(kind)} Assignment`)"
      :size="12"
      :p="[10, 14]"
      @click="addAssignment"
    />
  </el-grid>
</template>
