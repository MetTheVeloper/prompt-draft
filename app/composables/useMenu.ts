import { markRaw, reactive, shallowRef } from 'vue'
import type { Component, ComponentPublicInstance } from 'vue'

export type GlobalMenuMode = 'point' | 'dropdown'
export type GlobalMenuItemType = 'item' | 'divider' | 'header'
export type GlobalMenuPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'right-end'
  | 'left-start'
  | 'left-end'

export type GlobalMenuAnchor =
  | HTMLElement
  | SVGElement
  | ComponentPublicInstance
  | null

export type GlobalMenuResolvedAnchor =
  | HTMLElement
  | SVGElement
  | null

export type GlobalMenuPoint = {
  x: number
  y: number
}

export type GlobalMenuItemHelpers = {
  close: () => void
  update: (config: Partial<GlobalMenuConfig>) => void
  menu: GlobalMenuConfig | null
  item: GlobalMenuItem
}

export type GlobalMenuItem = {
  type?: GlobalMenuItemType

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

export type GlobalMenuOptions = {
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  maxHeight?: number | string

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

export type GlobalMenuConfig = {
  mode?: GlobalMenuMode

  event?: MouseEvent | PointerEvent
  x?: number
  y?: number

  anchor?: GlobalMenuAnchor
  placement?: GlobalMenuPlacement

  items?: GlobalMenuItem[]

  component?: Component | null
  props?: Record<string, any>

  options?: GlobalMenuOptions
}

type GlobalMenuState = {
  isOpen: boolean
  menu: GlobalMenuConfig | null
  version: number
}

const defaultMenu: Required<Omit<GlobalMenuConfig, 'event' | 'anchor' | 'component'>> & {
  event: undefined
  anchor: null
  component: null
} = {
  mode: 'point',

  event: undefined,
  x: 0,
  y: 0,

  anchor: null,
  placement: 'bottom-start',

  items: [],

  component: null,
  props: {},

  options: {
    width: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    maxHeight: undefined,
    
    offset: 8,
    safePadding: 12,

    closeOnOutside: true,
    closeOnEsc: true,
    closeOnScroll: true,
    closeOnResize: true,

    closeOnSelect: true,

    matchAnchorWidth: false,

    zIndex: 1000,
  },
}

const state = reactive<GlobalMenuState>({
  isOpen: false,
  menu: null,
  version: 0,
})

const activeComponent = shallowRef<Component | null>(null)

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function isClient() {
  return typeof window !== 'undefined'
}

function resolveAnchor(anchor?: GlobalMenuAnchor): GlobalMenuResolvedAnchor {
  if (!anchor || !isClient()) return null

  if (typeof Element !== 'undefined' && anchor instanceof Element) {
    return anchor as HTMLElement | SVGElement
  }

  const component = anchor as ComponentPublicInstance

  if (
    component.$el &&
    typeof Element !== 'undefined' &&
    component.$el instanceof Element
  ) {
    return component.$el as HTMLElement | SVGElement
  }

  return null
}

function getPointFromConfig(config: GlobalMenuConfig): GlobalMenuPoint {
  if (
    config.event &&
    typeof config.event.clientX === 'number' &&
    typeof config.event.clientY === 'number'
  ) {
    return {
      x: config.event.clientX,
      y: config.event.clientY,
    }
  }

  if (typeof config.x === 'number' && typeof config.y === 'number') {
    return {
      x: config.x,
      y: config.y,
    }
  }

  if (isClient()) {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }

  return {
    x: 0,
    y: 0,
  }
}

function inferMenuMode(config: GlobalMenuConfig, anchor: GlobalMenuResolvedAnchor): GlobalMenuMode {
  if (config.mode) return config.mode

  if (anchor) return 'dropdown'

  return 'point'
}

function hasMenuContent(config: GlobalMenuConfig) {
  return Boolean(config.component) || Boolean(config.items?.length)
}

function normalizeMenu(config: GlobalMenuConfig = {}): GlobalMenuConfig {
  const anchor = resolveAnchor(config.anchor)
  const point = getPointFromConfig(config)
  const mode = inferMenuMode(config, anchor)

  return {
    ...defaultMenu,
    ...config,

    mode,

    event: undefined,

    x: point.x,
    y: point.y,

    anchor: anchor
      ? markRaw(anchor)
      : null,

    placement: config.placement || defaultMenu.placement,

    items: Array.isArray(config.items)
      ? config.items
      : [],

    component: null,

    props: config.props || {},

    options: {
      ...defaultMenu.options,
      ...(config.options || {}),
    },
  }
}

function open(config: GlobalMenuConfig = {}) {
  if (!hasMenuContent(config)) {
    console.warn('[useMenu] برای باز کردن منو، items یا component الزامی است.')
    return
  }

  activeComponent.value = config.component
    ? markRaw(config.component)
    : null

  state.menu = normalizeMenu(config)
  state.isOpen = true
  state.version += 1
}

function close() {
  state.isOpen = false
  state.version += 1
}

function clear() {
  if (state.isOpen) return

  state.menu = null
  activeComponent.value = null
  state.version += 1
}

function clearAfterClose() {
  clear()
}

function update(config: Partial<GlobalMenuConfig> = {}) {
  if (!state.menu) return

  if (hasOwn(config, 'component')) {
    activeComponent.value = config.component
      ? markRaw(config.component)
      : null
  }

  const nextConfig: GlobalMenuConfig = {
    ...state.menu,
    ...config,

    props: {
      ...(state.menu.props || {}),
      ...(config.props || {}),
    },

    options: {
      ...(state.menu.options || {}),
      ...(config.options || {}),
    },

    items: hasOwn(config, 'items')
      ? config.items
      : state.menu.items,

    anchor: hasOwn(config, 'anchor')
      ? config.anchor
      : state.menu.anchor,

    x: hasOwn(config, 'x')
      ? config.x
      : state.menu.x,

    y: hasOwn(config, 'y')
      ? config.y
      : state.menu.y,

    event: hasOwn(config, 'event')
      ? config.event
      : undefined,

    placement: hasOwn(config, 'placement')
      ? config.placement
      : state.menu.placement,

    mode: hasOwn(config, 'mode')
      ? config.mode
      : state.menu.mode,
  }

  state.menu = normalizeMenu(nextConfig)
  state.version += 1
}

function getComponent() {
  return activeComponent.value
}

function isDividerItem(item: GlobalMenuItem) {
  return item.type === 'divider' || item.divider === true
}

function isHeaderItem(item: GlobalMenuItem) {
  return item.type === 'header'
}

function isInteractiveItem(item: GlobalMenuItem) {
  return !isDividerItem(item) && !isHeaderItem(item)
}

function isItemDisabled(item: GlobalMenuItem) {
  if (!item || !isInteractiveItem(item)) return true

  if (typeof item.disabled === 'function') {
    try {
      return item.disabled()
    } catch (error) {
      console.error('[useMenu] خطا در بررسی disabled آیتم منو:', error)
      return true
    }
  }

  return !!item.disabled
}

async function runItem(item: GlobalMenuItem) {
  if (!state.menu || !item || !isInteractiveItem(item) || isItemDisabled(item)) return

  let result: void | boolean

  try {
    result = await item.handler?.({
      close,
      update,
      menu: state.menu,
      item,
    })
  } catch (error) {
    console.error('[useMenu] خطا در اجرای handler آیتم منو:', error)
    return
  }

  const shouldClose =
    result !== false &&
    item.close !== false &&
    state.menu.options?.closeOnSelect !== false

  if (shouldClose) {
    close()
  }
}

const menuApi = {
  state,
  open,
  close,
  update,
  clear,
  clearAfterClose,
  getComponent,
  isItemDisabled,
  runItem,
}

export function useMenu() {
  return menuApi
}