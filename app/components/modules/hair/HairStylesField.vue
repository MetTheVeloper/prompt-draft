<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  HairComponent,
  HairComponentType,
  HairPropertyState,
  HairReferenceRef,
  HairStyle,
  SemanticTargetRef,
} from "~/modules/hair.types";
import {
  hairBasePropertyIds,
  hairComponentStarterMap,
  hairComponentStarters,
  hairComponentTypeMap,
  hairComponentTypes,
  hairPresetRecipes,
  hairPropertyDefinitions,
} from "~/modules/hair.catalog";
import { normalizeHairStyles } from "~/utils/compileHair";
import {
  createUniqueHairEntityKey,
  getHairStyleVariableToken,
  normalizeHairEntityKey,
} from "~/utils/hairVariables";
import { semanticScopeSummary } from "~/utils/semanticTargets";
import { useSubjectAssignmentTargets } from "~/composables/prompt/useSubjectAssignmentTargets";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import HairComponentCard from "./HairComponentCard.vue";

const { mobile } = useScreen();
const targetCatalog = useSubjectAssignmentTargets();
const {
  enabledPromptVariables,
  enabledSystemPromptVariables,
} = usePromptVariables();

const props = withDefaults(
  defineProps<{ modelValue?: HairStyle[] }>(),
  { modelValue: () => [] },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: HairStyle[]): void;
}>();

const collapsedStyleIds = ref<string[]>([]);
const pendingComponentChoices = reactive<Record<string, string[]>>({});

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function humanize(value: string) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUiStyle(value: HairStyle, index: number): HairStyle {
  const normalized = normalizeHairStyles([value])[0];
  if (normalized) return normalized;

  return {
    id: value?.id || `hair-style-${index + 1}`,
    key: normalizeHairEntityKey(
      value?.key || value?.name || `style${index + 1}`,
      `style${index + 1}`,
    ),
    name: value?.name || "",
    presetId: value?.presetId,
    targets: Array.isArray(value?.targets) ? cloneValue(value.targets) : [],
    source: value?.source || { mode: "defined" },
    properties: value?.properties ? cloneValue(value.properties) : {},
    components: Array.isArray(value?.components) ? cloneValue(value.components) : [],
    additionalDetails: value?.additionalDetails || "",
  };
}

const styles = computed(() =>
  (Array.isArray(props.modelValue) ? props.modelValue : []).map(normalizeUiStyle),
);

watch(
  [() => props.modelValue, targetCatalog.availableOptions],
  () => {
    const source = Array.isArray(props.modelValue) ? props.modelValue : [];
    const normalized = normalizeHairStyles(source).map((style) => ({
      ...style,
      targets: targetCatalog.upgradeTargets(style.targets),
    }));

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", normalized);
    }
  },
  { immediate: true, deep: true },
);

function setStyles(next: HairStyle[]) {
  emit("update:modelValue", cloneValue(next));
}

function defaultTargets(): SemanticTargetRef[] {
  const first = targetCatalog.availableOptions.value[0]?.target;
  return first ? [{ ...first }] : [];
}

function createEmptyStyle(): HairStyle {
  const index = styles.value.length + 1;
  return {
    id: createId("hair-style"),
    key: createUniqueHairEntityKey(
      `style${index}`,
      styles.value.map((style) => style.key),
      "style",
    ),
    name: `Hairstyle ${index}`,
    targets: defaultTargets(),
    source: { mode: "defined" },
    properties: {},
    components: [],
    additionalDetails: "",
  };
}

function addStyle() {
  const style = createEmptyStyle();
  setStyles([...styles.value, style]);
  collapsedStyleIds.value = collapsedStyleIds.value.filter(
    (id) => id !== style.id,
  );
}

function removeStyle(index: number) {
  const style = styles.value[index];
  if (style) {
    collapsedStyleIds.value = collapsedStyleIds.value.filter(
      (id) => id !== style.id,
    );
    delete pendingComponentChoices[style.id];
  }
  setStyles(styles.value.filter((_, itemIndex) => itemIndex !== index));
}

function duplicateStyle(index: number) {
  const source = styles.value[index];
  if (!source) return;

  const duplicate: HairStyle = {
    ...cloneValue(source),
    id: createId("hair-style"),
    key: createUniqueHairEntityKey(
      `${source.key}Copy`,
      styles.value.map((style) => style.key),
      "style",
    ),
    name: `${source.name || "Hairstyle"} Copy`,
    presetId: undefined,
    components: source.components.map((component) => ({
      ...cloneValue(component),
      id: createId("hair-component"),
    })),
  };

  setStyles([...styles.value, duplicate]);
}

function updateStyle(
  index: number,
  patch: Partial<HairStyle>,
  detachPreset = false,
) {
  setStyles(
    styles.value.map((style, itemIndex) => {
      if (itemIndex !== index) return style;
      return {
        ...cloneValue(style),
        ...cloneValue(patch),
        ...(detachPreset ? { presetId: undefined } : {}),
      };
    }),
  );
}

function updateStyleKey(index: number, value: unknown) {
  const style = styles.value[index];
  if (!style) return;
  const key = createUniqueHairEntityKey(
    String(value ?? ""),
    styles.value
      .filter((_, itemIndex) => itemIndex !== index)
      .map((candidate) => candidate.key),
    style.key || `style${index + 1}`,
  );
  updateStyle(index, { key });
}

function isExpanded(style: HairStyle) {
  return !collapsedStyleIds.value.includes(style.id);
}

function toggleExpanded(style: HairStyle) {
  collapsedStyleIds.value = isExpanded(style)
    ? [...collapsedStyleIds.value, style.id]
    : collapsedStyleIds.value.filter((id) => id !== style.id);
}

function targetItems(style: HairStyle) {
  return targetCatalog.itemsFor(style.targets);
}

function targetValues(style: HairStyle) {
  return targetCatalog.valuesFor(style.targets);
}

function updateTargets(index: number, values: ElDropdownValue[]) {
  const style = styles.value[index];
  if (!style) return;
  updateStyle(index, {
    targets: targetCatalog.resolveSelections(values, style.targets),
  });
}

function styleTitle(style: HairStyle, index: number) {
  return style.name?.trim() || `Hairstyle ${index + 1}`;
}

function styleSummary(style: HairStyle) {
  const scope = semanticScopeSummary(style.targets);
  const count = style.components.length;
  return `${scope} · ${count} ${count === 1 ? "component" : "components"}`;
}

function variableReference(variable: {
  id: string;
  key: string;
  label?: string;
  source?: string;
}): HairReferenceRef {
  return {
    variableId: variable.id,
    token: `{${variable.key}}`,
    label: variable.label || variable.key,
    source: variable.source === "user" ? "user" : "system",
  };
}

const referenceItems = computed(() => {
  const variables = [
    ...enabledSystemPromptVariables.value.filter(
      (variable) => variable.key === "reference" || variable.type === "reference",
    ),
    ...enabledPromptVariables.value.filter(
      (variable) => variable.type === "reference",
    ),
  ];

  const items: Array<{
    value: string;
    label: string;
    description: string;
    reference: HairReferenceRef;
  }> = variables.map((variable) => ({
    value: variable.id,
    label: `{${variable.key}}`,
    description: variable.label || variable.value,
    reference: variableReference(variable),
  }));

  if (!items.some((item) => item.reference.token === "{reference}")) {
    items.unshift({
      value: "system-reference",
      label: "{reference}",
      description: "Main attached reference image",
      reference: {
        token: "{reference}",
        label: "Reference",
        source: "system",
      },
    });
  }

  return items;
});

function selectedReferenceValue(style: HairStyle) {
  if (style.source.mode !== "reference") return "";
  const token = style.source.reference.token;
  return (
    referenceItems.value.find((item) => item.reference.token === token)?.value ||
    "system-reference"
  );
}

const sourceModeItems = [
  { value: "defined", label: "Defined Hairstyle" },
  { value: "reference", label: "From Reference" },
];

function changeSourceMode(index: number, value: ElDropdownValue) {
  const style = styles.value[index];
  if (!style) return;

  if (String(value ?? "defined") !== "reference") {
    updateStyle(index, { source: { mode: "defined" } });
    return;
  }

  updateStyle(index, {
    source: {
      mode: "reference",
      reference: cloneValue(
        referenceItems.value[0]?.reference || {
          token: "{reference}",
          label: "Reference",
          source: "system" as const,
        },
      ),
    },
  });
}

function changeReference(index: number, value: ElDropdownValue) {
  const style = styles.value[index];
  if (!style || style.source.mode !== "reference") return;
  const selected = referenceItems.value.find(
    (item) => item.value === String(value ?? ""),
  );
  if (!selected) return;
  updateStyle(index, {
    source: {
      ...style.source,
      reference: cloneValue(selected.reference),
    },
  });
}

function updateReferenceHint(index: number, value: unknown) {
  const style = styles.value[index];
  if (!style || style.source.mode !== "reference") return;
  updateStyle(index, {
    source: {
      ...style.source,
      hairHint: String(value ?? ""),
    },
  });
}

function basePropertyState(style: HairStyle, propertyId: string): HairPropertyState {
  return style.properties[propertyId] || { mode: "inherit" };
}

function updateBaseProperty(
  styleIndex: number,
  propertyId: string,
  state: HairPropertyState,
) {
  const style = styles.value[styleIndex];
  if (!style) return;
  updateStyle(
    styleIndex,
    {
      properties: {
        ...cloneValue(style.properties),
        [propertyId]: cloneValue(state),
      },
    },
    true,
  );
}

function inheritLabel(style: HairStyle) {
  return style.source.mode === "reference"
    ? "From referenced hairstyle"
    : "As defined by hairstyle";
}

function basePropertySelection(style: HairStyle, propertyId: string) {
  const state = basePropertyState(style, propertyId);
  if (state.mode === "inherit") return "__inherit";
  if (state.mode === "reference") return "__reference";
  if (state.mode === "absent") return "__absent";
  if (state.mode === "custom") return "__custom";
  return state.value ? `option:${state.value}` : "__inherit";
}

function basePropertyItems(style: HairStyle, propertyId: string) {
  const definition = hairPropertyDefinitions[propertyId];
  const items: Array<{ value: string; label: string }> = [
    { value: "__inherit", label: inheritLabel(style) },
    ...(definition?.options || []).map((item) => ({
      value: `option:${item.value}`,
      label: humanize(item.value),
    })),
  ];
  if (definition?.allowReference) {
    items.push({ value: "__reference", label: "From reference" });
  }
  if (definition?.allowAbsent) {
    items.push({ value: "__absent", label: "Explicitly absent" });
  }
  if (definition?.allowCustom) {
    items.push({ value: "__custom", label: "Custom" });
  }
  return items;
}

function updateBasePropertySelection(
  styleIndex: number,
  propertyId: string,
  value: ElDropdownValue,
) {
  const selected = String(value ?? "__inherit");
  if (selected === "__reference") {
    updateBaseProperty(styleIndex, propertyId, { mode: "reference" });
  } else if (selected === "__absent") {
    updateBaseProperty(styleIndex, propertyId, { mode: "absent" });
  } else if (selected === "__custom") {
    updateBaseProperty(styleIndex, propertyId, { mode: "custom", value: "" });
  } else if (selected.startsWith("option:")) {
    updateBaseProperty(styleIndex, propertyId, {
      mode: "option",
      value: selected.slice("option:".length),
    });
  } else {
    updateBaseProperty(styleIndex, propertyId, { mode: "inherit" });
  }
}

function customBasePropertyValue(style: HairStyle, propertyId: string) {
  const state = basePropertyState(style, propertyId);
  return state.mode === "custom" ? state.value : "";
}

const componentPickerItems = computed(() => [
  ...hairComponentTypes
    .filter((item) => item.value !== "custom")
    .map((item) => ({
      value: `type:${item.value}`,
      label: item.label,
      description: "Hair component",
      group: "components",
      groupLabel: "Components",
    })),
  ...hairComponentStarters.map((starter) => ({
    value: `starter:${starter.id}`,
    label: starter.label,
    description: "Starter configuration",
    group: "starters",
    groupLabel: "Starters",
  })),
  {
    value: "custom",
    label: "Custom Hair Component",
    description: "Define a custom structural hair element",
    group: "custom",
    groupLabel: "Custom",
  },
]);

function createComponentFromChoice(
  choice: string,
  existingKeys: Set<string>,
): HairComponent | null {
  if (choice === "custom") {
    const key = createUniqueHairEntityKey(
      "customComponent",
      existingKeys,
      "component",
    );
    existingKeys.add(key);
    return {
      id: createId("hair-component"),
      key,
      name: "Custom Hair Component",
      type: "custom",
      customType: "",
      properties: {},
      additionalDetails: "",
    };
  }

  if (choice.startsWith("starter:")) {
    const starter = hairComponentStarterMap.get(
      choice.slice("starter:".length),
    );
    if (!starter) return null;
    const definition = hairComponentTypeMap.get(starter.type);
    const key = createUniqueHairEntityKey(
      starter.type || starter.label,
      existingKeys,
      "component",
    );
    existingKeys.add(key);
    return {
      id: createId("hair-component"),
      key,
      name: starter.label,
      type: starter.type,
      properties: cloneValue(starter.properties || {}),
      additionalDetails: "",
    };
  }

  if (choice.startsWith("type:")) {
    const raw = choice.slice("type:".length) as HairComponentType;
    const definition = hairComponentTypeMap.get(raw);
    if (!definition) return null;
    const key = createUniqueHairEntityKey(raw, existingKeys, "component");
    existingKeys.add(key);
    return {
      id: createId("hair-component"),
      key,
      name: definition.label,
      type: raw,
      properties: {},
      additionalDetails: "",
    };
  }

  return null;
}

function updatePendingComponents(styleId: string, values: ElDropdownValue[]) {
  pendingComponentChoices[styleId] = values
    .map((value) => String(value ?? ""))
    .filter(Boolean);
}

function addSelectedComponents(styleIndex: number) {
  const style = styles.value[styleIndex];
  if (!style) return;
  const choices = pendingComponentChoices[style.id] || [];
  if (!choices.length) return;

  const existingKeys = new Set(style.components.map((component) => component.key));
  const components = choices
    .map((choice) => createComponentFromChoice(choice, existingKeys))
    .filter((component): component is HairComponent => Boolean(component));

  if (components.length) {
    updateStyle(
      styleIndex,
      { components: [...style.components, ...components] },
      true,
    );
  }
  pendingComponentChoices[style.id] = [];
}

function updateComponent(
  styleIndex: number,
  componentIndex: number,
  component: HairComponent,
) {
  const style = styles.value[styleIndex];
  if (!style) return;
  const key = createUniqueHairEntityKey(
    component.key || component.name || component.type,
    style.components
      .filter((_, index) => index !== componentIndex)
      .map((candidate) => candidate.key),
    `component${componentIndex + 1}`,
  );

  updateStyle(
    styleIndex,
    {
      components: style.components.map((current, index) =>
        index === componentIndex
          ? { ...cloneValue(component), key }
          : current,
      ),
    },
    true,
  );
}

function removeComponent(styleIndex: number, componentIndex: number) {
  const style = styles.value[styleIndex];
  if (!style) return;
  updateStyle(
    styleIndex,
    {
      components: style.components.filter((_, index) => index !== componentIndex),
    },
    true,
  );
}

function duplicateComponent(styleIndex: number, componentIndex: number) {
  const style = styles.value[styleIndex];
  const component = style?.components[componentIndex];
  if (!style || !component) return;

  const duplicate: HairComponent = {
    ...cloneValue(component),
    id: createId("hair-component"),
    key: createUniqueHairEntityKey(
      component.key,
      style.components.map((candidate) => candidate.key),
      "component",
    ),
    name: `${component.name || humanize(component.type)} Copy`,
  };

  updateStyle(
    styleIndex,
    { components: [...style.components, duplicate] },
    true,
  );
}

const presetItems = computed(() =>
  hairPresetRecipes.map((preset) => ({
    value: preset.id,
    label: preset.label,
    description: preset.categoryLabel,
    group: preset.category,
    groupLabel: preset.categoryLabel,
  })),
);

function applyPreset(index: number, value: ElDropdownValue) {
  const style = styles.value[index];
  if (!style) return;
  const presetId = String(value ?? "");
  if (!presetId) {
    updateStyle(index, { presetId: undefined });
    return;
  }

  const recipe = hairPresetRecipes.find((preset) => preset.id === presetId);
  if (!recipe) return;

  const usedComponentKeys = new Set<string>();
  const components: HairComponent[] = (recipe.components || []).map(
    (recipeComponent, componentIndex) => {
      const definition = hairComponentTypeMap.get(recipeComponent.type);
      const key = createUniqueHairEntityKey(
        recipeComponent.key || recipeComponent.type,
        usedComponentKeys,
        `component${componentIndex + 1}`,
      );
      usedComponentKeys.add(key);
      return {
        id: createId("hair-component"),
        key,
        name:
          recipeComponent.name ||
          definition?.label ||
          humanize(recipeComponent.customType || recipeComponent.type),
        type: recipeComponent.type,
        customType: recipeComponent.customType,
        properties: cloneValue(recipeComponent.properties || {}),
        additionalDetails: recipeComponent.additionalDetails || "",
      };
    },
  );

  const hasDefaultName = /^Hairstyle \d+$/i.test(style.name?.trim() || "");
  const nextName = hasDefaultName
    ? recipe.name || recipe.label
    : style.name?.trim() || recipe.name || recipe.label;
  const nextKey = hasDefaultName
    ? createUniqueHairEntityKey(
        nextName,
        styles.value
          .filter((_, styleIndex) => styleIndex !== index)
          .map((candidate) => candidate.key),
        style.key,
      )
    : style.key;

  updateStyle(index, {
    presetId: recipe.id,
    name: nextName,
    key: nextKey,
    properties: cloneValue(recipe.properties || {}),
    components,
    additionalDetails:
      recipe.additionalDetails || style.additionalDetails || "",
  });
}
</script>

<template>
  <el-grid :gap="14" class="w100">
    <el-grid
      v-for="(style, styleIndex) in styles"
      :key="style.id"
      :radius="20"
      :br="2"
      :bc="isExpanded(style) ? 'blue45' : 'normal10'"
      :p="12"
      :gap="12"
      class="w100"
    >
      <el-flex
        rules="rbc"
        class="w100 crp"
        :gap="8"
        role="button"
        tabindex="0"
        @click="toggleExpanded(style)"
        @keydown.enter.prevent="toggleExpanded(style)"
      >
        <el-flex rules="ccs" :gap="1" class="minw0">
          <el-text :size="15" :weight="600" icon="face_retouching_natural">{{ styleTitle(style, styleIndex) }}</el-text>
          <el-text :size="9" color="normal45">{{ getHairStyleVariableToken(style) }} · {{ styleSummary(style) }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="4">
          <el-button type="fab" mode="flat" icon="content_copy" label="Duplicate hairstyle" :size="12" :p="7" @click.stop="duplicateStyle(styleIndex)" />
          <el-button type="fab" mode="flat" color="red" icon="delete" label="Remove hairstyle" :size="12" :p="7" @click.stop="removeStyle(styleIndex)" />
          <el-icon :icon="isExpanded(style) ? 'expand_less' : 'expand_more'" :size="14" />
        </el-flex>
      </el-flex>

      <el-grid v-if="isExpanded(style)" :gap="12" class="w100">
        <el-grid :cols="mobile ? 1 : 3" :gap="10">
          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Hairstyle name</el-text>
            <el-text-field
              :model-value="style.name"
              type="text"
              placeholder="Hairstyle name"
              @update:model-value="updateStyle(styleIndex, { name: String($event ?? '') })"
            />
          </el-grid>

          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Semantic key</el-text>
            <el-text-field
              :model-value="style.key"
              type="text"
              placeholder="curlyUpdo"
              @update:model-value="updateStyleKey(styleIndex, $event)"
            />
            <el-text :size="8" color="normal40">lowerCamelCase · auto-unique</el-text>
          </el-grid>

          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Starter preset</el-text>
            <el-dropdown
              :model-value="style.presetId || ''"
              :items="presetItems"
              item-label="label"
              item-value="value"
              item-description="description"
              item-group="group"
              item-group-label="groupLabel"
              clearable
              placeholder="No preset"
              @update:model-value="applyPreset(styleIndex, $event)"
            />
          </el-grid>
        </el-grid>

        <el-grid :cols="mobile ? 1 : 2" :gap="10">
          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Whose hair is this?</el-text>
            <el-multi-select
              :model-value="targetValues(style)"
              :items="targetItems(style)"
              item-label="label"
              item-value="value"
              item-description="description"
              item-group="group"
              item-group-label="groupLabel"
              placeholder="Select subject targets"
              @update:model-value="updateTargets(styleIndex, $event)"
            />
          </el-grid>

          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Baseline source</el-text>
            <el-dropdown
              :model-value="style.source.mode"
              :items="sourceModeItems"
              item-label="label"
              item-value="value"
              @update:model-value="changeSourceMode(styleIndex, $event)"
            />
          </el-grid>

          <template v-if="style.source.mode === 'reference'">
            <el-grid :gap="4">
              <el-text :size="10" :weight="500">Reference</el-text>
              <el-dropdown
                :model-value="selectedReferenceValue(style)"
                :items="referenceItems"
                item-label="label"
                item-value="value"
                item-description="description"
                @update:model-value="changeReference(styleIndex, $event)"
              />
            </el-grid>

            <el-grid :gap="4">
              <el-text :size="10" :weight="500">Reference hair hint</el-text>
              <el-text-field
                :model-value="style.source.hairHint || ''"
                type="text"
                placeholder="e.g. the hairstyle of the person on the left"
                @update:model-value="updateReferenceHint(styleIndex, $event)"
              />
            </el-grid>
          </template>
        </el-grid>

        <el-divider mode="dashed" />

        <el-flex rules="ccs" :gap="2">
          <el-text :size="12" :weight="600" icon="tune">Base Hair Structure</el-text>
          <el-text :size="9" color="normal45">Color and material are intentionally assigned from their own modules.</el-text>
        </el-flex>

        <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
          <el-grid
            v-for="propertyId in hairBasePropertyIds"
            :key="propertyId"
            :gap="5"
            :p="10"
            :radius="12"
            bc="normal5"
            :br="1"
          >
            <el-flex rules="rbc" class="w100">
              <el-text :size="11" :weight="500">{{ hairPropertyDefinitions[propertyId]?.label || humanize(propertyId) }}</el-text>
              <el-text :size="8" color="normal40">{{ hairPropertyDefinitions[propertyId]?.nature || '' }}</el-text>
            </el-flex>

            <el-dropdown
              :model-value="basePropertySelection(style, propertyId)"
              :items="basePropertyItems(style, propertyId)"
              item-label="label"
              item-value="value"
              @update:model-value="updateBasePropertySelection(styleIndex, propertyId, $event)"
            />

            <el-text-field
              v-if="basePropertyState(style, propertyId).mode === 'custom'"
              :model-value="customBasePropertyValue(style, propertyId)"
              type="text"
              :placeholder="`Custom ${(hairPropertyDefinitions[propertyId]?.label || propertyId).toLowerCase()}...`"
              @update:model-value="updateBaseProperty(styleIndex, propertyId, { mode: 'custom', value: String($event ?? '') })"
            />
          </el-grid>
        </el-grid>

        <el-grid :p="10" :radius="14" :br="1" bc="normal10" :gap="8">
          <el-flex rules="rbc" class="w100" :gap="8">
            <el-flex rules="ccs" :gap="1">
              <el-text :size="12" :weight="600" icon="add_circle">Add hairstyle components</el-text>
              <el-text :size="9" color="normal45">Add bangs, braids, buns, ponytails, hair accessories, or custom elements.</el-text>
            </el-flex>
            <el-button
              icon="add"
              color="prim"
              label="Add selected"
              :disable="!(pendingComponentChoices[style.id] || []).length"
              :size="12"
              :p="[8, 12]"
              @click="addSelectedComponents(styleIndex)"
            />
          </el-flex>

          <el-multi-select
            :model-value="pendingComponentChoices[style.id] || []"
            :items="componentPickerItems"
            item-label="label"
            item-value="value"
            item-description="description"
            item-group="group"
            item-group-label="groupLabel"
            placeholder="Select hairstyle components..."
            @update:model-value="updatePendingComponents(style.id, $event)"
          />
        </el-grid>

        <el-grid v-if="style.components.length" :gap="8" class="w100">
          <HairComponentCard
            v-for="(component, componentIndex) in style.components"
            :key="component.id"
            :component="component"
            :style-key="style.key"
            @update:component="updateComponent(styleIndex, componentIndex, $event)"
            @remove="removeComponent(styleIndex, componentIndex)"
            @duplicate="duplicateComponent(styleIndex, componentIndex)"
          />
        </el-grid>

        <el-flex v-else rules="ccs" :p="12" :radius="12" :br="1" bc="normal10">
          <el-text :size="11" color="normal45" icon="info">No extra hairstyle components. Base hair structure can stand on its own.</el-text>
        </el-flex>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Additional hairstyle details</el-text>
          <el-text-field
            :model-value="style.additionalDetails || ''"
            type="textarea"
            :rows="2"
            placeholder="Optional structural or styling instructions..."
            support-variables
            @update:model-value="updateStyle(styleIndex, { additionalDetails: String($event ?? '') }, true)"
          />
        </el-grid>
      </el-grid>
    </el-grid>

    <el-flex rules="ccc" :gap="8" :p="16" :radius="16" :br="1" bc="normal10">
      <el-button
        icon="add"
        color="prim"
        label="Add Hairstyle"
        :size="13"
        :p="[9, 14]"
        @click="addStyle"
      />
      <el-text :size="9" color="normal45">Create separate hairstyles for different subjects or alternate looks.</el-text>
    </el-flex>
  </el-grid>
</template>
