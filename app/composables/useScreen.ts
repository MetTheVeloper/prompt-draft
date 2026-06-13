import { useI18n } from 'vue-i18n'
import { useWindowSize, useDevicePixelRatio } from '@vueuse/core'

type Orientation = 'portrait' | 'landscape'
type DeviceKind = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide'

interface RatioInfo {
  w: number
  h: number
  r: number
  label: string
}

interface UseScreenResult {
  width: Ref<number>
  height: Ref<number>
  orientation: ComputedRef<Orientation>

  device: ComputedRef<DeviceKind>
  mobile: ComputedRef<boolean>
  tablet: ComputedRef<boolean>
  laptop: ComputedRef<boolean>
  desktop: ComputedRef<boolean>
  wide: ComputedRef<boolean>
  mini: ComputedRef<boolean>
  big: ComputedRef<boolean>

  deviceWidth: number
  deviceHeight: number
  ratio: ComputedRef<RatioInfo>

  pixelRatio: Ref<number>
  pixelDensity: ComputedRef<{ pixelRatio: number }>
  actualDevice: ComputedRef<string>
  gridMaker: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    g: number | string
  ) => string
  direction: ComputedRef<'rtl' | 'ltr'>
  sizes: number
}

export function useScreen(): UseScreenResult {
  const { locale } = useI18n()

  // loacle را به string جنریک تبدیل می‌کنیم تا در آینده با اضافه شدن زبان‌های جدید TS گیر نده
  const currentLocale = computed(() => String(locale.value))

  // VueUse: SSR-safe window size با initial fallback
  const { width, height } = useWindowSize({
    initialWidth: 1024,
    initialHeight: 768,
  })

  const { pixelRatio } = useDevicePixelRatio()

  // فقط در کلاینت به navigator و screen دسترسی داریم
  const userAgent = import.meta.client ? navigator.userAgent.toLowerCase() : ''
  const deviceWidth = import.meta.client ? window.screen.availWidth : 0
  const deviceHeight = import.meta.client ? window.screen.availHeight : 0

  const orientation = computed<Orientation>(() =>
    width.value > height.value ? 'landscape' : 'portrait'
  )

  const device = computed<DeviceKind>(() => {
    const w = width.value
    if (w < 820) return 'mobile'
    if (w < 1367) return 'tablet'
    if (w < 1600) return 'laptop'
    if (w < 1920) return 'desktop'
    return 'wide'
  })

  const mobile = computed(() => device.value === 'mobile')
  const tablet = computed(() => device.value === 'tablet')
  const laptop = computed(() => device.value === 'laptop')
  const desktop = computed(() => device.value === 'desktop')
  const wide = computed(() => device.value === 'wide')
  const mini = computed(() => mobile.value || tablet.value)
  const big = computed(() => laptop.value || desktop.value || wide.value)

  const actualDevice = computed(() => {
    if (!userAgent) return 'Unknown Device'
    if (userAgent.includes('iphone')) return 'iPhone'
    if (userAgent.includes('ipad')) return 'iPad'
    if (userAgent.includes('android')) return 'Android Device'
    if (userAgent.includes('mac')) return 'Mac'
    if (userAgent.includes('windows')) return 'Windows PC'
    if (userAgent.includes('linux')) return 'Linux PC'
    return 'Unknown Device'
  })

  const ratio = computed<RatioInfo>(() => {
    const w = width.value
    const h = height.value
    const r = +(w / h).toFixed(4)
    let label = ''
    if (r === 1.3333) label = '4:3'
    else if (r === 1.7778) label = '16:9'
    else if (r === 1.6) label = '16:10'
    else if (r === 2.0) label = '18:9'
    else label = `${w}:${h}`
    return { w, h, r, label }
  })

  const gridMaker = (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    g: number | string
  ): string => {
    switch (device.value) {
      case 'mobile':
        return `g-${a}-1-${g}`
      case 'tablet':
        return `g-${b}-1-${g}`
      case 'laptop':
        return `g-${c}-1-${g}`
      case 'desktop':
        return `g-${d}-1-${g}`
      case 'wide':
        return `g-${e}-1-${g}`
      default:
        return ''
    }
  }

  // برای سازگاری با نسخهٔ قبلی که pixelDensity برمی‌گردوند
  const pixelDensity = computed(() => ({
    pixelRatio: pixelRatio.value,
  }))

  const direction = computed<'rtl' | 'ltr'>(() => {
    const { locale } = useI18n()
    // هر زبان RTL جدید را فقط اینجا اضافه می‌کنی
    const rtlLocales = ['fa', 'ar']
    return rtlLocales.includes(locale.value) ? 'rtl' : 'ltr'
  })

  const sizes = ((m, t, d) => {
    return mobile.value ? m : mini.value ? t : d;
  })

  return {
    width,
    height,
    orientation,
    mobile,
    tablet,
    laptop,
    desktop,
    wide,
    device,
    deviceWidth,
    deviceHeight,
    gridMaker,
    mini,
    big,
    ratio,
    pixelRatio,
    pixelDensity,
    actualDevice,
    direction,
    sizes,
  }
}
