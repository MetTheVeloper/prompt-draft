<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  OutfitItem,
  OutfitPresetRecipe,
  OutfitSet,
  SemanticTargetRef,
} from "~/modules/outfit.types";
import {
  outfitItemStarterMap,
  outfitItemStarters,
  outfitItemTypeMap,
  outfitItemTypes,
  outfitPresetRecipes,
} from "~/modules/outfit.catalog";
import { normalizeOutfitSets } from "~/utils/compileOutfit";
import {
  getOutfitItemVariableToken,
  getOutfitSetVariableToken,
} from "~/utils/outfitVariables";
import { semanticScopeSummary } from "~/utils/semanticTargets";
import { useSubjectAssignmentTargets } from "~/composables/prompt/useSubjectAssignmentTargets";
import OutfitItemCard from "./OutfitItemCard.vue";

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    modelValue?: OutfitSet[];
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: OutfitSet[]): void;
}>();

const targetCatalog = useSubjectAssignmentTargets();
const collapsedSetIds = ref<string[]>([]);
const pendingItemChoices = reactive<Record<string, string[]>>({});

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

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUiSet(value: OutfitSet, index: number): OutfitSet {
  const normalized = normalizeOutfitSets([value])[0];
  if (normalized) return normalized;

  return {
    id: value?.id || `outfit-set-${index + 1}`,
    name: value?.name || "",
    presetId: value?.presetId,
    targets: Array.isArray(value?.targets) ? cloneValue(value.targets) : [],
    items: Array.isArray(value?.items) ? cloneValue(value.items) : [],
    relations: Array.isArray(value?.relations) ? cloneValue(value.relations) : [],
    additionalDetails: value?.additionalDetails || "",
  };
}

const sets = computed(() =>
  (Array.isArray(props.modelValue) ? props.modelValue : []).map(normalizeUiSet),
);

watch(
  [() => props.modelValue, targetCatalog.availableOptions],
  () => {
    const source = Array.isArray(props.modelValue) ? props.modelValue : [];
    const normalized = source.map(normalizeUiSet).map((set) => ({
      ...set,
      targets: targetCatalog.upgradeTargets(set.targets),
    }));

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", normalized);
    }
  },
  { immediate: true, deep: true },
);

function setSets(next: OutfitSet[]) {
  emit("update:modelValue", cloneValue(next));
}

function defaultTargets(): SemanticTargetRef[] {
  const first = targetCatalog.availableOptions.value[0]?.target;
  return first ? [{ ...first }] : [];
}

function createEmptySet(): OutfitSet {
  return {
    id: createId("outfit-set"),
    name: `Outfit Set ${sets.value.length + 1}`,
    targets: defaultTargets(),
    items: [],
    relations: [],
    additionalDetails: "",
  };
}

function addSet() {
  const set = createEmptySet();
  setSets([...sets.value, set]);
  collapsedSetIds.value = collapsedSetIds.value.filter((id) => id !== set.id);
}

function removeSet(index: number) {
  const set = sets.value[index];
  if (set) {
    collapsedSetIds.value = collapsedSetIds.value.filter((id) => id !== set.id);
    delete pendingItemChoices[set.id];
  }
  setSets(sets.value.filter((_, itemIndex) => itemIndex !== index));
}

function duplicateSet(index: number) {
  const source = sets.value[index];
  if (!source) return;

  const itemIdMap = new Map<string, string>();
  const items = source.items.map((item) => {
    const id = createId("outfit-item");
    itemIdMap.set(item.id, id);
    return { ...cloneValue(item), id };
  });

  const duplicate: OutfitSet = {
    ...cloneValue(source),
    id: createId("outfit-set"),
    name: `${source.name || "Outfit Set"} Copy`,
    presetId: undefined,
    items,
    relations: (source.relations || []).map((relation) => ({
      ...cloneValue(relation),
      id: createId("outfit-relation"),
      sourceItemId: itemIdMap.get(relation.sourceItemId) || relation.sourceItemId,
      targetItemId: itemIdMap.get(relation.targetItemId) || relation.targetItemId,
    })),
  };

  setSets([...sets.value, duplicate]);
}

function updateSet(
  index: number,
  patch: Partial<OutfitSet>,
  detachPreset = false,
) {
  setSets(
    sets.value.map((set, itemIndex) => {
      if (itemIndex !== index) return set;
      return {
        ...cloneValue(set),
        ...cloneValue(patch),
        ...(detachPreset ? { presetId: undefined } : {}),
      };
    }),
  );
}

function isExpanded(set: OutfitSet) {
  return !collapsedSetIds.value.includes(set.id);
}

function toggleExpanded(set: OutfitSet) {
  collapsedSetIds.value = isExpanded(set)
    ? [...collapsedSetIds.value, set.id]
    : collapsedSetIds.value.filter((id) => id !== set.id);
}

function targetItems(set: OutfitSet) {
  return targetCatalog.itemsFor(set.targets);
}

function targetValues(set: OutfitSet) {
  return targetCatalog.valuesFor(set.targets);
}

function updateTargets(index: number, values: ElDropdownValue[]) {
  const set = sets.value[index];
  if (!set) return;
  updateSet(index, {
    targets: targetCatalog.resolveSelections(values, set.targets),
  });
}

function setTitle(set: OutfitSet, index: number) {
  return set.name?.trim() || `Outfit Set ${index + 1}`;
}

function setSummary(set: OutfitSet) {
  const scope = semanticScopeSummary(set.targets);
  const count = set.items.length;
  return `${scope} · ${count} ${count === 1 ? "item" : "items"}`;
}

const categoryLabels: Record<string, string> = {
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

const itemPickerItems = computed(() => [
  ...outfitItemTypes.map((item) => ({
    value: `type:${item.value}`,
    label: item.label,
    description: "Wearable type",
    group: item.category,
    groupLabel: categoryLabels[item.category] || humanize(item.category),
  })),
  ...outfitItemStarters.map((starter) => ({
    value: `starter:${starter.id}`,
    label: starter.label,
    description: "Starter configuration",
    group: starter.category,
    groupLabel: `${categoryLabels[starter.category] || humanize(starter.category)} · Starters`,
  })),
  {
    value: "custom",
    label: "Custom Wearable",
    description: "Define a custom wearable item",
    group: "custom",
    groupLabel: "Custom",
  },
]);

function createItemFromChoice(choice: string): OutfitItem | null {
  if (choice === "custom") {
    return {
      id: createId("outfit-item"),
      name: "Custom Wearable",
      type: "custom",
      customType: "",
      customCategory: "custom",
      source: { mode: "defined" },
      properties: {},
      additionalDetails: "",
    };
  }

  if (choice.startsWith("starter:")) {
    const starter = outfitItemStarterMap.get(choice.slice("starter:".length));
    if (!starter) return null;
    const definition = outfitItemTypeMap.get(starter.item.type);
    return {
      id: createId("outfit-item"),
      name: starter.label,
      type: starter.item.type,
      customType: starter.item.customType,
      customCategory: starter.item.customCategory,
      source: { mode: "defined" },
      properties: cloneValue(starter.item.properties || {}),
      additionalDetails: "",
    };
  }

  if (choice.startsWith("type:")) {
    const type = choice.slice("type:".length);
    const definition = outfitItemTypeMap.get(type);
    if (!definition) return null;
    return {
      id: createId("outfit-item"),
      name: definition.label,
      type,
      source: { mode: "defined" },
      properties: {},
      additionalDetails: "",
    };
  }

  return null;
}

function addSelectedItems(index: number) {
  const set = sets.value[index];
  if (!set) return;
  const choices = pendingItemChoices[set.id] || [];
  if (!choices.length) return;

  const items = choices
    .map(createItemFromChoice)
    .filter((item): item is OutfitItem => Boolean(item));

  if (items.length) {
    updateSet(index, { items: [...set.items, ...items] }, true);
  }
  pendingItemChoices[set.id] = [];
}

function updatePendingItems(setId: string, values: ElDropdownValue[]) {
  pendingItemChoices[setId] = values
    .map((value) => String(value ?? ""))
    .filter(Boolean);
}

function updateItem(setIndex: number, itemIndex: number, item: OutfitItem) {
  const set = sets.value[setIndex];
  if (!set) return;
  updateSet(
    setIndex,
    {
      items: set.items.map((current, index) =>
        index === itemIndex ? cloneValue(item) : current,
      ),
    },
    true,
  );
}

function removeItem(setIndex: number, itemIndex: number) {
  const set = sets.value[setIndex];
  if (!set) return;
  const removed = set.items[itemIndex];
  updateSet(
    setIndex,
    {
      items: set.items.filter((_, index) => index !== itemIndex),
      relations: (set.relations || []).filter(
        (relation) =>
          relation.sourceItemId !== removed?.id &&
          relation.targetItemId !== removed?.id,
      ),
    },
    true,
  );
}

function duplicateItem(setIndex: number, itemIndex: number) {
  const set = sets.value[setIndex];
  const item = set?.items[itemIndex];
  if (!set || !item) return;
  const duplicate: OutfitItem = {
    ...cloneValue(item),
    id: createId("outfit-item"),
    name: `${item.name || humanize(item.type)} Copy`,
  };
  updateSet(setIndex, { items: [...set.items, duplicate] }, true);
}

const presetItems = computed(() =>
  outfitPresetRecipes.map((preset) => ({
    value: preset.id,
    label: preset.label,
    description: preset.category ? humanize(preset.category) : "",
    group: preset.category || "other",
    groupLabel: preset.category ? humanize(preset.category) : "Other",
  })),
);

function applyPreset(index: number, value: ElDropdownValue) {
  const set = sets.value[index];
  if (!set) return;

  const presetId = String(value ?? "");
  if (!presetId) {
    updateSet(index, { presetId: undefined });
    return;
  }

  const recipe = outfitPresetRecipes.find((preset) => preset.id === presetId);
  if (!recipe) return;

  const keyToId = new Map<string, string>();
  const items = recipe.items.map((recipeItem) => {
    const id = createId("outfit-item");
    keyToId.set(recipeItem.key, id);
    const definition = outfitItemTypeMap.get(recipeItem.type);

    return {
      id,
      name: definition?.label || humanize(recipeItem.customType || recipeItem.type),
      type: recipeItem.type,
      customType: recipeItem.customType,
      customCategory: recipeItem.customCategory,
      source: { mode: "defined" as const },
      properties: cloneValue(recipeItem.properties || {}),
      additionalDetails: recipeItem.additionalDetails || "",
    } satisfies OutfitItem;
  });

  const relations = (recipe.relations || []).map((relation) => ({
    id: createId("outfit-relation"),
    type: relation.type,
    sourceItemId: keyToId.get(relation.sourceKey) || relation.sourceKey,
    targetItemId: keyToId.get(relation.targetKey) || relation.targetKey,
    details: relation.details,
  }));

  updateSet(index, {
    presetId: recipe.id,
    name: set.name?.trim() || recipe.name || recipe.label,
    items,
    relations,
  });
}

function presetValue(set: OutfitSet) {
  return set.presetId || "";
}
</script>

<template>
  <el-grid :gap="14" class="w100">
    <el-grid
      v-for="(set, setIndex) in sets"
      :key="set.id"
      :radius="20"
      :br="2"
      :bc="isExpanded(set) ? 'blue45' : 'normal10'"
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
        @click="toggleExpanded(set)"
        @keydown.enter.prevent="toggleExpanded(set)"
      >
        <el-flex rules="ccs" :gap="1" class="minw0">
          <el-text :size="15" :weight="600" icon="styler">
            {{ setTitle(set, setIndex) }}
          </el-text>
          <el-text :size="9" color="normal45">
            {{ getOutfitSetVariableToken(set) }} · {{ setSummary(set) }}
          </el-text>
        </el-flex>

        <el-flex rules="rcc" :gap="4">
          <el-button
            type="fab"
            mode="flat"
            icon="content_copy"
            label="Duplicate set"
            :size="12"
            :p="7"
            @click.stop="duplicateSet(setIndex)"
          />
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="delete"
            label="Remove set"
            :size="12"
            :p="7"
            @click.stop="removeSet(setIndex)"
          />
          <el-icon :icon="isExpanded(set) ? 'expand_less' : 'expand_more'" :size="14" />
        </el-flex>
      </el-flex>

      <el-grid v-if="isExpanded(set)" :gap="12" class="w100">
        <el-grid :cols="mobile ? 1 : 2" :gap="10">
          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Set name</el-text>
            <el-text-field
              :model-value="set.name"
              type="text"
              placeholder="Outfit set name"
              @update:model-value="updateSet(setIndex, { name: String($event ?? '') })"
            />
          </el-grid>

          <el-grid :gap="4">
            <el-text :size="10" :weight="500">Starter preset</el-text>
            <el-dropdown
              :model-value="presetValue(set)"
              :items="presetItems"
              item-label="label"
              item-value="value"
              clearable
              placeholder="No preset"
              @update:model-value="applyPreset(setIndex, $event)"
            />
          </el-grid>
        </el-grid>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Who wears this set?</el-text>
          <el-multi-select
            :model-value="targetValues(set)"
            :items="targetItems(set)"
            item-label="label"
            item-value="value"
            :item-group="(option) => option.group"
            :item-group-label="(option) => option.groupLabel"
            placeholder="Select subject targets"
            @update:model-value="updateTargets(setIndex, $event)"
          />
        </el-grid>

        <el-grid :p="10" :radius="14" :br="1" bc="normal10" :gap="8">
          <el-flex rules="rbc" class="w100" :gap="8">
            <el-flex rules="ccs" :gap="1">
              <el-text :size="12" :weight="600" icon="add_circle">Add wearable items</el-text>
              <el-text :size="9" color="normal45">
                Choose canonical items, prepared starters, or a custom wearable.
              </el-text>
            </el-flex>
            <el-button
              icon="add"
              color="prim"
              label="Add selected"
              :disable="!(pendingItemChoices[set.id] || []).length"
              :size="12"
              :p="[8, 12]"
              @click="addSelectedItems(setIndex)"
            />
          </el-flex>

          <el-multi-select
            :model-value="pendingItemChoices[set.id] || []"
            :items="itemPickerItems"
            item-label="label"
            item-value="value"
            :item-group="(option) => option.group"
            :item-group-label="(option) => option.groupLabel"
            placeholder="Select clothes and wearable items..."
            searchable
            @update:model-value="updatePendingItems(set.id, $event)"
          />
        </el-grid>

        <el-grid v-if="set.items.length" :gap="8" class="w100">
          <OutfitItemCard
            v-for="(item, itemIndex) in set.items"
            :key="item.id"
            :item="item"
            @update:item="updateItem(setIndex, itemIndex, $event)"
            @remove="removeItem(setIndex, itemIndex)"
            @duplicate="duplicateItem(setIndex, itemIndex)"
          />
        </el-grid>

        <el-flex v-else rules="ccs" :p="12" :radius="12" :br="1" bc="orange15">
          <el-text :size="11" color="orange" icon="info" icon-color="orange">
            This set has no wearable items yet.
          </el-text>
        </el-flex>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Additional set details</el-text>
          <el-text-field
            :model-value="set.additionalDetails || ''"
            type="textarea"
            :rows="2"
            placeholder="Optional instructions for the whole outfit set..."
            support-variables
            @update:model-value="updateSet(setIndex, { additionalDetails: String($event ?? '') }, true)"
          />
        </el-grid>
      </el-grid>
    </el-grid>

    <el-flex rules="ccc" :gap="8" :p="16" :radius="16" :br="1" bc="normal10">
      <el-button
        icon="add"
        color="prim"
        label="Add Outfit Set"
        :size="13"
        :p="[9, 14]"
        @click="addSet"
      />
      <el-text :size="9" color="normal45">
        Create separate outfit sets for different subjects or alternate looks.
      </el-text>
    </el-flex>
  </el-grid>
</template>
