<script setup lang="ts">
import { computed, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  HairComponent,
  HairComponentType,
  HairPropertyState,
} from "~/modules/hair.types";
import {
  hairComponentTypeMap,
  hairComponentTypes,
  hairPropertyDefinitions,
} from "~/modules/hair.catalog";
import {
  getHairComponentVariableToken,
  normalizeHairEntityKey,
} from "~/utils/hairVariables";

const { mobile } = useScreen();

const props = defineProps<{
  component: HairComponent;
  styleKey: string;
}>();

const emit = defineEmits<{
  (event: "update:component", value: HairComponent): void;
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

function updateComponent(patch: Partial<HairComponent>) {
  emit("update:component", {
    ...cloneValue(props.component),
    ...cloneValue(patch),
  });
}

function updateComponentKey(value: unknown) {
  updateComponent({
    key: normalizeHairEntityKey(
      String(value ?? ""),
      props.component.key || props.component.type || "component",
    ),
  });
}

const typeDefinition = computed(() =>
  hairComponentTypeMap.get(props.component.type),
);
const typeLabel = computed(() => {
  if (props.component.type === "custom") {
    return props.component.customType?.trim() || "Custom Hair Component";
  }
  return typeDefinition.value?.label || humanize(props.component.type);
});
const componentTitle = computed(() =>
  props.component.name?.trim() || typeLabel.value,
);
const componentToken = computed(() =>
  getHairComponentVariableToken(props.styleKey, props.component),
);

const typeItems = computed(() =>
  hairComponentTypes.map((item) => ({
    value: item.value,
    label: item.label,
  })),
);

const propertyIds = computed(() => typeDefinition.value?.propertyIds || []);

function changeType(value: ElDropdownValue) {
  const raw = String(value ?? "custom") as HairComponentType;
  const type = hairComponentTypeMap.has(raw) ? raw : "custom";
  const definition = hairComponentTypeMap.get(type);
  updateComponent({
    type,
    name: definition?.label || "Custom Hair Component",
    customType: type === "custom" ? props.component.customType || "" : undefined,
    properties: {},
  });
}

function propertyState(propertyId: string): HairPropertyState {
  return props.component.properties[propertyId] || { mode: "inherit" };
}

function updateProperty(propertyId: string, state: HairPropertyState) {
  updateComponent({
    properties: {
      ...cloneValue(props.component.properties),
      [propertyId]: cloneValue(state),
    },
  });
}

function propertySelection(propertyId: string) {
  const state = propertyState(propertyId);
  if (state.mode === "inherit") return "__inherit";
  if (state.mode === "reference") return "__reference";
  if (state.mode === "absent") return "__absent";
  if (state.mode === "custom") return "__custom";
  return state.value ? `option:${state.value}` : "__inherit";
}

function propertyItems(propertyId: string) {
  const definition = hairPropertyDefinitions[propertyId];
  const items: Array<{ value: string; label: string }> = [
    { value: "__inherit", label: `As defined by ${typeLabel.value}` },
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

function updatePropertySelection(propertyId: string, value: ElDropdownValue) {
  const selected = String(value ?? "__inherit");
  if (selected === "__reference") {
    updateProperty(propertyId, { mode: "reference" });
  } else if (selected === "__absent") {
    updateProperty(propertyId, { mode: "absent" });
  } else if (selected === "__custom") {
    updateProperty(propertyId, { mode: "custom", value: "" });
  } else if (selected.startsWith("option:")) {
    updateProperty(propertyId, {
      mode: "option",
      value: selected.slice("option:".length),
    });
  } else {
    updateProperty(propertyId, { mode: "inherit" });
  }
}

function customPropertyValue(propertyId: string) {
  const state = propertyState(propertyId);
  return state.mode === "custom" ? state.value : "";
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
        <el-text :size="14" :weight="600" icon="content_cut">{{ componentTitle }}</el-text>
        <el-text :size="9" color="normal45">{{ componentToken }}</el-text>
      </el-flex>
      <el-flex rules="rcc" :gap="4">
        <el-button type="fab" mode="flat" icon="content_copy" label="Duplicate component" :size="12" :p="7" @click.stop="emit('duplicate')" />
        <el-button type="fab" mode="flat" color="red" icon="delete" label="Remove component" :size="12" :p="7" @click.stop="emit('remove')" />
        <el-icon :icon="expanded ? 'expand_less' : 'expand_more'" :size="14" />
      </el-flex>
    </el-flex>

    <template v-if="expanded">
      <el-grid :cols="mobile ? 1 : 3" :gap="10" class="w100">
        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Component name</el-text>
          <el-text-field
            :model-value="component.name"
            type="text"
            placeholder="Display name"
            @update:model-value="updateComponent({ name: String($event ?? '') })"
          />
        </el-grid>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Semantic key</el-text>
          <el-text-field
            :model-value="component.key"
            type="text"
            placeholder="bangs"
            @update:model-value="updateComponentKey"
          />
          <el-text :size="8" color="normal40">Unique inside this hairstyle</el-text>
        </el-grid>

        <el-grid :gap="4">
          <el-text :size="10" :weight="500">Component type</el-text>
          <el-dropdown
            :model-value="component.type"
            :items="typeItems"
            item-label="label"
            item-value="value"
            @update:model-value="changeType"
          />
        </el-grid>

        <el-grid v-if="component.type === 'custom'" :gap="4">
          <el-text :size="10" :weight="500">Custom component</el-text>
          <el-text-field
            :model-value="component.customType || ''"
            type="text"
            placeholder="Describe the hair component..."
            @update:model-value="updateComponent({ customType: String($event ?? '') })"
          />
        </el-grid>
      </el-grid>

      <el-divider v-if="propertyIds.length" mode="dashed" />

      <el-grid v-if="propertyIds.length" :cols="mobile ? 1 : 2" :gap="10" class="w100">
        <el-grid
          v-for="propertyId in propertyIds"
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
            :model-value="propertySelection(propertyId)"
            :items="propertyItems(propertyId)"
            item-label="label"
            item-value="value"
            @update:model-value="updatePropertySelection(propertyId, $event)"
          />

          <el-text-field
            v-if="propertyState(propertyId).mode === 'custom'"
            :model-value="customPropertyValue(propertyId)"
            type="text"
            :placeholder="`Custom ${(hairPropertyDefinitions[propertyId]?.label || propertyId).toLowerCase()}...`"
            @update:model-value="updateProperty(propertyId, { mode: 'custom', value: String($event ?? '') })"
          />
        </el-grid>
      </el-grid>

      <el-grid :gap="4">
        <el-text :size="10" :weight="500">Additional component details</el-text>
        <el-text-field
          :model-value="component.additionalDetails || ''"
          type="textarea"
          :rows="2"
          placeholder="Optional structural or styling details..."
          support-variables
          @update:model-value="updateComponent({ additionalDetails: String($event ?? '') })"
        />
      </el-grid>
    </template>
  </el-grid>
</template>
