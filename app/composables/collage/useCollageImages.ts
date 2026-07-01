import type {
  CollageImageItem,
} from '~/types/collage'

import {
  loadCollageImageFile,
} from '~/utils/collage/file'

type UseCollageImagesOptions = {
  onChange?: () => void | Promise<void>
}

export function useCollageImages(options: UseCollageImagesOptions = {}) {
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const images = ref<CollageImageItem[]>([])
  const isDragging = ref(false)

  function openFilePicker() {
    fileInputRef.value?.click()
  }

  function openReplaceFilePicker(id: string) {
    if (!import.meta.client) return

    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'

    let cleanupTimer: number | null = null

    function cleanup() {
      if (cleanupTimer !== null) {
        window.clearTimeout(cleanupTimer)
        cleanupTimer = null
      }

      input.remove()
    }

    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0]

        cleanup()

        if (!file) return

        void replaceImage(id, file)
      },
      { once: true },
    )

    document.body.appendChild(input)
    input.click()

    cleanupTimer = window.setTimeout(cleanup, 60_000)
  }

  async function notifyChange() {
    await options.onChange?.()
  }

  async function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])

    await addFiles(files)

    input.value = ''
  }

  async function addFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))

    if (!imageFiles.length) return

    const loadedImages = await Promise.all(
      imageFiles.map(loadCollageImageFile)
    )

    images.value.push(...loadedImages)

    await nextTick()
    await notifyChange()
  }

  async function replaceImage(id: string, file: File) {
    if (!file.type.startsWith('image/')) return

    const targetIndex = images.value.findIndex((item) => item.id === id)

    if (targetIndex < 0) return

    const previousImage = images.value[targetIndex]
    if (!previousImage) return

    const nextImage = await loadCollageImageFile(file)

    URL.revokeObjectURL(previousImage.url)

    images.value.splice(targetIndex, 1, {
      ...nextImage,
      id: previousImage.id,
    })

    await nextTick()
    await notifyChange()
  }

  async function removeImage(id: string) {
    const target = images.value.find((item) => item.id === id)

    if (target) {
      URL.revokeObjectURL(target.url)
    }

    images.value = images.value.filter((item) => item.id !== id)

    await notifyChange()
  }

  async function clearImages() {
    for (const item of images.value) {
      URL.revokeObjectURL(item.url)
    }

    images.value = []

    await notifyChange()
  }

  function handlePaste(event: ClipboardEvent) {
    const items = Array.from(event.clipboardData?.items || [])

    const files = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean) as File[]

    if (!files.length) return

    void addFiles(files)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false

    const files = Array.from(event.dataTransfer?.files || [])

    void addFiles(files)
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave() {
    isDragging.value = false
  }

  function disposeImages() {
    for (const item of images.value) {
      URL.revokeObjectURL(item.url)
    }

    images.value = []
  }

  return {
    fileInputRef,
    images,
    isDragging,

    openFilePicker,
    openReplaceFilePicker,
    handleFileInput,
    addFiles,
    replaceImage,
    removeImage,
    clearImages,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    disposeImages,
  }
}