<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs } from "vue";
import {
  usePromptEditor,
  type PromptEditableElement,
} from "~/composables/prompt/usePromptEditor";

defineOptions({
  inheritAttrs: false,
});

type TextFieldType = "text" | "textarea";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    type?: TextFieldType;
    rows?: number | string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    editorId?: string;
    supportVariables?: boolean;
  }>(),
  {
    type: "text",
    rows: 3,
    placeholder: "",
    disabled: false,
    readonly: false,
    editorId: "",
    supportVariables: false,
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
}>();

const attrs = useAttrs();
const promptEditor = usePromptEditor();

const fieldRef = ref<PromptEditableElement | null>(null);

const textValue = computed(() => {
  return props.modelValue == null ? "" : String(props.modelValue);
});

const shouldTrackEditor = computed(() => {
  return props.supportVariables && Boolean(props.editorId);
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

function focus() {
  fieldRef.value?.focus();
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
  <textarea
    v-if="type === 'textarea'"
    ref="fieldRef"
    class="el-text-field el-text-field--textarea"
    :value="textValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    v-bind="attrs"
    @focus="handleFocus"
    @blur="handleBlur"
    @input="handleInput"
    @click="handleClick"
    @keyup="handleKeyup"
    @select="handleSelect"
    @touchend="handleTouchend"
  />

  <input
    v-else
    ref="fieldRef"
    class="el-text-field el-text-field--input"
    type="text"
    :value="textValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    v-bind="attrs"
    @focus="handleFocus"
    @blur="handleBlur"
    @input="handleInput"
    @click="handleClick"
    @keyup="handleKeyup"
    @select="handleSelect"
    @touchend="handleTouchend"
  />
</template>