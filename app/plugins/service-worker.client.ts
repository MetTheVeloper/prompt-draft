import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!process.client) return

  const isNativeApp = Capacitor.isNativePlatform()

  if (isNativeApp) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })
})