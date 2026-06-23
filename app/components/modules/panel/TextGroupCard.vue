<script setup lang="ts">
import { usePromptEditor } from "~/composables/prompt/usePromptEditor";

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

const promptEditor = usePromptEditor();

type PromptEditableElement = HTMLInputElement | HTMLTextAreaElement;

function isPromptEditableTarget(target: EventTarget | null): target is PromptEditableElement {
  if (!target) return false;

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function editorId(fieldKey: string) {
  return `${props.moduleKey || "typography"}:${props.field.id}:group_${props.groupIndex}:${fieldKey}`;
}

function handleEditorFocus(event: Event, fieldKey: string) {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.registerEditor(editorId(fieldKey), event.target);
}

function handleEditorBlur(fieldKey: string) {
  promptEditor.blurEditor(editorId(fieldKey));
}

function handleEditorCursor(event: Event) {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.updateCursor(event.target);
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

function getEventValue(event: Event) {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
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
        Remove group
      </button>
    </el-flex>

    <el-grid :cols="1" :gap="10">
      <label class="text-group-card__field">
        <span>Group purpose</span>

        <select :value="modelValue.groupPurpose || ''"
          @change="updateGroupField('groupPurpose', getEventValue($event))">
          <option value="">None</option>

          <option v-for="option in getConfigOptions('groupPurposeOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.groupPurpose === 'custom'" class="text-group-card__field">
        <span>Custom group purpose</span>

        <input type="text" :value="modelValue.customGroupPurpose || ''"
          placeholder="Describe this text group purpose..." @focus="handleEditorFocus($event, 'customGroupPurpose')"
          @blur="handleEditorBlur('customGroupPurpose')"
          @input="updateGroupField('customGroupPurpose', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>

      <label class="text-group-card__field">
        <span>Position</span>

        <select :value="modelValue.positionPreset || ''"
          @change="updateGroupField('positionPreset', getEventValue($event))">
          <option value="">None</option>

          <option v-for="option in getConfigOptions('positionPresetOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.positionPreset === 'custom'" class="text-group-card__field">
        <span>Custom position description</span>

        <textarea :value="modelValue.customPositionDescription || ''" rows="2"
          placeholder="Describe the exact placement of this text group..."
          @focus="handleEditorFocus($event, 'customPositionDescription')"
          @blur="handleEditorBlur('customPositionDescription')"
          @input="updateGroupField('customPositionDescription', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>

      <div class="text-group-card__grid">
        <label class="text-group-card__field">
          <span>Direction</span>

          <select :value="modelValue.direction || 'column'"
            @change="updateGroupField('direction', getEventValue($event) as TypographyTextGroup['direction'])">
            <option v-for="option in getConfigOptions('directionOptions')" :key="option.value" :value="option.value">
              {{ humanizeValue(option.value) }}
            </option>
          </select>
        </label>

        <label class="text-group-card__field">
          <span>Writing direction</span>

          <select :value="modelValue.writingDirection || ''"
            @change="updateGroupField('writingDirection', (getEventValue($event) || undefined) as TypographyTextGroup['writingDirection'])">
            <option value="">None</option>

            <option v-for="option in getConfigOptions('writingDirectionOptions')" :key="option.value"
              :value="option.value">
              {{ humanizeValue(option.value) }}
            </option>
          </select>
        </label>

        <label class="text-group-card__field">
          <span>Alignment</span>

          <select :value="modelValue.alignment || 'center'"
            @change="updateGroupField('alignment', getEventValue($event) as TypographyTextGroup['alignment'])">
            <option v-for="option in getConfigOptions('alignmentOptions')" :key="option.value" :value="option.value">
              {{ humanizeValue(option.value) }}
            </option>
          </select>
        </label>

        <label class="text-group-card__field">
          <span>Distribution</span>

          <select :value="modelValue.distribution || 'compact'"
            @change="updateGroupField('distribution', getEventValue($event) as TypographyTextGroup['distribution'])">
            <option v-for="option in getConfigOptions('distributionOptions')" :key="option.value" :value="option.value">
              {{ humanizeValue(option.value) }}
            </option>
          </select>
        </label>
      </div>

      <label class="text-group-card__field">
        <span>Group additional description</span>

        <textarea :value="modelValue.additionalDescription || ''" rows="2"
          placeholder="Optional note for this whole group..."
          @focus="handleEditorFocus($event, 'additionalDescription')" @blur="handleEditorBlur('additionalDescription')"
          @input="updateGroupField('additionalDescription', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>
    </el-grid>

    <el-divider mode="dashed" :dash="4" :gap="2" />

    <el-flex rules="rbc" class="w100">
      <el-text :size="13" :weight="600" icon="text">
        Text blocks
      </el-text>

      <button type="button" class="text-group-card__button" @click="emit('addTextBlock')">
        Add text
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