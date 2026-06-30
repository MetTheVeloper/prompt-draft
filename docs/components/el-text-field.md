# el-text-field

`el-text-field` is the shared text input component used across Prompt Draft for both native text inputs and textareas.

It keeps the native input behavior, while adding project-level features such as prompt variable insertion, text actions, translation, right-click context menus, and action-based undo / redo.

---

## Location

```txt
app/components/el/text-field.vue
```

Related files:

```txt
app/composables/prompt/usePromptEditor.ts
app/composables/prompt/useVariablePickerModal.ts
app/composables/prompt/usePromptTranslation.ts
app/components/modals/VariablePickerModal.vue
app/components/modules/panel/TranslationOptionsModal.vue
```

---

## Responsibilities

`el-text-field` is responsible for:

- Rendering a native `input` or `textarea`
- Syncing with `v-model` / `modelValue`
- Preserving native focus and cursor behavior
- Tracking cursor position for prompt variable insertion
- Opening the global action menu from the `more` button
- Opening the same menu from right-click / context menu
- Running clipboard actions
- Running translation actions
- Opening the variable picker modal
- Managing an internal undo / redo stack for programmatic actions

---

## Basic usage

Text input:

```vue
<el-text-field
  v-model="value"
  type="text"
  placeholder="Text"
/>
```

Textarea:

```vue
<el-text-field
  v-model="value"
  type="textarea"
  rows="4"
  placeholder="Describe your idea"
/>
```

Using `model-value` manually:

```vue
<el-text-field
  :model-value="settings.idea"
  type="textarea"
  rows="4"
  :placeholder="t('promptSetup.idea.placeholder')"
  @update:model-value="updateSettings({ idea: $event })"
/>
```

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string \| number \| null` | `undefined` | Field value. |
| `type` | `'text' \| 'textarea'` | `'text'` | Determines whether the component renders an input or textarea. |
| `rows` | `number \| string` | `3` | Textarea row count. |
| `placeholder` | `string` | `''` | Native placeholder. |
| `disabled` | `boolean` | `false` | Disables the field and its action button. |
| `readonly` | `boolean` | `false` | Makes the field read-only. Editing actions are disabled. |
| `historyLimit` | `number` | `20` | Maximum number of undo / redo snapshots. |
| `editorId` | `string` | `''` | Unique prompt editor id used for variable insertion. |
| `supportVariables` | `boolean` | `false` | Enables prompt editor registration and cursor tracking. |
| `actions` | `TextFieldAction[] \| false` | `undefined` | Controls which action menu items are shown. |
| `actionLabel` | `string` | `'Text actions'` | Accessible label for the action button. |
| `translationSource` | `PromptTranslationSource` | `'auto'` | Source language for translation. |
| `translationTarget` | `PromptTranslationTarget` | `'en'` | Target language for translation. |
| `translationAlternatives` | `number` | `3` | Number of requested translation alternatives. |
| `protectVariablesOnTranslate` | `boolean` | `true` | Protects `{variable}` tokens before translation and restores them after translation. |

---

## Emits

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `string` | Emitted whenever the value changes. |
| `focus` | `FocusEvent` | Re-emits native focus. |
| `blur` | `FocusEvent` | Re-emits native blur. |
| `input` | `Event` | Re-emits native input. |
| `click` | `MouseEvent` | Re-emits native click. |
| `keyup` | `KeyboardEvent` | Re-emits native keyup. |
| `select` | `Event` | Re-emits native select. |
| `touchend` | `TouchEvent` | Re-emits native touchend. |
| `action-error` | `unknown` | Emitted when an action fails, such as clipboard or translation errors. |

---

## Action types

```ts
type TextFieldAction =
  | 'insertVariable'
  | 'translate'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'undo'
  | 'redo'
  | 'clear'
```

Default action list:

```ts
const DEFAULT_TEXT_FIELD_ACTIONS: TextFieldAction[] = [
  'insertVariable',
  'translate',
  'copy',
  'paste',
  'selectAll',
  'undo',
  'redo',
  'clear',
]
```

---

## Action resolver

Current resolver:

```ts
const enabledActions = computed<TextFieldAction[]>(() => {
  if (Array.isArray(props.actions)) {
    return Array.from(new Set(props.actions))
  } else {
    return DEFAULT_TEXT_FIELD_ACTIONS
  }
})
```

Current behavior:

| Usage | Result |
|---|---|
| `actions` omitted / `undefined` | Shows all default actions. |
| `:actions="[]"` | Disables all actions. |
| `:actions="['copy', 'translate']"` | Shows only `copy` and `translate`. |
| `:actions="false"` | Falls back to all default actions with the current resolver. |

Recommended default usage for normal prompt fields:

```vue
<el-text-field
  :model-value="settings.idea"
  type="textarea"
  rows="4"
  :placeholder="t('promptSetup.idea.placeholder')"
  :editor-id="editorId('idea')"
  support-variables
  @update:model-value="updateSettings({ idea: $event })"
/>
```

Disable actions explicitly:

```vue
<el-text-field
  v-model="value"
  :actions="[]"
/>
```

Use only selected actions:

```vue
<el-text-field
  v-model="value"
  :actions="['copy', 'translate']"
/>
```

---

## Action menu behavior

The action menu can be opened in two ways:

1. By clicking the internal `more` button.
2. By right-clicking inside the input / textarea.

The component uses the global menu system:

```ts
const { $menu } = useNuxtApp()
```

The `more` button opens the menu in dropdown mode:

```ts
$menu.open({
  mode: 'dropdown',
  anchor: actionAnchorRef.value,
  placement: 'bottom-end',
  items: getActionMenuItems(),
})
```

Right-click opens the menu in point mode:

```ts
$menu.open({
  mode: 'point',
  event,
  items: getActionMenuItems(),
})
```

When no actions are enabled, the action button is hidden and right-click does not override the browser context menu.

---

## Variable insertion

Variable insertion uses the existing prompt editor system.

A field must provide both:

```vue
support-variables
:editor-id="editorId(...)"
```

Example:

```vue
<el-text-field
  :model-value="settings.idea"
  type="textarea"
  rows="4"
  :editor-id="editorId('idea')"
  support-variables
  @update:model-value="updateSettings({ idea: $event })"
/>
```

When the `insertVariable` action is selected:

```txt
Insert Variable action
→ sync current field with usePromptEditor
→ open VariablePickerModal through useVariablePickerModal
→ selected variable token is inserted at the saved cursor position
```

Shared composable:

```txt
app/composables/prompt/useVariablePickerModal.ts
```

Modal component:

```txt
app/components/modals/VariablePickerModal.vue
```

The same modal is used by the global variable FAB and by `el-text-field`.

---

## Translation

The `translate` action translates the full current value of the field.

Flow:

```txt
Translate action
→ usePromptTranslation.translateText()
→ TranslationOptionsModal
→ user selects an option
→ selected translation replaces field value
→ previous value is pushed to undo stack
```

Composable:

```txt
app/composables/prompt/usePromptTranslation.ts
```

Modal:

```txt
app/components/modules/panel/TranslationOptionsModal.vue
```

Default translation behavior:

```ts
translationSource: 'auto'
translationTarget: 'en'
translationAlternatives: 3
protectVariablesOnTranslate: true
```

Example:

```vue
<el-text-field
  v-model="idea"
  type="textarea"
  translation-source="auto"
  translation-target="en"
  :translation-alternatives="3"
  :protect-variables-on-translate="true"
/>
```

When `protectVariablesOnTranslate` is enabled, variable tokens are protected before sending the text to the translation API.

Example tokens:

```txt
{app_name}
{title_1}
{product}
```

Example source text:

```txt
ساخت یک پوستر برای {app_name} با تیتر {title_1}
```

The translated text should keep the variables intact.

---

## Clipboard actions

### Copy

Copies the full field value to the clipboard.

Disabled when:

```txt
field is empty
clipboard API is unavailable
```

### Paste

Reads clipboard text and inserts it at the current cursor position.

If part of the text is selected, paste replaces the selected range.

Disabled when:

```txt
field is disabled
field is readonly
clipboard API is unavailable
```

Clipboard API may require browser permission or a secure context. It usually works on `localhost`.

### Select all

Selects the full field content and focuses the field.

Disabled when:

```txt
field is empty
```

### Clear

Clears the full field value.

Disabled when:

```txt
field is empty
field is disabled
field is readonly
```

Clear is history-aware and can be reverted with `Undo`.

---

## Undo / redo

`el-text-field` includes a small internal history stack for programmatic text changes.

Actions that push history snapshots:

```txt
paste
clear
translate
```

Normal user typing is not pushed into this custom history stack. Native browser undo / redo still handles normal typing.

This avoids conflicts between browser-native editing behavior and the component action menu.

Default history limit:

```ts
historyLimit: 20
```

Override:

```vue
<el-text-field
  v-model="value"
  :history-limit="50"
/>
```

Undo behavior:

```txt
Undo
→ restores the previous programmatic snapshot
→ pushes current value to redo stack
```

Redo behavior:

```txt
Redo
→ restores the last redo snapshot
→ pushes current value to undo stack
```

---

## Cursor and focus behavior

The component reads and writes native selection state:

```ts
selectionStart
selectionEnd
setSelectionRange()
```

Cursor is updated on:

```txt
focus
input
click
keyup
select
touchend
contextmenu
```

For variable insertion, it also syncs the current native field with `usePromptEditor`:

```txt
fieldRef
editorId
cursor position
```

This keeps variable insertion accurate even after the action menu or a modal opens.

---

## Context menu

Right-click support is built into the component.

Behavior:

```txt
right-click inside input / textarea
→ if actions are enabled, prevent native context menu
→ open global menu in point mode
```

If no actions are enabled, native browser context menu remains untouched.

---

## Recommended usage patterns

### Prompt text fields

Use default actions and variable support:

```vue
<el-text-field
  :model-value="settings.idea"
  type="textarea"
  rows="4"
  :placeholder="t('promptSetup.idea.placeholder')"
  :editor-id="editorId('idea')"
  support-variables
  @update:model-value="updateSettings({ idea: $event })"
/>
```

### Plain text field with all actions

```vue
<el-text-field
  v-model="text"
/>
```

### Disable actions for structural fields

```vue
<el-text-field
  v-model="draft.key"
  type="text"
  :actions="[]"
/>
```

### Only copy and translate

```vue
<el-text-field
  v-model="text"
  :actions="['copy', 'translate']"
/>
```

### Only clipboard actions

```vue
<el-text-field
  v-model="text"
  :actions="['copy', 'paste', 'selectAll']"
/>
```

---

## Suggested places to disable actions

Disable action menus for fields where text tools are not useful or may feel noisy.

Examples:

```txt
VariableEditorModal.vue
ColorAssignmentsField.vue
Small hex color inputs
Internal key/name fields
Utility-only fields
```

Example:

```vue
<el-text-field
  v-model="draft.key"
  type="text"
  :actions="[]"
/>
```

---

## Migration notes

Translation logic that was previously owned by panel-level components should now be moved into `el-text-field`.

The panel should no longer need a dedicated translate button for custom override fields.

Before:

```txt
base.vue
→ custom translate button
→ translation API
→ TranslationOptionsModal
→ apply selected translation
```

After:

```txt
el-text-field
→ Translate action
→ usePromptTranslation
→ TranslationOptionsModal
→ commitFieldValue
→ undo-aware replacement
```

---

## Design notes

`el-text-field` is intentionally built on top of native input / textarea elements.

It does not replace native text editing. Instead, it adds project-level actions around the native field.

The component should remain:

```txt
simple for basic input usage
powerful by default for prompt text fields
configurable for special cases
disabled explicitly for structural fields
```

