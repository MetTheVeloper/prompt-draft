<template>
  <el-flex
    rules="ccs"
    class="elColorPicker"
    :gap="12"
    :style="pickerStyle"
  >
    <el-flex rules="ccs" class="w100" :gap="8">
      <div
        ref="saturationPlane"
        class="elColorPickerPlane"
        :style="planeStyle"
        role="slider"
        aria-label="Color saturation and brightness"
        :aria-valuetext="selectedColor"
        tabindex="0"
        @pointerdown="startPlaneDrag"
        @pointermove="movePlaneDrag"
        @pointerup="stopPlaneDrag"
        @pointercancel="stopPlaneDrag"
        @keydown="handlePlaneKeydown"
      >
        <span class="elColorPickerPlaneWhite" />
        <span class="elColorPickerPlaneBlack" />
        <span class="elColorPickerCursor" :style="cursorStyle" />
      </div>

      <el-flex rules="rsc" class="w100" :gap="10">
        <span class="elColorPickerPreview" :style="previewStyle" />

        <el-flex rules="ccs" class="elColorPickerSliders" :gap="8">
          <input
            v-model.number="hue"
            class="elColorPickerRange elColorPickerHue"
            type="range"
            min="0"
            max="360"
            step="1"
            aria-label="Hue"
          >

          <input
            v-if="showAlpha"
            v-model.number="alphaPercent"
            class="elColorPickerRange elColorPickerAlpha"
            :style="alphaRangeStyle"
            type="range"
            min="0"
            max="100"
            step="1"
            aria-label="Opacity"
          >
        </el-flex>
      </el-flex>
    </el-flex>

    <el-flex v-if="showInput" rules="rsc" class="w100" :gap="8">
      <el-text-field
        class="elColorPickerInput"
        :model-value="inputValue"
        :placeholder="showAlpha ? '#RRGGBBAA' : '#RRGGBB'"
        spellcheck="false"
        autocomplete="off"
        @update:modelValue="handleInput"
        @blur="commitInput"
        @keydown.enter.prevent="commitInput"
      />

      <el-text :size="11" :weight="500" color="normal60">
        {{ colorMeta }}
      </el-text>
    </el-flex>

    <el-flex v-if="showPresets && normalizedPresets.length" rules="ccs" class="w100" :gap="6">
      <el-text :size="11" :weight="600" color="normal60">
        {{ presetsLabel }}
      </el-text>

      <el-flex rules="rsc" class="w100 fw elColorPickerPresets" :gap="6">
        <button
          v-for="preset in normalizedPresets"
          :key="preset"
          type="button"
          class="elColorPickerPreset"
          :class="{ isActive: colorsEqual(preset, selectedColor) }"
          :style="{ background: preset }"
          :aria-label="preset"
          :title="preset"
          @click="selectPreset(preset)"
        />
      </el-flex>
    </el-flex>

    <el-divider />

    <el-flex rules="rbc" class="w100" :gap="8">
      <el-button
        :label="cancelLabel"
        :icon="cancelIcon"
        color="normal"
        mode="flat"
        :size="13"
        :p="[8, 12]"
        :radius="8"
        @click="emitCancel"
      />

      <el-button
        :label="confirmLabel"
        :icon="confirmIcon"
        color="prim"
        :size="13"
        :p="[8, 12]"
        :radius="8"
        @click="emitConfirm"
      />
    </el-flex>
  </el-flex>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type RgbaColor = {
  r: number
  g: number
  b: number
  a: number
}

type HsvaColor = {
  h: number
  s: number
  v: number
  a: number
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    defaultColor?: string
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
  }>(),
  {
    modelValue: '',
    defaultColor: '#675CFF',
    presets: () => [
      '#000000',
      '#FFFFFF',
      '#EF4444',
      '#F97316',
      '#EAB308',
      '#22C55E',
      '#06B6D4',
      '#3B82F6',
      '#675CFF',
      '#A855F7',
      '#EC4899',
    ],
    showPresets: true,
    showAlpha: false,
    showInput: true,
    presetsLabel: 'Presets',
    confirmLabel: 'Apply',
    cancelLabel: 'Cancel',
    confirmIcon: 'check_circle',
    cancelIcon: 'cancel',
    width: 280,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'confirm', value: string): void
  (event: 'cancel'): void
}>()

const saturationPlane = ref<HTMLElement | null>(null)
const isPlaneDragging = ref(false)
const hue = ref(0)
const saturation = ref(0)
const brightness = ref(100)
const alpha = ref(1)
const inputValue = ref('')

const pickerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  maxWidth: '100%',
}))

const alphaPercent = computed({
  get: () => Math.round(alpha.value * 100),
  set: (value: number) => {
    alpha.value = clamp(value, 0, 100) / 100
  },
})

const hsva = computed<HsvaColor>(() => ({
  h: normalizeHue(hue.value),
  s: clamp(saturation.value, 0, 100),
  v: clamp(brightness.value, 0, 100),
  a: clamp(alpha.value, 0, 1),
}))

const rgba = computed(() => hsvaToRgba(hsva.value))

const selectedColor = computed(() => rgbaToHex(rgba.value, props.showAlpha))

const planeStyle = computed(() => ({
  backgroundColor: `hsl(${normalizeHue(hue.value)} 100% 50%)`,
}))

const cursorStyle = computed(() => ({
  left: `${clamp(saturation.value, 0, 100)}%`,
  top: `${100 - clamp(brightness.value, 0, 100)}%`,
  background: rgbaToHex({ ...rgba.value, a: 1 }, false),
}))

const previewStyle = computed(() => ({
  background: checkerBackground(selectedColor.value),
}))

const alphaRangeStyle = computed(() => {
  const opaque = rgbaToHex({ ...rgba.value, a: 1 }, false)

  return {
    background: `linear-gradient(90deg, transparent, ${opaque}), ${checkerPattern()}`,
  }
})

const colorMeta = computed(() => {
  const { r, g, b } = rgba.value
  const opacity = Math.round(alpha.value * 100)

  return props.showAlpha
    ? `rgba(${r}, ${g}, ${b}, ${opacity}%)`
    : `rgb(${r}, ${g}, ${b})`
})

const normalizedPresets = computed(() => {
  const unique = new Set<string>()

  for (const preset of props.presets) {
    const parsed = parseColor(preset)

    if (!parsed) continue
    unique.add(rgbaToHex(parsed, props.showAlpha))
  }

  return Array.from(unique)
})

watch(
  () => props.modelValue,
  (value) => {
    applyExternalColor(value || props.defaultColor)
  },
  { immediate: true },
)

watch(selectedColor, (value) => {
  inputValue.value = value
  emit('update:modelValue', value)
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeHue(value: number) {
  return ((value % 360) + 360) % 360
}

function roundChannel(value: number) {
  return Math.round(clamp(value, 0, 255))
}

function componentToHex(value: number) {
  return roundChannel(value).toString(16).padStart(2, '0').toUpperCase()
}

function rgbaToHex(color: RgbaColor, includeAlpha = false) {
  const base = `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`

  if (!includeAlpha) return base

  return `${base}${componentToHex(color.a * 255)}`
}

function hsvaToRgba(color: HsvaColor): RgbaColor {
  const h = normalizeHue(color.h)
  const s = clamp(color.s, 0, 100) / 100
  const v = clamp(color.v, 0, 100) / 100
  const chroma = v * s
  const section = h / 60
  const x = chroma * (1 - Math.abs((section % 2) - 1))
  const offset = v - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (section < 1) {
    red = chroma
    green = x
  } else if (section < 2) {
    red = x
    green = chroma
  } else if (section < 3) {
    green = chroma
    blue = x
  } else if (section < 4) {
    green = x
    blue = chroma
  } else if (section < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  return {
    r: roundChannel((red + offset) * 255),
    g: roundChannel((green + offset) * 255),
    b: roundChannel((blue + offset) * 255),
    a: clamp(color.a, 0, 1),
  }
}

function rgbaToHsva(color: RgbaColor): HsvaColor {
  const red = clamp(color.r, 0, 255) / 255
  const green = clamp(color.g, 0, 255) / 255
  const blue = clamp(color.b, 0, 255) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let nextHue = 0

  if (delta !== 0) {
    if (max === red) {
      nextHue = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
      nextHue = 60 * ((blue - red) / delta + 2)
    } else {
      nextHue = 60 * ((red - green) / delta + 4)
    }
  }

  return {
    h: normalizeHue(nextHue),
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
    a: clamp(color.a, 0, 1),
  }
}

function parseHexColor(value: string): RgbaColor | null {
  const hex = value.trim().replace(/^#/, '')

  if (![3, 4, 6, 8].includes(hex.length) || !/^[\da-f]+$/i.test(hex)) {
    return null
  }

  const expanded = hex.length <= 4
    ? hex.split('').map((character) => character.repeat(2)).join('')
    : hex

  const hasAlpha = expanded.length === 8

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
    a: hasAlpha
      ? Number.parseInt(expanded.slice(6, 8), 16) / 255
      : 1,
  }
}

function parseRgbColor(value: string): RgbaColor | null {
  const match = value.trim().match(/^rgba?\((.+)\)$/i)

  if (!match) return null

  const parts = match[1]
    .split(',')
    .map(part => part.trim())

  if (parts.length < 3 || parts.length > 4) return null

  const channels = parts.slice(0, 3).map((part) => {
    if (part.endsWith('%')) {
      return clamp(Number.parseFloat(part) * 2.55, 0, 255)
    }

    return clamp(Number.parseFloat(part), 0, 255)
  })

  if (channels.some(channel => Number.isNaN(channel))) return null

  let nextAlpha = 1

  if (parts[3] !== undefined) {
    nextAlpha = parts[3].endsWith('%')
      ? clamp(Number.parseFloat(parts[3]), 0, 100) / 100
      : clamp(Number.parseFloat(parts[3]), 0, 1)
  }

  if (Number.isNaN(nextAlpha)) return null

  return {
    r: channels[0],
    g: channels[1],
    b: channels[2],
    a: nextAlpha,
  }
}

function parseColor(value?: string): RgbaColor | null {
  if (!value) return null

  if (value.trim().startsWith('#')) {
    return parseHexColor(value)
  }

  if (/^rgba?\(/i.test(value.trim())) {
    return parseRgbColor(value)
  }

  return null
}

function applyRgba(color: RgbaColor) {
  const next = rgbaToHsva(color)

  hue.value = next.h
  saturation.value = next.s
  brightness.value = next.v
  alpha.value = props.showAlpha ? next.a : 1
}

function applyExternalColor(value: string) {
  const fallback = parseColor(props.defaultColor) || parseHexColor('#675CFF')!
  const parsed = parseColor(value) || fallback

  applyRgba(parsed)
  inputValue.value = rgbaToHex(parsed, props.showAlpha)
}

function updatePlaneFromPointer(event: PointerEvent) {
  const element = saturationPlane.value

  if (!element) return

  const rect = element.getBoundingClientRect()
  const x = clamp(event.clientX - rect.left, 0, rect.width)
  const y = clamp(event.clientY - rect.top, 0, rect.height)

  saturation.value = rect.width ? (x / rect.width) * 100 : 0
  brightness.value = rect.height ? 100 - (y / rect.height) * 100 : 100
}

function startPlaneDrag(event: PointerEvent) {
  isPlaneDragging.value = true
  saturationPlane.value?.setPointerCapture?.(event.pointerId)
  updatePlaneFromPointer(event)
}

function movePlaneDrag(event: PointerEvent) {
  if (!isPlaneDragging.value) return
  updatePlaneFromPointer(event)
}

function stopPlaneDrag(event: PointerEvent) {
  if (!isPlaneDragging.value) return

  isPlaneDragging.value = false
  saturationPlane.value?.releasePointerCapture?.(event.pointerId)
}

function handlePlaneKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 1

  switch (event.key) {
    case 'ArrowLeft':
      saturation.value = clamp(saturation.value - step, 0, 100)
      break
    case 'ArrowRight':
      saturation.value = clamp(saturation.value + step, 0, 100)
      break
    case 'ArrowUp':
      brightness.value = clamp(brightness.value + step, 0, 100)
      break
    case 'ArrowDown':
      brightness.value = clamp(brightness.value - step, 0, 100)
      break
    default:
      return
  }

  event.preventDefault()
}

function handleInput(value: string) {
  inputValue.value = value

  const parsed = parseColor(value)

  if (parsed) {
    applyRgba(parsed)
  }
}

function commitInput() {
  const parsed = parseColor(inputValue.value)

  if (!parsed) {
    inputValue.value = selectedColor.value
    return
  }

  applyRgba(parsed)
  inputValue.value = rgbaToHex(parsed, props.showAlpha)
}

function selectPreset(value: string) {
  const parsed = parseColor(value)

  if (parsed) {
    applyRgba(parsed)
  }
}

function colorsEqual(first: string, second: string) {
  const firstColor = parseColor(first)
  const secondColor = parseColor(second)

  if (!firstColor || !secondColor) return false

  return rgbaToHex(firstColor, props.showAlpha) === rgbaToHex(secondColor, props.showAlpha)
}

function checkerPattern() {
  return 'linear-gradient(45deg, #999 25%, transparent 25%), linear-gradient(-45deg, #999 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #999 75%), linear-gradient(-45deg, transparent 75%, #999 75%)'
}

function checkerBackground(color: string) {
  return `linear-gradient(${color}, ${color}), ${checkerPattern()}`
}

function emitConfirm() {
  emit('confirm', selectedColor.value)
}

function emitCancel() {
  emit('cancel')
}
</script>

<style scoped>
.elColorPicker {
  box-sizing: border-box;
  user-select: none;
}

.elColorPickerPlane {
  position: relative;
  width: 100%;
  height: 164px;
  overflow: hidden;
  border-radius: 12px;
  cursor: crosshair;
  touch-action: none;
  outline: none;
}

.elColorPickerPlane:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 24%, transparent);
}

.elColorPickerPlaneWhite,
.elColorPickerPlaneBlack {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.elColorPickerPlaneWhite {
  background: linear-gradient(90deg, #fff, transparent);
}

.elColorPickerPlaneBlack {
  background: linear-gradient(0deg, #000, transparent);
}

.elColorPickerCursor {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 5px rgb(0 0 0 / 55%);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.elColorPickerPreview {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border: 1px solid rgb(127 127 127 / 25%);
  border-radius: 10px;
  background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px !important;
  background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0 !important;
}

.elColorPickerSliders {
  min-width: 0;
  flex: 1 1 auto;
}

.elColorPickerRange {
  width: 100%;
  height: 12px;
  margin: 0;
  border-radius: 999px;
  appearance: none;
  cursor: pointer;
  outline: none;
}

.elColorPickerRange::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 50%;
  appearance: none;
  background: transparent;
  box-shadow: 0 1px 5px rgb(0 0 0 / 55%);
}

.elColorPickerRange::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 1px 5px rgb(0 0 0 / 55%);
}

.elColorPickerHue {
  background: linear-gradient(
    90deg,
    #f00,
    #ff0,
    #0f0,
    #0ff,
    #00f,
    #f0f,
    #f00
  );
}

.elColorPickerAlpha {
  background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px !important;
  background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0 !important;
}

.elColorPickerInput {
  min-width: 0;
  flex: 1 1 auto;
  direction: ltr;
}

.elColorPickerPresets {
  align-content: flex-start;
}

.elColorPickerPreset {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px rgb(127 127 127 / 22%);
  cursor: pointer;
}

.elColorPickerPreset.isActive {
  border-color: currentColor;
  box-shadow:
    inset 0 0 0 1px rgb(127 127 127 / 22%),
    0 0 0 2px rgb(127 127 127 / 18%);
}
</style>
