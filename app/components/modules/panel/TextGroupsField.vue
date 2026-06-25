<script setup lang="ts">
import { computed } from "vue";
import type {
  ModuleField,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../../../modules/types";
import TextGroupCard from "./TextGroupCard.vue";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: unknown;
  field: ModuleField;
  moduleKey?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: TypographyTextGroup[]): void;
}>();

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isTextGroup(value: unknown): value is TypographyTextGroup {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isTextBlock(value: unknown): value is TypographyTextBlock {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getRawGroups() {
  if (!Array.isArray(props.modelValue)) return [];

  return props.modelValue.filter(isTextGroup);
}

function createTextBlock(): TypographyTextBlock {
  return {
    id: createId("text"),
    layerName: "",
    text: "",
    purpose: "",
    customPurpose: "",
    fontStyle: "",
    customFontStyle: "",
    fontSize: "",
    customFontSize: "",
    fontWeight: "regular",
    customFontWeight: "",
    additionalDescription: "",
  };
}

function createTextGroup(): TypographyTextGroup {
  return {
    id: createId("text_group"),
    groupName: "",
    groupPurpose: "",
    customGroupPurpose: "",
    positionPreset: "",
    customPositionDescription: "",
    direction: "column",
    writingDirection: undefined,
    alignment: "center",
    distribution: "compact",
    texts: [createTextBlock()],
    additionalDescription: "",
  };
}

function normalizeGroups(
  source: unknown,
  options: { createMissingIds?: boolean } = {},
): TypographyTextGroup[] {
  if (!Array.isArray(source)) return [];

  let textCounter = 0;

  return source.filter(isTextGroup).map((group, groupIndex) => {
    const rawTexts = Array.isArray(group.texts) ? group.texts : [];

    const texts = rawTexts.filter(isTextBlock).map((block) => {
      textCounter += 1;

      return {
        ...block,
        id: block.id || (options.createMissingIds ? createId("text") : undefined),
        layerName: `{text_${textCounter}}`,
        text: block.text ?? "",
        purpose: block.purpose ?? "",
        customPurpose: block.customPurpose ?? "",
        fontStyle: block.fontStyle ?? "",
        customFontStyle: block.customFontStyle ?? "",
        fontSize: block.fontSize ?? "",
        customFontSize: block.customFontSize ?? "",
        fontWeight: block.fontWeight ?? "regular",
        customFontWeight: block.customFontWeight ?? "",
        additionalDescription: block.additionalDescription ?? "",
      };
    });

    return {
      ...group,
      id: group.id || (options.createMissingIds ? createId("text_group") : undefined),
      groupName: `{text_group_${groupIndex + 1}}`,
      groupPurpose: group.groupPurpose ?? "",
      customGroupPurpose: group.customGroupPurpose ?? "",
      positionPreset: group.positionPreset ?? "",
      customPositionDescription: group.customPositionDescription ?? "",
      direction: group.direction ?? "column",
      writingDirection: group.writingDirection,
      alignment: group.alignment ?? "center",
      distribution: group.distribution ?? "compact",
      texts,
      additionalDescription: group.additionalDescription ?? "",
    };
  });
}

const groups = computed(() => {
  return normalizeGroups(props.modelValue);
});

function commit(nextGroups: TypographyTextGroup[]) {
  emit("update:modelValue", normalizeGroups(nextGroups, { createMissingIds: true }));
}

function addGroup() {
  commit([...getRawGroups(), createTextGroup()]);
}

function updateGroup(groupIndex: number, group: TypographyTextGroup) {
  const nextGroups = [...getRawGroups()];

  nextGroups[groupIndex] = group;

  commit(nextGroups);
}

function removeGroup(groupIndex: number) {
  commit(getRawGroups().filter((_, index) => index !== groupIndex));
}

function addTextBlock(groupIndex: number) {
  const nextGroups = [...getRawGroups()];
  const currentGroup = nextGroups[groupIndex];

  if (!currentGroup) return;

  nextGroups[groupIndex] = {
    ...currentGroup,
    texts: [...(currentGroup.texts || []), createTextBlock()],
  };

  commit(nextGroups);
}
</script>

<template>
  <el-grid class="text-groups-field" :gap="12">
    <el-flex rules="rbc" class="w100">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="13" :weight="600" icon="text">
          {{ t("modules.typography.fields.textGroups.title") }}
        </el-text>

        <el-text :size="10" color="normal45">
          {{ t("modules.typography.fields.textGroups.count", { count: groups.length }) }}
        </el-text>
      </el-flex>

      <button
        type="button"
        class="text-groups-field__add-button"
        @click="addGroup">
        {{ t("modules.typography.fields.textGroups.actions.addGroup") }}
      </button>
    </el-flex>

    <el-flex
      v-if="!groups.length"
      rules="ccs"
      class="text-groups-field__empty"
      :gap="4">
      <el-text :size="13" :weight="600" icon="info-circle">
        {{ t("modules.typography.fields.textGroups.empty.title") }}
      </el-text>

      <el-text :size="11" color="normal45">
        {{ t("modules.typography.fields.textGroups.empty.description") }}
      </el-text>
    </el-flex>

    <modules-panel-text-group-card
      v-for="(group, groupIndex) in groups"
      :key="group.id || `${group.groupName}-${groupIndex}`"
      :model-value="group"
      :field="field"
      :group-index="groupIndex"
      :module-key="moduleKey"
      @update:model-value="updateGroup(groupIndex, $event)"
      @remove="removeGroup(groupIndex)"
      @add-text-block="addTextBlock(groupIndex)" />
  </el-grid>
</template>

<style scoped>
.text-groups-field {
  width: 100%;
}

.text-groups-field__empty {
  padding: 12px;
  border: 1px dashed var(--normalText15);
  border-radius: 12px;
  background: var(--normalText5);
}

.text-groups-field__add-button {
  border: 1px solid var(--themeBlue50);
  border-radius: 10px;
  background: var(--themeBlue10);
  color: var(--themeBlue);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>