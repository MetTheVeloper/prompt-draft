import { Capacitor } from '@capacitor/core'
import { initializeOfflinePackage } from '~/composables/useOfflinePackage'

const DEV_SW_RESET_KEY = 'prompt-draft:dev-sw-reset:v1'
const APP_CACHE_PREFIX = 'prompt-draft'

async function clearPromptDraftCaches() {
  if (!('caches' in window)) return

  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(cacheName => cacheName.startsWith(APP_CACHE_PREFIX))
      .map(cacheName => caches.delete(cacheName)),
  )
}

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) return
  if (Capacitor.isNativePlatform()) return
  if (!('serviceWorker' in navigator)) return

  if (import.meta.dev) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    const hadController = !!navigator.serviceWorker.controller

    await Promise.all(
      registrations.map(registration => registration.unregister()),
    )
    await clearPromptDraftCaches()

    if (
      hadController &&
      sessionStorage.getItem(DEV_SW_RESET_KEY) !== '1'
    ) {
      sessionStorage.setItem(DEV_SW_RESET_KEY, '1')
      window.location.reload()
      return
    }

    sessionStorage.removeItem(DEV_SW_RESET_KEY)
    return
  }

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      await initializeOfflinePackage(registration)

      // Checks for a newer sw.js without blocking the app startup.
      void registration.update().catch(() => undefined)
    } catch (error) {
      console.warn('Service worker registration failed:', error)
    }
  }

  if (document.readyState === 'complete') {
    void registerServiceWorker()
  } else {
    window.addEventListener('load', registerServiceWorker, { once: true })
  }
})
