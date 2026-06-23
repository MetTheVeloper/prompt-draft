<script setup lang="ts">
import { usePromptEditor } from "~/composables/prompt/usePromptEditor";

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

const promptEditor = usePromptEditor();

type PromptEditableElement = HTMLInputElement | HTMLTextAreaElement;

function isPromptEditableTarget(target: EventTarget | null): target is PromptEditableElement {
  if (!target) return false;

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function editorId(fieldKey: string) {
  return `${props.moduleKey || "typography"}:${props.field.id}:block_${props.blockIndex}:${fieldKey}`;
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
          Required text is empty
        </el-text>
      </el-flex>

      <button v-if="canRemove" type="button" class="text-block-card__button text-block-card__button--danger"
        @click="emit('remove')">
        Remove
      </button>
    </el-flex>

    <label class="text-block-card__field text-block-card__field--full">
      <span>Text</span>

      <textarea :value="modelValue.text || ''" rows="2" placeholder="Write the exact text content..."
        @focus="handleEditorFocus($event, 'text')" @blur="handleEditorBlur('text')"
        @input="updateBlockField('text', getEventValue($event)); handleEditorCursor($event)" @click="handleEditorCursor"
        @keyup="handleEditorCursor" @select="handleEditorCursor" @touchend="handleEditorCursor" />
    </label>

    <div class="text-block-card__grid">
      <label class="text-block-card__field">
        <span>Purpose</span>

        <select :value="modelValue.purpose || ''" @change="updateBlockField('purpose', getEventValue($event))">
          <option value="">None</option>

          <option v-for="option in getConfigOptions('textPurposeOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.purpose === 'custom'" class="text-block-card__field">
        <span>Custom purpose</span>

        <input type="text" :value="modelValue.customPurpose || ''" placeholder="Describe the text purpose..."
          @focus="handleEditorFocus($event, 'customPurpose')" @blur="handleEditorBlur('customPurpose')"
          @input="updateBlockField('customPurpose', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>

      <label class="text-block-card__field">
        <span>Font style</span>

        <select :value="modelValue.fontStyle || ''" @change="updateBlockField('fontStyle', getEventValue($event))">
          <option value="">None</option>

          <option v-for="option in getConfigOptions('fontStyleOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.fontStyle === 'custom'" class="text-block-card__field">
        <span>Custom font style</span>

        <input type="text" :value="modelValue.customFontStyle || ''" placeholder="Describe the font style..."
          @focus="handleEditorFocus($event, 'customFontStyle')" @blur="handleEditorBlur('customFontStyle')"
          @input="updateBlockField('customFontStyle', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>

      <label class="text-block-card__field">
        <span>Font size</span>

        <select :value="modelValue.fontSize || ''" @change="updateBlockField('fontSize', getEventValue($event))">
          <option value="">None</option>

          <option v-for="option in getConfigOptions('fontSizeOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.fontSize === 'custom'" class="text-block-card__field">
        <span>Custom font size</span>

        <input type="text" :value="modelValue.customFontSize || ''" placeholder="Describe the text size..."
          @focus="handleEditorFocus($event, 'customFontSize')" @blur="handleEditorBlur('customFontSize')"
          @input="updateBlockField('customFontSize', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>

      <label class="text-block-card__field">
        <span>Font weight</span>

        <select :value="modelValue.fontWeight || 'regular'"
          @change="updateBlockField('fontWeight', getEventValue($event))">
          <option v-for="option in getConfigOptions('fontWeightOptions')" :key="option.value" :value="option.value">
            {{ humanizeValue(option.value) }}
          </option>
        </select>
      </label>

      <label v-if="modelValue.fontWeight === 'custom'" class="text-block-card__field">
        <span>Custom font weight</span>

        <input type="text" :value="modelValue.customFontWeight || ''" placeholder="Describe the font weight..."
          @focus="handleEditorFocus($event, 'customFontWeight')" @blur="handleEditorBlur('customFontWeight')"
          @input="updateBlockField('customFontWeight', getEventValue($event)); handleEditorCursor($event)"
          @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
          @touchend="handleEditorCursor" />
      </label>
    </div>

    <label class="text-block-card__field text-block-card__field--full">
      <span>Additional description</span>

      <textarea :value="modelValue.additionalDescription || ''" rows="2"
        placeholder="Optional details for this text layer..."
        @focus="handleEditorFocus($event, 'additionalDescription')" @blur="handleEditorBlur('additionalDescription')"
        @input="updateBlockField('additionalDescription', getEventValue($event)); handleEditorCursor($event)"
        @click="handleEditorCursor" @keyup="handleEditorCursor" @select="handleEditorCursor"
        @touchend="handleEditorCursor" />
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