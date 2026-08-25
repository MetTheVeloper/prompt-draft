import type { Component } from 'vue'
import type { GlobalMenuItem } from '~/composables/useMenu'

export type PageContextMenuOpenOptions = {
  items?: GlobalMenuItem[]
  fallbackItems?: GlobalMenuItem[]
  component?: Component | null
  props?: Record<string, any>
  minWidth?: number
  maxWidth?: number | string
  maxHeight?: number | string
  closeOnScroll?: boolean
  zIndex?: number
  respectIgnoreSelector?: boolean
}

const DEFAULT_CONTEXT_MENU_IGNORE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'option',
  'button',
  'a',
  '[contenteditable="true"]',
  '[data-native-context-menu]',
  '[data-page-context-menu-ignore]',
  '[data-el-overlay="menu"]',
  '[data-el-overlay="menu-box"]',
  '[data-el-overlay="modal"]',
].join(', ')

const MODULE_ENTITIES_CONTEXT_SELECTOR = '[data-module-entities-context]'
const MODULE_ENTITIES_OPEN_EVENT = 'prompt-draft-open-module-entities'

export function usePageContextMenu() {
  const { $menu } = useNuxtApp()

  function shouldIgnorePageContextMenu(event: MouseEvent) {
    const target = event.target as HTMLElement | null

    if (!target) return false

    return !!target.closest(DEFAULT_CONTEXT_MENU_IGNORE_SELECTOR)
  }

  function getModuleEntitiesContext(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    if (!target) return null

    return target.closest(MODULE_ENTITIES_CONTEXT_SELECTOR) as HTMLElement | null
  }

  function withModuleEntitiesAction(
    event: MouseEvent,
    sourceItems: GlobalMenuItem[],
  ) {
    const context = getModuleEntitiesContext(event)
    if (!context) return sourceItems

    const label = context.dataset.moduleEntitiesLabel || 'Named Configurations'
    const count = Number(context.dataset.moduleEntitiesCount || 0)
    const displayLabel = Number.isFinite(count) && count > 0
      ? `${label} (${count})`
      : label

    const item: GlobalMenuItem = {
      label: displayLabel,
      icon: 'layers',
      handler: () => {
        context.dispatchEvent(new CustomEvent(MODULE_ENTITIES_OPEN_EVENT))
      },
    }

    const items = [...sourceItems]
    const firstDividerIndex = items.findIndex((entry) => entry.type === 'divider')
    const insertIndex = firstDividerIndex >= 0 ? firstDividerIndex : items.length

    items.splice(insertIndex, 0, item)
    return items
  }

  function openPageContextMenu(
    event: MouseEvent,
    options: PageContextMenuOpenOptions = {},
  ) {
    if ((options.respectIgnoreSelector ?? true) && shouldIgnorePageContextMenu(event)) return false

    const baseItems = options.items?.length
      ? options.items
      : options.fallbackItems || []
    const items = withModuleEntitiesAction(event, baseItems)

    if (!items.length && !options.component) return false

    event.preventDefault()
    event.stopPropagation()

    $menu.open({
      mode: 'point',
      event,
      options: {
        minWidth: options.minWidth ?? 220,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        closeOnScroll: options.closeOnScroll ?? false,
        zIndex: options.zIndex,
      },
      items,
      component: options.component || null,
      props: options.props || {},
    })

    return true
  }

  return {
    shouldIgnorePageContextMenu,
    openPageContextMenu,
  }
}
