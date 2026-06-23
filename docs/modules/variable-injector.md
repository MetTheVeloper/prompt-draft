# Variable Injector System

This document describes the global variable injection system added after the `Variables` module.

The purpose of this system is to let the user insert a defined prompt variable into any supported text input or textarea from anywhere in the app, without manually typing the variable token.

Example:

```txt
{headline}
{person_1}
{logo}
```

The system tracks the currently focused editable field and the cursor position, then inserts the selected variable token exactly at that cursor position.

---

## Core idea

The `Variables` module defines reusable prompt variables.

The variable injector system makes those variables usable across the app through a global floating action button.

Flow:

```txt
User defines variables
  ↓
Variables are synced to global variable state
  ↓
User focuses a supported input or textarea
  ↓
Global editor state stores active element and cursor position
  ↓
FAB appears
  ↓
User opens variable picker modal
  ↓
User selects a variable
  ↓
Token is inserted at cursor position
```

---

## Main files

```txt
app/composables/prompt/usePromptEditor.ts
app/composables/prompt/usePromptVariables.ts
app/components/el/variable-fab.vue
app/components/modals/VariablePickerModal.vue
app/components/modules/panel/base.vue
app/app.vue
```

---

## `usePromptEditor.ts`

Path:

```txt
app/composables/prompt/usePromptEditor.ts
```

This composable tracks the active editable element.

It stores:

```ts
activeEditorId
activeEditor
lastFocusedEditorId
cursor.start
cursor.end
```

Supported editable elements:

```ts
HTMLInputElement
HTMLTextAreaElement
```

The main methods are:

```ts
registerEditor(id, el)
blurEditor(id)
unregisterEditor(id)
updateCursor(el)
updateCursorFromEvent(event)
insertAtCursor(text)
insertVariable(key)
```

### Important behavior

`blurEditor()` intentionally does not clear the active editor immediately.

This is required because clicking the FAB or opening the modal causes the input to lose focus. If the active editor were cleared on blur, the system would lose the cursor position before the variable is selected.

The insertion logic updates the native input value, restores focus, moves the cursor after the inserted token, then dispatches native events:

```ts
input
change
```

This keeps Vue `v-model` synced.

---

## `usePromptVariables.ts`

Path:

```txt
app/composables/prompt/usePromptVariables.ts
```

This composable stores the global list of prompt variables.

It exposes:

```ts
promptVariables
enabledPromptVariables
hasPromptVariables
setPromptVariables(variables)
clearPromptVariables()
getVariableToken(key)
```

Only enabled variables with valid key and value are exposed through `enabledPromptVariables`.

The FAB uses `enabledPromptVariables` to decide whether the variable picker should be available.

---

## Syncing Variables module to global state

The Variables module is rendered through:

```txt
app/components/modules/panel/base.vue
```

Inside `base.vue`, the module values are watched.

When the current module key is:

```ts
variables
```

the variable list is synced to the global variable store.

Expected logic:

```ts
watch(
  values,
  () => {
    if (props.module.key !== "variables") return;

    const variableList = values.variables;

    setGlobalPromptVariables(
      Array.isArray(variableList) ? variableList as PromptVariable[] : []
    );
  },
  {
    deep: true,
    immediate: true,
  }
);
```

To avoid a naming collision with the local helper function `setPromptVariables(fieldId, variables)`, the global setter is imported with an alias:

```ts
const {
  setPromptVariables: setGlobalPromptVariables,
  clearPromptVariables,
} = usePromptVariables();
```

On unmount, the global variable list is cleared if the current module is the Variables module:

```ts
onBeforeUnmount(() => {
  if (props.module.key === "variables") {
    clearPromptVariables();
  }
});
```

---

## Input and textarea tracking in `base.vue`

Supported inputs need focus and cursor events.

For textarea fields:

```vue
<textarea
  v-model="values[field.id]"
  :rows="field.ui?.rows || 3"
  :placeholder="fieldPlaceholder(field.id)"
  @focus="handleEditorFocus($event, field.id)"
  @blur="handleEditorBlur(field.id)"
  @input="handleEditorCursor"
  @click="handleEditorCursor"
  @keyup="handleEditorCursor"
  @select="handleEditorCursor"
  @touchend="handleEditorCursor"
/>
```

For normal text inputs:

```vue
<input
  v-model="values[field.id]"
  type="text"
  :placeholder="fieldPlaceholder(field.id)"
  @focus="handleEditorFocus($event, field.id)"
  @blur="handleEditorBlur(field.id)"
  @input="handleEditorCursor"
  @click="handleEditorCursor"
  @keyup="handleEditorCursor"
  @select="handleEditorCursor"
  @touchend="handleEditorCursor"
/>
```

For custom override fields, a suffix is used:

```vue
@focus="handleEditorFocus($event, overrideField.id, 'override')"
@blur="handleEditorBlur(overrideField.id, 'override')"
```

The helper functions in `base.vue`:

```ts
type PromptEditableElement = HTMLInputElement | HTMLTextAreaElement;

function isPromptEditableTarget(target: EventTarget | null): target is PromptEditableElement {
  if (!target) return false;

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function promptEditorId(fieldId: string, suffix = "") {
  return `${props.module.key}:${fieldId}${suffix ? `:${suffix}` : ""}`;
}

function handleEditorFocus(event: Event, fieldId: string, suffix = "") {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.registerEditor(promptEditorId(fieldId, suffix), event.target);
}

function handleEditorBlur(fieldId: string, suffix = "") {
  promptEditor.blurEditor(promptEditorId(fieldId, suffix));
}

function handleEditorCursor(event: Event) {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.updateCursor(event.target);
}
```

---

## `variable-fab.vue`

Path:

```txt
app/components/el/variable-fab.vue
```

This component renders the global floating button.

It is teleported to `body`.

The FAB is shown only when both conditions are true:

```ts
hasActiveEditor.value === true
enabledPromptVariables.value.length > 0
```

Current implementation:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import VariablePickerModal from '~/components/modals/VariablePickerModal.vue'

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const modal = useModal()
const { hasActiveEditor } = usePromptEditor()
const { enabledPromptVariables } = usePromptVariables()

const showFab = computed(() => {
  return hasActiveEditor.value && enabledPromptVariables.value.length > 0
})

function openVariablePicker() {
  if (!showFab.value) return

  modal.open({
    header: {
      icon: 'code',
      title: 'Insert variable',
      subtitle: 'Choose a variable to insert at the cursor position',
      color: 'blue',
    },
    component: VariablePickerModal,
    props: {
      variables: enabledPromptVariables.value,
    },
    actions: [
      {
        label: 'modal.actions.close',
        color: 'normal',
        mode: 'flat',
        icon: 'close-circle',
        size: 14,
        close: true,
      },
    ],
    options: {
      width: 560,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  })
}
</script>

<template>
  <Teleport to="body">
    <el-button
      v-if="showFab"
      label="Insert variable"
      icon="code"
      type="fab"
      color="prim"
      tooltip-position="left"
      :size="16"
      class="variable-fab"
      @click="openVariablePicker" />
  </Teleport>
</template>

<style scoped>
.variable-fab {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 900;
}
</style>
```

---

## Registering the FAB globally

The FAB is rendered once in:

```txt
app/app.vue
```

Expected placement:

```vue
<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <el-modal />
  <el-variable-fab />
</template>
```

The modal must remain available because the FAB opens `VariablePickerModal` through the global modal system.

---

## `VariablePickerModal.vue`

Path:

```txt
app/components/modals/VariablePickerModal.vue
```

This modal receives the available variables through props.

The modal displays variable tokens such as:

```txt
{headline}
{person_1}
{logo}
```

When the user selects a variable, the modal calls:

```ts
promptEditor.insertVariable(variable.key)
```

or:

```ts
promptEditor.insertAtCursor(`{${variable.key}}`)
```

Then it closes itself.

The modal should import the prompt editor explicitly:

```ts
import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
```

If it uses the global variables composable directly, it should also import:

```ts
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
```

---

## Important import rule

Do not rely only on Nuxt auto-import for these composables in components that caused SSR/runtime issues.

Use explicit imports:

```ts
import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
```

This was required in:

```txt
base.vue
variable-fab.vue
VariablePickerModal.vue
```

Without explicit imports, the app may show:

```txt
500 Internal Server Error
usePromptEditor is not defined
```

---

## Display rules

The FAB appears only when:

```txt
1. At least one enabled variable exists.
2. The user has focused a supported input or textarea.
```

It does not appear when:

```txt
No variable is defined.
All variables are disabled.
Variable key or value is empty.
No supported input or textarea is focused.
The focused field is not registered with usePromptEditor.
```

---

## Supported fields in v1

The system currently supports:

```txt
input[type="text"]
textarea
custom override textarea
custom override text input
```

It should not be enabled for:

```txt
checkbox
color picker
range
select
multiSelect
number
```

Number input may technically support text insertion in the DOM layer, but inserting prompt variable tokens into numeric fields is not a valid UX case.

---

## Testing checklist

Use this checklist after changing the system.

### Basic visibility

```txt
1. Define a variable in Variables module.
2. Focus an extra details textarea or any supported text input.
3. FAB should appear.
4. Blur the input without focusing another editable field.
5. FAB behavior should remain stable enough for modal interaction.
```

### Insert behavior

```txt
1. Click inside a textarea.
2. Put cursor in the middle of existing text.
3. Click FAB.
4. Pick a variable.
5. The token should insert at the cursor position.
6. Cursor should move after the inserted token.
7. v-model should update.
```

### Custom override

```txt
1. Enable custom mode on a module.
2. Focus the custom override textarea.
3. Insert a variable.
4. Token should appear inside the custom override content.
```

### Disabled or incomplete variables

```txt
1. Disable a variable.
2. It should disappear from picker.
3. Clear a variable value.
4. It should not be available in picker.
```

---

## Known limitations

### No inline autocomplete yet

The current system uses FAB + modal only.

Future possible upgrade:

```txt
Typing "{" opens inline autocomplete.
```

### No syntax highlighting yet

Textarea content is plain text.

Future possible upgrade:

```txt
Highlight {variable} tokens inside textarea.
```

### No field-level support flag yet

Currently any supported text input or textarea wired in `base.vue` can use variables.

Future possible upgrade:

```ts
supportVariables?: boolean
```

or later through a shared `el-input` wrapper:

```vue
<el-input
  v-model="value"
  type="textarea"
  :support-variables="true"
/>
```

### No picker search yet

The picker can be upgraded with:

```txt
search
group by type
recent variables
keyboard navigation
```

---

## Future development plan

Recommended next steps:

```txt
1. Stabilize current FAB/modal insertion behavior.
2. Add search to VariablePickerModal.
3. Add keyboard shortcut, for example Ctrl + Space.
4. Create shared el-input wrapper.
5. Move editor registration logic from base.vue into el-input.
6. Add supportVariables prop.
7. Add inline variable autocomplete.
8. Add variable chips or token highlighting in textarea-like editors.
```

---

## Relationship with Variables module

The Variables module is responsible for defining variable data.

The variable injector system is responsible for inserting references to those variables into editable fields.

The injector does not resolve variable values.

It inserts only the token:

```txt
{variable_key}
```

The final prompt still keeps variable references as template references.

Example:

```txt
{headline} = "MORE THAN HUMAN"

Typography layout: use "{headline}" as the main title.
```

This is intentional.

The prompt remains editable as a template.
