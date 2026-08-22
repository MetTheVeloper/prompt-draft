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

const { t } = useI18n();

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
    size?: number | string;

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
    actionLabel: undefined,
    size: 16,

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
const { hasInsertableVariables, openVariablePicker } = useVariablePickerModal();

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

const resolvedActionLabel = computed(() => {
  return props.actionLabel || t("components.textField.actionLabel");
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

const safeSize = computed(() => {
  return Math.max(Number(props.size) || 16, 1);
});

function getFixedPixel(value: number) {
  return `${fixNumber(value)}px`;
}

const hostStyle = computed<Record<string, string>>(() => {
  const size = safeSize.value;

  return {
    "--el-text-field-font-size": getFixedPixel(size),
    "--el-text-field-line-height": getFixedPixel(size * 1.45),
    "--el-text-field-padding-block": getFixedPixel(size * 0.55),
    "--el-text-field-padding-inline": getFixedPixel(size * 0.75),
    "--el-text-field-radius": getFixedPixel(size * 0.75),
    "--el-text-field-action-inset": getFixedPixel(size * 0.5),
    "--el-text-field-action-space": getFixedPixel(size * 2.625),
  };
});

const actionButtonSize = computed(() => {
  return fixNumber(safeSize.value * 0.625);
});

const actionButtonPadding = computed(() => {
  return fixNumber(safeSize.value * 0.5);
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
  if (!hasInsertableVariables.value) return;

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
      title: t("components.textField.translation.errorTitle"),
      message: t("components.textField.translation.errorMessage"),
      actionLabel: t("components.textField.translation.close"),
    });

    emit("action-error", error);

    return;
  }

  if (!result.options.length) {
    modal.message({
      type: "warning",
      title: t("components.textField.translation.noneTitle"),
      message: t("components.textField.translation.noneMessage"),
      actionLabel: t("components.textField.translation.close"),
    });

    return;
  }

  selectedTranslationOption.value = result.options[0];

  modal.open({
    header: {
      icon: "translate",
      title: t("components.textField.translation.chooseTitle"),
      subtitle: t("components.textField.translation.chooseSubtitle"),
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
        label: t("components.textField.translation.close"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("components.textField.translation.useSelected"),
        icon: "check_circle",
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
      label: t("components.textField.actions.insertVariable"),
      icon: "code",
      color: "blue",
      disabled: () =>
        !shouldTrackEditor.value || !hasInsertableVariables.value,
      handler: insertVariableAtCursor,
    });

    addDivider(items);
  }

  if (hasAction("translate")) {
    items.push({
      label: isTranslating.value
        ? t("components.textField.actions.translating")
        : t("components.textField.actions.translate"),
      icon: "translate",
      color: "blue",
      disabled: () => isLocked.value || !hasValue.value || isTranslating.value,
      handler: translateFieldContent,
    });

    addDivider(items);
  }
  if (hasAction("copy")) {
    items.push({
      label: t("components.textField.actions.copy"),
      icon: "content_copy",
      disabled: () => !hasValue.value || !canUseClipboard.value,
      handler: copyFieldContent,
    });
  }

  if (hasAction("paste")) {
    items.push({
      label: t("components.textField.actions.paste"),
      icon: "content_paste",
      disabled: () => isLocked.value || !canUseClipboard.value,
      handler: pasteClipboardContent,
    });
  }

  if (hasAction("selectAll")) {
    items.push({
      label: t("components.textField.actions.selectAll"),
      icon: "select_all",
      disabled: () => !hasValue.value,
      handler: selectAllContent,
    });
  }

  if (hasAction("undo") || hasAction("redo")) {
    addDivider(items);

    if (hasAction("undo")) {
      items.push({
        label: t("components.textField.actions.undo"),
        icon: "undo",
        disabled: () => !canUndo.value,
        handler: undoFieldChange,
      });
    }

    if (hasAction("redo")) {
      items.push({
        label: t("components.textField.actions.redo"),
        icon: "redo",
        disabled: () => !canRedo.value,
        handler: redoFieldChange,
      });
    }
  }

  if (hasAction("clear")) {
    addDivider(items);

    items.push({
      label: t("components.textField.actions.clear"),
      icon: "delete",
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
      zIndex: 30000,
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
      zIndex: 30000,
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
  }" :style="hostStyle">
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
      <el-button
        :label="resolvedActionLabel"
        icon="more_vert"
        type="fab"
        mode="flat"
        color="normal"
        :size="actionButtonSize"
        :p="actionButtonPadding" />
    </div>
  </div>
</template>

<style scoped>
.el-text-field-host {
  position: relative;
  width: 100%;
  --el-text-field-font-size: 16px;
  --el-text-field-line-height: 23.2px;
  --el-text-field-padding-block: 8.8px;
  --el-text-field-padding-inline: 12px;
  --el-text-field-radius: 12px;
  --el-text-field-action-inset: 8px;
  --el-text-field-action-space: 42px;
}

.el-text-field-host__control {
  width: 100%;
  font-size: var(--el-text-field-font-size);
  line-height: var(--el-text-field-line-height);
  padding-block: var(--el-text-field-padding-block);
  padding-inline: var(--el-text-field-padding-inline);
  border-radius: var(--el-text-field-radius);
}

.el-text-field-host--with-actions .el-text-field-host__control {
  padding-inline-end: var(--el-text-field-action-space);
}

.el-text-field-host__actions {
  position: absolute;
  z-index: 2;
  inset-inline-end: var(--el-text-field-action-inset);
  top: var(--el-text-field-action-inset);
  display: flex;
}

.el-text-field-host--input .el-text-field-host__actions {
  top: 50%;
  transform: translateY(-50%);
}
</style>
