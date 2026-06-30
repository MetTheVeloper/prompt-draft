<script setup lang="ts">
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleField,
  ModuleFieldOption,
  TypographyTextBlock,
} from "../../../modules/types";

const props = defineProps<{
  modelValue: TypographyTextBlock;
  field: ModuleField;
  blockIndex: number;
  canRemove?: boolean;
  moduleKey?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: TypographyTextBlock): void;
  (event: "remove"): void;
}>();

const { t } = useI18n();


function editorId(fieldKey: string) {
  return `${props.moduleKey || "typography"}:${props.field.id}:block_${props.blockIndex}:${fieldKey}`;
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

function getDropdownValue(value: ElDropdownValue, fallback = "") {
  return String(value || fallback);
}

function updatePurpose(value: ElDropdownValue) {
  updateBlockField("purpose", getDropdownValue(value));
}

function updateFontStyle(value: ElDropdownValue) {
  updateBlockField("fontStyle", getDropdownValue(value));
}

function updateFontSize(value: ElDropdownValue) {
  updateBlockField("fontSize", getDropdownValue(value));
}

function updateFontWeight(value: ElDropdownValue) {
  updateBlockField("fontWeight", getDropdownValue(value, "regular"));
}

function getConfigOptions(key: string): ModuleFieldOption[] {
  const value = props.field.config?.[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isModuleFieldOption);
}

function updateBlockField<K extends keyof TypographyTextBlock>(
  key: K,
  value: TypographyTextBlock[K],
) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
}
</script>

<template>
  <el-grid class="text-block-card" :class="{ 'text-block-card--empty': !modelValue.text?.trim() }" :gap="10">
    <el-flex rules="rbc" class="w100">
      <el-flex rules="rsc" :gap="8">
        <el-text marker="orange15" color="orange" :size="12" :weight="700">
          {{ modelValue.layerName || '{text_' + (blockIndex + 1) + '}' }}
        </el-text>

        <el-text v-if="!modelValue.text?.trim()" :size="10" color="orange" icon="danger" icon-color="orange">
          {{ t("modules.typography.fields.textGroups.block.validation.requiredTextEmpty") }}
        </el-text>
      </el-flex>

      <button v-if="canRemove" type="button" class="text-block-card__button text-block-card__button--danger"
        @click="emit('remove')">
        {{ t("modules.typography.fields.textGroups.block.actions.remove") }}
      </button>
    </el-flex>

    <label class="text-block-card__field text-block-card__field--full">
      <span>
        {{ t("modules.typography.fields.textGroups.block.controls.text.label") }}
      </span>

      <el-text-field
        :model-value="modelValue.text || ''"
        type="textarea"
        rows="2"
        :placeholder="t('modules.typography.fields.textGroups.block.controls.text.placeholder')"
        :editor-id="editorId('text')"
        support-variables
        @update:model-value="updateBlockField('text', $event)"
      />
    </label>

    <div class="text-block-card__grid">
      <label class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.purpose.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.purpose || ''"
          :items="getConfigOptions('textPurposeOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updatePurpose"
        />
      </label>

      <label v-if="modelValue.purpose === 'custom'" class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.customPurpose.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.customPurpose || ''"
          type="text"
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customPurpose.placeholder')"
          :editor-id="editorId('customPurpose')"
          support-variables
          @update:model-value="updateBlockField('customPurpose', $event)"
        />
      </label>

      <label class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.fontStyle.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.fontStyle || ''"
          :items="getConfigOptions('fontStyleOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateFontStyle"
        />
      </label>

      <label v-if="modelValue.fontStyle === 'custom'" class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.customFontStyle.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.customFontStyle || ''"
          type="text"
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontStyle.placeholder')"
          :editor-id="editorId('customFontStyle')"
          support-variables
          @update:model-value="updateBlockField('customFontStyle', $event)"
        />
      </label>

      <label class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.fontSize.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.fontSize || ''"
          :items="getConfigOptions('fontSizeOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateFontSize"
        />
      </label>

      <label v-if="modelValue.fontSize === 'custom'" class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.customFontSize.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.customFontSize || ''"
          type="text"
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontSize.placeholder')"
          :editor-id="editorId('customFontSize')"
          support-variables
          @update:model-value="updateBlockField('customFontSize', $event)"
        />
      </label>

      <label class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.fontWeight.label") }}
        </span>

        <el-dropdown
          :model-value="modelValue.fontWeight || 'regular'"
          :items="getConfigOptions('fontWeightOptions')"
          :item-label="(option) => humanizeValue(option.value)"
          item-value="value"
          @update:model-value="updateFontWeight"
        />
      </label>

      <label v-if="modelValue.fontWeight === 'custom'" class="text-block-card__field">
        <span>
          {{ t("modules.typography.fields.textGroups.block.controls.customFontWeight.label") }}
        </span>

        <el-text-field
          :model-value="modelValue.customFontWeight || ''"
          type="text"
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontWeight.placeholder')"
          :editor-id="editorId('customFontWeight')"
          support-variables
          @update:model-value="updateBlockField('customFontWeight', $event)"
        />
      </label>
    </div>

    <label class="text-block-card__field text-block-card__field--full">
      <span>
        {{ t("modules.typography.fields.textGroups.block.controls.additionalDescription.label") }}
      </span>

      <el-text-field
        :model-value="modelValue.additionalDescription || ''"
        type="textarea"
        rows="2"
        :placeholder="t('modules.typography.fields.textGroups.block.controls.additionalDescription.placeholder')"
        :editor-id="editorId('additionalDescription')"
        support-variables
        @update:model-value="updateBlockField('additionalDescription', $event)"
      />
    </label>
  </el-grid>
</template>

<style scoped>
.text-block-card {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--normalText10);
  border-radius: 12px;
  background: var(--surface);
}

.text-block-card--empty {
  border-color: var(--themeOrange30);
  background: var(--themeOrange5);
}

.text-block-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.text-block-card__field {
  display: grid;
  gap: 6px;
  width: 100%;
}

.text-block-card__field--full {
  grid-column: 1 / -1;
}

.text-block-card__field span {
  color: var(--normalText60);
  font-size: 11px;
  font-weight: 600;
}

.text-block-card__button {
  border: 1px solid var(--normalText15);
  border-radius: 8px;
  background: var(--normalText5);
  color: var(--normalText);
  padding: 6px 9px;
  font-size: 12px;
  cursor: pointer;
}

.text-block-card__button--danger {
  color: var(--themeRed);
  border-color: var(--themeRed30);
}

@media (max-width: 768px) {
  .text-block-card__grid {
    grid-template-columns: 1fr;
  }

  .text-block-card__field--full {
    grid-column: auto;
  }
}
</style>