export {}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }

  interface TelegramWebApp {
    initData: string
    initDataUnsafe?: {
      user?: {
        id: number
        first_name?: string
        last_name?: string
        username?: string
        language_code?: string
        is_premium?: boolean
        photo_url?: string
      }
      start_param?: string
      chat_type?: string
      chat_instance?: string
    }

    version: string
    platform: string
    colorScheme: 'light' | 'dark'
    themeParams: Record<string, string | undefined>

    viewportHeight: number
    viewportStableHeight: number
    isExpanded: boolean

    ready: () => void
    expand: () => void
    close: () => void

    setHeaderColor?: (color: string) => void
    setBackgroundColor?: (color: string) => void
    setBottomBarColor?: (color: string) => void
    isVersionAtLeast?: (version: string) => boolean

    onEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void
    offEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void

    BackButton?: {
      show: () => void
      hide: () => void
      onClick: (callback: () => void) => void
      offClick?: (callback: () => void) => void
    }

    HapticFeedback?: {
      impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
      notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
      selectionChanged?: () => void
    }
  }
}