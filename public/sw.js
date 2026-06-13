const CACHE_VERSION = 'v1'
const CACHE_NAME = `prompt-draft-${CACHE_VERSION}`

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(request))
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)

    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())

    return response
  } catch {
    const cache = await caches.open(CACHE_NAME)

    return (
      (await cache.match(request)) ||
      (await cache.match('/')) ||
      new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    )
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)

    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())

    return response
  } catch {
    const cachedResponse = await caches.match(request)

    return (
      cachedResponse ||
      new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    )
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) return cachedResponse

  const response = await fetch(request)

  const cache = await caches.open(CACHE_NAME)
  cache.put(request, response.clone())

  return response
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_nuxt/') ||
    /\.(js|css|json|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|otf)$/i.test(url.pathname)
  )
}