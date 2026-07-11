import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
} from 'vue'
import type {
  ImageVectorizerProgress,
  ImageVectorizerResult,
  ImageVectorizerSettings,
  ImageVectorizerWorkerRequest,
  ImageVectorizerWorkerResponse,
} from '~/types/imageVectorizer'
import { normalizeImageVectorizerSettings } from '~/utils/vectorizer/config'

const MAX_PROCESSING_EDGE = 2048

type LoadedVectorizerSource = {
  file: File
  url: string
  pixels: Uint8ClampedArray
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

type PendingRequest = {
  resolve: (result: ImageVectorizerResult) => void
  reject: (error: ImageVectorizerProcessError) => void
}

export class ImageVectorizerProcessError extends Error {
  code: string
  detectedColorCount?: number
  maxColors?: number

  constructor(
    code: string,
    message: string,
    details: {
      detectedColorCount?: number
      maxColors?: number
    } = {},
  ) {
    super(message)
    this.name = 'ImageVectorizerProcessError'
    this.code = code
    this.detectedColorCount = details.detectedColorCount
    this.maxColors = details.maxColors
  }
}

function isSupportedImage(file: File) {
  if (file.type.startsWith('image/')) return true
  return /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name)
}

async function decodeImage(file: File) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions)
    } catch {
      // HTMLImageElement covers browser/format combinations not handled above.
    }
  }

  const url = URL.createObjectURL(file)

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Cannot decode ${file.name}`))
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png') {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas export failed.'))
      }
    }, type)
  })
}

function revokeUrl(url: string) {
  if (url) URL.revokeObjectURL(url)
}

export function useImageVectorizer() {
  const source = shallowRef<LoadedVectorizerSource | null>(null)
  const result = shallowRef<ImageVectorizerResult | null>(null)
  const rasterUrl = ref('')
  const rasterBlob = shallowRef<Blob | null>(null)
  const svgUrl = ref('')
  const isLoading = ref(false)
  const progress = ref<ImageVectorizerProgress>({
    percent: 0,
    stage: 'preparing',
  })
  const error = shallowRef<ImageVectorizerProcessError | null>(null)

  const worker = shallowRef<Worker | null>(null)
  const pendingRequests = new Map<number, PendingRequest>()
  let requestCounter = 0
  let activeRequestId = 0

  const sourceUrl = computed(() => source.value?.url || '')
  const sourceFile = computed(() => source.value?.file || null)

  function getWorker() {
    if (worker.value) return worker.value

    const nextWorker = new Worker(
      new URL('../../workers/imageVectorizer.worker.ts', import.meta.url),
      { type: 'module' },
    )

    nextWorker.onmessage = async (
      event: MessageEvent<ImageVectorizerWorkerResponse>,
    ) => {
      const response = event.data
      const pending = pendingRequests.get(response.id)

      if (!pending) return

      if (response.type === 'progress') {
        if (response.id === activeRequestId) {
          progress.value = response.progress
        }
        return
      }

      pendingRequests.delete(response.id)

      if (response.type === 'error') {
        const processError = new ImageVectorizerProcessError(
          response.error.code,
          response.error.message,
          response.error,
        )

        if (response.id === activeRequestId) {
          error.value = processError
          isLoading.value = false
        }

        pending.reject(processError)
        return
      }

      try {
        if (response.id === activeRequestId) {
          progress.value = {
            percent: 99,
            stage: 'finalizing',
          }

          const previewCanvas = document.createElement('canvas')
          previewCanvas.width = response.preview.width
          previewCanvas.height = response.preview.height

          const context = previewCanvas.getContext('2d')

          if (!context) {
            throw new Error('Canvas 2D context is unavailable.')
          }

          const imageData = new ImageData(
            new Uint8ClampedArray(response.preview.pixels),
            response.preview.width,
            response.preview.height,
          )

          context.putImageData(imageData, 0, 0)

          const previewBlob = await canvasToBlob(previewCanvas)

          if (response.id !== activeRequestId) {
            pending.resolve(response.result)
            return
          }

          const nextRasterUrl = URL.createObjectURL(previewBlob)
          const nextSvgUrl = response.result.svg
            ? URL.createObjectURL(
                new Blob([response.result.svg], {
                  type: 'image/svg+xml;charset=utf-8',
                }),
              )
            : ''

          revokeUrl(rasterUrl.value)
          revokeUrl(svgUrl.value)

          rasterUrl.value = nextRasterUrl
          rasterBlob.value = previewBlob
          svgUrl.value = nextSvgUrl
          result.value = response.result
          error.value = null
          progress.value = {
            percent: 100,
            stage: 'finalizing',
          }
          isLoading.value = false
        }

        pending.resolve(response.result)
      } catch (caughtError) {
        const processError = new ImageVectorizerProcessError(
          'PREVIEW_FAILED',
          caughtError instanceof Error
            ? caughtError.message
            : 'Could not build the vector preview.',
        )

        if (response.id === activeRequestId) {
          error.value = processError
          isLoading.value = false
        }

        pending.reject(processError)
      }
    }

    nextWorker.onerror = (event) => {
      const processError = new ImageVectorizerProcessError(
        'WORKER_FAILED',
        event.message || 'The vectorizer worker stopped unexpectedly.',
      )

      for (const pending of pendingRequests.values()) {
        pending.reject(processError)
      }

      pendingRequests.clear()
      error.value = processError
      isLoading.value = false
    }

    worker.value = nextWorker

    return nextWorker
  }

  async function loadFile(file: File) {
    if (!isSupportedImage(file)) {
      throw new ImageVectorizerProcessError(
        'UNSUPPORTED_FILE',
        'The selected file is not a supported image.',
      )
    }

    const image = await decodeImage(file)
    const originalWidth = image.width
    const originalHeight = image.height

    if (!originalWidth || !originalHeight) {
      if ('close' in image && typeof image.close === 'function') image.close()

      throw new ImageVectorizerProcessError(
        'INVALID_IMAGE',
        'The selected image has invalid dimensions.',
      )
    }

    const scale = Math.min(
      1,
      MAX_PROCESSING_EDGE / Math.max(originalWidth, originalHeight),
    )
    const width = Math.max(1, Math.round(originalWidth * scale))
    const height = Math.max(1, Math.round(originalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    if (!context) {
      if ('close' in image && typeof image.close === 'function') image.close()
      throw new ImageVectorizerProcessError(
        'CANVAS_UNAVAILABLE',
        'Canvas 2D context is unavailable.',
      )
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    if ('close' in image && typeof image.close === 'function') {
      image.close()
    }

    const imageData = context.getImageData(0, 0, width, height)
    const nextUrl = URL.createObjectURL(file)

    if (source.value) revokeUrl(source.value.url)

    source.value = {
      file,
      url: nextUrl,
      pixels: new Uint8ClampedArray(imageData.data),
      width,
      height,
      originalWidth,
      originalHeight,
    }

    clearOutput()

    return source.value
  }

  function cancelProcessing() {
    if (!worker.value && !pendingRequests.size && !isLoading.value) return false

    activeRequestId = ++requestCounter

    const cancelledError = new ImageVectorizerProcessError(
      'CANCELLED',
      'Image vectorization was cancelled.',
    )

    for (const pending of pendingRequests.values()) {
      pending.reject(cancelledError)
    }

    pendingRequests.clear()
    worker.value?.terminate()
    worker.value = null
    isLoading.value = false
    progress.value = {
      percent: 0,
      stage: 'preparing',
    }

    return true
  }

  function process(settings: ImageVectorizerSettings) {
    const currentSource = source.value

    if (!currentSource) {
      return Promise.reject(
        new ImageVectorizerProcessError(
          'NO_IMAGE',
          'Choose an image before starting vectorization.',
        ),
      )
    }

    cancelProcessing()

    const id = ++requestCounter
    activeRequestId = id
    isLoading.value = true
    progress.value = {
      percent: 1,
      stage: 'preparing',
    }
    error.value = null

    const pixels = currentSource.pixels.slice().buffer
    const workerSettings = normalizeImageVectorizerSettings({
      ...settings,
      backgroundColor: settings.backgroundColor || null,
      paletteOverrides: {
        ...settings.paletteOverrides,
      },
    })
    const request: ImageVectorizerWorkerRequest = {
      type: 'process',
      id,
      width: currentSource.width,
      height: currentSource.height,
      pixels,
      settings: workerSettings,
    }

    return new Promise<ImageVectorizerResult>((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject })

      try {
        getWorker().postMessage(request, [pixels])
      } catch (caughtError) {
        pendingRequests.delete(id)

        const processError = new ImageVectorizerProcessError(
          'WORKER_MESSAGE_FAILED',
          caughtError instanceof Error
            ? caughtError.message
            : 'Could not send the vectorizer request to the worker.',
        )

        if (id === activeRequestId) {
          error.value = processError
          isLoading.value = false
        }

        reject(processError)
      }
    })
  }

  function clearOutput() {
    result.value = null
    error.value = null
    revokeUrl(rasterUrl.value)
    revokeUrl(svgUrl.value)
    rasterUrl.value = ''
    rasterBlob.value = null
    svgUrl.value = ''
    progress.value = {
      percent: 0,
      stage: 'preparing',
    }
  }

  function reset() {
    cancelProcessing()

    if (source.value) revokeUrl(source.value.url)
    source.value = null
    clearOutput()
    isLoading.value = false
  }

  function getOutputBaseName(fileName?: string) {
    const fallback = result.value?.mode === 'upscale'
      ? 'upscaled-image'
      : 'vectorized-image'
    const sourceName = source.value?.file.name || fallback

    return (fileName || sourceName)
      .replace(/\.[^.]+$/, '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .trim() || fallback
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.click()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function downloadSvg(fileName?: string) {
    if (!result.value?.svg) return false

    const blob = new Blob([result.value.svg], {
      type: 'image/svg+xml;charset=utf-8',
    })

    downloadBlob(blob, `${getOutputBaseName(fileName)}.svg`)
    return true
  }

  function downloadPng(fileName?: string) {
    if (!rasterBlob.value) return false

    const suffix = result.value?.mode === 'upscale' ? '.upscaled.png' : '.reduced.png'
    downloadBlob(rasterBlob.value, `${getOutputBaseName(fileName)}${suffix}`)
    return true
  }

  async function copySvgCode() {
    if (!result.value?.svg) {
      throw new ImageVectorizerProcessError(
        'NO_SVG_OUTPUT',
        'No SVG output is available to copy.',
      )
    }

    if (!navigator.clipboard?.writeText) {
      throw new ImageVectorizerProcessError(
        'CLIPBOARD_WRITE_UNAVAILABLE',
        'Text clipboard access is unavailable in this browser.',
      )
    }

    await navigator.clipboard.writeText(result.value.svg)
  }

  async function copyPng() {
    if (!rasterBlob.value) {
      throw new ImageVectorizerProcessError(
        'NO_PNG_OUTPUT',
        'No reduced-color PNG output is available to copy.',
      )
    }

    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new ImageVectorizerProcessError(
        'IMAGE_CLIPBOARD_UNAVAILABLE',
        'Image clipboard access is unavailable in this browser.',
      )
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': rasterBlob.value,
      }),
    ])
  }

  async function pasteImageFromClipboard() {
    if (!navigator.clipboard?.read) {
      throw new ImageVectorizerProcessError(
        'CLIPBOARD_READ_UNAVAILABLE',
        'Image clipboard reading is unavailable in this browser.',
      )
    }

    const clipboardItems = await navigator.clipboard.read()

    for (const clipboardItem of clipboardItems) {
      const imageType = clipboardItem.types.find((type) => {
        return type.startsWith('image/')
      })

      if (!imageType) continue

      const blob = await clipboardItem.getType(imageType)
      const extension = imageType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
      const file = new File(
        [blob],
        `clipboard-image-${Date.now()}.${extension}`,
        {
          type: imageType,
          lastModified: Date.now(),
        },
      )

      await loadFile(file)
      return file
    }

    throw new ImageVectorizerProcessError(
      'NO_CLIPBOARD_IMAGE',
      'The clipboard does not contain an image.',
    )
  }

  function cleanup() {
    cancelProcessing()

    if (source.value) revokeUrl(source.value.url)
    source.value = null
    clearOutput()
  }

  onBeforeUnmount(cleanup)

  return {
    source,
    sourceUrl,
    sourceFile,
    result,
    rasterUrl,
    rasterBlob,
    svgUrl,
    isLoading,
    progress,
    error,
    loadFile,
    process,
    cancelProcessing,
    clearOutput,
    reset,
    downloadSvg,
    downloadPng,
    copySvgCode,
    copyPng,
    pasteImageFromClipboard,
    cleanup,
  }
}
