import { Capacitor } from '@capacitor/core'
import { initializeOfflinePackage } from '~/composables/useOfflinePackage'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  if (Capacitor.isNativePlatform()) return
  if (!('serviceWorker' in navigator)) return

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
