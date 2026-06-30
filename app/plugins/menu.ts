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