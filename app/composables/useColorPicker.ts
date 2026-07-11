import ColorPicker from '~/components/el/color-picker.vue'
import { useMenu } from '~/composables/useMenu'
import type {
  GlobalMenuAnchor,
  GlobalMenuMode,
  GlobalMenuOptions,
  GlobalMenuPlacement,
} from '~/composables/useMenu'

export type ColorPickerResult = string | null

export type ColorPickerMenuOptions = {
  value?: string
  defaultColor?: string

  event?: MouseEvent | PointerEvent
  x?: number
  y?: number
  anchor?: GlobalMenuAnchor
  placement?: GlobalMenuPlacement
  mode?: GlobalMenuMode

  presets?: string[]
  showPresets?: boolean
  showAlpha?: boolean
  showInput?: boolean

  presetsLabel?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmIcon?: string
  cancelIcon?: string

  width?: number | string
  menuOptions?: GlobalMenuOptions
}

function normalizeOptions(options?: ColorPickerMenuOptions | string): ColorPickerMenuOptions {
  if (typeof options === 'string') {
    return { value: options }
  }

  return options || {}
}

export function useColorPicker() {
  const menu = useMenu()

  function open(options?: ColorPickerMenuOptions | string): Promise<ColorPickerResult> {
    const config = normalizeOptions(options)

    return new Promise((resolve) => {
      let settled = false

      function finish(value: ColorPickerResult) {
        if (settled) return

        settled = true
        resolve(value)
      }

      function handleConfirm(value: string) {
        finish(value)
        menu.close('confirm')
      }

      function handleCancel() {
        finish(null)
        menu.close('cancel')
      }

      menu.open({
        mode: config.mode,
        event: config.event,
        x: config.x,
        y: config.y,
        anchor: config.anchor,
        placement: config.placement || 'bottom-start',
        component: ColorPicker,
        props: {
          modelValue: config.value,
          defaultColor: config.defaultColor,
          presets: config.presets,
          showPresets: config.showPresets,
          showAlpha: config.showAlpha,
          showInput: config.showInput,
          presetsLabel: config.presetsLabel,
          confirmLabel: config.confirmLabel,
          cancelLabel: config.cancelLabel,
          confirmIcon: config.confirmIcon,
          cancelIcon: config.cancelIcon,
          width: config.width,
          onConfirm: handleConfirm,
          onCancel: handleCancel,
        },
        options: {
          width: config.width || 280,
          minWidth: config.width || 280,
          maxWidth: 'calc(100vw - 24px)',
          closeOnSelect: false,
          ...config.menuOptions,
        },
        onClose: () => finish(null),
      })
    })
  }

  return {
    open,
  }
}
