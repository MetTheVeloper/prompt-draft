<script setup lang="ts">
import { computed } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleField,
  ModuleFieldOption,
} from "../../../modules/types";

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: ColorAssignmentItem[];
  }>(),
  {
    modelValue: () => [],
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ColorAssignmentItem[]): void;
}>();

const colorAssignmentModeOptions: ColorAssignmentMode[] = [
  "preset",
  "custom",
];

const colorAssignmentUsageOptions: ColorAssignmentUsage[] = [
  "overall",
  "background",
  "subject",
  "outfit",
  "hair",
  "lighting",
  "accents",
];

type ColorAssignmentMode = "preset" | "custom";

type ColorAssignmentUsage =
  | "overall"
  | "background"
  | "subject"
  | "outfit"
  | "hair"
  | "lighting"
  | "accents";

type ColorAssignmentItem = {
  mode: ColorAssignmentMode;
  preset: string;
  colors: string[];
  usage: ColorAssignmentUsage;
};

type ColorAssignmentLayoutItem =
  | {
    type: "assignment";
    key: string;
    assignment: ColorAssignmentItem;
    assignmentIndex: number;
    weight: number;
  }
  | {
    type: "add";
    key: string;
    weight: number;
  };

const assignments = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const assignmentColumns = computed(() => {
  return getColorAssignmentColumns(mobile.value);
});

const collapsedAssignmentIndexes = ref<number[]>([]);

function isColorAssignmentExpanded(assignmentIndex: number) {
  return !collapsedAssignmentIndexes.value.includes(assignmentIndex);
}

function toggleColorAssignment(assignmentIndex: number) {
  if (collapsedAssignmentIndexes.value.includes(assignmentIndex)) {
    collapsedAssignmentIndexes.value = collapsedAssignmentIndexes.value.filter(
      (index) => index !== assignmentIndex
    );

    return;
  }

  collapsedAssignmentIndexes.value = [
    ...collapsedAssignmentIndexes.value,
    assignmentIndex,
  ];
}

function createColorAssignment(): ColorAssignmentItem {
  return {
    mode: "preset",
    preset: "",
    colors: [],
    usage: "overall",
  };
}

function setAssignments(nextAssignments: ColorAssignmentItem[]) {
  emit("update:modelValue", nextAssignments);
}

function addColorAssignment() {
  setAssignments([...assignments.value, createColorAssignment()]);
}

function removeColorAssignment(assignmentIndex: number) {
  setAssignments(
    assignments.value.filter((_, index) => index !== assignmentIndex)
  );
}

function updateColorAssignmentMode(
  assignmentIndex: number,
  value: ElDropdownValue,
) {
  const mode = String(value || "preset") as ColorAssignmentMode;

  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  nextAssignments[assignmentIndex] = {
    ...current,
    mode,
    preset: mode === "preset" ? current.preset : "",
    colors: mode === "custom" ? current.colors || [] : [],
  };

  setAssignments(nextAssignments);
}

function updateColorAssignmentUsage(
  assignmentIndex: number,
  value: ElDropdownValue,
) {
  const usage = String(value || "overall") as ColorAssignmentUsage;

  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  nextAssignments[assignmentIndex] = {
    ...current,
    usage,
  };

  setAssignments(nextAssignments);
}

function updateColorAssignmentPreset(
  assignmentIndex: number,
  value: ElDropdownValue,
) {
  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  nextAssignments[assignmentIndex] = {
    ...current,
    preset: String(value || ""),
  };

  setAssignments(nextAssignments);
}

function addColorAssignmentColor(assignmentIndex: number) {
  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  nextAssignments[assignmentIndex] = {
    ...current,
    colors: [...(current.colors || []), "#000000"],
  };

  setAssignments(nextAssignments);
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

function removeColorAssignmentColor(
  assignmentIndex: number,
  colorIndex: number
) {
  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  nextAssignments[assignmentIndex] = {
    ...current,
    colors: (current.colors || []).filter((_, index) => index !== colorIndex),
  };

  setAssignments(nextAssignments);
}

function updateColorAssignmentColorValue(
  assignmentIndex: number,
  colorIndex: number,
  value: string
) {
  const nextAssignments = [...assignments.value];
  const current = nextAssignments[assignmentIndex];

  if (!current) return;

  const colors = [...(current.colors || [])];

  colors[colorIndex] = value;

  nextAssignments[assignmentIndex] = {
    ...current,
    colors,
  };

  setAssignments(nextAssignments);
}

function updateColorAssignmentColor(
  assignmentIndex: number,
  colorIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement | null;

  updateColorAssignmentColorValue(
    assignmentIndex,
    colorIndex,
    target?.value || ""
  );
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

function colorPalettePresetLabel(option: ModuleFieldOption) {
  return option.value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getColorAssignmentWeight(assignment: ColorAssignmentItem) {
  if (assignment.mode === "custom") {
    const colorCount = Math.max(assignment.colors?.length || 0, 1);

    return 132 + colorCount * 44;
  }

  return 132;
}

function getColorAssignmentColumns(isMobile: boolean): ColorAssignmentLayoutItem[][] {
  const assignmentItems: ColorAssignmentLayoutItem[] = assignments.value.map(
    (assignment, assignmentIndex) => ({
      type: "assignment",
      key: `${props.field.id}-assignment-${assignmentIndex}`,
      assignment,
      assignmentIndex,
      weight: getColorAssignmentWeight(assignment),
    })
  );

  const items: ColorAssignmentLayoutItem[] = [
    ...assignmentItems,
    {
      type: "add",
      key: `${props.field.id}-add-assignment`,
      weight: 104,
    },
  ];

  if (isMobile) {
    return [items];
  }

  const columns: ColorAssignmentLayoutItem[][] = [[], []];
  const columnWeights = [0, 0];

  items.forEach((item) => {
    const targetColumn = columnWeights[0] <= columnWeights[1] ? 0 : 1;

    columns[targetColumn].push(item);
    columnWeights[targetColumn] += item.weight + 16;
  });

  return columns;
}
</script>

<template>
  <el-grid rules="csc" :gap="8" :cols="mobile ? 1 : 2" align-items="start">
    <el-flex v-for="(column, columnIndex) in assignmentColumns" :key="`${field.id}-assignment-column-${columnIndex}`"
      rules="csc" :gap="16" class="w100">
      <template v-for="item in column" :key="item.key">
        <el-grid v-if="item.type === 'assignment'" :radius="24" :br="2"
          :bc="isColorAssignmentExpanded(item.assignmentIndex) ? 'blue45' : 'normal10'"
          :p="12" :gap="12"
          class="module-field__assignment-card w100">
          <!-- header -->
          <el-flex rules="rbc" :gap="8" class="crp" role="button" tabindex="0"
            @click="toggleColorAssignment(item.assignmentIndex)"
            @keydown.enter.prevent="toggleColorAssignment(item.assignmentIndex)"
            @keydown.space.prevent="toggleColorAssignment(item.assignmentIndex)">
            <el-text :size="14" :weight="300" icon="color-swatch">
              {{ t("modules.colorPalette.fields.paletteAssignments.ruleTitle", {index: item.assignmentIndex + 1}) }}
            </el-text>

            <el-flex rules="rcc" :gap="6">
              <el-icon :icon="isColorAssignmentExpanded(item.assignmentIndex)
                  ? 'arrow-up-2'
                  : 'arrow-down-2'
                " :size="14" class="module-field__assignment-toggle-icon" />

              <el-button :label="t('modules.colorPalette.fields.paletteAssignments.actions.remove')" icon="trash" :p="8"
                @click.stop="removeColorAssignment(item.assignmentIndex)" mode="flat" color="red" type="fab"
                :size="14" />
            </el-flex>
          </el-flex>
          <!-- options -->
          <el-grid class="w100" v-show="isColorAssignmentExpanded(item.assignmentIndex)">
            <el-grid :cols="mobile ? 1 : 2" :gap="8">
              <el-dropdown
                :model-value="item.assignment.mode"
                :items="colorAssignmentModeOptions"
                :item-label="(mode) => t(`modules.colorPalette.fields.paletteAssignments.modes.${mode}`)"
                :item-value="(mode) => mode"
                @update:model-value="updateColorAssignmentMode(item.assignmentIndex, $event)"
              />
  
              <el-dropdown
                :model-value="item.assignment.usage"
                :items="colorAssignmentUsageOptions"
                :item-label="(usage) => t(`modules.colorPalette.fields.paletteAssignments.usages.${usage}`)"
                :item-value="(usage) => usage"
                @update:model-value="updateColorAssignmentUsage(item.assignmentIndex, $event)"
              />
            </el-grid>
  
            <div v-if="item.assignment.mode === 'preset'" class="module-field__assignment-body">
              <el-dropdown
                :model-value="item.assignment.preset || ''"
                :items="getColorPalettePresetDropdownOptions()"
                :item-label="(option) => colorPalettePresetLabel(option)"
                item-value="value"
                item-group="category"
                :item-group-label="(option) => option.categoryLabel || option.category || ''"
                :placeholder="t('panel.none')"
                clearable
                @update:model-value="updateColorAssignmentPreset(item.assignmentIndex, $event)"
              />
            </div>
  
            <el-flex v-else rules="csc" :gap="8" class="module-field__assignment-body">
              <el-flex v-for="(color, colorIndex) in item.assignment.colors"
                :key="`${field.id}-${item.assignmentIndex}-${colorIndex}`" rules="rbc" :gap="8"
                class="module-field__color-row">
                <input type="color" :value="color"
                  @input="updateColorAssignmentColor(item.assignmentIndex, colorIndex, $event)" />
  
                <el-text-field
                  :model-value="color"
                  type="text"
                  :placeholder="t('modules.colorPalette.fields.paletteAssignments.controls.color.placeholder')"
                  @update:model-value="
                    updateColorAssignmentColorValue(
                      item.assignmentIndex,
                      colorIndex,
                      $event
                    )
                  "
                />
  
                <el-button :label="t('modules.colorPalette.fields.paletteAssignments.actions.remove')" icon="trash" :p="8"
                  @click="removeColorAssignmentColor(item.assignmentIndex, colorIndex)" mode="flat" color="red" type="fab"
                  :size="14" />
              </el-flex>
  
              <el-button :label="t('modules.colorPalette.fields.paletteAssignments.actions.addColor')" mode="outline"
                color="blue" :size="14" :p="[8, 12]" class="w100"
                @click="addColorAssignmentColor(item.assignmentIndex)" />
            </el-flex>
          </el-grid>
        </el-grid>

        <el-flex v-else rules="ccc" :radius="24" :br="2" :p="12" :gap="12" bc="normal10" class="w100">
          <el-button :label="t('modules.colorPalette.fields.paletteAssignments.actions.addAssignment')" color="blue"
            :size="14" :p="[8, 12]" class="w100" @click="addColorAssignment" />
        </el-flex>
      </template>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.module-field__assignment-card {
  align-self: start;
}

.module-field__assignment-body {
  width: 100%;
}

.module-field__color-row {
  width: 100%;
}

.module-field__color-row input[type="color"] {
  width: 38px;
  min-width: 38px;
  height: 38px;
  padding: 3px;
  border-radius: 10px;
}

.module-field__color-input {
  min-width: 0;
  flex: 1;
}
</style>