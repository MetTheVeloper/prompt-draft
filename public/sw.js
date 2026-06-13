const CACHE_VERSION = 'v2'

const APP_CACHE = `prompt-draft-app-${CACHE_VERSION}`
const STATIC_CACHE = `prompt-draft-static-${CACHE_VERSION}`
const SLIDER_CACHE = `prompt-draft-slider-${CACHE_VERSION}`

const SLIDER_MAX_ENTRIES = 80

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
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const validCaches = [
          APP_CACHE,
          STATIC_CACHE,
          SLIDER_CACHE,
        ]

        return Promise.all(
          cacheNames
            .filter((cacheName) => !validCaches.includes(cacheName))
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

  if (isSliderAsset(url)) {
    event.respondWith(cacheFirst(request, SLIDER_CACHE, SLIDER_MAX_ENTRIES))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  event.respondWith(networkFirst(request))
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)

    if (isSafeResponse(response)) {
      const cache = await caches.open(APP_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    const cache = await caches.open(APP_CACHE)

    return (
      (await cache.match(request)) ||
      (await cache.match('/')) ||
      createOfflineResponse()
    )
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)

    if (isSafeResponse(response)) {
      const cache = await caches.open(APP_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    const cachedResponse = await caches.match(request)

    return cachedResponse || createOfflineResponse()
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)

  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)

  if (isSafeResponse(response)) {
    await cache.put(request, response.clone())

    if (maxEntries) {
      await trimCache(cacheName, maxEntries)
    }
  }

  return response
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length <= maxEntries) return

  const keysToDelete = keys.slice(0, keys.length - maxEntries)

  await Promise.all(
    keysToDelete.map((request) => cache.delete(request))
  )
}

function isSafeResponse(response) {
  return response && response.ok && response.status === 200
}

function createOfflineResponse() {
  return new Response('Offline', {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

function isSliderAsset(url) {
  return (
    url.pathname.startsWith('/slider/') &&
    /\.(webp|png|jpg|jpeg)$/i.test(url.pathname)
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_nuxt/') ||
    /\.(js|css|json|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|otf)$/i.test(url.pathname)
  )
}