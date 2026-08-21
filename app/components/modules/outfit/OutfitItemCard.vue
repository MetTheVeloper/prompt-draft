<script setup lang="ts">
import { computed, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  OutfitItem,
  OutfitItemCategory,
  OutfitPropertyBinding,
  OutfitPropertyState,
  PromptReferenceRef,
} from "~/modules/outfit.types";
import {
  getOutfitPropertyBindings,
  getOutfitPropertyOptions,
  outfitItemTypeMap,
  outfitItemTypes,
  outfitPropertyDefinitions,
  outfitPropertyProfiles,
} from "~/modules/outfit.catalog";
import { getOutfitItemVariableToken } from "~/utils/outfitVariables";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const { t } = useI18n();
const { mobile } = useScreen();
const {
  enabledPromptVariables,
  enabledSystemPromptVariables,
} = usePromptVariables();

const props = defineProps<{
  item: OutfitItem;
}>();

const emit = defineEmits<{
  (event: "update:item", value: OutfitItem): void;
  (event: "remove"): void;
  (event: "duplicate"): void;
}>();

const expanded = ref(true);

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

function translate(path: string, fallback: string) {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function updateItem(patch: Partial<OutfitItem>) {
  emit("update:item", {
    ...cloneValue(props.item),
    ...cloneValue(patch),
  });
}

const typeDefinition = computed(() => outfitItemTypeMap.get(props.item.type));
const typeLabel = computed(() => {
  if (props.item.type === "custom") {
    return props.item.customType?.trim() || "Custom Wearable";
  }
  return typeDefinition.value?.label || humanize(props.item.type);
});

const itemTitle = computed(() => props.item.name?.trim() || typeLabel.value);
const itemToken = computed(() => getOutfitItemVariableToken(props.item));

const categoryLabels: Record<OutfitItemCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  one_piece: "One-Piece",
  outerwear: "Outerwear",
  legwear: "Legwear",
  footwear: "Footwear",
  headwear: "Headwear",
  neckwear: "Neckwear",
  handwear: "Handwear",
  waistwear: "Waistwear",
  jewelry: "Jewelry",
  eyewear: "Eyewear",
  wearable_accessories: "Wearable Accessories",
  specialty: "Specialty Garments",
  protective_costume: "Protective / Costume",
  custom: "Custom",
};

const typeItems = computed(() => [
  ...outfitItemTypes.map((item) => ({
    value: item.value,
    label: item.label,
    group: item.category,
    groupLabel: categoryLabels[item.category],
  })),
  {
    value: "custom",
    label: "Custom Wearable",
    group: "custom",
    groupLabel: "Custom",
  },
]);

const customCategoryItems = computed(() =>
  (Object.keys(categoryLabels) as OutfitItemCategory[])
    .filter((category) => category !== "custom")
    .map((category) => ({
      value: category,
      label: categoryLabels[category],
    })),
);

const customProfileMap: Partial<Record<OutfitItemCategory, string>> = {
  tops: "top_basic",
  bottoms: "bottom_trouser",
  one_piece: "dress",
  outerwear: "outerwear",
  legwear: "legwear",
  footwear: "footwear",
  headwear: "accessory",
  neckwear: "accessory",
  handwear: "accessory",
  waistwear: "accessory",
  jewelry: "accessory",
  eyewear: "accessory",
  wearable_accessories: "accessory",
  specialty: "dress",
  protective_costume: "accessory",
};

const propertyBindings = computed<OutfitPropertyBinding[]>(() => {
  if (typeDefinition.value) {
    return getOutfitPropertyBindings(typeDefinition.value);
  }

  const profileId = customProfileMap[props.item.customCategory || "custom"];
  return profileId ? outfitPropertyProfiles[profileId]?.properties || [] : [];
});

const sourceModeItems = computed(() => [
  {
    value: "defined",
    label: translate("modules.outfit.designer.source.defined", "Defined Item"),
    description: translate(
      "modules.outfit.designer.source.definedDescription",
      "Use the normal semantic definition of this wearable item.",
    ),
  },
  {
    value: "reference",
    label: translate("modules.outfit.designer.source.reference", "From Reference"),
    description: translate(
      "modules.outfit.designer.source.referenceDescription",
      "Use a matching wearable item from a reference as the baseline.",
    ),
  },
]);

function variableReference(variable: { id: string; key: string; label?: string; source?: string }): PromptReferenceRef {
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
    ...enabledPromptVariables.value.filter((variable) => variable.type === "reference"),
  ];

  const items = variables.map((variable) => ({
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
      } as PromptReferenceRef,
    });
  }

  return items;
});

const selectedReferenceValue = computed(() => {
  if (props.item.source.mode !== "reference") return "";
  const token = props.item.source.reference.token;
  return (
    referenceItems.value.find((item) => item.reference.token === token)?.value ||
    "system-reference"
  );
});

function changeType(value: ElDropdownValue) {
  const type = String(value ?? "custom") || "custom";
  const definition = outfitItemTypeMap.get(type);

  updateItem({
    type,
    name: definition?.label || (type === "custom" ? props.item.name : humanize(type)),
    customType: type === "custom" ? props.item.customType || "" : undefined,
    customCategory:
      type === "custom" ? props.item.customCategory || "custom" : undefined,
    properties: {},
  });
}

function changeSourceMode(value: ElDropdownValue) {
  const mode = String(value ?? "defined");
  if (mode !== "reference") {
    updateItem({ source: { mode: "defined" } });
    return;
  }

  const firstReference = referenceItems.value[0]?.reference || {
    token: "{reference}",
    label: "Reference",
    source: "system" as const,
  };

  updateItem({
    source: {
      mode: "reference",
      reference: cloneValue(firstReference),
    },
  });
}

function changeReference(value: ElDropdownValue) {
  if (props.item.source.mode !== "reference") return;
  const selected = referenceItems.value.find(
    (item) => item.value === String(value ?? ""),
  );
  if (!selected) return;

  updateItem({
    source: {
      ...props.item.source,
      reference: cloneValue(selected.reference),
    },
  });
}

function updateReferenceHint(value: unknown) {
  if (props.item.source.mode !== "reference") return;
  updateItem({
    source: {
      ...props.item.source,
      itemHint: String(value ?? ""),
    },
  });
}

function propertyState(propertyId: string): OutfitPropertyState {
  return props.item.properties[propertyId] || { mode: "inherit" };
}

function updateProperty(propertyId: string, state: OutfitPropertyState) {
  updateItem({
    properties: {
      ...cloneValue(props.item.properties),
      [propertyId]: cloneValue(state),
    },
  });
}

function inheritLabel() {
  return props.item.source.mode === "reference"
    ? `From referenced ${typeLabel.value}`
    : `As defined by ${typeLabel.value}`;
}

function optionLabel(value: string, promptText?: string) {
  return humanize(value || promptText || "");
}

function singleSelection(binding: OutfitPropertyBinding) {
  const state = propertyState(binding.propertyId);
  if (state.mode === "inherit") return "__inherit";
  if (state.mode === "reference") return "__reference";
  if (state.mode === "absent") return "__absent";
  if (state.mode === "custom") return "__custom";
  const value = Array.isArray(state.value) ? state.value[0] : state.value;
  return value ? `option:${value}` : "__inherit";
}

function singleItems(binding: OutfitPropertyBinding) {
  const definition = outfitPropertyDefinitions[binding.propertyId];
  const options = getOutfitPropertyOptions(binding.propertyId, binding.optionSet);
  const items = [
    {
      value: "__inherit",
      label: inheritLabel(),
      marker: "blue5",
    },
    ...options.map((option) => ({
      value: `option:${option.value}`,
      label: optionLabel(option.value, option.promptText),
    })),
  ];

  if (definition?.allowReference) {
    items.push({
      value: "__reference",
      label: "From reference",
    });
  }

  if (definition?.allowAbsent) {
    items.push({
      value: "__absent",
      label: "Explicitly absent",
    });
  }

  if (definition?.allowCustom) {
    items.push({
      value: "__custom",
      label: "Custom",
    });
  }

  return items;
}

function updateSingle(binding: OutfitPropertyBinding, value: ElDropdownValue) {
  const selected = String(value ?? "__inherit");
  if (selected === "__reference") {
    updateProperty(binding.propertyId, { mode: "reference" });
  } else if (selected === "__absent") {
    updateProperty(binding.propertyId, { mode: "absent" });
  } else if (selected === "__custom") {
    updateProperty(binding.propertyId, { mode: "custom", value: "" });
  } else if (selected.startsWith("option:")) {
    updateProperty(binding.propertyId, {
      mode: "option",
      value: selected.slice("option:".length),
    });
  } else {
    updateProperty(binding.propertyId, { mode: "inherit" });
  }
}

function multiMode(binding: OutfitPropertyBinding) {
  const state = propertyState(binding.propertyId);
  if (state.mode === "option") return "explicit";
  return state.mode;
}

function multiModeItems(binding: OutfitPropertyBinding) {
  const definition = outfitPropertyDefinitions[binding.propertyId];
  const items = [
    { value: "inherit", label: inheritLabel() },
    { value: "explicit", label: "Choose values" },
  ];
  if (definition?.allowReference) items.push({ value: "reference", label: "From reference" });
  if (definition?.allowAbsent) items.push({ value: "absent", label: "Explicitly absent" });
  if (definition?.allowCustom) items.push({ value: "custom", label: "Custom" });
  return items;
}

function updateMultiMode(binding: OutfitPropertyBinding, value: ElDropdownValue) {
  const mode = String(value ?? "inherit");
  if (mode === "explicit") {
    updateProperty(binding.propertyId, { mode: "option", value: [] });
  } else if (mode === "reference") {
    updateProperty(binding.propertyId, { mode: "reference" });
  } else if (mode === "absent") {
    updateProperty(binding.propertyId, { mode: "absent" });
  } else if (mode === "custom") {
    updateProperty(binding.propertyId, { mode: "custom", value: "" });
  } else {
    updateProperty(binding.propertyId, { mode: "inherit" });
  }
}

function multiValues(propertyId: string) {
  const state = propertyState(propertyId);
  if (state.mode !== "option") return [];
  return Array.isArray(state.value) ? state.value : state.value ? [state.value] : [];
}

function updateMultiValues(binding: OutfitPropertyBinding, values: ElDropdownValue[]) {
  updateProperty(binding.propertyId, {
    mode: "option",
    value: values.map((value) => String(value ?? "")).filter(Boolean),
  });
}

function multiOptionItems(binding: OutfitPropertyBinding) {
  return getOutfitPropertyOptions(binding.propertyId, binding.optionSet).map((option) => ({
    ...option,
    label: optionLabel(option.value, option.promptText),
  }));
}

function updateCustomProperty(propertyId: string, value: unknown) {
  updateProperty(propertyId, { mode: "custom", value: String(value ?? "") });
}

function customPropertyValue(propertyId: string) {
  const state = propertyState(propertyId);
  return state.mode === "custom" ? state.value : "";
}

function propertyLabel(propertyId: string) {
  return outfitPropertyDefinitions[propertyId]?.label || humanize(propertyId);
}
</script>

<template>
  <el-grid
    :br="1"
    :bc="expanded ? 'blue35' : 'normal10'"
    :radius="16"
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
      @click="expanded = !expanded"
      @keydown.enter.prevent="expanded = !expanded"
    >
      <el-flex rules="ccs" :gap="1" class="minw0">
        <el-text :size="14" :weight="600" icon="checkroom">
          {{ itemTitle }}
        </el-text>
        <el-text :size="9" color="normal45">
          {{ itemToken }} · {{ item.source.mode === 'reference' ? 'Reference baseline' : 'Defined baseline' }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="4">
        <el-button
          type="fab"
          mode="flat"
          icon="content_copy"
          label="Duplicate item"
          :size="12"
          :p="7"
          @click.stop="emit('duplicate')"
        />
        <el-button
          type="fab"
          mode="flat"
          color="red"
          icon="delete"
          label="Remove item"
          :size="12"
          :p="7"
          @click.stop="emit('remove')"
        />
        <el-icon :icon="expanded ? 'expand_less' : 'expand_more'" :size="14" />
      </el-flex>
    </el-flex>

    <el-grid v-if="expanded" :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <el-grid :gap="4">
        <el-text :size="10" :weight="500">Item name</el-text>
        <el-text-field
          :model-value="item.name"
          type="text"
          placeholder="Display name"
          @update:model-value="updateItem({ name: String($event ?? '') })"
        />
      </el-grid>

      <el-grid :gap="4">
        <el-text :size="10" :weight="500">Wearable type</el-text>
        <el-dropdown
          :model-value="item.type"
          :items="typeItems"
          item-label="label"
          item-value="value"
          searchable
          @update:model-value="changeType"
        />
      </el-grid>

      <template v-if="item.type === 'custom'">
        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Custom wearable</el-text>
          <el-text-field
            :model-value="item.customType || ''"
            type="text"
            placeholder="Describe the wearable item..."
            @update:model-value="updateItem({ customType: String($event ?? '') })"
          />
        </el-grid>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Property family</el-text>
          <el-dropdown
            :model-value="item.customCategory || 'custom'"
            :items="customCategoryItems"
            item-label="label"
            item-value="value"
            @update:model-value="updateItem({ customCategory: String($event || 'custom') as OutfitItemCategory, properties: {} })"
          />
        </el-grid>
      </template>

      <el-grid :gap="4">
        <el-text :size="10" :weight="500">Baseline source</el-text>
        <el-dropdown
          :model-value="item.source.mode"
          :items="sourceModeItems"
          item-label="label"
          item-value="value"
          @update:model-value="changeSourceMode"
        />
      </el-grid>

      <template v-if="item.source.mode === 'reference'">
        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Reference</el-text>
          <el-dropdown
            :model-value="selectedReferenceValue"
            :items="referenceItems"
            item-label="label"
            item-value="value"
            @update:model-value="changeReference"
          />
        </el-grid>

        <el-grid :gap="4" :class="mobile ? '' : 'gc1-3'">
          <el-text :size="10" :weight="500">Reference item hint</el-text>
          <el-text-field
            :model-value="item.source.itemHint || ''"
            type="text"
            placeholder="e.g. the blouse worn by the person on the left"
            @update:model-value="updateReferenceHint"
          />
        </el-grid>
      </template>
    </el-grid>

    <el-divider v-if="expanded && propertyBindings.length" mode="dashed" />

    <el-grid v-if="expanded && propertyBindings.length" :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <el-grid
        v-for="binding in propertyBindings"
        :key="binding.propertyId"
        :gap="5"
        :p="10"
        :radius="12"
        bc="normal5"
        :br="1"
      >
        <el-flex rules="rbc" class="w100">
          <el-text :size="11" :weight="500">{{ propertyLabel(binding.propertyId) }}</el-text>
          <el-text :size="8" color="normal40">
            {{ outfitPropertyDefinitions[binding.propertyId]?.nature || '' }}
          </el-text>
        </el-flex>

        <template v-if="outfitPropertyDefinitions[binding.propertyId]?.control === 'multiSelect'">
          <el-dropdown
            :model-value="multiMode(binding)"
            :items="multiModeItems(binding)"
            item-label="label"
            item-value="value"
            @update:model-value="updateMultiMode(binding, $event)"
          />
          <el-multi-select
            v-if="propertyState(binding.propertyId).mode === 'option'"
            :model-value="multiValues(binding.propertyId)"
            :items="multiOptionItems(binding)"
            item-label="label"
            item-value="value"
            @update:model-value="updateMultiValues(binding, $event)"
          />
        </template>

        <el-dropdown
          v-else
          :model-value="singleSelection(binding)"
          :items="singleItems(binding)"
          item-label="label"
          item-value="value"
          @update:model-value="updateSingle(binding, $event)"
        />

        <el-text-field
          v-if="propertyState(binding.propertyId).mode === 'custom'"
          :model-value="customPropertyValue(binding.propertyId)"
          type="text"
          :placeholder="`Custom ${propertyLabel(binding.propertyId).toLowerCase()}...`"
          @update:model-value="updateCustomProperty(binding.propertyId, $event)"
        />
      </el-grid>
    </el-grid>

    <el-grid v-if="expanded" :gap="4">
      <el-text :size="10" :weight="500">Additional item details</el-text>
      <el-text-field
        :model-value="item.additionalDetails || ''"
        type="textarea"
        :rows="2"
        placeholder="Optional construction or wearing details..."
        support-variables
        @update:model-value="updateItem({ additionalDetails: String($event ?? '') })"
      />
    </el-grid>
  </el-grid>
</template>
