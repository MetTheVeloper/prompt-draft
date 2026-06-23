import { computed, reactive, ref } from "vue";

export type PromptEditableElement = HTMLInputElement | HTMLTextAreaElement;

type PromptEditorEntry = {
  id: string;
  el: PromptEditableElement;
};

const activeEditorId = ref<string | null>(null);
const activeEditor = ref<PromptEditorEntry | null>(null);
const lastFocusedEditorId = ref<string | null>(null);

const cursor = reactive({
  start: 0,
  end: 0,
});

const editors = new Map<string, PromptEditorEntry>();

function isPromptEditableElement(value: EventTarget | null): value is PromptEditableElement {
  if (!value) return false;

  return value instanceof HTMLInputElement || value instanceof HTMLTextAreaElement;
}

function isTextLikeInput(el: PromptEditableElement) {
  if (el instanceof HTMLTextAreaElement) return true;

  const type = (el.getAttribute("type") || "text").toLowerCase();

  return [
    "text",
    "search",
    "email",
    "url",
    "tel",
    "password",
    "number",
  ].includes(type);
}

function focusEditor(el: PromptEditableElement) {
  requestAnimationFrame(() => {
    el.focus();
  });
}

export function usePromptEditor() {
  const hasActiveEditor = computed(() => Boolean(activeEditor.value?.el));

  function updateCursor(el?: PromptEditableElement | null) {
    const target = el || activeEditor.value?.el;

    if (!target) return;

    cursor.start = target.selectionStart ?? target.value.length;
    cursor.end = target.selectionEnd ?? cursor.start;
  }

  function updateCursorFromEvent(event: Event) {
    if (!isPromptEditableElement(event.target)) return;

    updateCursor(event.target);
  }

  function registerEditor(id: string, el: PromptEditableElement) {
    if (!isTextLikeInput(el)) return;

    const entry = { id, el };

    editors.set(id, entry);

    activeEditorId.value = id;
    lastFocusedEditorId.value = id;
    activeEditor.value = entry;

    updateCursor(el);
  }

  function registerEditorFromEvent(id: string, event: Event) {
    if (!isPromptEditableElement(event.target)) return;

    registerEditor(id, event.target);
  }

  function setActiveEditor(id: string) {
    const entry = editors.get(id);

    if (!entry) return;

    activeEditorId.value = id;
    lastFocusedEditorId.value = id;
    activeEditor.value = entry;

    updateCursor(entry.el);
  }

  function blurEditor(id: string) {
    if (activeEditorId.value !== id) return;

    updateCursor(activeEditor.value?.el);

    // Do not clear here; modal/FAB click moves focus away.
  }

  function unregisterEditor(id: string) {
    editors.delete(id);

    if (activeEditorId.value !== id) return;

    activeEditorId.value = null;
    activeEditor.value = null;
  }

  function clearActiveEditor() {
    activeEditorId.value = null;
    activeEditor.value = null;
  }

  function insertAtCursor(text: string) {
    const editor = activeEditor.value;

    if (!editor?.el) return false;

    const el = editor.el;
    const start = cursor.start ?? el.selectionStart ?? el.value.length;
    const end = cursor.end ?? el.selectionEnd ?? start;

    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const nextValue = `${before}${text}${after}`;
    const nextCursor = start + text.length;

    el.value = nextValue;

    cursor.start = nextCursor;
    cursor.end = nextCursor;

    focusEditor(el);

    requestAnimationFrame(() => {
      el.selectionStart = nextCursor;
      el.selectionEnd = nextCursor;

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    return true;
  }

  function insertVariable(key: string) {
    return insertAtCursor(`{${key}}`);
  }

  return {
    activeEditorId,
    activeEditor,
    lastFocusedEditorId,
    cursor,
    hasActiveEditor,

    isPromptEditableElement,
    registerEditor,
    registerEditorFromEvent,
    unregisterEditor,
    blurEditor,
    setActiveEditor,
    clearActiveEditor,
    updateCursor,
    updateCursorFromEvent,
    insertAtCursor,
    insertVariable,
  };
}