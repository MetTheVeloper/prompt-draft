# Global Menu System for Nuxt 4

This document describes the current global menu system used in the Prompt Draft Nuxt 4 project.

The menu system is a lightweight centralized overlay system for:

* dropdown menus
* right-click context menus
* floating point menus
* action menus
* future select/option dropdowns
* future custom menu components

The public API is available as:

```ts
const { $menu } = useNuxtApp()
```

The system is separate from the global modal system.

Unlike modal, menu does not:

* lock body scroll
* dim the full page visually
* center content
* behave like a blocking dialog

It does:

* render globally through a single renderer
* use `Teleport`
* support dropdown positioning relative to an anchor element
* support point positioning relative to cursor/click position
* calculate safe viewport position
* close on outside click
* close on Escape
* close on scroll/resize based on options
* support item-based menus
* support future custom component menus

---

## Current file structure

```txt
app/
  composables/
    useMenu.ts

  plugins/
    menu.ts

  components/
    el/
      global-menu.vue
      menu-list.vue

  app.vue
```

Important naming decision:

```txt
el-global-menu.vue
```

is used instead of:

```txt
el-menu.vue
```

because `el-menu` can conflict with other UI libraries or component resolvers.

The public API is still named:

```ts
$menu
useMenu()
```

---

## Mounting the global renderer

The global renderer must be mounted once in `app.vue`.

Current `app.vue` pattern:

```vue
<template>
  <NuxtLoadingIndicator />

  <Transition name="appBootLoader">
    <div
      v-if="!isAppMounted"
      class="appBootLoader"
      aria-label="Loading application"
    >
      <div class="appBootLoader__content">
        <div class="appBootLoader__logo">
          PROMPT DRAFT
        </div>

        <div class="appBootLoader__spinner" />
      </div>
    </div>
  </Transition>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <el-variable-fab />

  <el-global-menu />
  <el-modal />
</template>
```

`<el-global-menu />` should be rendered globally, usually near `<el-modal />`.

---

## Teleport target

The current renderer uses:

```vue
<Teleport to="#teleports">
```

This means menu content appears inside Nuxt's teleport container:

```html
<div id="teleports"></div>
```

Earlier versions used:

```vue
<Teleport to="body">
```

But the current working implementation uses `#teleports`.

---

## Public API

Use the menu API through Nuxt injection:

```ts
const { $menu } = useNuxtApp()
```

Available methods:

```ts
$menu.open(config)
$menu.close()
$menu.update(config)
$menu.clear()
$menu.clearAfterClose()
$menu.getComponent()
$menu.isItemDisabled(item)
$menu.runItem(item)
```

Most components should only use:

```ts
$menu.open()
$menu.close()
$menu.update()
```

`clearAfterClose`, `runItem`, and `isItemDisabled` are mostly used internally by `el-global-menu.vue` and `el-menu-list.vue`.

---

## Plugin

Current plugin path:

```txt
app/plugins/menu.ts
```

Purpose:

* creates the singleton menu API with `useMenu()`
* injects it into Nuxt as `$menu`
* exposes TypeScript support for `NuxtApp.$menu`
* exposes Options API support for `this.$menu`

Recommended shape:

```ts
import type { GlobalMenuConfig } from '~/composables/useMenu'

export default defineNuxtPlugin(() => {
  const menu = useMenu()

  return {
    provide: {
      menu,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $menu: ReturnType<typeof useMenu>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $menu: ReturnType<typeof useMenu>
  }
}

export type {
  GlobalMenuConfig,
}
```

Usage:

```ts
const { $menu } = useNuxtApp()

$menu.open({
  mode: 'dropdown',
  anchor: event.currentTarget as HTMLElement,
  items: [
    {
      label: 'Edit',
      icon: 'edit-2',
      handler: () => console.log('edit'),
    },
  ],
})
```

---

## Core composable

Current composable path:

```txt
app/composables/useMenu.ts
```

The composable owns:

* global menu state
* menu config types
* menu item types
* menu options
* component storage
* config normalization
* item execution
* disabled item handling
* open/close/update/clear behavior

The state is singleton-based, similar to the global modal system.

---

## Menu modes

The system currently supports two modes:

```ts
export type GlobalMenuMode = 'point' | 'dropdown'
```

---

## Dropdown mode

Dropdown mode attaches the menu to an element.

Use it for:

* button action menus
* more menus
* profile menus
* language menus
* future select/dropdown components

Example:

```ts
function openTestMenu(event: MouseEvent) {
  $menu.open({
    mode: 'dropdown',
    anchor: event.currentTarget as HTMLElement,
    placement: 'bottom-start',
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Edit',
        icon: 'edit-2',
        handler: () => console.log('edit'),
      },
      {
        label: 'Duplicate',
        icon: 'copy',
        description: 'Make a duplicate',
        handler: () => console.log('duplicate'),
      },
      {
        divider: true,
      },
      {
        label: 'Delete',
        icon: 'trash',
        color: 'red',
        handler: () => console.log('delete'),
      },
    ],
  })
}
```

Template example:

```vue
<el-button
  label="Open menu"
  icon="more"
  :size="16"
  mode="flat"
  @click="openTestMenu"
/>
```

---

## Point mode / context menu

Point mode opens the menu near a screen coordinate.

Use it for:

* right-click context menus
* cursor-position menus
* floating menus
* canvas-like interactions

Example:

```ts
function openTestContextMenu(event: MouseEvent) {
  event.preventDefault()

  $menu.open({
    mode: 'point',
    event,
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Point menu',
        icon: 'mouse-circle',
        description: 'Opened at cursor position',
        active: true,
        handler: () => console.log('point menu'),
      },
      {
        label: 'Copy position',
        icon: 'copy',
        handler: () => {
          console.log({
            x: event.clientX,
            y: event.clientY,
          })
        },
      },
      {
        divider: true,
      },
      {
        label: 'Close',
        icon: 'close-circle',
        color: 'red',
        close: true,
      },
    ],
  })
}
```

Template example:

```vue
<el-button
  label="Open menu"
  icon="more"
  :size="16"
  mode="flat"
  @click="openTestMenu"
  @contextmenu.prevent="openTestContextMenu"
/>
```

Result:

* left click opens dropdown mode under/near the button
* right click opens point mode near cursor position

---

## Menu placement

Dropdown mode supports these placements:

```ts
export type GlobalMenuPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'right-end'
  | 'left-start'
  | 'left-end'
```

Default placement:

```ts
'bottom-start'
```

Example:

```ts
$menu.open({
  mode: 'dropdown',
  anchor: event.currentTarget as HTMLElement,
  placement: 'bottom-end',
  items,
})
```

The renderer tries the requested placement first.

If there is not enough room, it can flip the placement:

```txt
bottom → top
top → bottom
right → left
left → right
```

Then it clamps the final position inside the viewport.

---

## Safe positioning

The global menu calculates a safe position after render.

Reason:

The actual menu width and height are unknown until the DOM is rendered.

Current flow:

1. open menu
2. render hidden menu
3. wait for `nextTick`
4. wait for `requestAnimationFrame`
5. measure `menuBox.getBoundingClientRect()`
6. calculate safe position
7. set `left` and `top`
8. set `position.ready = true`

Current behavior:

* menu never overflows viewport intentionally
* menu is clamped using `safePadding`
* dropdown mode uses anchor rect
* point mode uses click/cursor coordinate
* if measurement fails, fallback dimensions are used

Important implementation note:

`requestAnimationFrame` was required to make measurement reliable.

---

## Menu options

Current options type:

```ts
export type GlobalMenuOptions = {
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string

  offset?: number
  safePadding?: number

  closeOnOutside?: boolean
  closeOnEsc?: boolean
  closeOnScroll?: boolean
  closeOnResize?: boolean

  closeOnSelect?: boolean

  matchAnchorWidth?: boolean

  zIndex?: number
}
```

Default options:

```ts
{
  offset: 8,
  safePadding: 12,

  closeOnOutside: true,
  closeOnEsc: true,
  closeOnScroll: true,
  closeOnResize: true,

  closeOnSelect: true,

  matchAnchorWidth: false,

  zIndex: 1000,
}
```

---

## Important option: `closeOnScroll`

By default, menu closes on scroll.

For initial testing, this option was disabled:

```ts
options: {
  closeOnScroll: false,
}
```

This is useful when testing on layouts that may fire scroll events unexpectedly.

For production dropdowns, default behavior can remain:

```ts
closeOnScroll: true
```

For menus that should stay open while internal content scrolls, this can be configured later.

---

## Important option: `zIndex`

The root menu overlay receives the main z-index.

Current renderer uses:

```ts
const rootStyle = computed(() => {
  const options = getOptions()

  return {
    zIndex: options.zIndex ?? 1000,
  }
})
```

Layer and box use relative z-index inside the isolated root.

This fixed visibility/stacking issues.

---

## Root stacking context

`el-global-menu.vue` uses:

```css
.globalMenuRoot {
  position: fixed;
  inset: 0;
  pointer-events: none;
  isolation: isolate;
}
```

Important details:

* `position: fixed` covers the viewport
* `pointer-events: none` prevents the root from blocking interaction by itself
* `isolation: isolate` creates a safe stacking context
* child layer and box re-enable pointer events

---

## Global menu layer

The invisible layer is responsible for outside click handling.

```css
.globalMenuLayer {
  position: fixed;
  inset: 0;
  background: transparent;
  pointer-events: auto;
}
```

It does not visually dim or blur the page.

Clicking this layer calls:

```ts
closeByOutside()
```

Unless:

```ts
closeOnOutside: false
```

---

## Global menu box

Current template uses the project theme utility classes:

```vue
<div
  ref="menuBox"
  class="globalMenuBox bg-surface brs2 bc-normal25"
  :style="boxStyle"
  @pointerdown.stop
  @click.stop
>
  ...
</div>
```

Current CSS:

```css
.globalMenuBox {
  position: fixed;
  width: max-content;
  min-width: 180px;
  border-radius: 14px;
  box-shadow: 0 18px 60px rgb(0 0 0 / 40%);
  overflow: hidden;
  pointer-events: auto;
}
```

The box style is intentionally integrated with the project theme system:

```txt
bg-surface
brs2
bc-normal25
```

This makes the menu match light/dark theme automatically.

---

## Current `el-global-menu.vue` template

Current working template:

```vue
<template>
  <ClientOnly>
    <Teleport to="#teleports">
      <Transition
        name="globalMenuTransition"
        @after-leave="menuApi.clearAfterClose"
      >
        <div
          v-if="isOpen"
          class="globalMenuRoot"
          :style="rootStyle"
        >
          <div
            class="globalMenuLayer"
            :style="layerStyle"
            @pointerdown="closeByOutside"
          />

          <div
            ref="menuBox"
            class="globalMenuBox bg-surface brs2 bc-normal25"
            :style="boxStyle"
            @pointerdown.stop
            @click.stop
          >
            <component
              :is="activeComponent"
              v-if="activeComponent"
              v-bind="menu?.props || {}"
              @close="menuApi.close"
            />

            <el-menu-list
              v-else
              :items="menu?.items || []"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
```

---

## Current `el-global-menu.vue` CSS

```css
.globalMenuRoot {
  position: fixed;
  inset: 0;
  pointer-events: none;
  isolation: isolate;
}

.globalMenuLayer {
  position: fixed;
  inset: 0;
  background: transparent;
  pointer-events: auto;
}

.globalMenuBox {
  position: fixed;
  width: max-content;
  min-width: 180px;
  border-radius: 14px;
  box-shadow: 0 18px 60px rgb(0 0 0 / 40%);
  overflow: hidden;
  pointer-events: auto;
}

.globalMenuTransition-enter-active,
.globalMenuTransition-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.globalMenuTransition-enter-from,
.globalMenuTransition-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.globalMenuTransition-enter-to,
.globalMenuTransition-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

---

## Current item UI

Current item renderer path:

```txt
app/components/el/menu-list.vue
```

The menu list uses existing project UI components:

```txt
el-grid
el-button
el-divider
```

This keeps the menu aligned with the existing design system.

The menu item is rendered through `el-button`.

Benefits:

* less custom CSS
* project direction support through `rules`
* theme consistency
* built-in hover effect
* built-in disabled behavior
* icon and label alignment handled by existing button

---

## Current `el-menu-list.vue`

Current working version:

```vue
<script setup lang="ts">
import type { GlobalMenuItem } from '~/composables/useMenu'

const props = withDefaults(
  defineProps<{
    items?: GlobalMenuItem[]
  }>(),
  {
    items: () => [],
  },
)

const menuApi = useMenu()

function isDisabled(item: GlobalMenuItem) {
  return menuApi.isItemDisabled(item)
}

function isActive(item: GlobalMenuItem) {
  return !!item.active
}

function getItemMode(item: GlobalMenuItem) {
  return isActive(item) ? 'normal' : 'flat'
}

function getItemColor(item: GlobalMenuItem) {
  if (isDisabled(item)) return 'normal'

  if (isActive(item)) return 'blue'

  return item.color || 'normal'
}

function getItemEffect(item: GlobalMenuItem) {
  if (isDisabled(item)) return undefined

  return {
    color: isActive(item) ? 'normal25' : item.color || 'blue50',
  }
}

async function handleItemClick(item: GlobalMenuItem) {
  await menuApi.runItem(item)
}
</script>

<template>
  <el-grid :gap="0" :p="6" class="w100">
    <template
      v-for="(item, index) in props.items"
      :key="`${item.value ?? item.label ?? 'menu-item'}-${index}`"
    >
      <el-divider
        v-if="item.divider"
        class="mb2 mt2"
      />

      <el-grid
        v-else-if="item.description"
        :gap="2"
        class="w100"
      >
        <el-button
          class="w100"
          rules="rsc"
          :label="item.label || ''"
          :icon="item.icon"
          :size="16"
          :sublabel="item.description"
          :mode="getItemMode(item)"
          :color="getItemColor(item)"
          :effect="getItemEffect(item)"
          :disable="isDisabled(item)"
          :radius="10"
          :p="[8, 10]"
          @click="handleItemClick(item)"
        />
      </el-grid>

      <el-button
        v-else
        class="w100"
        rules="rsc"
        :label="item.label || ''"
        :icon="item.icon"
        :size="16"
        :mode="getItemMode(item)"
        :color="getItemColor(item)"
        :effect="getItemEffect(item)"
        :disable="isDisabled(item)"
        :radius="10"
        :p="[8, 10]"
        @click="handleItemClick(item)"
      />
    </template>
  </el-grid>
</template>
```

---

## Menu item type

Current item type:

```ts
export type GlobalMenuItem = {
  label?: string
  icon?: string
  color?: string
  description?: string
  value?: string | number | boolean
  active?: boolean
  divider?: boolean
  disabled?: boolean | (() => boolean)
  close?: boolean
  handler?: (helpers: GlobalMenuItemHelpers) => void | boolean | Promise<void | boolean>
}
```

---

## Menu item helpers

Handlers receive helpers:

```ts
export type GlobalMenuItemHelpers = {
  close: () => void
  update: (config: Partial<GlobalMenuConfig>) => void
  menu: GlobalMenuConfig | null
  item: GlobalMenuItem
}
```

Example:

```ts
{
  label: 'Delete',
  icon: 'trash',
  color: 'red',
  async handler({ close }) {
    await deleteItem()
    close()
  },
}
```

---

## Item close behavior

By default, clicking an item closes the menu.

The menu stays open when:

```ts
item.close === false
```

or when handler returns:

```ts
false
```

or when global option says:

```ts
closeOnSelect: false
```

Example:

```ts
{
  label: 'Keep open',
  icon: 'setting',
  close: false,
  handler() {
    console.log('menu stays open')
  },
}
```

Example with validation:

```ts
{
  label: 'Apply',
  icon: 'tick-circle',
  close: true,
  handler() {
    if (!isValid.value) return false

    apply()
  },
}
```

---

## Disabled items

Item can be disabled with boolean:

```ts
{
  label: 'Disabled action',
  disabled: true,
}
```

Or with function:

```ts
{
  label: 'Save',
  disabled: () => !formIsValid.value,
}
```

Disabled items:

* render as disabled through `el-button`
* do not run handlers
* do not close menu

---

## Divider items

Divider item:

```ts
{
  divider: true,
}
```

Current UI:

```vue
<el-divider
  v-if="item.divider"
  class="mb2 mt2"
/>
```

---

## Active items

Active item:

```ts
{
  label: 'Point menu',
  active: true,
}
```

Current visual behavior in `menu-list.vue`:

```ts
function getItemMode(item: GlobalMenuItem) {
  return isActive(item) ? 'normal' : 'flat'
}

function getItemColor(item: GlobalMenuItem) {
  if (isDisabled(item)) return 'normal'

  if (isActive(item)) return 'blue'

  return item.color || 'normal'
}
```

Active item receives:

```txt
mode: normal
color: blue
effect: normal25
```

---

## Item colors

Menu item can set color:

```ts
{
  label: 'Delete',
  icon: 'trash',
  color: 'red',
}
```

Current color behavior:

* active items use blue
* disabled items use normal
* custom color is passed to `el-button`
* hover effect uses item color when available

```ts
function getItemEffect(item: GlobalMenuItem) {
  if (isDisabled(item)) return undefined

  return {
    color: isActive(item) ? 'normal25' : item.color || 'blue50',
  }
}
```

---

## Description / sublabel

Menu item can include description:

```ts
{
  label: 'Duplicate',
  icon: 'copy',
  description: 'Make a duplicate',
}
```

Current renderer passes it to `el-button` as:

```vue
:sublabel="item.description"
```

This keeps item layout compact and consistent with the existing button system.

---

## Component-based menu content

The system supports future custom component content.

Config shape:

```ts
$menu.open({
  mode: 'dropdown',
  anchor: event.currentTarget as HTMLElement,
  component: CustomMenuComponent,
  props: {
    value,
    onChange,
  },
})
```

The renderer supports:

```vue
<component
  :is="activeComponent"
  v-if="activeComponent"
  v-bind="menu?.props || {}"
  @close="menuApi.close"
/>
```

A custom menu component may emit:

```ts
emit('close')
```

to close the menu.

Example future usage:

```ts
import ColorPickerMenu from '~/components/menus/ColorPickerMenu.vue'

$menu.open({
  mode: 'dropdown',
  anchor: event.currentTarget as HTMLElement,
  placement: 'bottom-start',
  options: {
    width: 320,
  },
  component: ColorPickerMenu,
  props: {
    value: selectedColor.value,
    onChange(color: string) {
      selectedColor.value = color
      $menu.close()
    },
  },
})
```

---

## Width behavior

Options support:

```ts
width?: number | string
minWidth?: number | string
maxWidth?: number | string
```

Number values become pixel strings.

Example:

```ts
$menu.open({
  options: {
    width: 260,
  },
  items,
})
```

CSS result:

```css
width: 260px;
```

String values are passed directly:

```ts
$menu.open({
  options: {
    width: 'min(320px, calc(100vw - 24px))',
  },
  items,
})
```

---

## `matchAnchorWidth`

This option is designed for future select/dropdown usage.

Example:

```ts
$menu.open({
  mode: 'dropdown',
  anchor: selectButton.value,
  placement: 'bottom-start',
  options: {
    matchAnchorWidth: true,
  },
  component: SelectOptionsMenu,
  props: {
    options,
    modelValue,
  },
})
```

When enabled, the menu width matches the anchor width.

---

## Closing behavior

The menu closes when:

* `$menu.close()` is called
* user clicks outside the menu
* user presses Escape
* user selects an item
* window resizes, unless disabled
* page scrolls, unless disabled

The menu does not close when:

* user clicks inside the menu
* item is disabled
* item handler returns `false`
* item has `close: false`
* global `closeOnSelect` is false
* related close option is disabled

---

## Escape behavior

Escape closes the menu by default.

Disable:

```ts
$menu.open({
  options: {
    closeOnEsc: false,
  },
  items,
})
```

---

## Outside click behavior

Outside click closes the menu by default.

Disable:

```ts
$menu.open({
  options: {
    closeOnOutside: false,
  },
  items,
})
```

The outside layer is transparent and does not visually affect the page.

---

## Scroll and resize behavior

By default:

```ts
closeOnScroll: true
closeOnResize: true
```

During testing, `closeOnScroll` was set to false:

```ts
options: {
  closeOnScroll: false,
}
```

Future improvement:

Instead of closing on scroll/resize, the menu can optionally recalculate position.

Possible future option:

```ts
repositionOnScroll?: boolean
repositionOnResize?: boolean
```

---

## Current tested examples

### Dropdown test

```ts
function openTestMenu(event: MouseEvent) {
  $menu.open({
    mode: 'dropdown',
    anchor: event.currentTarget as HTMLElement,
    placement: 'bottom-start',
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Edit',
        icon: 'edit-2',
        handler: () => console.log('edit'),
      },
      {
        label: 'Duplicate',
        icon: 'copy',
        description: 'Make a duplicate',
        handler: () => console.log('duplicate'),
      },
      {
        divider: true,
      },
      {
        label: 'Delete',
        icon: 'trash',
        color: 'red',
        handler: () => console.log('delete'),
      },
    ],
  })

  console.log('menu state:', $menu.state.isOpen, $menu.state.menu)
}
```

### Context menu test

```ts
function openTestContextMenu(event: MouseEvent) {
  event.preventDefault()

  $menu.open({
    mode: 'point',
    event,
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Point menu',
        icon: 'mouse-circle',
        description: 'Opened at cursor position',
        active: true,
        handler: () => console.log('point menu'),
      },
      {
        label: 'Copy position',
        icon: 'copy',
        handler: () => {
          console.log({
            x: event.clientX,
            y: event.clientY,
          })
        },
      },
      {
        divider: true,
      },
      {
        label: 'Close',
        icon: 'close-circle',
        color: 'red',
        close: true,
      },
    ],
  })

  console.log('context menu state:', $menu.state.isOpen, $menu.state.menu)
}
```

### Template test

```vue
<el-button
  label="Open menu"
  icon="more"
  :size="16"
  mode="flat"
  @click="openTestMenu"
  @contextmenu.prevent="openTestContextMenu"
/>
```

Tested behavior:

* left click opens dropdown attached to button
* right click opens point menu at cursor
* menu matches project light/dark theme
* active item works
* color item works
* description/sublabel works
* divider works
* outside click closes
* item click closes
* position calculation works

---

## Debug notes from implementation

During implementation, these issues were found and fixed:

### 1. Renderer was mounted correctly but menu was not visible

`$menu.open()` worked and state was correct.

`el-global-menu` was mounted.

The position log showed that the box was measured:

```txt
[el-global-menu] positioned:
{
  mode: 'dropdown',
  left: 639.328125,
  top: 586,
  width: 180,
  height: 146,
  ready: true
}
```

The issue was related to teleport target and stacking/z-index behavior.

### 2. `Teleport to="body"` did not show content inside `#teleports`

This was expected behavior.

The renderer was changed to:

```vue
<Teleport to="#teleports">
```

### 3. Root needed z-index and isolated stacking context

Final fix:

```css
.globalMenuRoot {
  position: fixed;
  inset: 0;
  pointer-events: none;
  isolation: isolate;
}
```

and root receives:

```ts
zIndex: options.zIndex ?? 1000
```

### 4. Box position needed reliable DOM measurement

`updatePosition()` was improved with:

```ts
await nextTick()
await new Promise(resolve => requestAnimationFrame(resolve))
```

This made measurement reliable.

---

## Difference from modal

Menu and modal are separate systems.

Modal:

* centered
* blocking
* can lock body scroll
* can show header/actions/content
* used for confirmations and dialogs

Menu:

* lightweight
* position-based
* does not lock scroll
* does not dim page
* used for context menus/dropdowns/select options
* should feel like part of UI controls, not a dialog

---

## Future select usage

The menu system was designed to support custom select/dropdown components later.

Possible future select implementation:

```ts
$menu.open({
  mode: 'dropdown',
  anchor: selectButton.value,
  placement: 'bottom-start',
  options: {
    matchAnchorWidth: true,
    closeOnScroll: false,
  },
  component: SelectOptionsMenu,
  props: {
    options,
    modelValue,
    onSelect(value) {
      emit('update:modelValue', value)
      $menu.close()
    },
  },
})
```

This would allow all project selects/dropdowns to share:

* one overlay system
* one positioning system
* one outside click behavior
* one Escape behavior
* one z-index strategy
* one theme-compatible visual layer

---

## Future improvements

Recommended next steps:

1. Remove debug console logs from test usage.
2. Add keyboard navigation for menu items.
3. Add ARIA roles:

   * `role="menu"`
   * `role="menuitem"`
   * `aria-disabled`
   * `aria-expanded` on triggers where needed
4. Add optional `repositionOnScroll`.
5. Add optional `repositionOnResize`.
6. Add nested/submenu support if needed.
7. Add selected/checkmark UI if `active` needs a dedicated indicator.
8. Add support for keyboard focus management.
9. Add `id` field to `GlobalMenuItem` if needed.
10. Add `shortcut` field for menu item keyboard shortcut labels.
11. Add `to` field if menu items should support navigation through `el-button`.
12. Add docs for custom component menu examples.
13. Build first real use case in project UI.
14. Later use this system to replace repeated select/option dropdown logic.

---

## Recommended current usage rules

* Use `$menu.open()` for all temporary menus.
* Use `mode: 'dropdown'` when the menu is attached to a UI element.
* Use `mode: 'point'` for context menus and cursor-based menus.
* Use `items` for simple menus.
* Use `component + props` for advanced custom menus.
* Use `closeOnScroll: false` during testing if scroll events close menu unexpectedly.
* Keep `<el-global-menu />` mounted once in `app.vue`.
* Keep menu rendering separate from modal rendering.
* Use existing UI components like `el-button`, `el-grid`, and `el-divider` for visual consistency.
* Prefer theme utility classes over hardcoded colors.
