<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs } from "vue";
import type { GlobalMenuItem } from "~/composables/useMenu";
import {
  usePromptEditor,
  type PromptEditableElement,
} from "~/composables/prompt/usePromptEditor";

import { useVariablePickerModal } from "~/composables/prompt/useVariablePickerModal";

import TranslationOptionsModal from "~/components/modules/panel/TranslationOptionsModal.vue";
import {
  usePromptTranslation,
  type PromptTranslationSource,
  type PromptTranslationTarget,
  type PromptTranslationResult,
} from "~/composables/prompt/usePromptTranslation";

defineOptions({
  inheritAttrs: false,
});

type TextFieldType = "text" | "textarea";

type TextFieldAction =
  | "insertVariable"
  | "translate"
  | "copy"
  | "paste"
  | "selectAll"
  | "undo"
  | "redo"
  | "clear";

type TextFieldActionsProp = TextFieldAction[] | false;

const DEFAULT_TEXT_FIELD_ACTIONS: TextFieldAction[] = [
  "insertVariable",
  "translate",
  "copy",
  "paste",
  "selectAll",
  "undo",
  "redo",
  "clear",
];

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    type?: TextFieldType;
    rows?: number | string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    historyLimit?: number;
    editorId?: string;
    supportVariables?: boolean;
    actions?: TextFieldActionsProp;
    actionLabel?: string;

    translationSource?: PromptTranslationSource;
    translationTarget?: PromptTranslationTarget;
    translationAlternatives?: number;
    protectVariablesOnTranslate?: boolean;
  }>(),
  {
    type: "text",
    rows: 3,
    placeholder: "",
    disabled: false,
    readonly: false,
    historyLimit: 20,
    editorId: "",
    supportVariables: false,
    actionLabel: "Text actions",

    translationSource: "auto",
    translationTarget: "en",
    translationAlternatives: 3,
    protectVariablesOnTranslate: true,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "focus", value: FocusEvent): void;
  (event: "blur", value: FocusEvent): void;
  (event: "input", value: Event): void;
  (event: "click", value: MouseEvent): void;
  (event: "keyup", value: KeyboardEvent): void;
  (event: "select", value: Event): void;
  (event: "touchend", value: TouchEvent): void;
  (event: "action-error", value: unknown): void;
}>();

const attrs = useAttrs();
const { $menu } = useNuxtApp();
const promptEditor = usePromptEditor();

const modal = useModal();

const { isTranslating, translateText } = usePromptTranslation();
const { enabledPromptVariables, openVariablePicker } = useVariablePickerModal();

const selectedTranslationOption = ref("");

const fieldRef = ref<PromptEditableElement | null>(null);
const actionAnchorRef = ref<HTMLElement | null>(null);

const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);

const textValue = computed(() => {
  return props.modelValue == null ? "" : String(props.modelValue);
});

const hasValue = computed(() => {
  return textValue.value.length > 0;
});

const isLocked = computed(() => {
  return props.disabled || props.readonly;
});

const enabledActions = computed<TextFieldAction[]>(() => {
  if (Array.isArray(props.actions)) {
    return Array.from(new Set(props.actions));
  } else {
    return DEFAULT_TEXT_FIELD_ACTIONS;
  }
});

const shouldTrackEditor = computed(() => {
  return props.supportVariables && Boolean(props.editorId);
});

const showActionButton = computed(() => {
  return enabledActions.value.length > 0 && !props.disabled;
});

const canUseClipboard = computed(() => {
  return import.meta.client && Boolean(navigator?.clipboard);
});

const safeHistoryLimit = computed(() => {
  return Math.max(Number(props.historyLimit) || 20, 1);
});

const canUndo = computed(() => {
  return undoStack.value.length > 0 && !isLocked.value;
});

const canRedo = computed(() => {
  return redoStack.value.length > 0 && !isLocked.value;
});

function getEditableTarget(event: Event): PromptEditableElement | null {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return target;
  }

  return fieldRef.value;
}

function updateEditorCursor(event: Event) {
  if (!shouldTrackEditor.value) return;

  const target = getEditableTarget(event);

  if (!target) return;

  promptEditor.updateCursor(target);
}

function updateEditorCursorFromField() {
  if (!shouldTrackEditor.value) return;
  if (!fieldRef.value) return;

  promptEditor.updateCursor(fieldRef.value);
}

function syncPromptEditorFromField() {
  if (!shouldTrackEditor.value) return;
  if (!fieldRef.value) return;

  promptEditor.registerEditor(props.editorId, fieldRef.value);
  promptEditor.updateCursor(fieldRef.value);
}

function handleFocus(event: FocusEvent) {
  const target = getEditableTarget(event);

  if (target) {
    fieldRef.value = target;

    if (shouldTrackEditor.value) {
      promptEditor.registerEditor(props.editorId, target);
    }
  }

  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  if (shouldTrackEditor.value) {
    promptEditor.blurEditor(props.editorId);
  }

  emit("blur", event);
}

function handleInput(event: Event) {
  const target = getEditableTarget(event);

  if (!target) return;

  emit("update:modelValue", target.value);

  updateEditorCursor(event);

  emit("input", event);
}

function handleClick(event: MouseEvent) {
  updateEditorCursor(event);

  emit("click", event);
}

function handleKeyup(event: KeyboardEvent) {
  updateEditorCursor(event);

  emit("keyup", event);
}

function handleSelect(event: Event) {
  updateEditorCursor(event);

  emit("select", event);
}

function handleTouchend(event: TouchEvent) {
  updateEditorCursor(event);

  emit("touchend", event);
}

function getSelectionRange() {
  const field = fieldRef.value;

  if (!field) {
    return {
      start: textValue.value.length,
      end: textValue.value.length,
    };
  }

  return {
    start: field.selectionStart ?? textValue.value.length,
    end: field.selectionEnd ?? textValue.value.length,
  };
}

function trimHistoryStack(stack: string[]) {
  return stack.slice(-safeHistoryLimit.value);
}

function pushUndoSnapshot(value = textValue.value) {
  const lastValue = undoStack.value[undoStack.value.length - 1];

  if (lastValue === value) return;

  undoStack.value = trimHistoryStack([...undoStack.value, value]);
  redoStack.value = [];
}

function pushRedoSnapshot(value = textValue.value) {
  const lastValue = redoStack.value[redoStack.value.length - 1];

  if (lastValue === value) return;

  redoStack.value = trimHistoryStack([...redoStack.value, value]);
}

async function setFieldValue(value: string, cursorPosition?: number) {
  const field = fieldRef.value;

  if (field) {
    field.value = value;
  }

  emit("update:modelValue", value);

  await nextTick();

  const activeField = fieldRef.value;

  if (!activeField) return;

  if (typeof cursorPosition === "number") {
    activeField.focus();
    activeField.setSelectionRange(cursorPosition, cursorPosition);
    updateEditorCursorFromField();
  }
}

async function commitFieldValue(value: string, cursorPosition?: number) {
  const currentValue = textValue.value;

  if (value === currentValue) {
    if (typeof cursorPosition === "number") {
      await setFieldValue(value, cursorPosition);
    }

    return;
  }

  pushUndoSnapshot(currentValue);

  await setFieldValue(value, cursorPosition);
}

async function copyFieldContent() {
  if (!hasValue.value) return;
  if (!canUseClipboard.value) return;

  try {
    await navigator.clipboard.writeText(textValue.value);
  } catch (error) {
    console.error("Text field copy failed:", error);
    emit("action-error", error);
  }
}

async function pasteClipboardContent() {
  if (isLocked.value) return;
  if (!canUseClipboard.value) return;

  try {
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText) return;

    const currentValue = textValue.value;
    const { start, end } = getSelectionRange();

    const nextValue =
      currentValue.slice(0, start) + clipboardText + currentValue.slice(end);

    await commitFieldValue(nextValue, start + clipboardText.length);
  } catch (error) {
    console.error("Text field paste failed:", error);
    emit("action-error", error);
  }
}

async function selectAllContent() {
  const field = fieldRef.value;

  if (!field || !hasValue.value) return;

  await nextTick();

  field.focus();
  field.select();
  updateEditorCursorFromField();
}

async function clearContent() {
  if (isLocked.value) return;
  if (!hasValue.value) return;

  await commitFieldValue("", 0);
}

async function undoFieldChange() {
  if (!canUndo.value) return;

  const currentValue = textValue.value;
  const previousValue = undoStack.value[undoStack.value.length - 1];

  undoStack.value = undoStack.value.slice(0, -1);
  pushRedoSnapshot(currentValue);

  await setFieldValue(previousValue, previousValue.length);
}

async function redoFieldChange() {
  if (!canRedo.value) return;

  const nextValue = redoStack.value[redoStack.value.length - 1];

  redoStack.value = redoStack.value.slice(0, -1);
  pushUndoSnapshot(textValue.value);

  await setFieldValue(nextValue, nextValue.length);
}

function insertVariableAtCursor() {
  if (!shouldTrackEditor.value) return;
  if (!enabledPromptVariables.value.length) return;

  syncPromptEditorFromField();

  openVariablePicker();
}

async function translateFieldContent() {
  if (isLocked.value) return;
  if (!hasValue.value) return;
  if (isTranslating.value) return;

  let result: PromptTranslationResult;

  try {
    result = await translateText({
      text: textValue.value,
      source: props.translationSource,
      target: props.translationTarget,
      alternatives: props.translationAlternatives,
      protectVariables: props.protectVariablesOnTranslate,
    });
  } catch (error) {
    console.error("Text field translation failed:", error);

    modal.message({
      type: "error",
      title: "خطا در ترجمه",
      message:
        "سرویس ترجمه در دسترس نیست. مطمئن شو LibreTranslate روی پورت 5000 روشن است.",
      actionLabel: "بستن",
    });

    emit("action-error", error);

    return;
  }

  if (!result.options.length) {
    modal.message({
      type: "warning",
      title: "ترجمه‌ای پیدا نشد",
      message: "موتور ترجمه پاسخی برای این متن برنگرداند.",
      actionLabel: "بستن",
    });

    return;
  }

  selectedTranslationOption.value = result.options[0];

  modal.open({
    header: {
      icon: "translate",
      title: "انتخاب ترجمه",
      subtitle: "یکی از ترجمه‌ها را انتخاب کن تا جایگزین متن فعلی شود.",
      color: "blue",
    },

    component: TranslationOptionsModal,

    props: {
      sourceText: result.sourceText,
      options: result.options,
      selected: selectedTranslationOption.value,
      onSelect: (value: string) => {
        selectedTranslationOption.value = value;
      },
    },

    actions: [
      {
        label: "بستن",
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: "استفاده از ترجمه انتخاب‌شده",
        icon: "tick-circle",
        color: "blue",
        mode: "normal",
        close: true,
        disable: () => !selectedTranslationOption.value,
        handler: async () => {
          if (!selectedTranslationOption.value) return false;

          await commitFieldValue(
            selectedTranslationOption.value,
            selectedTranslationOption.value.length
          );

          return true;
        },
      },
    ],

    options: {
      width: 760,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function hasAction(action: TextFieldAction) {
  return enabledActions.value.includes(action);
}

function addDivider(items: GlobalMenuItem[]) {
  if (!items.length) return;

  const lastItem = items[items.length - 1];

  if (lastItem?.divider) return;

  items.push({
    divider: true,
  });
}

function getActionMenuItems(): GlobalMenuItem[] {
  const items: GlobalMenuItem[] = [];

  if (hasAction("insertVariable")) {
    items.push({
      label: "درج متغیر",
      icon: "code",
      color: "blue",
      disabled: () =>
        !shouldTrackEditor.value || !enabledPromptVariables.value.length,
      handler: insertVariableAtCursor,
    });

    addDivider(items);
  }

  if (hasAction("translate")) {
    items.push({
      label: isTranslating.value ? "Translating..." : "Translate",
      icon: "translate",
      color: "blue",
      disabled: () => isLocked.value || !hasValue.value || isTranslating.value,
      handler: translateFieldContent,
    });

    addDivider(items);
  }
  if (hasAction("copy")) {
    items.push({
      label: "Copy",
      icon: "copy",
      disabled: () => !hasValue.value || !canUseClipboard.value,
      handler: copyFieldContent,
    });
  }

  if (hasAction("paste")) {
    items.push({
      label: "Paste",
      icon: "clipboard",
      disabled: () => isLocked.value || !canUseClipboard.value,
      handler: pasteClipboardContent,
    });
  }

  if (hasAction("selectAll")) {
    items.push({
      label: "Select all",
      icon: "text-block",
      disabled: () => !hasValue.value,
      handler: selectAllContent,
    });
  }

  if (hasAction("undo") || hasAction("redo")) {
    addDivider(items);

    if (hasAction("undo")) {
      items.push({
        label: "Undo",
        icon: "undo",
        disabled: () => !canUndo.value,
        handler: undoFieldChange,
      });
    }

    if (hasAction("redo")) {
      items.push({
        label: "Redo",
        icon: "redo",
        disabled: () => !canRedo.value,
        handler: redoFieldChange,
      });
    }
  }

  if (hasAction("clear")) {
    addDivider(items);

    items.push({
      label: "Clear",
      icon: "trash",
      color: "red",
      disabled: () => isLocked.value || !hasValue.value,
      handler: clearContent,
    });
  }

  return items;
}

function openActionMenu(event: MouseEvent) {
  if (!showActionButton.value) return;

  event.preventDefault();
  event.stopPropagation();

  updateEditorCursorFromField();

  $menu.open({
    mode: "dropdown",
    anchor: actionAnchorRef.value || (event.currentTarget as HTMLElement),
    placement: "bottom-end",
    options: {
      closeOnScroll: false,
      zIndex: 2200,
      minWidth: 180,
    },
    items: getActionMenuItems(),
  });
}

function focus() {
  fieldRef.value?.focus();
}

function openContextActionMenu(event: MouseEvent) {
  if (!showActionButton.value) return;

  event.preventDefault();
  event.stopPropagation();

  const target = getEditableTarget(event);

  if (target) {
    fieldRef.value = target;
  }

  updateEditorCursorFromField();

  $menu.open({
    mode: "point",
    event,
    options: {
      closeOnScroll: false,
      zIndex: 2200,
      minWidth: 180,
    },
    items: getActionMenuItems(),
  });
}

onBeforeUnmount(() => {
  if (props.editorId) {
    promptEditor.unregisterEditor(props.editorId);
  }
});

defineExpose({
  focus,
  el: fieldRef,
});
</script>

<template>
  <div class="el-text-field-host" :class="{
    'el-text-field-host--textarea': type === 'textarea',
    'el-text-field-host--input': type !== 'textarea',
    'el-text-field-host--with-actions': showActionButton,
  }">
    <textarea v-if="type === 'textarea'" ref="fieldRef"
      class="el-text-field el-text-field--textarea el-text-field-host__control" :value="textValue" :rows="rows"
      :placeholder="placeholder" :disabled="disabled" :readonly="readonly" v-bind="attrs" @focus="handleFocus"
      @blur="handleBlur" @input="handleInput" @click="handleClick" @keyup="handleKeyup" @select="handleSelect"
      @touchend="handleTouchend" @contextmenu="openContextActionMenu" />

    <input v-else ref="fieldRef" class="el-text-field el-text-field--input el-text-field-host__control" type="text"
      :value="textValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" v-bind="attrs"
      @focus="handleFocus" @blur="handleBlur" @input="handleInput" @click="handleClick" @keyup="handleKeyup"
      @select="handleSelect" @touchend="handleTouchend" @contextmenu="openContextActionMenu" />

    <div v-if="showActionButton" ref="actionAnchorRef" class="el-text-field-host__actions" @pointerdown.prevent.stop
      @click.stop="openActionMenu">
      <el-button :label="actionLabel" icon="more-vertical" type="fab" mode="flat" color="normal" :size="10" :p="8" />
    </div>
  </div>
</template>

<style scoped>
.el-text-field-host {
  position: relative;
  width: 100%;
}

.el-text-field-host__control {
  width: 100%;
}

.el-text-field-host--with-actions .el-text-field-host__control {
  padding-inline-end: 42px;
}

.el-text-field-host__actions {
  position: absolute;
  z-index: 2;
  inset-inline-end: 8px;
  top: 8px;
  display: flex;
}

.el-text-field-host--input .el-text-field-host__actions {
  top: 50%;
  transform: translateY(-50%);
}
</style>