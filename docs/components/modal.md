# Global Modal System for Nuxt 4

This document describes the current global modal system used in the Nuxt 4 project.

The system provides:

* a single global modal component rendered once in `app.vue`
* a composable API via `useModal()`
* Nuxt injections via `$modal` and `$message`
* support for default text content
* support for custom modal components
* support for actions, async action handlers, disabled actions, loading state, backdrop behavior, Escape handling, and close transitions
* modal rendering through `ClientOnly`, `Teleport`, and Vue transition

---

## File structure

Current structure:

```txt
app/
  composables/
    useModal.ts

  plugins/
    modal.ts

  components/
    el/
      modal.vue

  app.vue
```

The modal component should be rendered once in `app.vue`:

```vue
<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <el-modal />
</template>
```

Because the component file is located at:

```txt
app/components/el/modal.vue
```

Nuxt auto-imports it as:

```vue
<el-modal />
```

---

## Core files

### `app/composables/useModal.ts`

This file contains:

* global modal state
* modal config types
* action config types
* message config types
* `open`
* `close`
* `update`
* `clearAfterClose`
* `getComponent`
* `message`

The composable returns a singleton API object. Every call to `useModal()` uses the same shared modal state.

```ts
const modal = useModal()

modal.open({...})
modal.close()
modal.update({...})
modal.message({...})
```

---

### `app/plugins/modal.ts`

This plugin injects the modal API into Nuxt:

```ts
const { $modal, $message } = useNuxtApp()

$modal.open({...})
$message({...})
```

It also adds TypeScript declarations for:

```ts
NuxtApp.$modal
NuxtApp.$message
this.$modal
this.$message
```

---

### `app/components/el/modal.vue`

This is the actual UI renderer.

It:

* renders only on the client through `ClientOnly`
* teleports the modal to `body`
* uses a Vue transition named `globalModalTransition`
* locks body scroll while the modal is open
* renders an optional header
* renders either a custom component or default title/description content
* renders modal actions as `el-button`
* handles backdrop click
* handles Escape key
* clears modal data only after the leave transition finishes

---

## Public API

Use the composable:

```ts
const modal = useModal()
```

Available methods:

```ts
modal.open(config)
modal.close()
modal.update(config)
modal.clearAfterClose()
modal.getComponent()
modal.message(options)
```

Usually, pages and components should only use:

```ts
modal.open()
modal.close()
modal.update()
modal.message()
```

`clearAfterClose()` is used internally by `modal.vue` after the close transition finishes.

---

## Nuxt injections

The plugin provides:

```ts
const { $modal, $message } = useNuxtApp()
```

Usage:

```ts
$modal.open({
  title: 'Delete item',
  descriptions: 'Are you sure?',
})
```

```ts
$message({
  type: 'success',
  message: 'Saved successfully.',
})
```

Options API components can also use:

```ts
this.$modal.open({...})
this.$message({...})
```

---

## Modal config shape

```ts
export type GlobalModalConfig = {
  header?: GlobalModalHeader | null
  title?: string
  description?: string
  descriptions?: string | string[]
  component?: Component | null
  props?: Record<string, any>
  actions?: GlobalModalAction[]
  options?: GlobalModalOptions
}
```

---

## Header config

```ts
export type GlobalModalHeader = {
  icon?: string
  title?: string
  subtitle?: string
  desc?: string
  closeButton?: boolean
  color?: string
}
```

Example:

```ts
modal.open({
  header: {
    icon: 'trash',
    title: 'Delete item',
    subtitle: 'This action is permanent',
    color: 'red',
  },
})
```

Header behavior:

* The header is rendered only when `header` exists.
* `icon` is rendered with `el-icon`.
* `title` is rendered as plain text.
* `subtitle` is preferred over `desc`.
* `color` controls the header icon color.
* The close button is shown by default.
* Set `closeButton: false` to hide the close button.

Example without close button:

```ts
modal.open({
  header: {
    title: 'Processing',
    closeButton: false,
  },
})
```

---

## Important i18n note

In the current implementation, modal text values are rendered as plain strings.

This means these fields are not automatically translated by `modal.vue`:

```ts
header.title
header.subtitle
header.desc
title
description
descriptions
action.label
```

So this:

```ts
modal.open({
  title: 'profile.messages.saved',
})
```

will currently display:

```txt
profile.messages.saved
```

not the translated value.

To show translated text in the current implementation, translate before passing the value:

```ts
const { t } = useI18n()

modal.open({
  title: t('profile.messages.saved'),
})
```

The only text translated directly inside `modal.vue` right now is the header close button label:

```ts
t('components.modal.actions.close')
```

---

## Required i18n key currently used by `modal.vue`

The modal close button uses:

```ts
components.modal.actions.close
```

Example locale entry:

```ts
export default {
  components: {
    modal: {
      actions: {
        close: 'Close',
      },
    },
  },
}
```

Persian example:

```ts
export default {
  components: {
    modal: {
      actions: {
        close: 'بستن',
      },
    },
  },
}
```

---

## Message default keys

The `message()` helper currently creates default titles and labels using these string values:

```ts
modal.titles.success
modal.titles.warning
modal.titles.error
modal.titles.info
modal.actions.ok
```

However, because `modal.vue` does not currently auto-translate modal text, these values may appear as raw keys unless the implementation is updated later or custom translated values are passed manually.

For example:

```ts
const { t } = useI18n()

$message({
  type: 'success',
  title: t('modal.titles.success'),
  message: t('profile.messages.saved'),
  actionLabel: t('modal.actions.ok'),
})
```

---

## Descriptions

The modal supports both a single description and multiple descriptions.

### Single description

```ts
modal.open({
  title: 'Warning',
  description: 'This action cannot be undone.',
})
```

Or:

```ts
modal.open({
  title: 'Warning',
  descriptions: 'This action cannot be undone.',
})
```

Both are normalized internally to an array.

### Multiple descriptions

```ts
modal.open({
  title: 'Warning',
  descriptions: [
    'This action cannot be undone.',
    'Please make sure before continuing.',
  ],
})
```

Falsy description items are filtered out.

---

## Actions

Every action is rendered as an `el-button`.

```ts
export type GlobalModalAction = {
  label: string
  icon?: string
  color?: string
  size?: number
  type?: string
  mode?: string
  center?: boolean
  close?: boolean
  disable?: boolean | (() => boolean)
  handler?: (helpers: GlobalModalActionHelpers) => void | boolean | Promise<void | boolean>
}
```

Example:

```ts
modal.open({
  title: 'Delete item',
  descriptions: 'Are you sure?',
  actions: [
    {
      label: 'Delete',
      icon: 'trash',
      color: 'red',
      size: 14,
      close: true,
    },
    {
      label: 'Cancel',
      icon: 'close-circle',
      color: 'normal',
      mode: 'flat',
      size: 14,
      close: true,
    },
  ],
})
```

Action rendering currently binds:

```vue
:label="action.label"
:icon="action.icon"
:color="action.color || 'prim'"
:size="action.size || 14"
:type="action.type"
:mode="action.mode"
:disable="isActionDisabled(action)"
```

Important rules:

* Use `icon`, not `ic`.
* `size` should be a number.
* Use `mode: 'flat'` for flat buttons.
* The UI kit uses `disable`, not `disabled`.
* `center` exists in the TypeScript type, but it is not currently bound in `modal.vue`.

---

## Action handlers

Action handlers receive helper methods:

```ts
export type GlobalModalActionHelpers = {
  close: () => void
  update: (config: Partial<GlobalModalConfig>) => void
  modal: GlobalModalConfig | null
}
```

Example:

```ts
modal.open({
  title: 'Save changes?',
  actions: [
    {
      label: 'Save',
      color: 'green',
      icon: 'tick-circle',
      size: 14,
      async handler({ close }) {
        await saveChanges()
        close()
      },
    },
  ],
})
```

---

## Auto close behavior

If an action has `close: true`, the modal closes after its handler finishes.

```ts
{
  label: 'Save',
  close: true,
  handler() {
    saveData()
  },
}
```

To prevent auto close, return `false` from the handler:

```ts
{
  label: 'Save',
  close: true,
  handler() {
    if (!formIsValid.value) {
      return false
    }

    saveData()
  },
}
```

If the handler throws an error, the error is logged and the modal does not continue to the auto-close step.

---

## Disabled actions

An action can be disabled with a boolean:

```ts
{
  label: 'Save',
  disable: true,
}
```

Or with a function:

```ts
{
  label: 'Save',
  disable: () => !formIsValid.value,
}
```

When modal loading is active, all actions are disabled automatically.

---

## Modal options

```ts
export type GlobalModalOptions = {
  width?: number | string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  blur?: boolean
  loading?: boolean | (() => boolean)
}
```

Default options:

```ts
{
  width: 594,
  closeOnBackdrop: true,
  closeOnEsc: true,
  persistent: false,
  blur: true,
  loading: false,
}
```

---

## Width

Width can be a number:

```ts
modal.open({
  options: {
    width: 720,
  },
})
```

This becomes:

```css
max-width: 720px;
```

Width can also be a CSS string:

```ts
modal.open({
  options: {
    width: 'min(720px, 100%)',
  },
})
```

The modal box also has this base width in CSS:

```css
width: calc(100% - 64px);
```

---

## Backdrop click

Backdrop click closes the modal by default.

```ts
modal.open({
  options: {
    closeOnBackdrop: true,
  },
})
```

Disable backdrop close:

```ts
modal.open({
  options: {
    closeOnBackdrop: false,
  },
})
```

Backdrop click is also blocked when:

```ts
persistent: true
```

or when:

```ts
loading: true
```

---

## Escape key

Escape closes the modal by default.

```ts
modal.open({
  options: {
    closeOnEsc: true,
  },
})
```

Disable Escape close:

```ts
modal.open({
  options: {
    closeOnEsc: false,
  },
})
```

Escape close is also blocked when:

```ts
persistent: true
```

or when:

```ts
loading: true
```

---

## Persistent modal

A persistent modal cannot be closed by backdrop click or Escape.

```ts
modal.open({
  options: {
    persistent: true,
  },
})
```

The header close button can still close the modal unless it is hidden or loading is active.

For fully blocking manual close, combine:

```ts
modal.open({
  header: {
    closeButton: false,
  },
  options: {
    persistent: true,
  },
})
```

---

## Backdrop blur

Backdrop blur is enabled by default.

```ts
modal.open({
  options: {
    blur: true,
  },
})
```

Disable blur:

```ts
modal.open({
  options: {
    blur: false,
  },
})
```

When blur is enabled, `modal.vue` adds this class:

```txt
hasBlur
```

and applies:

```css
backdrop-filter: blur(8px);
```

---

## Loading behavior

Loading can be a boolean:

```ts
modal.open({
  options: {
    loading: true,
  },
})
```

Or a function:

```ts
const pending = ref(false)

modal.open({
  options: {
    loading: () => pending.value,
  },
})
```

When loading is active:

* all actions are disabled
* the header close button is disabled
* backdrop click is ignored
* Escape key is ignored

Example:

```ts
const pending = ref(false)

modal.open({
  title: 'Delete item',
  descriptions: 'This action cannot be undone.',
  options: {
    loading: () => pending.value,
  },
  actions: [
    {
      label: 'Delete',
      color: 'red',
      icon: 'trash',
      size: 14,
      async handler({ close }) {
        pending.value = true

        try {
          await deleteItem()
          close()
        } finally {
          pending.value = false
        }
      },
    },
    {
      label: 'Cancel',
      color: 'normal',
      mode: 'flat',
      icon: 'close-circle',
      size: 14,
      close: true,
    },
  ],
})
```

---

## Custom component content

Use `component` and `props` to render custom content inside the modal.

```ts
import UserDetailsModal from '~/components/modals/UserDetailsModal.vue'

const modal = useModal()

modal.open({
  header: {
    icon: 'user',
    title: 'User details',
    subtitle: 'Full user information',
  },

  component: UserDetailsModal,

  props: {
    userId: selectedUserId.value,
  },

  actions: [
    {
      label: 'Close',
      color: 'normal',
      mode: 'flat',
      icon: 'close-circle',
      size: 14,
      close: true,
    },
  ],
})
```

The custom component receives `props` through `v-bind`.

Example custom component:

```vue
<template>
  <el-flex rules="ccs" class="w100" :gap="8">
    <el-text :size="16" :weight="700">
      User #{{ userId }}
    </el-text>

    <el-text :size="14" :weight="400" color="normal75">
      This content is rendered from a custom modal component.
    </el-text>
  </el-flex>
</template>

<script setup lang="ts">
defineProps<{
  userId: number | string
}>()
</script>
```

The custom component may emit `close`:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}
</script>
```

The global modal listens to this event and calls:

```ts
modalApi.close()
```

---

## Component storage behavior

Custom components are stored separately from `state.modal`.

Internally:

* the component is stored in a `shallowRef`
* the component is wrapped with `markRaw`
* `state.modal.component` is normalized to `null`
* `modal.getComponent()` returns the active component

This avoids making the Vue component object deeply reactive.

---

## Updating an open modal

Use `modal.update()` to update the current modal without closing it.

```ts
modal.update({
  title: 'New title',
  descriptions: 'New description',
})
```

`update()` does nothing when no modal is currently active.

---

## Update merge behavior

The current implementation uses special merge behavior for some fields.

### `header`

When `header` is provided, it is merged with the existing header:

```ts
modal.update({
  header: {
    title: 'Updated title',
  },
})
```

This keeps other existing header fields.

Current limitation:

* Passing `header: null` does not reliably clear the existing header during `update()`.
* To open a modal without a header, use `modal.open()` without a header.

### `props`

Props are merged:

```ts
modal.update({
  props: {
    userId: 2,
  },
})
```

### `options`

Options are merged:

```ts
modal.update({
  options: {
    loading: true,
  },
})
```

### `actions`

Actions are replaced only when the `actions` field exists in the update config:

```ts
modal.update({
  actions: [
    {
      label: 'Done',
      close: true,
    },
  ],
})
```

### `description` and `descriptions`

Descriptions are replaced only when their fields exist in the update config.

---

## Closing manually

```ts
const modal = useModal()

modal.close()
```

Or:

```ts
const { $modal } = useNuxtApp()

$modal.close()
```

Calling `close()` sets:

```ts
state.isOpen = false
```

The modal data is not cleared immediately. It is cleared after the leave transition finishes.

---

## Transition and cleanup behavior

When closing:

1. `modal.close()` sets `state.isOpen` to `false`.
2. The leave transition starts.
3. `modal.vue` waits for `@after-leave`.
4. `afterLeave()` calls `modalApi.clearAfterClose()`.
5. `state.modal` is set to `null`.
6. `activeComponent` is set to `null`.
7. `global-modal-open` is removed from `body`.

This prevents modal content from disappearing before the close animation finishes.

---

## Body scroll lock

When the modal opens, `modal.vue` adds this class to `body`:

```txt
global-modal-open
```

Global CSS:

```css
body.global-modal-open {
  overflow: hidden;
}
```

The class is removed:

* after the close transition finishes
* when the component is unmounted

---

## `$message`

Use `$message` for simple modal messages.

```ts
const { $message } = useNuxtApp()

$message({
  type: 'warning',
  message: 'No value was entered for this field.',
})
```

String shortcut:

```ts
$message('Operation completed.')
```

When a string is passed, the message type defaults to:

```ts
info
```

---

## Message options

```ts
export type GlobalMessageOptions = {
  type?: GlobalModalMessageType
  title?: string
  subtitle?: string
  message: string
  icon?: string
  actionLabel?: string
  actionColor?: string
  actionIcon?: string
  actionSize?: number
  width?: number | string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  blur?: boolean
}
```

Required field:

```ts
message
```

If `message` is missing or invalid, the helper logs a warning and does not open the modal.

---

## Message types

```ts
export type GlobalModalMessageType = 'success' | 'warning' | 'error' | 'info'
```

Default message metadata:

```ts
success: {
  icon: 'tick-circle',
  title: 'modal.titles.success',
  color: 'green',
}

warning: {
  icon: 'warning-2',
  title: 'modal.titles.warning',
  color: 'orange',
}

error: {
  icon: 'close-circle',
  title: 'modal.titles.error',
  color: 'red',
}

info: {
  icon: 'info-circle',
  title: 'modal.titles.info',
  color: 'blue',
}
```

If `type` is missing or invalid, it falls back to:

```ts
info
```

---

## Message action

`$message` always creates one close action.

Default action:

```ts
{
  label: finalOptions.actionLabel || 'modal.actions.ok',
  color: finalOptions.actionColor || typeConfig.color,
  icon: finalOptions.actionIcon || 'tick-circle',
  size: finalOptions.actionSize || 16,
  close: true,
}
```

The current `GlobalMessageOptions` type does not support `actionMode`.

---

## Message modal options

`$message` maps options like this:

```ts
options: {
  width: finalOptions.width || 480,
  closeOnBackdrop: finalOptions.closeOnBackdrop !== false,
  closeOnEsc: finalOptions.closeOnEsc !== false,
  persistent: !!finalOptions.persistent,
  blur: finalOptions.blur !== false,
}
```

`$message` does not currently support `loading`.

---

## Complete example: confirmation modal

```ts
const modal = useModal()

function showDeleteModal() {
  modal.open({
    header: {
      icon: 'trash',
      title: 'Delete item',
      subtitle: 'Remove from collection',
      color: 'red',
    },

    title: 'Are you sure you want to delete this item?',

    descriptions: [
      'This action cannot be undone.',
      'The item will be permanently removed.',
    ],

    actions: [
      {
        label: 'Delete',
        color: 'red',
        icon: 'trash',
        size: 14,
        async handler({ close }) {
          await deleteItem()
          close()
        },
      },
      {
        label: 'Cancel',
        color: 'normal',
        mode: 'flat',
        icon: 'close-circle',
        size: 14,
        close: true,
      },
    ],

    options: {
      width: 520,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  })
}
```

---

## Complete example: translated confirmation modal

Because the current modal renderer does not translate modal text automatically, translate values before passing them.

```ts
const modal = useModal()
const { t } = useI18n()

function showDeleteModal() {
  modal.open({
    header: {
      icon: 'trash',
      title: t('items.delete.title'),
      subtitle: t('items.delete.subtitle'),
      color: 'red',
    },

    title: t('items.delete.confirmTitle'),

    descriptions: [
      t('items.delete.description1'),
      t('items.delete.description2'),
    ],

    actions: [
      {
        label: t('items.delete.actions.delete'),
        color: 'red',
        icon: 'trash',
        size: 14,
        close: true,
      },
      {
        label: t('items.delete.actions.cancel'),
        color: 'normal',
        mode: 'flat',
        icon: 'close-circle',
        size: 14,
        close: true,
      },
    ],
  })
}
```

---

## Complete example: simple message

```ts
const { $message } = useNuxtApp()

$message({
  type: 'success',
  message: 'Saved successfully.',
})
```

---

## Complete example: translated message

```ts
const { $message } = useNuxtApp()
const { t } = useI18n()

$message({
  type: 'success',
  title: t('modal.titles.success'),
  message: t('profile.messages.saved'),
  actionLabel: t('modal.actions.ok'),
})
```

---

## UI components used by the modal

The modal currently uses these project UI components:

```txt
el-flex
el-button
el-icon
el-divider
el-text
```

Important usage notes:

* `el-button` receives `label`, `icon`, `color`, `size`, `type`, `mode`, `disable`, `p`, and `radius`.
* `el-button.size` should be numeric.
* Flat buttons should use `mode="flat"`.
* Icons use `icon`, not `ic`.
* Disabled state uses `disable`, not `disabled`.
* Text content is rendered with `el-text`.

---

## Current limitations

The current implementation has a few important limitations:

* Modal text is not automatically translated, except for the header close button.
* `$message` default titles and OK label are currently stored as i18n key strings, but they are not translated by `modal.vue`.
* `GlobalMessageOptions` does not support `actionMode`.
* `GlobalModalAction.center` exists in the type but is not currently used in the modal template.
* `modal.update({ header: null })` does not reliably remove an existing header because header updates are merged.
* There is no modal queue. Opening a new modal replaces the current modal.
* There is no focus trap or ARIA dialog metadata in the current `modal.vue`.

---

## Recommended usage rules

* Render `<el-modal />` once in `app.vue`.
* Use `useModal()` or `$modal` instead of building modal layouts manually in pages.
* Use `$message` only for simple informational messages.
* Use `modal.open()` for confirmations, delete dialogs, custom content, and forms.
* Use `component` and `props` for custom modal bodies.
* Use `options.loading` for async operations.
* Use `options.persistent` for critical operations.
* Translate text before passing it to the modal in the current implementation.
* Use `icon`, not `ic`.
* Use numeric button sizes.
* Use `mode: 'flat'` instead of old transparent color patterns.
* Use `disable`, not `disabled`.
