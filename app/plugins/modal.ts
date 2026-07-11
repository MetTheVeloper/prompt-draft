import { useModal } from '~/composables/useModal'
import type { GlobalMessageOptions, GlobalModalConfig } from '~/composables/useModal'
import { useColorPicker } from '~/composables/useColorPicker'
import type { ColorPickerMenuOptions, ColorPickerResult } from '~/composables/useColorPicker'

export type GlobalColorPicker = (
  options?: ColorPickerMenuOptions | string,
) => Promise<ColorPickerResult>

export type GlobalModalApi = ReturnType<typeof useModal> & {
  colorPicker: GlobalColorPicker
}

export default defineNuxtPlugin(() => {
  const modal = useModal()
  const colorPickerApi = useColorPicker()
  const colorPicker: GlobalColorPicker = options => colorPickerApi.open(options)
  const modalApi = Object.assign(modal, { colorPicker }) as GlobalModalApi

  return {
    provide: {
      modal: modalApi,
      message: modal.message,
      colorPicker,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $modal: GlobalModalApi
    $message: (options: GlobalMessageOptions | string) => void
    $colorPicker: GlobalColorPicker
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $modal: GlobalModalApi
    $message: (options: GlobalMessageOptions | string) => void
    $colorPicker: GlobalColorPicker
  }
}

export type {
  GlobalModalConfig,
  GlobalMessageOptions,
  ColorPickerMenuOptions,
  ColorPickerResult,
}
