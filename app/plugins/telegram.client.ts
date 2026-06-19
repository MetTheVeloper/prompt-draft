export default defineNuxtPlugin(() => {
  const router = useRouter()

  const getWebApp = () => window.Telegram?.WebApp

  const isTelegramVersionAtLeast = (version: string) => {
    const tg = getWebApp()

    return Boolean(tg?.isVersionAtLeast?.(version))
  }

  const setTelegramViewportHeight = () => {
    const tg = getWebApp()

    const height =
      tg?.viewportStableHeight ||
      tg?.viewportHeight ||
      window.innerHeight

    document.documentElement.style.setProperty(
      '--telegram-viewport-height',
      `${height}px`
    )
  }

  const setTelegramTheme = () => {
    const tg = getWebApp()

    document.documentElement.classList.toggle('is-telegram-webapp', Boolean(tg))
    document.documentElement.dataset.telegramTheme = tg?.colorScheme || 'dark'

    if (!tg) return

    /**
     * setHeaderColor / setBackgroundColor are not supported in older Telegram WebApp versions.
     * Calling them directly on version 6.0 causes console warnings.
     */
    if (isTelegramVersionAtLeast('6.1')) {
      tg.setHeaderColor?.('#0f0f14')
      tg.setBackgroundColor?.('#0f0f14')
    }

    /**
     * Bottom bar color is only available in newer Telegram WebApp versions.
     */
    if (isTelegramVersionAtLeast('7.10')) {
      tg.setBottomBarColor?.('#0f0f14')
    }
  }

  const routeByStartParam = async () => {
    const tg = getWebApp()

    const startParam =
      tg?.initDataUnsafe?.start_param ||
      new URLSearchParams(window.location.search).get('tgWebAppStartParam') ||
      ''

    if (!startParam) return

    const routes: Record<string, string> = {
      create: '/create',
      collage: '/collage',
      guide: '/guide',
    }

    const target = routes[startParam]

    if (target && router.currentRoute.value.path !== target) {
      await router.replace(target)
    }
  }

  const setupTelegramBackButton = () => {
    const tg = getWebApp()

    /**
     * BackButton is not supported in Telegram WebApp 6.0.
     * Checking only tg.BackButton is not enough because the object may exist,
     * but calling show/hide/onClick can still produce warnings.
     */
    if (!tg?.BackButton || !isTelegramVersionAtLeast('6.1')) return

    const syncBackButton = () => {
      const currentPath = router.currentRoute.value.path

      if (currentPath === '/') {
        tg.BackButton.hide()
      } else {
        tg.BackButton.show()
      }
    }

    const handleBackButton = () => {
      const currentPath = router.currentRoute.value.path

      if (currentPath === '/') {
        tg.close?.()
        return
      }

      router.back()
    }

    tg.BackButton.onClick(handleBackButton)
    router.afterEach(syncBackButton)

    syncBackButton()
  }

  onNuxtReady(async () => {
    const tg = getWebApp()

    if (!tg) return

    tg.ready?.()
    tg.expand?.()

    setTelegramTheme()
    setTelegramViewportHeight()

    tg.onEvent?.('viewportChanged', setTelegramViewportHeight)
    tg.onEvent?.('themeChanged', setTelegramTheme)

    setupTelegramBackButton()
    await routeByStartParam()
  })
})