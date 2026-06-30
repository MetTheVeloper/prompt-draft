<script setup lang="ts">

const { t } = useI18n();
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleField,
  ModuleFieldOption,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../../../modules/types";

const props = defineProps<{
  modelValue: TypographyTextGroup;
  field: ModuleField;
  groupIndex: number;
  moduleKey?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: TypographyTextGroup): void;
  (event: "remove"): void;
  (event: "addTextBlock"): void;
}>();


function editorId(fieldKey: string) {
  return `${props.moduleKey || "typography"}:${props.field.id}:group_${props.groupIndex}:${fieldKey}`;
}

function humanizeValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isModuleFieldOption(value: unknown): value is ModuleFieldOption {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as ModuleFieldOption).value === "string",
  );
}

function getConfigOptions(key: string): ModuleFieldOption[] {
  const value = props.field.config?.[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isModuleFieldOption);
}

function updateGroupField<K extends keyof TypographyTextGroup>(
  key: K,
  value: TypographyTextGroup[K],
) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
}

function updateTextBlock(blockIndex: number, block: TypographyTextBlock) {
  const texts = [...(props.modelValue.texts || [])];

  texts[blockIndex] = block;

  updateGroupField("texts", texts);
}

function getDropdownValue(value: ElDropdownValue, fallback = "") {
  return String(value || fallback);
}

function updateGroupPurpose(value: ElDropdownValue) {
  updateGroupField("groupPurpose", getDropdownValue(value));
}

function updatePositionPreset(value: ElDropdownValue) {
  updateGroupField("positionPreset", getDropdownValue(value));
}

function updateDirection(value: ElDropdownValue) {
  updateGroupField(
    "direction",
    getDropdownValue(value, "column") as TypographyTextGroup["direction"],
  );
}

function updateWritingDirection(value: ElDropdownValue) {
  const nextValue = getDropdownValue(value);

  updateGroupField(
    "writingDirection",
    (nextValue || undefined) as TypographyTextGroup["writingDirection"],
  );
}

function updateAlignment(value: ElDropdownValue) {
  updateGroupField(
    "alignment",
    getDropdownValue(value, "center") as TypographyTextGroup["alignment"],
  );
}

function updateDistribution(value: ElDropdownValue) {
  updateGroupField(
    "distribution",
    getDropdownValue(value, "compact") as TypographyTextGroup["distribution"],
  );
}

function removeTextBlock(blockIndex: number) {
  const texts = (props.modelValue.texts || []).filter((_, index) => {
    return index !== blockIndex;
  });

  updateGroupField("texts", texts);
}
</script>

<template>
  <el-grid class="text-group-card" :gap="12">
    <el-flex rules="rbc" class="w100">
      <el-flex rules="rsc" :gap="8">
        <el-text marker="blue15" color="blue" :size="12" :weight="700">
          {{ modelValue.groupName || '{text_group_' + (groupIndex + 1) + '}' }}
        </el-text>

        <el-text :size="12" color="normal45">
          {{ modelValue.texts?.length || 0 }} text block{{ (modelValue.texts?.length || 0) === 1 ? "" : "s" }}
        </el-text>
      </el-flex>

      <button type="button" class="text-group-card__button text-group-card__button--danger" @click="emit('remove')">
        {{ t("modules.typography.fields.textGroups.group.actions.remove") }}
      </button>
    </el-flex>

    <el-grid :cols="1" :gap="10">
      <label class="text-group-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.group.controls.groupPurpose.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.groupPurpose || ''"
          :items="getConfigOptions('groupPurposeOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateGroupPurpose"
        />
      </label>

      <label v-if="modelValue.groupPurpose === 'custom'" class="text-group-card__field">
        <span>Custom group purpose</span>

        <el-text-field
          :model-value="modelValue.customGroupPurpose || ''"
          type="text"
          :placeholder="t('modules.typography.fields.textGroups.group.controls.customGroupPurpose.placeholder')"
          :editor-id="editorId('customGroupPurpose')"
          support-variables
          @update:model-value="updateGroupField('customGroupPurpose', $event)"
        />
      </label>

      <label class="text-group-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.group.controls.positionPreset.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.positionPreset || ''"
          :items="getConfigOptions('positionPresetOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updatePositionPreset"
        />
      </label>

      <label v-if="modelValue.positionPreset === 'custom'" class="text-group-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.group.controls.customPositionDescription.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.customPositionDescription || ''"
          type="textarea"
          rows="2"
          :placeholder="t('modules.typography.fields.textGroups.group.controls.customPositionDescription.placeholder')"
          :editor-id="editorId('customPositionDescription')"
          support-variables
          @update:model-value="updateGroupField('customPositionDescription', $event)"
        />
      </label>

      <div class="text-group-card__grid">
        <label class="text-group-card__field">
          <span>
            {{ t("modules.typography.fields.textGroups.group.controls.direction.label") }}
          </span>

          <el-dropdown
            :model-value="modelValue.direction || 'column'"
            :items="getConfigOptions('directionOptions')"
            :item-label="(option) => humanizeValue(option.value)"
            item-value="value"
            @update:model-value="updateDirection"
          />
        </label>

        <label class="text-group-card__field">
          <span>
            {{ t("modules.typography.fields.textGroups.group.controls.writingDirection.label") }}
          </span>

          <el-dropdown
            :model-value="modelValue.writingDirection || ''"
            :items="getConfigOptions('writingDirectionOptions')"
            :item-label="(option) => humanizeValue(option.value)"
            item-value="value"
            :placeholder="t('panel.none')"
            clearable
            @update:model-value="updateWritingDirection"
          />
        </label>

        <label class="text-group-card__field">
          <span>
            {{ t("modules.typography.fields.textGroups.group.controls.alignment.label") }}
          </span>

          <el-dropdown
            :model-value="modelValue.alignment || 'center'"
            :items="getConfigOptions('alignmentOptions')"
            :item-label="(option) => humanizeValue(option.value)"
            item-value="value"
            @update:model-value="updateAlignment"
          />
        </label>

        <label class="text-group-card__field">
          <span>
            {{ t("modules.typography.fields.textGroups.group.controls.distribution.label") }}
          </span>

          <el-dropdown
            :model-value="modelValue.distribution || 'compact'"
            :items="getConfigOptions('distributionOptions')"
            :item-label="(option) => humanizeValue(option.value)"
            item-value="value"
            @update:model-value="updateDistribution"
          />
        </label>
      </div>

      <label class="text-group-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.group.controls.additionalDescription.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.additionalDescription || ''"
          type="textarea"
          rows="2"
          :placeholder="t('modules.typography.fields.textGroups.group.controls.additionalDescription.placeholder')"
          :editor-id="editorId('additionalDescription')"
          support-variables
          @update:model-value="updateGroupField('additionalDescription', $event)"
        />
      </label>
    </el-grid>

    <el-divider mode="dashed" :dash="4" :gap="2" />

    <el-flex rules="rbc" class="w100">
      <el-text :size="13" :weight="600" icon="text">
        {{ t("modules.typography.fields.textGroups.group.textBlocksTitle") }}
      </el-text>

      <button type="button" class="text-group-card__button" @click="emit('addTextBlock')">
        {{ t("modules.typography.fields.textGroups.group.actions.addText") }}
      </button>
    </el-flex>

    <el-grid class="text-group-card__texts" :gap="10">
      <modules-panel-text-block-card v-for="(block, blockIndex) in modelValue.texts || []"
        :key="block.id || `${block.layerName}-${blockIndex}`" :model-value="block" :field="field"
        :block-index="blockIndex" :can-remove="(modelValue.texts?.length || 0) > 1" :module-key="moduleKey"
        @update:model-value="updateTextBlock(blockIndex, $event)" @remove="removeTextBlock(blockIndex)" />
    </el-grid>
  </el-grid>
</template>

<style scoped>
.text-group-card {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--normalText10);
  border-radius: 14px;
  background: var(--normalText5);
}

.text-group-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.text-group-card__field {
  display: grid;
  gap: 6px;
  width: 100%;
}

.text-group-card__field span {
  color: var(--normalText60);
  font-size: 11px;
  font-weight: 600;
}

.text-group-card__texts {
  width: 100%;
}

.text-group-card__button {
  border: 1px solid var(--normalText15);
  border-radius: 9px;
  background: var(--normalText5);
  color: var(--normalText);
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
}

.text-group-card__button--danger {
  color: var(--themeRed);
  border-color: var(--themeRed30);
}

@media (max-width: 768px) {
  .text-group-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>