import type { GlobalMessageOptions, GlobalModalConfig } from '~/composables/useModal'

export default defineNuxtPlugin(() => {
  const modal = useModal()

  return {
    provide: {
      modal,
      message: modal.message,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $modal: ReturnType<typeof useModal>
    $message: (options: GlobalMessageOptions | string) => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $modal: ReturnType<typeof useModal>
    $message: (options: GlobalMessageOptions | string) => void
  }
}

export type {
  GlobalModalConfig,
  GlobalMessageOptions,
}