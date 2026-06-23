# Global Modal System for Nuxt 4

This document describes the centralized modal system used in the Nuxt 4 project. It is intended to be reusable project documentation so that future work can use the existing modal API consistently.

The system provides:

- a single global modal component rendered once in `app.vue`
- a composable API via `useModal()`
- Nuxt injections via `$modal` and `$message`
- localized default modal titles and action labels
- support for default text content and custom modal components
- support for actions, async handlers, loading states, disabled actions, transitions, backdrop behavior, and Escape handling

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

The modal component is registered once in `app.vue`:

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

## UI components used by the modal

The Nuxt 4 project uses custom UI components:

```txt
el-flex
el-button
el-icon
el-divider
el-text
```

Important UI rules:

- `el-flex` has the same prop behavior as the older `zee-flex`.
- `el-button` has similar props to the old `zee-btn`, but its `size` prop only accepts numbers.
- `el-button` does not use a `trans` color. For flat/transparent buttons, use `mode="flat"`.
- Icons use the `icon` prop only. The old `ic` key is not used in this project.
- `el-icon` props:
  - `icon: string`
  - `size: number`
  - `color: string`
- Text should be rendered with `el-text` where possible.
- `el-text` props:
  - `size: number`
  - `weight: number`
  - `color: string`

---

## Core idea

Pages and components should not build modal layouts directly. They should call the central API:

```ts
const modal = useModal()

modal.open({...})
modal.close()
modal.update({...})
modal.message({...})
```

Or use Nuxt injections:

```ts
const { $modal, $message } = useNuxtApp()

$modal.open({...})
$message({...})
```

In Options API components, this also works:

```ts
this.$modal.open({...})
this.$message({...})
```

---

## Simple messages with `$message`

Use `$message` for simple feedback messages, similar to toast behavior, but displayed as a modal.

### Basic usage

```ts
const { $message } = useNuxtApp()

$message({
  type: 'warning',
  message: 'No value was entered for this field.',
})
```

### String shortcut

```ts
const { $message } = useNuxtApp()

$message('Operation completed.')
```

When a string is passed directly, the message type defaults to `info`.

### Using `useModal()`

```ts
const modal = useModal()

modal.message({
  type: 'success',
  message: 'Data was saved successfully.',
})
```

---

## `$message` options

```ts
$message({
  type: 'success' | 'warning' | 'error' | 'info',
  title: 'Optional title or i18n key',
  subtitle: 'Optional subtitle or i18n key',
  message: 'Required message text or i18n key',
  icon: 'optional-icon-name',
  actionLabel: 'Optional button label or i18n key',
  actionColor: 'green',
  actionMode: 'flat',
  actionIcon: 'tick-circle',
  actionSize: 16,
  width: 480,
  closeOnBackdrop: true,
  closeOnEsc: true,
  persistent: false,
  blur: true,
})
```

The only required field is:

```ts
message
```

If `type` is missing or invalid, it defaults to:

```ts
info
```

The message action always closes the modal. It does not run custom logic.

---

## Default message types

The default message metadata should use i18n keys for titles:

```ts
success:
  icon: 'tick-circle'
  title: 'modal.titles.success'
  color: 'green'

warning:
  icon: 'warning-2'
  title: 'modal.titles.warning'
  color: 'orange'

error:
  icon: 'close-circle'
  title: 'modal.titles.error'
  color: 'red'

info:
  icon: 'info-circle'
  title: 'modal.titles.info'
  color: 'blue'
```

The default confirmation button label should also be an i18n key:

```ts
modal.actions.ok
```

---

## Required i18n keys

The project uses i18n, so the modal system should use translation keys for default system text.

Example English locale:

```ts
export default {
  modal: {
    titles: {
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      info: 'Information',
    },
    actions: {
      ok: 'OK',
      close: 'Close',
      cancel: 'Cancel',
      delete: 'Delete',
    },
  },
}
```

Example Persian locale:

```ts
export default {
  modal: {
    titles: {
      success: 'موفقیت',
      warning: 'هشدار',
      error: 'خطا',
      info: 'اطلاع‌رسانی',
    },
    actions: {
      ok: 'باشه',
      close: 'بستن',
      cancel: 'انصراف',
      delete: 'حذف',
    },
  },
}
```

The modal component should translate text only when the provided value is a valid i18n key. Literal strings should remain unchanged.

Recommended helper inside `app/components/el/modal.vue`:

```ts
const { t, te } = useI18n()

function translate(value?: string) {
  if (!value) return ''

  return te(value) ? t(value) : value
}
```

Use it for:

- header title
- header subtitle
- default content title
- default descriptions
- button labels

---

## Opening a full modal with `modal.open`

Use `modal.open` for confirmations, delete dialogs, custom content, forms, and advanced modal layouts.

```ts
const modal = useModal()

modal.open({
  header: {
    icon: 'trash',
    title: 'Delete item',
    subtitle: 'Remove from list',
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
      handler: () => {
        // delete item
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

## Full `modal.open` config shape

```ts
modal.open({
  header: {
    icon: 'trash',
    title: 'Header title or i18n key',
    subtitle: 'Header subtitle or i18n key',
    desc: 'Alternative subtitle or i18n key',
    closeButton: true,
    color: 'red',
  },

  title: 'Main title or i18n key',

  description: 'Single description string or i18n key',

  descriptions: [
    'First description or i18n key',
    'Second description or i18n key',
  ],

  component: CustomModalComponent,

  props: {
    id: 123,
  },

  actions: [
    {
      label: 'Button label or i18n key',
      icon: 'tick-circle',
      color: 'blue',
      mode: undefined,
      size: 14,
      type: undefined,
      close: false,
      disable: false,
      handler: ({ close, update, modal }) => {},
    },
  ],

  options: {
    width: 594,
    closeOnBackdrop: true,
    closeOnEsc: true,
    persistent: false,
    blur: true,
    loading: false,
  },
})
```

---

## Header config

```ts
header: {
  icon?: string
  title?: string
  subtitle?: string
  desc?: string
  closeButton?: boolean
  color?: string
}
```

Notes:

- Use `icon`, not `ic`.
- `title`, `subtitle`, and `desc` may be literal strings or i18n keys.
- `color` is used for the header icon.
- If `closeButton` is `false`, the close button is hidden.

---

## Descriptions

The system supports both string and array descriptions.

### Single string

```ts
modal.open({
  title: 'Warning',
  descriptions: 'This action cannot be undone.',
})
```

Or:

```ts
modal.open({
  title: 'Warning',
  description: 'This action cannot be undone.',
})
```

### Array

```ts
modal.open({
  title: 'Warning',
  descriptions: [
    'This action cannot be undone.',
    'Please make sure before continuing.',
  ],
})
```

Descriptions can also be i18n keys.

---

## Actions

Every action becomes one `el-button`.

```ts
{
  label: 'Delete',
  color: 'red',
  icon: 'trash',
  size: 14,
  close: false,
  handler: () => {
    // custom logic
  },
}
```

Supported action fields:

```ts
label: string
icon?: string
color?: string
mode?: string
size?: number
type?: string
close?: boolean
disable?: boolean | (() => boolean)
handler?: Function
```

Important rules:

- Use `icon`, not `ic`.
- `size` must be a number.
- Do not use `color: 'trans'`.
- For transparent/flat buttons, use `mode: 'flat'`.
- The UI kit uses `disable`, not `disabled`.

---

## Flat/cancel action example

Old Vue 2 pattern:

```ts
{
  label: 'Cancel',
  color: 'trans',
  icon: 'close',
  close: true,
}
```

Nuxt 4 pattern:

```ts
{
  label: 'modal.actions.cancel',
  color: 'normal',
  mode: 'flat',
  icon: 'close-circle',
  size: 14,
  close: true,
}
```

---

## Closing the modal from an action

If an action only closes the modal:

```ts
{
  label: 'modal.actions.cancel',
  color: 'normal',
  mode: 'flat',
  icon: 'close-circle',
  size: 14,
  close: true,
}
```

If an action has a handler and `close: true`, the modal closes after the handler finishes, unless the handler returns `false`.

```ts
{
  label: 'Save',
  color: 'green',
  icon: 'tick-circle',
  size: 14,
  close: true,
  handler: () => {
    if (!formIsValid.value) return false

    saveData()
  },
}
```

---

## Action handler helpers

Action handlers receive a helpers object:

```ts
handler: ({ close, update, modal }) => {
  close()
}
```

Helpers:

```ts
close: () => void
update: (config) => void
modal: GlobalModalConfig | null
```

Using helpers is optional. This is also valid:

```ts
handler: () => {
  deleteItem()
}
```

---

## Async actions

Handlers can be async:

```ts
{
  label: 'Delete',
  color: 'red',
  icon: 'trash',
  size: 14,
  async handler() {
    await deleteItem()

    const modal = useModal()
    modal.close()
  },
}
```

Or with helpers:

```ts
{
  label: 'Save',
  color: 'green',
  icon: 'tick-circle',
  size: 14,
  async handler({ close }) {
    await saveData()
    close()
  },
}
```

---

## Disabling actions

An action can be disabled with a boolean:

```ts
{
  label: 'Save',
  color: 'green',
  size: 14,
  disable: true,
}
```

Or with a function:

```ts
{
  label: 'Save',
  color: 'green',
  size: 14,
  disable: () => !formIsValid.value,
}
```

If `options.loading` is active, all actions are disabled.

---

## Loading behavior

The Nuxt 4 modal uses `options.loading`.

### Boolean loading

```ts
modal.open({
  title: 'Delete',
  descriptions: 'Are you sure?',
  options: {
    loading: true,
  },
})
```

### Reactive loading

If the loading state is reactive, prefer passing a function:

```ts
const pending = ref(false)

modal.open({
  title: 'Delete',
  descriptions: 'Are you sure?',

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
  ],
})
```

When loading is active:

- actions are disabled
- the close button is disabled
- clicking the backdrop does not close the modal
- pressing Escape does not close the modal

---

## Modal options

```ts
options: {
  width: 594,
  closeOnBackdrop: true,
  closeOnEsc: true,
  persistent: false,
  blur: true,
  loading: false,
}
```

### width

```ts
options: {
  width: 720,
}
```

Or:

```ts
options: {
  width: 'min(720px, 100%)',
}
```

### closeOnBackdrop

If `false`, clicking the backdrop does not close the modal.

```ts
options: {
  closeOnBackdrop: false,
}
```

### closeOnEsc

If `false`, pressing Escape does not close the modal.

```ts
options: {
  closeOnEsc: false,
}
```

### persistent

If `true`, the modal cannot be closed by backdrop click or Escape.

```ts
options: {
  persistent: true,
}
```

### blur

If `false`, backdrop blur is disabled.

```ts
options: {
  blur: false,
}
```

---

## Custom component content

Use `component` and `props` for custom modal layouts.

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
      label: 'modal.actions.close',
      color: 'normal',
      mode: 'flat',
      icon: 'close-circle',
      size: 14,
      close: true,
    },
  ],
})
```

Custom component example:

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

The central `el-modal` listens to `close` and calls `modalApi.close`.

---

## Updating an open modal

Use `modal.update` to update the current modal without closing it.

```ts
const modal = useModal()

modal.update({
  title: 'New title',
  descriptions: 'New description',
})
```

Example:

```ts
modal.open({
  title: 'Processing',
  descriptions: 'Please wait...',
  options: {
    persistent: true,
  },
})

await doSomething()

modal.update({
  title: 'Done',
  descriptions: 'The operation finished successfully.',
  actions: [
    {
      label: 'modal.actions.ok',
      color: 'green',
      icon: 'tick-circle',
      size: 14,
      close: true,
    },
  ],
  options: {
    persistent: false,
  },
})
```

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

---

## Transition and cleanup behavior

When `close()` is called:

1. `state.isOpen` becomes `false`.
2. The leave transition runs.
3. After the transition finishes, `clearAfterClose()` runs.
4. The modal data and active component are cleared.

This prevents the content from disappearing abruptly during the close animation.

---

## Recommended `useModal.ts` changes for this project

The Nuxt 4 project should not keep Vue 2 compatibility fields such as `ic`, string sizes, or `trans` colors.

Recommended action type:

```ts
export type GlobalModalAction = {
  label: string
  icon?: string
  color?: string
  mode?: string
  size?: number
  type?: string
  close?: boolean
  disable?: boolean | (() => boolean)
  handler?: (helpers: GlobalModalActionHelpers) => void | boolean | Promise<void | boolean>
}
```

Recommended header type:

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

Recommended message options:

```ts
export type GlobalMessageOptions = {
  type?: GlobalModalMessageType
  title?: string
  subtitle?: string
  message: string
  icon?: string
  actionLabel?: string
  actionColor?: string
  actionMode?: string
  actionIcon?: string
  actionSize?: number
  width?: number | string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  blur?: boolean
}
```

Recommended message action default:

```ts
actions: [
  {
    label: finalOptions.actionLabel || 'modal.actions.ok',
    color: finalOptions.actionColor || typeConfig.color,
    mode: finalOptions.actionMode,
    icon: finalOptions.actionIcon || 'tick-circle',
    size: finalOptions.actionSize || 16,
    close: true,
  },
]
```

---

## Recommended `modal.vue` changes for this project

The Nuxt 4 modal should:

- remove all `ic` fallbacks
- bind `mode` to `el-button`
- translate text with `useI18n`
- use numeric button sizes
- use `el-text` for text rendering
- fix the CSS selector `.title, .desc`

Important template patterns:

```vue
<el-text
  :size="16"
  :weight="700"
  v-if="modal.header.title"
>
  {{ translate(modal.header.title) }}
</el-text>
```

```vue
<el-button
  v-for="(action, index) in modal.actions"
  :key="index"
  :label="translate(action.label)"
  :icon="action.icon"
  :color="action.color || 'prim'"
  :mode="action.mode"
  :size="action.size || 14"
  :type="action.type"
  :disable="isActionDisabled(action)"
  :p="[8, 12]"
  :radius="8"
  @click="runAction(action)"
/>
```

CSS fix:

```css
.title,
.desc {
  line-height: 2;
}
```

---

## Complete example: delete item

```ts
const modal = useModal()
const pending = ref(false)

function showDeleteModal(itemName: string) {
  modal.open({
    header: {
      icon: 'trash',
      title: 'Delete item',
      subtitle: 'Remove from collection',
      color: 'red',
    },

    title: `Are you sure you want to delete ${itemName}?`,

    descriptions: 'This action cannot be undone.',

    options: {
      loading: () => pending.value,
      width: 520,
    },

    actions: [
      {
        label: 'modal.actions.delete',
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
        label: 'modal.actions.cancel',
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

## Complete example: warning message

```ts
const { $message } = useNuxtApp()

$message({
  type: 'warning',
  message: 'No value was entered for this field.',
})
```

---

## Complete example: localized message

```ts
const { $message } = useNuxtApp()

$message({
  type: 'success',
  title: 'modal.titles.success',
  message: 'profile.messages.saved',
  actionLabel: 'modal.actions.ok',
})
```

If `profile.messages.saved` exists in i18n messages, it will be translated by the modal component. If it does not exist, the literal string will be displayed.

---

## Notes for future development

- The central modal component lives at `app/components/el/modal.vue`.
- It is rendered once in `app.vue` as `<el-modal />`.
- The modal API lives in `app/composables/useModal.ts`.
- `$modal` and `$message` are injected from `app/plugins/modal.ts`.
- Use `$message` for simple informational modals.
- Use `modal.open` for confirmations, delete dialogs, forms, and custom content.
- Use `component` and `props` for custom modal layouts.
- Use `options.loading` or `options.persistent` for critical operations.
- For reactive loading, prefer `loading: () => pending.value`.
- Use `icon`, not `ic`.
- Use numeric `size` for buttons.
- Use `mode: 'flat'` instead of `color: 'trans'`.
- Use `el-text` for text rendering.
- Use `el-divider` instead of a plain `.line-hor` divider.
- Header layout is implemented manually with `el-flex`, `el-icon`, and `el-text`; there is no `title-row` in the Nuxt 4 project.
