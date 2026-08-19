<script setup lang="ts">
import { computed, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  LightingSource,
  ModuleField,
  ModuleFieldOption,
} from "../../../modules/types";

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: LightingSource[];
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: LightingSource[]): void;
}>();

const collapsedIds = ref<string[]>([]);

const sources = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue.slice(0, maxSources.value) : [];
});

const maxSources = computed(() => {
  const configured = Number(props.field.config?.maxSources || 3);

  if (!Number.isFinite(configured)) return 3;

  return Math.max(1, Math.min(3, configured));
});

const canAddSource = computed(() => sources.value.length < maxSources.value);

function configOptions(key: string) {
  const value = props.field.config?.[key];

  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ModuleFieldOption => {
    return Boolean(item && typeof item === "object" && typeof item.value === "string");
  });
}

function optionLabel(group: string, value: string) {
  const key = `modules.lighting.fields.lightSources.${group}.options.${value}`;
  const translated = t(key);

  return translated === key ? value.replace(/[_-]+/g, " ") : translated;
}

function roleOptions() {
  return configOptions("roleOptions");
}

function sourceTypeOptions() {
  return configOptions("sourceTypeOptions");
}

function directionOptions() {
  return configOptions("directionOptions");
}

function qualityOptions() {
  return configOptions("qualityOptions");
}

function intensityOptions() {
  return configOptions("intensityOptions");
}

function colorOptions() {
  return configOptions("colorOptions");
}

function featureOptions() {
  return configOptions("featureOptions");
}

function createSourceId() {
  return `light_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSource(): LightingSource {
  return {
    id: createSourceId(),
    role: "",
    sourceType: "",
    direction: "",
    quality: "",
    intensity: "",
    color: "",
    customColor: "",
    features: [],
  };
}

function setSources(nextSources: LightingSource[]) {
  emit(
    "update:modelValue",
    nextSources.slice(0, maxSources.value).map((source) => ({
      ...source,
      features: Array.isArray(source.features) ? [...source.features] : [],
    })),
  );
}

function addSource() {
  if (!canAddSource.value) return;

  setSources([...sources.value, createSource()]);
}

function removeSource(index: number) {
  const removed = sources.value[index];

  if (removed?.id) {
    collapsedIds.value = collapsedIds.value.filter((id) => id !== removed.id);
  }

  setSources(sources.value.filter((_, sourceIndex) => sourceIndex !== index));
}

function updateSource(index: number, patch: Partial<LightingSource>) {
  const current = sources.value[index];

  if (!current) return;

  const next = [...sources.value];
  next[index] = {
    ...current,
    ...patch,
  };

  setSources(next);
}

function updateSourceValue(
  index: number,
  key: keyof LightingSource,
  value: ElDropdownValue,
) {
  const nextValue = String(value ?? "");

  if (key === "color") {
    updateSource(index, {
      color: nextValue,
      customColor: nextValue === "custom" ? sources.value[index]?.customColor || "" : "",
    });
    return;
  }

  updateSource(index, {
    [key]: nextValue,
  });
}

function toggleFeature(index: number, feature: string) {
  const current = sources.value[index];

  if (!current) return;

  const features = Array.isArray(current.features) ? current.features : [];
  const nextFeatures = features.includes(feature)
    ? features.filter((item) => item !== feature)
    : [...features, feature];

  updateSource(index, { features: nextFeatures });
}

function isFeatureSelected(source: LightingSource, feature: string) {
  return Array.isArray(source.features) && source.features.includes(feature);
}

function sourceId(source: LightingSource, index: number) {
  return source.id || `light-${index + 1}`;
}

function isExpanded(source: LightingSource, index: number) {
  return !collapsedIds.value.includes(sourceId(source, index));
}

function toggleExpanded(source: LightingSource, index: number) {
  const id = sourceId(source, index);

  collapsedIds.value = collapsedIds.value.includes(id)
    ? collapsedIds.value.filter((item) => item !== id)
    : [...collapsedIds.value, id];
}

function sourceTitle(source: LightingSource, index: number) {
  if (source.role) {
    return optionLabel("role", source.role);
  }

  return t("modules.lighting.fields.lightSources.sourceTitle", {
    index: index + 1,
  });
}

function sourceFilledCount(source: LightingSource) {
  let count = 0;

  if (source.role) count += 1;
  if (source.sourceType) count += 1;
  if (source.direction) count += 1;
  if (source.quality) count += 1;
  if (source.intensity) count += 1;
  if (source.color && (source.color !== "custom" || source.customColor?.trim())) count += 1;
  if (source.features?.length) count += 1;

  return count;
}
</script>

<template>
  <el-grid :gap="12" class="w100">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="13" :weight="600" icon="lightbulb">
          {{ t("modules.lighting.fields.lightSources.editorTitle") }}
        </el-text>
        <el-text :size="10" color="normal45">
          {{ t("modules.lighting.fields.lightSources.editorDescription", { max: maxSources }) }}
        </el-text>
      </el-flex>

      <el-button
        icon="add"
        color="blue"
        :type="mobile ? 'fab' : 'normal'"
        :label="t('modules.lighting.fields.lightSources.actions.add')"
        :disable="!canAddSource"
        :size="12"
        :p="mobile ? 8 : [8, 12]"
        @click="addSource"
      />
    </el-flex>

    <el-flex
      v-if="!sources.length"
      rules="ccs"
      :p="16"
      :radius="12"
      :br="1"
      bc="orange25"
      bg="orange5"
      class="w100"
      :gap="4"
    >
      <el-text :size="13" :weight="600" color="orange" icon="lightbulb">
        {{ t("modules.lighting.fields.lightSources.emptyTitle") }}
      </el-text>
      <el-text :size="11" color="normal55">
        {{ t("modules.lighting.fields.lightSources.emptyDescription") }}
      </el-text>
    </el-flex>

    <el-grid
      v-for="(source, index) in sources"
      :key="sourceId(source, index)"
      :p="12"
      :radius="14"
      :br="1"
      :bc="isExpanded(source, index) ? 'blue35' : 'normal15'"
      bg="surface"
      :gap="12"
      class="w100"
    >
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-flex rules="rsc" class="fg100 crp" :gap="8" @click="toggleExpanded(source, index)">
          <el-icon :icon="isExpanded(source, index) ? 'expand_less' : 'expand_more'" :size="16" />
          <el-flex rules="ccs" :gap="0">
            <el-text :size="13" :weight="600">
              {{ sourceTitle(source, index) }}
            </el-text>
            <el-text :size="10" color="normal45">
              {{ sourceFilledCount(source) }} / 7 {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-button
          type="fab"
          mode="flat"
          color="red"
          icon="delete"
          :label="t('modules.lighting.fields.lightSources.actions.remove')"
          :size="12"
          :p="8"
          @click="removeSource(index)"
        />
      </el-flex>

      <el-grid v-if="isExpanded(source, index)" :cols="mobile ? 1 : 2" :gap="10">
        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.role.label") }}</el-text>
          <el-dropdown
            :model-value="source.role || ''"
            :items="roleOptions()"
            :item-label="(item) => optionLabel('role', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'role', $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.sourceType.label") }}</el-text>
          <el-dropdown
            :model-value="source.sourceType || ''"
            :items="sourceTypeOptions()"
            :item-label="(item) => optionLabel('sourceType', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'sourceType', $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.direction.label") }}</el-text>
          <el-dropdown
            :model-value="source.direction || ''"
            :items="directionOptions()"
            :item-label="(item) => optionLabel('direction', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'direction', $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.quality.label") }}</el-text>
          <el-dropdown
            :model-value="source.quality || ''"
            :items="qualityOptions()"
            :item-label="(item) => optionLabel('quality', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'quality', $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.intensity.label") }}</el-text>
          <el-dropdown
            :model-value="source.intensity || ''"
            :items="intensityOptions()"
            :item-label="(item) => optionLabel('intensity', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'intensity', $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.color.label") }}</el-text>
          <el-dropdown
            :model-value="source.color || ''"
            :items="colorOptions()"
            :item-label="(item) => optionLabel('color', item.value)"
            item-value="value"
            clearable
            @update:model-value="updateSourceValue(index, 'color', $event)"
          />
        </el-grid>

        <el-grid v-if="source.color === 'custom'" :gap="6" class="w100">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.color.customLabel") }}</el-text>
          <el-text-field
            :model-value="source.customColor || ''"
            :placeholder="t('modules.lighting.fields.lightSources.color.customPlaceholder')"
            @update:model-value="updateSource(index, { customColor: String($event || '') })"
          />
        </el-grid>

        <el-grid :gap="8" class="w100" :style="mobile ? '' : 'grid-column: 1 / -1'">
          <el-text :size="10" color="normal45">{{ t("modules.lighting.fields.lightSources.features.label") }}</el-text>
          <el-flex rules="rsc" class="fw" :gap="6">
            <el-text
              v-for="feature in featureOptions()"
              :key="feature.value"
              :size="11"
              :weight="400"
              class="crp"
              :p="[5, 8]"
              :radius="12"
              :marker="isFeatureSelected(source, feature.value) ? 'blue' : 'normal5'"
              :color="isFeatureSelected(source, feature.value) ? 'white' : 'normal70'"
              :icon="isFeatureSelected(source, feature.value) ? 'check' : 'add'"
              :icon-color="isFeatureSelected(source, feature.value) ? 'white' : 'normal45'"
              @click="toggleFeature(index, feature.value)"
            >
              {{ optionLabel("features", feature.value) }}
            </el-text>
          </el-flex>
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
