import { computed, reactive } from 'vue'

export type OfflinePackageStatus = {
  supported: boolean
  registered: boolean
  checked: boolean
  checking: boolean
  isStandalone: boolean
  online: boolean
  ready: boolean
  updateAvailable: boolean
  downloading: boolean
  progress: number
  completedFiles: number
  totalFiles: number
  downloadedBytes: number
  totalBytes: number
  version: string
  installedVersion: string
  error: string
}

type OfflinePackageMessage = {
  type?: string
  ready?: boolean
  updateAvailable?: boolean
  downloading?: boolean
  progress?: number
  completedFiles?: number
  totalFiles?: number
  downloadedBytes?: number
  totalBytes?: number
  version?: string
  installedVersion?: string
  error?: string
}

const state = reactive<OfflinePackageStatus>({
  supported: false,
  registered: false,
  checked: false,
  checking: false,
  isStandalone: false,
  online: true,
  ready: false,
  updateAvailable: false,
  downloading: false,
  progress: 0,
  completedFiles: 0,
  totalFiles: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  version: '',
  installedVersion: '',
  error: '',
})

let registration: ServiceWorkerRegistration | null = null
let initialized = false
let mediaQuery: MediaQueryList | null = null

function detectStandaloneMode() {
  if (!import.meta.client) return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function syncEnvironmentState() {
  if (!import.meta.client) return

  state.online = navigator.onLine
  state.isStandalone = detectStandaloneMode()
}

function getMessageWorker() {
  if (!import.meta.client) return null

  return (
    navigator.serviceWorker.controller ||
    registration?.active ||
    registration?.waiting ||
    registration?.installing ||
    null
  )
}

function postMessage(type: string) {
  const worker = getMessageWorker()

  if (!worker) return false

  worker.postMessage({ type })
  return true
}

function applyMessage(message: OfflinePackageMessage) {
  if (typeof message.ready === 'boolean') state.ready = message.ready
  if (typeof message.updateAvailable === 'boolean') state.updateAvailable = message.updateAvailable
  if (typeof message.downloading === 'boolean') state.downloading = message.downloading
  if (typeof message.progress === 'number') state.progress = message.progress
  if (typeof message.completedFiles === 'number') state.completedFiles = message.completedFiles
  if (typeof message.totalFiles === 'number') state.totalFiles = message.totalFiles
  if (typeof message.downloadedBytes === 'number') state.downloadedBytes = message.downloadedBytes
  if (typeof message.totalBytes === 'number') state.totalBytes = message.totalBytes
  if (typeof message.version === 'string') state.version = message.version
  if (typeof message.installedVersion === 'string') state.installedVersion = message.installedVersion
}

function handleServiceWorkerMessage(event: MessageEvent<OfflinePackageMessage>) {
  const message = event.data || {}

  switch (message.type) {
    case 'OFFLINE_PACKAGE_STATUS':
      applyMessage(message)
      state.checked = true
      state.checking = false
      state.error = ''
      break

    case 'OFFLINE_PACKAGE_PROGRESS':
      applyMessage(message)
      state.checked = true
      state.downloading = true
      state.error = ''
      break

    case 'OFFLINE_PACKAGE_READY':
      applyMessage(message)
      state.checked = true
      state.ready = true
      state.updateAvailable = false
      state.downloading = false
      state.progress = 100
      state.error = ''
      break

    case 'OFFLINE_PACKAGE_ERROR':
      applyMessage(message)
      state.checked = true
      state.downloading = false
      state.error = message.error || 'offline-package-download-failed'
      break
  }
}

function handleOnline() {
  state.online = true
  void checkStatus()
}

function handleOffline() {
  state.online = false
}

function handleControllerChange() {
  state.registered = !!navigator.serviceWorker.controller
  void checkStatus()
}

function handleDisplayModeChange() {
  state.isStandalone = detectStandaloneMode()
}

export async function initializeOfflinePackage(nextRegistration: ServiceWorkerRegistration) {
  if (!import.meta.client) return

  registration = nextRegistration
  state.supported = 'serviceWorker' in navigator
  state.registered = true
  syncEnvironmentState()

  if (!initialized) {
    initialized = true

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    mediaQuery = window.matchMedia('(display-mode: standalone)')

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      mediaQuery.addListener(handleDisplayModeChange)
    }
  }

  try {
    await navigator.serviceWorker.ready
    state.registered = true
    await checkStatus()
  } catch (error) {
    console.warn('[Offline package] Service worker is not ready:', error)
    state.checking = false
  }
}

export async function checkStatus() {
  if (!import.meta.client || !state.supported) return false

  state.checking = true

  if (postMessage('GET_OFFLINE_PACKAGE_STATUS')) {
    return true
  }

  try {
    registration = registration || await navigator.serviceWorker.ready

    if (postMessage('GET_OFFLINE_PACKAGE_STATUS')) {
      return true
    }
  } catch (error) {
    console.warn('[Offline package] Could not request package status:', error)
  }

  state.checking = false
  return false
}

export async function downloadOfflinePackage() {
  if (!import.meta.client || !state.supported || !state.online) {
    state.error = 'offline-package-network-unavailable'
    return false
  }

  state.downloading = true
  state.error = ''

  if (postMessage('DOWNLOAD_OFFLINE_PACKAGE')) {
    return true
  }

  try {
    registration = registration || await navigator.serviceWorker.ready

    if (postMessage('DOWNLOAD_OFFLINE_PACKAGE')) {
      return true
    }
  } catch (error) {
    console.warn('[Offline package] Could not start package download:', error)
  }

  state.downloading = false
  state.error = 'offline-package-service-worker-unavailable'
  return false
}

export function formatOfflineBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** unitIndex
  const digits = unitIndex >= 2 ? 1 : 0

  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

const formattedTotalSize = computed(() => formatOfflineBytes(state.totalBytes))
const formattedDownloadedSize = computed(() => formatOfflineBytes(state.downloadedBytes))

export function useOfflinePackage() {
  return {
    state,
    formattedTotalSize,
    formattedDownloadedSize,
    initialize: initializeOfflinePackage,
    checkStatus,
    download: downloadOfflinePackage,
    formatBytes: formatOfflineBytes,
  }
}
