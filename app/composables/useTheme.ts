import { useAppStore } from '~/store/app'

type ThemeMode = 'dark' | 'light'

type ThemeConfig = {
  name: string
  faName: string
  theme: {
    static: Record<string, string>
    dark: Record<string, string>
    light: Record<string, string>
  }
}

type ThemeDefinition = {
  name: string
  faName: string
  theme: Record<string, string> & {
    mode: ThemeMode
  }
}

const themeProperties = [
  'primary',
  'primaryDark',
  'onPrimary',
  'secondary',
  'secondaryDark',
  'onSecondary',
  'normalText',
  'darkText',
  'invertText',
  'themeBackground',
  'themeSurface',
  'themeGreen',
  'themeRed',
  'themeOrange',
  'themeBlue',
  'themeWhite',
  'themeBlack',
  'themeGray',
  'paletteOne',
  'paletteTwo',
  'paletteThree',
]

export const useTheme = () => {
  const activeTheme = useState<any>('activeTheme', () => ({}))
  const appConfig = useState<ThemeConfig | null>('themeAppConfig', () => null)
  const lang = useState<string>('themeLang', () => 'en')

  const defaultTheme: ThemeConfig = {
    name: 'theme',
    faName: 'theme',
    theme: {
      static: {
        primary: '#3588a9',
        primaryDark: '#156889',
        onPrimary: '#ffffff',
        secondary: '#25ea65',
        secondaryDark: '#15da55',
        onSecondary: '#ffffff',
        themeGreen: '#44ee66',
        themeBlue: '#4466ee',
        themeRed: '#ee6644',
        themeOrange: '#eeaa44',
        themeWhite: '#ffffff',
        themeBlack: '#101010',
        themeGray: '#888888',
        paletteOne: '#123654',
        paletteTwo: '#987456',
        paletteThree: '#163425',
      },
      dark: {
        themeSurface: '#232323',
        themeBackground: '#121212',
        normalText: '#ffffff',
        darkText: '#b0b0b0',
        invertText: '#000000',
      },
      light: {
        themeSurface: '#fafafa',
        themeBackground: '#eaeaea',
        normalText: '#000000',
        darkText: '#707070',
        invertText: '#ffffff',
      },
    },
  }

  const t = computed(() => activeTheme.value)

  const isClient = () => import.meta.client

  const normalizeThemeMode = (mode: string | null): ThemeMode => {
    return mode === 'light' ? 'light' : 'dark'
  }

  const toHex = (c: number) => {
    const hex = c.toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  const hexToRgb = (hex: string) => {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    if (!rgb) {
      return { r: 0, g: 0, b: 0 }
    }

    return {
      r: parseInt(rgb[1], 16),
      g: parseInt(rgb[2], 16),
      b: parseInt(rgb[3], 16),
    }
  }

  const mixColor = (color: string, percent: number, isBlack = true) => {
    const rgb = hexToRgb(color)
    const { r, g, b } = rgb

    const amount = Math.floor((isBlack ? 0 : 255) * (percent / 100))

    const newR = isBlack
      ? Math.floor(r * (1 - percent / 100))
      : Math.min(r + amount, 255)

    const newG = isBlack
      ? Math.floor(g * (1 - percent / 100))
      : Math.min(g + amount, 255)

    const newB = isBlack
      ? Math.floor(b * (1 - percent / 100))
      : Math.min(b + amount, 255)

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
  }

  const makeShades = (color: string) => {
    if (!isClient()) return

    let alpha = 0
    const stepSize = Math.floor(255 / 20)

    for (let i = 0; i <= 20; i += 1) {
      const colorIndex = `${i * 5}`
      const alphaHex = toHex(i === 20 ? 255 : alpha)
      const colorCode = `#${alphaHex}${alphaHex}${alphaHex}`

      document.body.style.setProperty(`--${color}${colorIndex}`, colorCode)

      alpha += stepSize
    }
  }

  const setShadesForColor = (color: string, code: string) => {
    if (!isClient()) return

    let alpha = 0
    const stepSize = Math.floor(255 / 20)

    for (let i = 0; i <= 20; i += 1) {
      const colorIndex = `${i * 5}`
      const alphaHex = toHex(i === 20 ? 255 : alpha)
      const colorCode = `${code}${alphaHex}`

      document.body.style.setProperty(`--${color}${colorIndex}`, colorCode)

      alpha += stepSize
    }

    for (let i = 0; i <= 20; i += 1) {
      const colorIndex = `${i * 5}`
      const blackShade = mixColor(code, i * 5, true)
      const whiteShade = mixColor(code, i * 5, false)

      document.body.style.setProperty(`--b-${color}${colorIndex}`, blackShade)
      document.body.style.setProperty(`--w-${color}${colorIndex}`, whiteShade)
    }
  }

  const buildThemeDefinition = (
    config: ThemeConfig,
    mode: ThemeMode,
  ): ThemeDefinition => {
    const dynamics = mode === 'dark'
      ? config.theme.dark
      : config.theme.light

    return {
      name: config.name,
      faName: config.faName,
      theme: {
        ...config.theme.static,
        themeSurface: dynamics.themeSurface,
        themeBackground: dynamics.themeBackground,
        normalText: dynamics.normalText,
        darkText: dynamics.darkText,
        invertText: dynamics.invertText,
        mode,
      },
    }
  }

  const setTheme = (themeDefinition: ThemeDefinition) => {
    if (!isClient()) return

    activeTheme.value = themeDefinition

    makeShades('gray')

    themeProperties.forEach((property) => {
      const value = themeDefinition.theme[property]

      if (!value) return

      document.body.style.setProperty(`--${property}`, value)
      setShadesForColor(property, value)
    })
  }

  const applyThemeMode = (
    mode: ThemeMode,
    options: {
      persist?: boolean
      syncStore?: boolean
    } = {},
  ) => {
    if (!isClient()) return

    const { persist = true, syncStore = true } = options

    const appStore = useAppStore()
    const config = appConfig.value || defaultTheme
    const themeDefinition = buildThemeDefinition(config, mode)

    if (persist) {
      localStorage.setItem('theme', mode)
    }

    setTheme(themeDefinition)

    if (syncStore) {
      appStore.setValue('theme', themeDefinition)
    }
  }

  const initTheme = (config = defaultTheme, selectedLang = 'fa') => {
    if (!isClient()) return

    const appStore = useAppStore()

    appStore.setValue('ready', false)
    appStore.setValue('uiState', 'loading')

    appConfig.value = config
    lang.value = selectedLang

    const savedTheme = normalizeThemeMode(localStorage.getItem('theme'))

    localStorage.setItem('theme', savedTheme)

    const themeDefinition = buildThemeDefinition(config, savedTheme)

    document.title = 'Waking Up The Monster...'

    setTheme(themeDefinition)

    nextTick(() => {
      appStore.setValue('theme', themeDefinition)
      appStore.setValue('ready', true)
      appStore.setValue('uiState', 'ready')
      document.title = 'Welcome to Prompt Draft'
    })
  }

  const switchTheme = () => {
    if (!isClient()) return

    const currentTheme = normalizeThemeMode(
      activeTheme.value?.theme?.mode || localStorage.getItem('theme'),
    )

    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark'

    applyThemeMode(nextTheme)
  }

  const detectOSTheme = (): ThemeMode => {
    if (!isClient()) return 'dark'

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  const syncThemeWithOS = () => {
    if (!isClient()) return

    const osTheme = detectOSTheme()
    const currentTheme = normalizeThemeMode(
      activeTheme.value?.theme?.mode || localStorage.getItem('theme'),
    )

    if (osTheme === currentTheme) return

    applyThemeMode(osTheme)
  }

  return {
    t,
    activeTheme,
    defaultTheme,
    initTheme,
    setTheme,
    switchTheme,
    detectOSTheme,
    syncThemeWithOS,
    mixColor,
    hexToRgb,
  }
}