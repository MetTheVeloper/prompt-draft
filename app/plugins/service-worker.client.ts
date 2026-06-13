export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      registration.update()
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
})