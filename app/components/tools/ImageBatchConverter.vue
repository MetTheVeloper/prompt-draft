<script setup lang="ts">
import ImageConverterFilesModal from '~/components/tools/ImageConverterFilesModal.vue'
import type {
  ImageConverterFormat,
  ImageConverterImageItem,
  ImageConverterZipEntry,
} from '~/types/imageConverter'
import { createZipBlob } from '~/utils/browserZip'

const QUALITY_OPTIONS = [30, 40, 50, 60, 70, 80, 90, 100]

type ConversionStats = {
  originalSize: number
  convertedSize: number
  convertedCount: number
}

const modal = useModal()
const { t } = useI18n()
const { mobile } = useScreen()

const fileInput = ref<HTMLInputElement | null>(null)
const items = ref<ImageConverterImageItem[]>([])
const outputFormat = ref<ImageConverterFormat>('webp')
const outputQuality = ref(80)
const isDragging = ref(false)
const isConverting = ref(false)
const statusText = ref('')
const conversionStats = ref<ConversionStats | null>(null)

const controlsCols = computed(() => {
  return mobile.value ? 1 : 2
})

const formatOptions = computed(() => [
  {
    label: t('tools.imageConverter.formats.webp'),
    value: 'webp',
    icon: 'photo_library',
  },
  {
    label: t('tools.imageConverter.formats.jpg'),
    value: 'jpg',
    icon: 'image',
  },
])

const qualityOptions = computed(() => {
  return QUALITY_OPTIONS.map((quality) => ({
    label: t('tools.imageConverter.qualityPercent', { quality }),
    value: quality,
    icon: 'auto_awesome',
  }))
})

const selectedOutputFormat = computed<ImageConverterFormat>({
  get() {
    return outputFormat.value
  },
  set(value) {
    if (value === 'jpg' || value === 'webp') {
      outputFormat.value = value
    }
  },
})

const selectedOutputQuality = computed<number>({
  get() {
    return outputQuality.value
  },
  set(value) {
    const quality = Number(value)

    if (QUALITY_OPTIONS.includes(quality)) {
      outputQuality.value = quality
    }
  },
})

const totalSize = computed(() => {
  return items.value.reduce((total, item) => total + item.size, 0)
})

const selectedCountText = computed(() => {
  return t('tools.imageConverter.selected.count', {
    count: items.value.length,
  })
})

const totalSizeText = computed(() => {
  return t('tools.imageConverter.selected.totalSize', {
    size: formatBytes(totalSize.value),
  })
})

const optimizationText = computed(() => {
  if (!conversionStats.value) return ''

  const { originalSize, convertedSize } = conversionStats.value

  if (!originalSize || !convertedSize) return ''

  const difference = originalSize - convertedSize
  const percent = (Math.abs(difference) / originalSize) * 100
  const values = {
    inputSize: formatBytes(originalSize),
    outputSize: formatBytes(convertedSize),
    percent: formatPercent(percent),
  }

  if (Math.abs(percent) < 0.5) {
    return t('tools.imageConverter.optimization.unchanged', values)
  }

  if (difference > 0) {
    return t('tools.imageConverter.optimization.reduced', values)
  }

  return t('tools.imageConverter.optimization.increased', values)
})

function resetConversionResult() {
  conversionStats.value = null
}

function openFilePicker() {
  fileInput.value?.click()
}

function createItem(file: File): ImageConverterImageItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    name: file.name,
    size: file.size,
    url: URL.createObjectURL(file),
  }
}

function addFiles(files: File[]) {
  const imageFiles = files.filter(isImageFile)

  if (!imageFiles.length) {
    modal.message({
      type: 'warning',
      message: t('tools.imageConverter.messages.noImageFiles'),
      width: 460,
    })
    return
  }

  items.value = [
    ...items.value,
    ...imageFiles.map(createItem),
  ]

  statusText.value = ''
  resetConversionResult()
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true

  return /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name)
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(Array.from(input.files || []))
  input.value = ''
}

function handleDragEnter() {
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node | null

  if (relatedTarget && target.contains(relatedTarget)) return

  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  addFiles(Array.from(event.dataTransfer?.files || []))
}

function removeFile(id: string) {
  const target = items.value.find((item) => item.id === id)

  if (target) {
    URL.revokeObjectURL(target.url)
  }

  items.value = items.value.filter((item) => item.id !== id)
  statusText.value = ''
  resetConversionResult()
}

function clearAll() {
  items.value.forEach((item) => URL.revokeObjectURL(item.url))
  items.value = []
  statusText.value = ''
  resetConversionResult()
}

function openFilesModal() {
  modal.open({
    header: {
      icon: 'photo_library',
      title: t('tools.imageConverter.preview.title'),
      subtitle: t('tools.imageConverter.preview.subtitle'),
      closeButton: true,
      color: 'prim',
    },
    component: ImageConverterFilesModal,
    props: {
      items: items.value,
      onRemove: removeFile,
    },
    options: {
      width: 760,
      maxHeight: '82vh',
      closeOnBackdrop: true,
      closeOnEsc: true,
    },
  })
}

async function downloadOutputs() {
  if (!items.value.length) {
    modal.message({
      type: 'warning',
      message: t('tools.imageConverter.messages.noFiles'),
      width: 460,
    })
    return
  }

  isConverting.value = true
  statusText.value = t('tools.imageConverter.status.converting')
  resetConversionResult()

  try {
    const usedNames = new Map<string, number>()
    const zipEntries: ImageConverterZipEntry[] = []
    const failedNames: string[] = []
    let convertedOriginalSize = 0
    let convertedOutputSize = 0

    for (const item of items.value) {
      try {
        const blob = await convertImage(item.file, outputFormat.value, outputQuality.value)
        const outputName = createOutputFileName(item.name, outputFormat.value, usedNames)

        convertedOriginalSize += item.size
        convertedOutputSize += blob.size

        zipEntries.push({
          name: outputName,
          data: blob,
          lastModified: item.file.lastModified,
        })
      } catch (error) {
        console.error('[ImageBatchConverter] Failed to convert image:', error)
        failedNames.push(item.name)
      }
    }

    if (!zipEntries.length) {
      throw new Error('No image could be converted.')
    }

    conversionStats.value = {
      originalSize: convertedOriginalSize,
      convertedSize: convertedOutputSize,
      convertedCount: zipEntries.length,
    }

    statusText.value = t('tools.imageConverter.status.zipping')

    const zip = await createZipBlob(zipEntries)
    downloadBlob(zip, createZipName(outputFormat.value))

    statusText.value = failedNames.length
      ? t('tools.imageConverter.status.completedWithErrors', {
          count: failedNames.length,
        })
      : t('tools.imageConverter.status.completed')
  } catch (error) {
    console.error('[ImageBatchConverter] Failed to export images:', error)
    statusText.value = ''
    resetConversionResult()
    modal.message({
      type: 'error',
      message: t('tools.imageConverter.messages.exportFailed'),
      width: 480,
    })
  } finally {
    isConverting.value = false
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function formatPercent(percent: number) {
  if (percent >= 10) return percent.toFixed(0)

  return percent.toFixed(1)
}

function getMimeType(format: ImageConverterFormat) {
  return format === 'jpg'
    ? 'image/jpeg'
    : 'image/webp'
}

function getExtension(format: ImageConverterFormat) {
  return format === 'jpg'
    ? 'jpg'
    : 'webp'
}

function createZipName(format: ImageConverterFormat) {
  const date = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')

  return `prompt-draft-images-${format}-${date}.zip`
}

function createOutputFileName(
  fileName: string,
  format: ImageConverterFormat,
  usedNames: Map<string, number>,
) {
  const extension = getExtension(format)
  const baseName = (fileName || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'image'

  const candidate = `${baseName}.${extension}`
  const usedCount = usedNames.get(candidate) || 0

  usedNames.set(candidate, usedCount + 1)

  if (!usedCount) return candidate

  return `${baseName}-${usedCount + 1}.${extension}`
}

async function decodeImage(file: File) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions)
    } catch {
      // The HTMLImageElement fallback covers formats/browsers that createImageBitmap cannot decode.
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

async function convertImage(
  file: File,
  format: ImageConverterFormat,
  quality: number,
) {
  const image = await decodeImage(file)
  const width = image.width
  const height = image.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is not available.')
  }

  if (format === 'jpg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }

  context.drawImage(image, 0, 0, width, height)

  if ('close' in image && typeof image.close === 'function') {
    image.close()
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (output) => {
        if (output) {
          resolve(output)
        } else {
          reject(new Error('Canvas export failed.'))
        }
      },
      getMimeType(format),
      quality / 100,
    )
  })

  return blob
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

watch([outputFormat, outputQuality], () => {
  statusText.value = ''
  resetConversionResult()
})

onBeforeUnmount(() => {
  items.value.forEach((item) => URL.revokeObjectURL(item.url))
})
</script>

<template>
  <div
    class="image-batch-converter"
    :class="{ 'is-dragging': isDragging }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      class="image-batch-converter-input"
      type="file"
      accept="image/*"
      multiple
      @change="handleInputChange"
    />

    <el-flex v-if="!items.length" rules="ccc" :gap="16" :p="28" bg="normal5" :radius="22" class="image-batch-converter-empty">
      <el-icon icon="add_photo_alternate" :size="34" />

      <el-flex rules="ccc" :gap="6">
        <el-text :size="16" :weight="600" icon="add_photo_alternate" marker="blue40">
          {{ $t('tools.imageConverter.empty.title') }}
        </el-text>
        <el-text :size="13" :weight="300" color="normal70" class="image-batch-converter-empty-description">
          {{ $t('tools.imageConverter.empty.description') }}
        </el-text>
      </el-flex>

      <el-button
        color="prim"
        icon="add"
        :label="$t('tools.imageConverter.empty.action')"
        :size="13"
        :p="[10, 14]"
        @click="openFilePicker"
      />
    </el-flex>

    <el-flex v-else rules="csc" :gap="18">
      <el-flex rules="csc" :gap="6" bg="normal5" :p="18" :radius="20" class="image-batch-converter-summary">
        <el-text :size="18" :weight="700" icon="photo_library" marker="blue40">
          {{ selectedCountText }}
        </el-text>
        <el-text :size="13" :weight="300" color="normal70" icon="folder_open">
          {{ totalSizeText }}
        </el-text>
      </el-flex>

      <el-flex rules="rsc" :gap="8" class="image-batch-converter-actions">
        <el-button
          icon="add"
          mode="flat"
          :label="$t('tools.imageConverter.actions.addMore')"
          :size="12"
          :p="[9, 12]"
          @click="openFilePicker"
        />

        <el-button
          icon="photo_library"
          mode="flat"
          color="prim"
          :label="$t('tools.imageConverter.actions.viewFiles')"
          :size="12"
          :p="[9, 12]"
          @click="openFilesModal"
        />

        <el-button
          icon="delete"
          mode="flat"
          color="red"
          :label="$t('tools.imageConverter.actions.clearAll')"
          :size="12"
          :p="[9, 12]"
          @click="clearAll"
        />
      </el-flex>
    </el-flex>

    <el-grid :cols="controlsCols" :gap="12" class="image-batch-converter-controls">
      <el-flex rules="csc" :gap="8" class="image-batch-converter-control">
        <el-text :size="12" :weight="400" color="normal70" icon="tune" marker="blue40">
          {{ $t('tools.imageConverter.controls.format') }}
        </el-text>

        <el-dropdown
          v-model="selectedOutputFormat"
          :items="formatOptions"
          icon="photo_library"
          :placeholder="$t('tools.imageConverter.controls.format')"
          :menu-options="{ zIndex: 40000 }"
        />
      </el-flex>

      <el-flex rules="csc" :gap="8" class="image-batch-converter-control">
        <el-text :size="12" :weight="400" color="normal70" icon="auto_awesome" marker="blue40">
          {{ $t('tools.imageConverter.controls.quality') }}
        </el-text>

        <el-dropdown
          v-model="selectedOutputQuality"
          :items="qualityOptions"
          icon="auto_awesome"
          :placeholder="$t('tools.imageConverter.controls.quality')"
          :menu-options="{ zIndex: 40000 }"
        />
      </el-flex>
    </el-grid>

    <el-flex rules="csc" :gap="6" class="image-batch-converter-download-area">
      <el-button
        color="prim"
        icon="download"
        class="image-batch-converter-download"
        :label="isConverting ? $t('tools.imageConverter.actions.downloading') : $t('tools.imageConverter.actions.download')"
        :disable="isConverting || !items.length"
        :disabled="isConverting || !items.length"
        :effect="true"
        :size="14"
        :p="[12, 16]"
        @click="downloadOutputs"
      />

      <el-text
        v-if="optimizationText"
        :size="10"
        :weight="300"
        color="normal60"
        icon="analytics"
        marker="blue40"
        class="image-batch-converter-optimization"
      >
        {{ optimizationText }}
      </el-text>

      <el-text v-if="statusText" :size="12" :weight="300" color="normal70" class="image-batch-converter-status">
        {{ statusText }}
      </el-text>
    </el-flex>
  </div>
</template>

<style scoped>
.image-batch-converter {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px;
}

.image-batch-converter.is-dragging {
  outline: 1px dashed currentColor;
  outline-offset: 8px;
  border-radius: 24px;
}

.image-batch-converter-input {
  display: none;
}

.image-batch-converter-empty {
  min-height: 220px;
  border: 1px dashed color-mix(in srgb, currentColor 20%, transparent);
  text-align: center;
}

.image-batch-converter-empty-description {
  max-width: 420px;
  line-height: 1.8;
}

.image-batch-converter-summary {
  width: 100%;
}

.image-batch-converter-actions {
  width: 100%;
  flex-wrap: wrap;
}

.image-batch-converter-controls {
  width: 100%;
}

.image-batch-converter-control {
  width: 100%;
  min-width: 0;
}

.image-batch-converter-download-area,
.image-batch-converter-download {
  width: 100%;
}

.image-batch-converter-optimization,
.image-batch-converter-status {
  text-align: center;
}
</style>
