const CACHE_PREFIX = 'prompt-draft'
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v1`
const META_CACHE = `${CACHE_PREFIX}-offline-meta-v1`
const OFFLINE_CACHE_PREFIX = `${CACHE_PREFIX}-offline-`
const META_KEY = '/__prompt-draft-offline-meta__'
const OFFLINE_MANIFEST_URL = '/offline-manifest.json'
const DOWNLOAD_CONCURRENCY = 4

let activeDownloadPromise = null
let activeDownloadState = null

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanupLegacyCaches(),
      self.clients.claim(),
    ]),
  )
})

self.addEventListener('message', (event) => {
  const type = event.data?.type

  if (type === 'GET_OFFLINE_PACKAGE_STATUS') {
    event.waitUntil(sendOfflinePackageStatus(event.source))
    return
  }

  if (type === 'DOWNLOAD_OFFLINE_PACKAGE') {
    event.waitUntil(startOfflinePackageDownload(event.source))
    return
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return
  if (isLocalDevelopment(url)) return

  if (isControlFile(url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isHashedNuxtAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, event))
    return
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE))
})

async function cleanupLegacyCaches() {
  const cacheNames = await caches.keys()
  const legacyPrefixes = [
    `${CACHE_PREFIX}-app-`,
    `${CACHE_PREFIX}-static-`,
    `${CACHE_PREFIX}-slider-`,
  ]

  await Promise.all(
    cacheNames
      .filter(cacheName => legacyPrefixes.some(prefix => cacheName.startsWith(prefix)))
      .map(cacheName => caches.delete(cacheName)),
  )
}

async function fetchOfflineManifest() {
  const response = await fetch(`${OFFLINE_MANIFEST_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`Offline manifest request failed with ${response.status}`)
  }

  const manifest = await response.json()

  if (
    !manifest ||
    typeof manifest.version !== 'string' ||
    !Array.isArray(manifest.assets)
  ) {
    throw new Error('Offline manifest is invalid')
  }

  return manifest
}

async function readOfflineMeta() {
  const cache = await caches.open(META_CACHE)
  const response = await cache.match(META_KEY)

  if (!response) return null

  try {
    return await response.json()
  } catch {
    return null
  }
}

async function writeOfflineMeta(meta) {
  const cache = await caches.open(META_CACHE)

  await cache.put(
    META_KEY,
    new Response(JSON.stringify(meta), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }),
  )
}

async function getInstalledPackageState() {
  const meta = await readOfflineMeta()

  if (!meta?.cacheName || !meta?.version) {
    return {
      meta: null,
      ready: false,
    }
  }

  const cacheNames = await caches.keys()
  const ready = cacheNames.includes(meta.cacheName)

  return {
    meta: ready ? meta : null,
    ready,
  }
}

async function getCachedProgress(manifest) {
  const cacheName = `${OFFLINE_CACHE_PREFIX}${manifest.version}`
  const cache = await caches.open(cacheName)

  let completedFiles = 0
  let downloadedBytes = 0

  for (const asset of manifest.assets) {
    const response = await cache.match(asset.url, { ignoreSearch: true })

    if (!response) continue

    completedFiles += 1
    downloadedBytes += Number(asset.size) || 0
  }

  return {
    cacheName,
    completedFiles,
    downloadedBytes,
  }
}

async function buildStatusPayload() {
  const installed = await getInstalledPackageState()
  let manifest = null

  try {
    manifest = await fetchOfflineManifest()
  } catch {
    // When offline, the installed package metadata is enough to report readiness.
  }

  if (!manifest) {
    return {
      type: 'OFFLINE_PACKAGE_STATUS',
      ready: installed.ready,
      updateAvailable: false,
      downloading: !!activeDownloadPromise,
      progress: activeDownloadState?.progress || (installed.ready ? 100 : 0),
      completedFiles: activeDownloadState?.completedFiles || installed.meta?.totalFiles || 0,
      totalFiles: activeDownloadState?.totalFiles || installed.meta?.totalFiles || 0,
      downloadedBytes: activeDownloadState?.downloadedBytes || installed.meta?.totalBytes || 0,
      totalBytes: activeDownloadState?.totalBytes || installed.meta?.totalBytes || 0,
      version: installed.meta?.version || '',
      installedVersion: installed.meta?.version || '',
    }
  }

  const currentCacheName = `${OFFLINE_CACHE_PREFIX}${manifest.version}`
  const currentIsInstalled = installed.ready && installed.meta?.version === manifest.version
  const partial = currentIsInstalled
    ? {
        completedFiles: manifest.totalFiles,
        downloadedBytes: manifest.totalBytes,
      }
    : await getCachedProgress(manifest)

  const currentCacheIsComplete = (
    manifest.totalFiles > 0 &&
    partial.completedFiles >= manifest.totalFiles
  )
  const currentIsReady = currentIsInstalled || currentCacheIsComplete

  // Self-heal the metadata when every current-build asset is already cached.
  // This covers cases where Cache Storage survived but the metadata entry did not.
  if (currentCacheIsComplete && !currentIsInstalled) {
    await writeOfflineMeta({
      version: manifest.version,
      cacheName: currentCacheName,
      installedAt: new Date().toISOString(),
      totalFiles: manifest.totalFiles,
      totalBytes: manifest.totalBytes,
    })

    await deleteOldOfflineCaches(currentCacheName)
  }

  const progress = manifest.totalFiles > 0
    ? Math.min(100, Math.round((partial.completedFiles / manifest.totalFiles) * 100))
    : 0

  return {
    type: 'OFFLINE_PACKAGE_STATUS',
    ready: currentIsReady,
    updateAvailable: (
      !currentIsReady &&
      installed.ready &&
      installed.meta?.version !== manifest.version
    ),
    downloading: !!activeDownloadPromise,
    progress: activeDownloadState?.progress ?? (currentIsReady ? 100 : progress),
    completedFiles: activeDownloadState?.completedFiles ?? partial.completedFiles,
    totalFiles: activeDownloadState?.totalFiles ?? manifest.totalFiles,
    downloadedBytes: activeDownloadState?.downloadedBytes ?? partial.downloadedBytes,
    totalBytes: activeDownloadState?.totalBytes ?? manifest.totalBytes,
    version: manifest.version,
    installedVersion: currentIsReady
      ? manifest.version
      : installed.meta?.version || '',
    cacheName: currentCacheName,
  }
}

async function sendOfflinePackageStatus(client) {
  const payload = await buildStatusPayload()
  await postToClient(client, payload)
}

async function startOfflinePackageDownload(client) {
  if (activeDownloadPromise) {
    if (activeDownloadState) {
      await postToClient(client, {
        type: 'OFFLINE_PACKAGE_PROGRESS',
        ...activeDownloadState,
      })
    }

    return activeDownloadPromise
  }

  activeDownloadPromise = downloadOfflinePackage()

  try {
    await activeDownloadPromise
  } finally {
    activeDownloadPromise = null
    activeDownloadState = null
  }
}

async function downloadOfflinePackage() {
  try {
    const manifest = await fetchOfflineManifest()
    const cacheName = `${OFFLINE_CACHE_PREFIX}${manifest.version}`
    const cache = await caches.open(cacheName)
    const pendingAssets = []

    let completedFiles = 0
    let downloadedBytes = 0

    for (const asset of manifest.assets) {
      const cachedResponse = await cache.match(asset.url, { ignoreSearch: true })

      if (cachedResponse) {
        completedFiles += 1
        downloadedBytes += Number(asset.size) || 0
      } else {
        pendingAssets.push(asset)
      }
    }

    updateDownloadState({
      version: manifest.version,
      installedVersion: (await readOfflineMeta())?.version || '',
      completedFiles,
      totalFiles: manifest.totalFiles,
      downloadedBytes,
      totalBytes: manifest.totalBytes,
    })

    await broadcast({
      type: 'OFFLINE_PACKAGE_PROGRESS',
      ...activeDownloadState,
    })

    const failures = []
    let cursor = 0

    async function downloadWorker() {
      while (cursor < pendingAssets.length) {
        const assetIndex = cursor
        cursor += 1

        const asset = pendingAssets[assetIndex]

        try {
          await cacheAsset(cache, asset)
          completedFiles += 1
          downloadedBytes += Number(asset.size) || 0

          updateDownloadState({
            version: manifest.version,
            installedVersion: activeDownloadState?.installedVersion || '',
            completedFiles,
            totalFiles: manifest.totalFiles,
            downloadedBytes,
            totalBytes: manifest.totalBytes,
          })

          await broadcast({
            type: 'OFFLINE_PACKAGE_PROGRESS',
            ...activeDownloadState,
            currentUrl: asset.url,
          })
        } catch (error) {
          failures.push({
            url: asset.url,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(DOWNLOAD_CONCURRENCY, Math.max(1, pendingAssets.length)) },
      () => downloadWorker(),
    )

    await Promise.all(workers)

    if (failures.length > 0) {
      throw new Error(`${failures.length} offline assets failed to download`)
    }

    const meta = {
      version: manifest.version,
      cacheName,
      installedAt: new Date().toISOString(),
      totalFiles: manifest.totalFiles,
      totalBytes: manifest.totalBytes,
    }

    await writeOfflineMeta(meta)
    await deleteOldOfflineCaches(cacheName)

    await broadcast({
      type: 'OFFLINE_PACKAGE_READY',
      ready: true,
      updateAvailable: false,
      downloading: false,
      progress: 100,
      completedFiles: manifest.totalFiles,
      totalFiles: manifest.totalFiles,
      downloadedBytes: manifest.totalBytes,
      totalBytes: manifest.totalBytes,
      version: manifest.version,
      installedVersion: manifest.version,
    })
  } catch (error) {
    console.error('[offline package]', error)

    await broadcast({
      type: 'OFFLINE_PACKAGE_ERROR',
      downloading: false,
      error: error instanceof Error ? error.message : 'Offline package download failed',
      ...(activeDownloadState || {}),
    })
  }
}

function updateDownloadState({
  version,
  installedVersion,
  completedFiles,
  totalFiles,
  downloadedBytes,
  totalBytes,
}) {
  const progress = totalFiles > 0
    ? Math.min(100, Math.round((completedFiles / totalFiles) * 100))
    : 0

  activeDownloadState = {
    ready: false,
    updateAvailable: !!installedVersion && installedVersion !== version,
    downloading: true,
    progress,
    completedFiles,
    totalFiles,
    downloadedBytes,
    totalBytes,
    version,
    installedVersion,
  }
}

async function cacheAsset(cache, asset) {
  const request = new Request(asset.url, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'reload',
  })
  const response = await fetch(request)

  if (!isSafeResponse(response)) {
    throw new Error(`Request failed with ${response.status}`)
  }

  await cache.put(asset.url, response.clone())
}

async function deleteOldOfflineCaches(activeCacheName) {
  const cacheNames = await caches.keys()

  await Promise.all(
    cacheNames
      .filter(cacheName => (
        cacheName.startsWith(OFFLINE_CACHE_PREFIX) &&
        cacheName !== activeCacheName
      ))
      .map(cacheName => caches.delete(cacheName)),
  )
}

async function postToClient(client, payload) {
  if (client && typeof client.postMessage === 'function') {
    client.postMessage(payload)
    return
  }

  await broadcast(payload)
}

async function broadcast(payload) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  clients.forEach(client => client.postMessage(payload))
}

async function getActiveOfflineCache() {
  const installed = await getInstalledPackageState()

  if (!installed.ready || !installed.meta?.cacheName) return null

  return caches.open(installed.meta.cacheName)
}

async function matchCachedRequest(request) {
  const offlineCache = await getActiveOfflineCache()

  if (offlineCache) {
    const offlineResponse = await offlineCache.match(request, { ignoreSearch: true })
    if (offlineResponse) return offlineResponse
  }

  const runtimeCache = await caches.open(RUNTIME_CACHE)
  return runtimeCache.match(request, { ignoreSearch: true })
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)

    if (isSafeResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    return (
      await matchNavigationFallback(request) ||
      createOfflineResponse()
    )
  }
}

async function matchNavigationFallback(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const normalizedPath = pathname.endsWith('/')
    ? pathname
    : `${pathname}/`
  const candidates = [
    request,
    pathname,
    `${normalizedPath}index.html`,
    '/index.html',
    '/200.html',
    '/',
  ]

  const offlineCache = await getActiveOfflineCache()
  const runtimeCache = await caches.open(RUNTIME_CACHE)

  for (const candidate of candidates) {
    if (offlineCache) {
      const response = await offlineCache.match(candidate, { ignoreSearch: true })
      if (response) return response
    }

    const runtimeResponse = await runtimeCache.match(candidate, { ignoreSearch: true })
    if (runtimeResponse) return runtimeResponse
  }

  return null
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)

    if (isSafeResponse(response)) {
      const cache = await caches.open(cacheName)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    return (
      await matchCachedRequest(request) ||
      createOfflineResponse()
    )
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await matchCachedRequest(request)

  if (cachedResponse) return cachedResponse

  const response = await fetch(request)

  if (isSafeResponse(response)) {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }

  return response
}

async function staleWhileRevalidate(request, cacheName, event) {
  const cachedResponse = await matchCachedRequest(request)
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isSafeResponse(response)) {
        const cache = await caches.open(cacheName)
        await cache.put(request, response.clone())
      }

      return response
    })
    .catch(() => null)

  if (cachedResponse) {
    event.waitUntil(networkPromise)
    return cachedResponse
  }

  return (
    await networkPromise ||
    createOfflineResponse()
  )
}

function isSafeResponse(response) {
  return !!response && response.ok && response.status === 200
}

function createOfflineResponse() {
  return new Response('Offline', {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function isControlFile(url) {
  return (
    url.pathname === '/sw.js' ||
    url.pathname === OFFLINE_MANIFEST_URL
  )
}

function isLocalDevelopment(url) {
  return (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '[::1]'
  )
}

function isHashedNuxtAsset(url) {
  return url.pathname.startsWith('/_nuxt/')
}

function isStaticAsset(url) {
  return /\.(?:js|mjs|css|json|wasm|png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf|otf|eot|webmanifest)$/i.test(url.pathname)
}
