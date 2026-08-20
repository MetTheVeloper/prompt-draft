<script setup lang="ts">
import { computed, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  EffectLayer,
  ModuleField,
  ModuleFieldOption,
} from "../../../modules/types";

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    field: ModuleField;
    modelValue?: EffectLayer[];
  }>(),
  {
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: EffectLayer[]): void;
}>();

const collapsedIds = ref<string[]>([]);

const maxLayers = computed(() => {
  const configured = Number(props.field.config?.maxLayers || 8);
  if (!Number.isFinite(configured)) return 8;
  return Math.max(1, Math.min(12, configured));
});

const layers = computed(() =>
  Array.isArray(props.modelValue)
    ? props.modelValue.slice(0, maxLayers.value)
    : [],
);

const canAddLayer = computed(() => layers.value.length < maxLayers.value);

function configOptions(key: string) {
  const value = props.field.config?.[key];
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ModuleFieldOption =>
    Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as ModuleFieldOption).value === "string",
    ),
  );
}

function effectTypeOptions() {
  return configOptions("effectTypeOptions");
}

function intensityOptions() {
  return configOptions("intensityOptions");
}

function effectTypeLabel(value: string) {
  const key = `modules.effects.fields.effectLayers.type.options.${value}`;
  const translated = t(key);
  return translated === key ? value.replace(/[_-]+/g, " ") : translated;
}

function intensityLabel(value: string) {
  const key = `modules.effects.fields.effectLayers.intensity.options.${value}`;
  const translated = t(key);
  return translated === key ? value.replace(/[_-]+/g, " ") : translated;
}

function createLayerId() {
  return `effect_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createLayer(): EffectLayer {
  return {
    id: createLayerId(),
    effectType: "",
    customEffect: "",
    intensity: "",
    details: "",
  };
}

function setLayers(nextLayers: EffectLayer[]) {
  emit(
    "update:modelValue",
    nextLayers.slice(0, maxLayers.value).map((layer) => ({ ...layer })),
  );
}

function addLayer() {
  if (!canAddLayer.value) return;
  setLayers([...layers.value, createLayer()]);
}

function removeLayer(index: number) {
  const removed = layers.value[index];
  if (removed?.id) {
    collapsedIds.value = collapsedIds.value.filter((id) => id !== removed.id);
  }
  setLayers(layers.value.filter((_, layerIndex) => layerIndex !== index));
}

function updateLayer(index: number, patch: Partial<EffectLayer>) {
  const current = layers.value[index];
  if (!current) return;

  const next = [...layers.value];
  next[index] = {
    ...current,
    ...patch,
  };
  setLayers(next);
}

function updateLayerType(index: number, value: ElDropdownValue) {
  const nextType = String(value ?? "");
  updateLayer(index, {
    effectType: nextType,
    customEffect: nextType === "custom" ? layers.value[index]?.customEffect || "" : "",
  });
}

function updateLayerIntensity(index: number, value: ElDropdownValue) {
  updateLayer(index, { intensity: String(value ?? "") });
}

function layerId(layer: EffectLayer, index: number) {
  return layer.id || `effect-${index + 1}`;
}

function isExpanded(layer: EffectLayer, index: number) {
  return !collapsedIds.value.includes(layerId(layer, index));
}

function toggleExpanded(layer: EffectLayer, index: number) {
  const id = layerId(layer, index);
  collapsedIds.value = collapsedIds.value.includes(id)
    ? collapsedIds.value.filter((item) => item !== id)
    : [...collapsedIds.value, id];
}

function layerTitle(layer: EffectLayer, index: number) {
  if (layer.effectType === "custom" && layer.customEffect?.trim()) {
    return layer.customEffect.trim();
  }
  if (layer.effectType) return effectTypeLabel(layer.effectType);
  return t("modules.effects.fields.effectLayers.layerTitle", { index: index + 1 });
}

function layerFilledCount(layer: EffectLayer) {
  let count = 0;
  if (layer.effectType && (layer.effectType !== "custom" || layer.customEffect?.trim())) count += 1;
  if (layer.intensity) count += 1;
  if (layer.details?.trim()) count += 1;
  return count;
}
</script>

<template>
  <el-grid :gap="12" class="w100">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="13" :weight="600" icon="auto_awesome">
          {{ t("modules.effects.fields.effectLayers.editorTitle") }}
        </el-text>
        <el-text :size="10" color="normal45">
          {{ t("modules.effects.fields.effectLayers.editorDescription", { max: maxLayers }) }}
        </el-text>
      </el-flex>

      <el-button
        icon="add"
        color="blue"
        :type="mobile ? 'fab' : 'normal'"
        :label="t('modules.effects.fields.effectLayers.actions.add')"
        :disable="!canAddLayer"
        :size="12"
        :p="mobile ? 8 : [8, 12]"
        @click="addLayer"
      />
    </el-flex>

    <el-flex
      v-if="!layers.length"
      rules="ccs"
      :p="16"
      :radius="12"
      :br="1"
      bc="orange25"
      bg="orange5"
      class="w100"
      :gap="4"
    >
      <el-text :size="13" :weight="600" color="orange" icon="auto_awesome">
        {{ t("modules.effects.fields.effectLayers.emptyTitle") }}
      </el-text>
      <el-text :size="11" color="normal55">
        {{ t("modules.effects.fields.effectLayers.emptyDescription") }}
      </el-text>
    </el-flex>

    <el-grid
      v-for="(layer, index) in layers"
      :key="layerId(layer, index)"
      :p="12"
      :radius="14"
      :br="1"
      :bc="isExpanded(layer, index) ? 'blue35' : 'normal15'"
      bg="surface"
      :gap="12"
      class="w100"
    >
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-flex rules="rsc" class="fg100 crp" :gap="8" @click="toggleExpanded(layer, index)">
          <el-icon :icon="isExpanded(layer, index) ? 'expand_less' : 'expand_more'" :size="16" />
          <el-flex rules="ccs" :gap="0">
            <el-text :size="13" :weight="600">
              {{ layerTitle(layer, index) }}
            </el-text>
            <el-text :size="10" color="normal45">
              {{ layerFilledCount(layer) }} / 3 {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-button
          type="fab"
          mode="flat"
          color="red"
          icon="delete"
          :label="t('modules.effects.fields.effectLayers.actions.remove')"
          :size="12"
          :p="8"
          @click="removeLayer(index)"
        />
      </el-flex>

      <el-grid v-if="isExpanded(layer, index)" :cols="mobile ? 1 : 2" :gap="10">
        <el-grid :gap="6">
          <el-text :size="10" color="normal45">
            {{ t("modules.effects.fields.effectLayers.type.label") }}
          </el-text>
          <el-dropdown
            :model-value="layer.effectType || ''"
            :items="effectTypeOptions()"
            :item-label="(item) => effectTypeLabel(item.value)"
            item-value="value"
            clearable
            @update:model-value="updateLayerType(index, $event)"
          />
        </el-grid>

        <el-grid :gap="6">
          <el-text :size="10" color="normal45">
            {{ t("modules.effects.fields.effectLayers.intensity.label") }}
          </el-text>
          <el-dropdown
            :model-value="layer.intensity || ''"
            :items="intensityOptions()"
            :item-label="(item) => intensityLabel(item.value)"
            item-value="value"
            clearable
            @update:model-value="updateLayerIntensity(index, $event)"
          />
        </el-grid>

        <el-grid v-if="layer.effectType === 'custom'" :gap="6" class="w100" :style="mobile ? '' : 'grid-column: 1 / -1'">
          <el-text :size="10" color="normal45">
            {{ t("modules.effects.fields.effectLayers.custom.label") }}
          </el-text>
          <el-text-field
            :model-value="layer.customEffect || ''"
            type="text"
            :placeholder="t('modules.effects.fields.effectLayers.custom.placeholder')"
            :editor-id="`effects:layer:${layerId(layer, index)}:custom`"
            support-variables
            @update:model-value="updateLayer(index, { customEffect: $event })"
          />
        </el-grid>

        <el-grid :gap="6" class="w100" :style="mobile ? '' : 'grid-column: 1 / -1'">
          <el-text :size="10" color="normal45">
            {{ t("modules.effects.fields.effectLayers.details.label") }}
          </el-text>
          <el-text-field
            :model-value="layer.details || ''"
            type="text"
            :placeholder="t('modules.effects.fields.effectLayers.details.placeholder')"
            :editor-id="`effects:layer:${layerId(layer, index)}:details`"
            support-variables
            @update:model-value="updateLayer(index, { details: $event })"
          />
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
