import type { GlobalMenuItem } from '~/composables/useMenu'

export type PageContextMenuOpenOptions = {
  items?: GlobalMenuItem[]
  fallbackItems?: GlobalMenuItem[]
  minWidth?: number
  maxWidth?: number | string
  closeOnScroll?: boolean
  zIndex?: number
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

export function usePageContextMenu() {
  const { $menu } = useNuxtApp()

  function shouldIgnorePageContextMenu(event: MouseEvent) {
    const target = event.target as HTMLElement | null

    if (!target) return false

    return !!target.closest(DEFAULT_CONTEXT_MENU_IGNORE_SELECTOR)
  }

  function openPageContextMenu(
    event: MouseEvent,
    options: PageContextMenuOpenOptions = {},
  ) {
    if (shouldIgnorePageContextMenu(event)) return false

    const items = options.items?.length
      ? options.items
      : options.fallbackItems || []

    if (!items.length) return false

    event.preventDefault()
    event.stopPropagation()

    $menu.open({
      mode: 'point',
      event,
      options: {
        minWidth: options.minWidth ?? 220,
        maxWidth: options.maxWidth,
        closeOnScroll: options.closeOnScroll ?? false,
        zIndex: options.zIndex,
      },
      items,
    })

    return true
  }

  return {
    shouldIgnorePageContextMenu,
    openPageContextMenu,
  }
}
