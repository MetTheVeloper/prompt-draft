import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

const HOME_PATHS = new Set(['/', '/index'])

export default defineNuxtPlugin(async () => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  document.documentElement.classList.add('is-native-app')

  try {
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: Style.Dark })

    const info = await StatusBar.getInfo()

    if (info.height) {
      document.documentElement.style.setProperty(
        '--native-statusbar-height',
        `${info.height}px`
      )
    }
  } catch (error) {
    console.warn('Native status bar setup failed:', error)
  }

  const routeStack = useState<string[]>('native-route-stack', () => [])

  const normalizePath = (path: string) => {
    return path || '/'
  }

  await router.isReady()

  const initialPath = normalizePath(router.currentRoute.value.fullPath)

  if (!routeStack.value.length) {
    routeStack.value.push(initialPath)
  }

  router.afterEach((to) => {
    const path = normalizePath(to.fullPath)
    const stack = routeStack.value
    const lastPath = stack[stack.length - 1]

    if (lastPath === path) return

    const existingIndex = stack.lastIndexOf(path)

    if (existingIndex >= 0) {
      stack.splice(existingIndex + 1)
      return
    }

    stack.push(path)
  })

  void CapacitorApp.addListener('backButton', async () => {
    const currentPath = router.currentRoute.value.path

    if (HOME_PATHS.has(currentPath)) {
      await CapacitorApp.exitApp()
      return
    }

    const stack = routeStack.value

    if (stack.length > 1) {
      stack.pop()

      const previousPath = stack[stack.length - 1] || '/'

      await router.push(previousPath)
      return
    }

    await router.push('/')
  })
})