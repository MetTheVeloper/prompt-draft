# Global Color Picker

این فیچر یک کالرپیکر سفارشی مبتنی بر Component System پروژه است که داخل Global Menu رندر می‌شود و از طریق پلاگین مودال قابل فراخوانی است.

## فایل‌ها

- `app/components/el/color-picker.vue`
- `app/composables/useColorPicker.ts`
- `app/composables/useMenu.ts`
- `app/plugins/modal.ts`

## رفتار خروجی

فراخوانی کالرپیکر یک `Promise<string | null>` برمی‌گرداند:

- با زدن دکمه تأیید، رنگ انتخاب‌شده برگردانده می‌شود.
- با لغو، کلیک بیرون، Escape، بسته‌شدن API یا جایگزین‌شدن منو، مقدار `null` برمی‌گردد.
- وقتی `showAlpha: false` باشد خروجی به فرم `#RRGGBB` است.
- وقتی `showAlpha: true` باشد خروجی به فرم `#RRGGBBAA` است.

## استفاده در Context Menu

```vue
<script setup lang="ts">
const { $modal } = useNuxtApp()
const selectedColor = ref('#675CFF')

async function handleColorContextMenu(event: MouseEvent) {
  event.preventDefault()

  const color = await $modal.colorPicker({
    event,
    value: selectedColor.value,
    showAlpha: true,
    presets: [
      '#000000',
      '#FFFFFF',
      '#EF4444',
      '#22C55E',
      '#3B82F6',
      '#675CFF',
    ],
    presetsLabel: 'رنگ‌های پیشنهادی',
    confirmLabel: 'تأیید',
    cancelLabel: 'لغو',
  })

  if (!color) return

  selectedColor.value = color
  // هر تصمیم دیگری که به رنگ انتخاب‌شده وابسته است اینجا انجام می‌شود.
}
</script>

<template>
  <div @contextmenu.prevent="handleColorContextMenu">
    برای انتخاب رنگ راست‌کلیک کنید
  </div>
</template>
```

## استفاده به‌صورت Dropdown متصل به یک دکمه

```vue
<script setup lang="ts">
const { $modal } = useNuxtApp()
const triggerRef = ref<HTMLElement | null>(null)
const selectedColor = ref('#675CFF')

async function openColorPicker() {
  const color = await $modal.colorPicker({
    anchor: triggerRef.value,
    mode: 'dropdown',
    placement: 'bottom-start',
    value: selectedColor.value,
    confirmLabel: 'تأیید',
    cancelLabel: 'لغو',
  })

  if (color) {
    selectedColor.value = color
  }
}
</script>

<template>
  <div ref="triggerRef">
    <el-button label="انتخاب رنگ" icon="color-swatch" @click="openColorPicker" />
  </div>
</template>
```

## فراخوانی کوتاه

برای حالتی که فقط رنگ اولیه مهم است:

```ts
const color = await $modal.colorPicker('#675CFF')
```

همچنین alias مستقیم پلاگین در دسترس است:

```ts
const { $colorPicker } = useNuxtApp()
const color = await $colorPicker({
  event,
  value: '#675CFF',
})
```

## گزینه‌ها

```ts
type ColorPickerMenuOptions = {
  value?: string
  defaultColor?: string

  event?: MouseEvent | PointerEvent
  x?: number
  y?: number
  anchor?: HTMLElement | SVGElement | ComponentPublicInstance | null
  placement?:
    | 'bottom-start'
    | 'bottom-end'
    | 'top-start'
    | 'top-end'
    | 'right-start'
    | 'right-end'
    | 'left-start'
    | 'left-end'
  mode?: 'point' | 'dropdown'

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
```

## استفاده مستقیم از کامپوننت

کامپوننت به دلیل قرارگرفتن در `app/components/el/color-picker.vue` با نام `el-color-picker` قابل استفاده است:

```vue
<el-color-picker
  v-model="selectedColor"
  :show-alpha="true"
  :presets="palette"
  confirm-label="تأیید"
  cancel-label="لغو"
  @confirm="handleConfirm"
  @cancel="handleCancel"
/>
```

## نکته درباره `useMenu`

در این پچ، `useMenu.close()` یک reason اختیاری می‌پذیرد و `GlobalMenuConfig` نیز callback جدید `onClose` دارد. این تغییر backward-compatible است؛ فراخوانی‌های قبلی `close()` همچنان بدون تغییر کار می‌کنند.

reasonهای پشتیبانی‌شده:

```ts
type GlobalMenuCloseReason =
  | 'api'
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'outside'
  | 'escape'
  | 'scroll'
  | 'resize'
  | 'replace'
```

در صورت تمایل، کامپوننت اصلی Global Menu می‌تواند دلیل دقیق بسته‌شدن را هم ارسال کند:

```ts
menuApi.close('outside')
menuApi.close('escape')
menuApi.close('scroll')
menuApi.close('resize')
```

این reasonها روی نتیجه کالرپیکر اثر متفاوتی ندارند و در همه این حالت‌ها نتیجه `null` است، اما برای لاگ، analytics یا رفتارهای آینده مفید هستند.
