<script setup lang="ts">
import type {
  GlobalMenuPlacement,
  GlobalMenuResolvedAnchor,
} from '~/composables/useMenu'

const menuApi = useMenu()
const menuBox = ref<HTMLElement | null>(null)

const position = reactive({
  left: 0,
  top: 0,
  ready: false,
})

const activeComponent = computed(() => menuApi.getComponent())

const isOpen = computed(() => {
  return menuApi.state.isOpen && !!menuApi.state.menu
})

const menu = computed(() => {
  return menuApi.state.menu
})

const isDrawer = computed(() => {
  return menu.value?.mode === 'drawer'
})

function toCssSize(value?: number | string) {
  if (typeof value === 'number') return `${value}px`

  return value
}

function getOptions() {
  return menu.value?.options || {}
}

const drawerSide = computed(() => {
  return getOptions().drawerSide || 'right'
})

function getAnchor() {
  return menu.value?.anchor as GlobalMenuResolvedAnchor
}

function getAnchorRect() {
  const anchor = getAnchor()

  if (!anchor) return null

  return anchor.getBoundingClientRect()
}

const boxStyle = computed(() => {
  const currentMenu = menu.value
  const options = getOptions()
  const anchorRect = getAnchorRect()
  const safePadding = options.safePadding ?? 12

  if (currentMenu?.mode === 'drawer') {
    const width =
      toCssSize(options.width) ||
      'min(86vw, 340px)'

    const style: Record<string, string | number> = {
      top: '0px',
      bottom: '0px',
      zIndex: 1,
      visibility: position.ready ? 'visible' : 'hidden',
      opacity: position.ready ? 1 : 0,
      width,
      maxWidth: toCssSize(options.maxWidth) || 'min(92vw, 380px)',
      maxHeight: toCssSize(options.maxHeight) || '100vh',
      overflowY: 'auto',
    }

    if (options.minWidth) {
      style.minWidth = toCssSize(options.minWidth) || ''
    }

    if (drawerSide.value === 'left') {
      style.left = '0px'
    } else {
      style.right = '0px'
    }

    return style
  }

  const defaultMaxHeight =
    currentMenu?.mode === 'point'
      ? '50vh'
      : `calc(100vh - ${safePadding * 2}px)`

  const style: Record<string, string | number> = {
    left: `${position.left}px`,
    top: `${position.top}px`,
    zIndex: 1,
    visibility: position.ready ? 'visible' : 'hidden',
    opacity: position.ready ? 1 : 0,
    maxWidth:
      toCssSize(options.maxWidth) ||
      `calc(100vw - ${safePadding * 2}px)`,
    maxHeight:
      toCssSize(options.maxHeight) ||
      defaultMaxHeight,
    overflowY: 'auto',
  }

  if (options.width) {
    style.width = toCssSize(options.width) || ''
  } else if (
    currentMenu?.mode === 'dropdown' &&
    options.matchAnchorWidth &&
    anchorRect
  ) {
    style.width = `${anchorRect.width}px`
  }

  if (options.minWidth) {
    style.minWidth = toCssSize(options.minWidth) || ''
  }

  return style
})

const rootStyle = computed(() => {
  const options = getOptions()

  return {
    zIndex: options.zIndex ?? 1000,
    '--global-menu-drawer-shift':
      drawerSide.value === 'left'
        ? '-100%'
        : '100%',
  }
})

const layerStyle = computed(() => {
  return {
    zIndex: 0,
    background: isDrawer.value
      ? 'rgb(0 0 0 / 32%)'
      : 'transparent',
    backdropFilter: isDrawer.value
      ? 'blur(2px)'
      : 'none',
  }
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPointPosition(menuWidth: number, menuHeight: number) {
  const currentMenu = menu.value
  const options = getOptions()

  const safePadding = options.safePadding ?? 12
  const offset = options.offset ?? 8

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const baseX = currentMenu?.x ?? viewportWidth / 2
  const baseY = currentMenu?.y ?? viewportHeight / 2

  const left = clamp(
    baseX + offset,
    safePadding,
    viewportWidth - menuWidth - safePadding,
  )

  const top = clamp(
    baseY + offset,
    safePadding,
    viewportHeight - menuHeight - safePadding,
  )

  return {
    left,
    top,
  }
}

function getBaseDropdownPosition(
  placement: GlobalMenuPlacement,
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
) {
  const options = getOptions()
  const offset = options.offset ?? 8

  switch (placement) {
    case 'bottom-end':
      return {
        left: anchorRect.right - menuWidth,
        top: anchorRect.bottom + offset,
      }

    case 'top-start':
      return {
        left: anchorRect.left,
        top: anchorRect.top - menuHeight - offset,
      }

    case 'top-end':
      return {
        left: anchorRect.right - menuWidth,
        top: anchorRect.top - menuHeight - offset,
      }

    case 'right-start':
      return {
        left: anchorRect.right + offset,
        top: anchorRect.top,
      }

    case 'right-end':
      return {
        left: anchorRect.right + offset,
        top: anchorRect.bottom - menuHeight,
      }

    case 'left-start':
      return {
        left: anchorRect.left - menuWidth - offset,
        top: anchorRect.top,
      }

    case 'left-end':
      return {
        left: anchorRect.left - menuWidth - offset,
        top: anchorRect.bottom - menuHeight,
      }

    case 'bottom-start':
    default:
      return {
        left: anchorRect.left,
        top: anchorRect.bottom + offset,
      }
  }
}

function flipDropdownPlacement(
  placement: GlobalMenuPlacement,
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
) {
  const options = getOptions()
  const safePadding = options.safePadding ?? 12
  const offset = options.offset ?? 8

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const hasSpaceBelow =
    anchorRect.bottom + offset + menuHeight <=
    viewportHeight - safePadding

  const hasSpaceAbove =
    anchorRect.top - offset - menuHeight >=
    safePadding

  const hasSpaceRight =
    anchorRect.right + offset + menuWidth <=
    viewportWidth - safePadding

  const hasSpaceLeft =
    anchorRect.left - offset - menuWidth >=
    safePadding

  if (
    placement.startsWith('bottom') &&
    !hasSpaceBelow &&
    hasSpaceAbove
  ) {
    return placement.replace(
      'bottom',
      'top',
    ) as GlobalMenuPlacement
  }

  if (
    placement.startsWith('top') &&
    !hasSpaceAbove &&
    hasSpaceBelow
  ) {
    return placement.replace(
      'top',
      'bottom',
    ) as GlobalMenuPlacement
  }

  if (
    placement.startsWith('right') &&
    !hasSpaceRight &&
    hasSpaceLeft
  ) {
    return placement.replace(
      'right',
      'left',
    ) as GlobalMenuPlacement
  }

  if (
    placement.startsWith('left') &&
    !hasSpaceLeft &&
    hasSpaceRight
  ) {
    return placement.replace(
      'left',
      'right',
    ) as GlobalMenuPlacement
  }

  return placement
}

function getDropdownPosition(
  menuWidth: number,
  menuHeight: number,
) {
  const anchorRect = getAnchorRect()

  if (!anchorRect) {
    return getPointPosition(menuWidth, menuHeight)
  }

  const currentMenu = menu.value
  const options = getOptions()

  const safePadding = options.safePadding ?? 12

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const preferredPlacement =
    currentMenu?.placement ||
    'bottom-start'

  const placement = flipDropdownPlacement(
    preferredPlacement,
    anchorRect,
    menuWidth,
    menuHeight,
  )

  const basePosition = getBaseDropdownPosition(
    placement,
    anchorRect,
    menuWidth,
    menuHeight,
  )

  return {
    left: clamp(
      basePosition.left,
      safePadding,
      viewportWidth - menuWidth - safePadding,
    ),
    top: clamp(
      basePosition.top,
      safePadding,
      viewportHeight - menuHeight - safePadding,
    ),
  }
}

async function updatePosition() {
  if (!isOpen.value) return

  position.ready = false

  await nextTick()

  if (isDrawer.value) {
    position.left = 0
    position.top = 0
    position.ready = true
    return
  }

  await new Promise(resolve =>
    requestAnimationFrame(resolve),
  )

  const box = menuBox.value

  if (!box) {
    console.warn(
      '[el-global-menu] menuBox ref is null',
    )

    position.left = menu.value?.x || 12
    position.top = menu.value?.y || 12
    position.ready = true

    return
  }

  const rect = box.getBoundingClientRect()

  const menuWidth = rect.width || 180
  const menuHeight = rect.height || 40

  const nextPosition =
    menu.value?.mode === 'dropdown'
      ? getDropdownPosition(
          menuWidth,
          menuHeight,
        )
      : getPointPosition(
          menuWidth,
          menuHeight,
        )

  position.left = nextPosition.left
  position.top = nextPosition.top
  position.ready = true
}

function closeByOutside() {
  if (!isOpen.value) return
  if (getOptions().closeOnOutside === false) return

  menuApi.close()
}

function handleLayerContextMenu(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()

  closeByOutside()
}

function handleBoxContextMenu(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return
  if (event.key !== 'Escape') return
  if (getOptions().closeOnEsc === false) return

  menuApi.close()
}

function handleResize() {
  if (!isOpen.value) return
  if (getOptions().closeOnResize === false) return

  menuApi.close()
}

function handleScroll(event: Event) {
  if (!isOpen.value) return
  if (getOptions().closeOnScroll === false) return

  const target = event.target

  if (
    target instanceof Node &&
    menuBox.value &&
    menuBox.value.contains(target)
  ) {
    return
  }

  menuApi.close()
}

watch(
  () => [
    menuApi.state.isOpen,
    menuApi.state.version,
  ],
  async () => {
    if (isOpen.value) {
      await updatePosition()
      return
    }

    position.ready = false
  },
  {
    flush: 'post',
    immediate: true,
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
  window.addEventListener(
    'scroll',
    handleScroll,
    true,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener(
    'scroll',
    handleScroll,
    true,
  )

  menuApi.clear()
})
</script>

<template>
  <ClientOnly>
    <Teleport to="#teleports">
      <Transition
        :name="isDrawer
          ? 'globalDrawerTransition'
          : 'globalMenuTransition'"
        @after-leave="menuApi.clearAfterClose">
        <div
          v-if="isOpen"
          class="globalMenuRoot"
          data-el-overlay="menu"
          :style="rootStyle"
          @pointerdown.stop
          @click.stop
          @contextmenu.prevent.stop>

          <div
            class="globalMenuLayer"
            :class="{
              'globalMenuLayer--drawer': isDrawer,
            }"
            :style="layerStyle"
            @pointerdown.stop
            @click.stop="closeByOutside"
            @contextmenu="handleLayerContextMenu">
          </div>

          <div
            ref="menuBox"
            class="globalMenuBox bg-surface brs2 bc-normal25"
            :class="{
              'globalMenuBox--drawer': isDrawer,
            }"
            data-el-overlay="menu-box"
            :style="boxStyle"
            @pointerdown.stop
            @click.stop
            @contextmenu="handleBoxContextMenu">

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

<style scoped>
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

.globalMenuLayer--drawer {
  touch-action: none;
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

.globalMenuBox--drawer {
  border-radius: 0;
  overscroll-behavior: contain;
  box-shadow: 0 0 70px rgb(0 0 0 / 34%);
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

.globalDrawerTransition-enter-active,
.globalDrawerTransition-leave-active {
  transition: opacity 0.22s ease;
}

.globalDrawerTransition-enter-active .globalMenuBox--drawer,
.globalDrawerTransition-leave-active .globalMenuBox--drawer {
  transition: transform 0.28s cubic-bezier(.22, .8, .24, 1);
}

.globalDrawerTransition-enter-from,
.globalDrawerTransition-leave-to {
  opacity: 0;
}

.globalDrawerTransition-enter-from .globalMenuBox--drawer,
.globalDrawerTransition-leave-to .globalMenuBox--drawer {
  transform: translateX(var(--global-menu-drawer-shift));
}

.globalDrawerTransition-enter-to,
.globalDrawerTransition-leave-from {
  opacity: 1;
}

.globalDrawerTransition-enter-to .globalMenuBox--drawer,
.globalDrawerTransition-leave-from .globalMenuBox--drawer {
  transform: translateX(0);
}
</style>
