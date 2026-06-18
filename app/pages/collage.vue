<script setup lang="ts">
// app/pages/collage.vue

import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Media } from '@capacitor-community/media'

const { orientation, mini } = useScreen();

import QRCode from 'qrcode'

import {
  createCanvasSliderRenderer,
  type CanvasSliderRenderer,
  type CanvasSliderImageSource
} from '~/utils/canvasSliderRenderer'

import type {
  CollageImageItem,
  CollageLayoutResult,
  CollageWatermarkPosition,
} from '~/types/collage'

const fileInputRef = ref<HTMLInputElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

type CollageMode = 'image' | 'video'

const activeMode = ref<CollageMode>('image')

const videoWidth = ref(1080)
const videoHeight = ref(1920)
const videoFps = ref(30)
const videoInterval = ref(2500)
const videoTransitionDuration = ref(1200)
const videoEdgeBlur = ref(160)
const videoRandom = ref(true)
const videoPreset = ref('1080x1920')
const videoLoop = ref(false)
const videoRepeat = ref(1)

const isRecordingVideo = ref(false)

let videoRenderer: CanvasSliderRenderer | null = null

function applyVideoPreset(value: string) {
  videoPreset.value = value

  const [width, height] = value.split('x').map(Number)

  if (!width || !height) return

  videoWidth.value = width
  videoHeight.value = height
}

function handleVideoPresetChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) return

  applyVideoPreset(target.value)
}

const images = ref<CollageImageItem[]>([])

const watermarkPosition = ref<CollageWatermarkPosition>('bottom-center')
const watermarkSize = ref(180)
const watermarkOpacity = ref(0.92)

type BrandOverlayTheme = 'black' | 'white'

const brandOverlayTheme = ref<BrandOverlayTheme>('white')
const telegramPostId = ref('')
const brandOverlayGap = ref(14)

const telegramChannelBase = 'https://t.me/Prompt_draft'

const logoAspectRatio = 1024 / 244

const logoCache = new Map<string, HTMLImageElement>()

const qrCache = ref<{
  url: string
  image: HTMLImageElement | null
}>({
  url: '',
  image: null
})

const videoImageCount = computed(() => images.value.length)

const normalizedVideoRepeat = computed(() => {
  return Math.max(1, Math.round(videoRepeat.value || 1))
})

const videoTotalSlideCount = computed(() => {
  return videoImageCount.value * normalizedVideoRepeat.value
})

const videoTransitionCount = computed(() => {
  const totalSlides = videoTotalSlideCount.value

  if (totalSlides <= 1) return 0

  return videoLoop.value ? totalSlides : totalSlides - 1
})

const videoDurationMs = computed(() => {
  const imageCount = videoImageCount.value

  if (!imageCount) return 0

  const repeat = normalizedVideoRepeat.value
  const interval = Math.max(videoInterval.value, 0)
  const transition = Math.max(videoTransitionDuration.value, 0)

  if (imageCount === 1) {
    return repeat * Math.max(interval, 3000)
  }

  return (
    videoTotalSlideCount.value * interval +
    videoTransitionCount.value * transition
  )
})

const videoDurationLabel = computed(() => {
  const seconds = videoDurationMs.value / 1000

  if (!seconds) return '0s'

  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`
  }

  return `${Math.round(seconds)}s`
})

const padding = ref(24)
const gap = ref(16)
const backgroundColor = ref('#0b0b0f')

const isDragging = ref(false)
const isRendering = ref(false)

const previewInfo = ref({
  width: 0,
  height: 0,
  ratio: 1,
  columns: 0,
  rows: 0
})

const watermarkPositions: {
  label: string
  value: CollageWatermarkPosition
}[] = [
    { label: 'بالا چپ', value: 'top-left' },
    { label: 'بالا وسط', value: 'top-center' },
    { label: 'بالا راست', value: 'top-right' },
    { label: 'وسط چپ', value: 'center-left' },
    { label: 'وسط', value: 'center' },
    { label: 'وسط راست', value: 'center-right' },
    { label: 'پایین چپ', value: 'bottom-left' },
    { label: 'پایین وسط', value: 'bottom-center' },
    { label: 'پایین راست', value: 'bottom-right' }
  ]

const canExport = computed(() => images.value.length > 0)

const canExportImage = computed(() => {
  return activeMode.value === 'image' && images.value.length > 0
})

const canExportVideo = computed(() => {
  return (
    activeMode.value === 'video' &&
    images.value.length > 0 &&
    !isRecordingVideo.value
  )
})

function openFilePicker() {
  fileInputRef.value?.click()
}

function normalizeTelegramPostUrl() {
  const value = telegramPostId.value.trim()

  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  if (value.startsWith('t.me/')) {
    return `https://${value}`
  }

  const cleanPostId = value
    .replace(/^@/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  return `${telegramChannelBase}/${cleanPostId}`
}

function loadImageSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const cached = logoCache.get(src)

    if (cached) {
      resolve(cached)
      return
    }

    const image = new Image()

    image.onload = () => {
      logoCache.set(src, image)
      resolve(image)
    }

    image.onerror = reject

    image.src = src
  })
}

async function getQrImage(url: string) {
  if (!url) {
    qrCache.value = {
      url: '',
      image: null
    }

    return null
  }

  if (qrCache.value.url === url && qrCache.value.image) {
    return qrCache.value.image
  }

  const dataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 1024,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const qrImage = new Image()

    qrImage.onload = () => resolve(qrImage)
    qrImage.onerror = reject
    qrImage.src = dataUrl
  })

  qrCache.value = {
    url,
    image
  }

  return image
}

async function createBrandOverlayCanvas() {
  const overlayHeight = watermarkSize.value

  if (overlayHeight <= 0) return null

  const logoSrc = `/img/logo_${brandOverlayTheme.value}.svg`
  const logoImage = await loadImageSource(logoSrc)

  const qrUrl = normalizeTelegramPostUrl()
  const qrImage = await getQrImage(qrUrl)

  const logoWidth = Math.round(overlayHeight * logoAspectRatio)
  const qrSize = qrImage ? overlayHeight : 0
  const gap = qrImage ? brandOverlayGap.value : 0

  const overlayWidth = Math.round(logoWidth + gap + qrSize)

  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = overlayWidth
  overlayCanvas.height = overlayHeight

  const ctx = overlayCanvas.getContext('2d')

  if (!ctx) return null

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

  ctx.drawImage(
    logoImage,
    0,
    0,
    logoWidth,
    overlayHeight
  )

  if (qrImage) {
    const qrX = logoWidth + gap
    const qrY = 0

    ctx.save()

    ctx.fillStyle = '#ffffff'

    drawRoundedRect(
      ctx,
      qrX,
      qrY,
      qrSize,
      qrSize,
      Math.round(qrSize * 0.12)
    )

    ctx.fill()

    const qrInnerPadding = Math.round(qrSize * 0.08)

    ctx.drawImage(
      qrImage,
      qrX + qrInnerPadding,
      qrY + qrInnerPadding,
      qrSize - qrInnerPadding * 2,
      qrSize - qrInnerPadding * 2
    )

    ctx.restore()
  }

  return overlayCanvas
}

function getBrandOverlayRect(
  canvasWidth: number,
  canvasHeight: number,
  overlayWidth: number,
  overlayHeight: number
) {
  const margin = Math.max(
    28,
    Math.round(Math.min(canvasWidth, canvasHeight) * 0.025)
  )

  const position = watermarkPosition.value

  const isLeft = position.endsWith('left')
  const isRight = position.endsWith('right')
  const isTop = position.startsWith('top')
  const isBottom = position.startsWith('bottom')
  const isVerticalCenter =
    position === 'center' || position.startsWith('center')
  const isHorizontalCenter =
    position === 'center' || position.endsWith('center')

  let x = margin
  let y = margin

  if (isHorizontalCenter) {
    x = (canvasWidth - overlayWidth) / 2
  } else if (isRight) {
    x = canvasWidth - overlayWidth - margin
  } else if (isLeft) {
    x = margin
  }

  if (isVerticalCenter) {
    y = (canvasHeight - overlayHeight) / 2
  } else if (isBottom) {
    y = canvasHeight - overlayHeight - margin
  } else if (isTop) {
    y = margin
  }

  return {
    x,
    y,
    width: overlayWidth,
    height: overlayHeight
  }
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

  const loadedImages = await Promise.all(imageFiles.map(loadImageFile))

  images.value.push(...loadedImages)

  await nextTick()
  await renderCurrentMode()
}

function loadImageFile(file: File): Promise<CollageImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        image
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Cannot load image: ${file.name}`))
    }

    image.src = url
  })
}

function removeImage(id: string) {
  const target = images.value.find((item) => item.id === id)

  if (target) {
    URL.revokeObjectURL(target.url)
  }

  images.value = images.value.filter((item) => item.id !== id)

  renderCurrentMode()
}

function clearImages() {
  for (const item of images.value) {
    URL.revokeObjectURL(item.url)
  }

  images.value = []

  renderCurrentMode()
}

function handlePaste(event: ClipboardEvent) {
  const items = Array.from(event.clipboardData?.items || [])

  const files = items
    .filter((item) => item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter(Boolean) as File[]

  if (!files.length) return

  addFiles(files)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])

  addFiles(files)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function getCanvasSizeFromRatio(ratio: number) {
  const maxSide = 2048

  if (ratio >= 1) {
    return {
      width: maxSide,
      height: Math.round(maxSide / ratio)
    }
  }

  return {
    width: Math.round(maxSide * ratio),
    height: maxSide
  }
}

function getCandidateRatios() {
  return [
    4 / 5,
    1,
    5 / 4,
    16 / 9
  ]
}

function getCropScore(imageRatio: number, cellRatio: number) {
  const diff = Math.abs(Math.log(imageRatio / cellRatio))

  return diff
}

function cloneCells(cells: CollageLayoutResult['cells']) {
  return cells.map((cell) => ({ ...cell }))
}

function calculateLayoutScore(cells: CollageLayoutResult['cells']) {
  if (!cells.length) return Number.POSITIVE_INFINITY

  const cropScores = cells.map((cell) => {
    const imageRatio = cell.image.width / cell.image.height
    const cellRatio = cell.width / cell.height

    return getCropScore(imageRatio, cellRatio)
  })

  const averageCrop = cropScores.reduce((sum, value) => sum + value, 0) / cropScores.length
  const maxCrop = Math.max(...cropScores)

  const areas = cells.map((cell) => cell.width * cell.height)
  const averageArea = areas.reduce((sum, value) => sum + value, 0) / areas.length

  const areaVariance = areas.reduce((sum, area) => {
    return sum + Math.abs(area / averageArea - 1)
  }, 0) / areas.length

  return averageCrop + maxCrop * 0.42 + areaVariance * 0.08
}

function createLayoutResult(
  width: number,
  height: number,
  ratio: number,
  cells: CollageLayoutResult['cells'],
  columns = 0,
  rows = 0,
  extraPenalty = 0
): CollageLayoutResult {
  return {
    width,
    height,
    ratio,
    columns,
    rows,
    cells,
    score: calculateLayoutScore(cells) + extraPenalty
  }
}

function getSortedImagesByRatio() {
  return [...images.value].sort((a, b) => {
    const ratioA = a.width / a.height
    const ratioB = b.width / b.height

    return ratioA - ratioB
  })
}

function getImageRatio(image: CollageImageItem) {
  return image.width / image.height
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getAverageLogRatio(items: CollageImageItem[]) {
  if (!items.length) return 1

  const averageLog = items.reduce((sum, image) => {
    return sum + Math.log(getImageRatio(image))
  }, 0) / items.length

  return Math.exp(averageLog)
}

function getTreemapOrderVariants() {
  const original = [...images.value]

  const ratioAscending = [...images.value].sort((a, b) => {
    return getImageRatio(a) - getImageRatio(b)
  })

  const ratioDescending = [...ratioAscending].reverse()

  const portraits = ratioAscending.filter((image) => getImageRatio(image) < 0.9)
  const landscapes = ratioAscending.filter((image) => getImageRatio(image) >= 0.9)

  const portraitEdges = [
    ...portraits.slice(0, Math.ceil(portraits.length / 2)),
    ...landscapes,
    ...portraits.slice(Math.ceil(portraits.length / 2))
  ]

  const landscapeEdges = [
    ...landscapes.slice(0, Math.ceil(landscapes.length / 2)),
    ...portraits,
    ...landscapes.slice(Math.ceil(landscapes.length / 2))
  ]

  const alternating: CollageImageItem[] = []
  const maxLength = Math.max(portraits.length, landscapes.length)

  for (let index = 0; index < maxLength; index++) {
    if (portraits[index]) alternating.push(portraits[index])
    if (landscapes[index]) alternating.push(landscapes[index])
  }

  const variants = [
    original,
    ratioAscending,
    portraitEdges,
    alternating
  ]

  const signatures = new Set<string>()

  return variants.filter((variant) => {
    const signature = variant.map((image) => image.id).join(',')

    if (signatures.has(signature)) return false

    signatures.add(signature)

    return true
  })
}

function getTreemapSplitIndexes(length: number) {
  if (length <= 1) return []

  const indexes = new Set<number>()

  indexes.add(Math.floor(length / 2))
  indexes.add(Math.ceil(length / 2))

  if (length <= 5) {
    indexes.add(1)
    indexes.add(length - 1)
  }

  return [...indexes].filter((index) => index > 0 && index < length)
}

function getTreemapSplitRatios(
  groupA: CollageImageItem[],
  groupB: CollageImageItem[],
  direction: 'vertical' | 'horizontal'
) {
  const countRatio = groupA.length / (groupA.length + groupB.length)

  const ratioA = getAverageLogRatio(groupA)
  const ratioB = getAverageLogRatio(groupB)

  let idealRatio = 0.5

  if (direction === 'vertical') {
    idealRatio = ratioA / (ratioA + ratioB)
  } else {
    const heightDemandA = 1 / ratioA
    const heightDemandB = 1 / ratioB

    idealRatio = heightDemandA / (heightDemandA + heightDemandB)
  }

  const rawRatios = [
    idealRatio,
    0.5,
    countRatio
  ]

  const uniqueRatios = new Set<number>()

  for (const ratio of rawRatios) {
    uniqueRatios.add(Number(clamp(ratio, 0.22, 0.78).toFixed(3)))
  }

  return [...uniqueRatios]
}

function splitTreemapRect(
  rect: TreemapRect,
  direction: 'vertical' | 'horizontal',
  splitRatio: number
): [TreemapRect, TreemapRect] {
  if (direction === 'vertical') {
    const firstWidth = rect.width * splitRatio

    return [
      {
        x: rect.x,
        y: rect.y,
        width: firstWidth - gap.value / 2,
        height: rect.height
      },
      {
        x: rect.x + firstWidth + gap.value / 2,
        y: rect.y,
        width: rect.width - firstWidth - gap.value / 2,
        height: rect.height
      }
    ]
  }

  const firstHeight = rect.height * splitRatio

  return [
    {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: firstHeight - gap.value / 2
    },
    {
      x: rect.x,
      y: rect.y + firstHeight + gap.value / 2,
      width: rect.width,
      height: rect.height - firstHeight - gap.value / 2
    }
  ]
}

function chunkImages<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function interleaveColumns<T>(first: T[], second: T[]) {
  const result: T[] = []
  const maxLength = Math.max(first.length, second.length)

  for (let index = 0; index < maxLength; index++) {
    if (first[index]) result.push(first[index])
    if (second[index]) result.push(second[index])
  }

  return result
}

function getColumnNaturalRatio(column: CollageImageItem[]) {
  const totalInverseRatio = column.reduce((sum, image) => {
    return sum + 1 / getImageRatio(image)
  }, 0)

  if (totalInverseRatio <= 0) return 1

  return 1 / totalInverseRatio
}

function getColumnSignature(columns: CollageImageItem[][]) {
  return columns
    .map((column) => column.map((image) => image.id).join(','))
    .join('|')
}

function pushUniqueColumnVariant(
  variants: CollageImageItem[][][],
  signatures: Set<string>,
  columns: CollageImageItem[][]
) {
  const cleanColumns = columns.filter((column) => column.length > 0)

  if (!cleanColumns.length) return

  const signature = getColumnSignature(cleanColumns)

  if (signatures.has(signature)) return

  signatures.add(signature)
  variants.push(cleanColumns)
}

function createLayoutFromColumns(
  ratio: number,
  columns: CollageImageItem[][],
  extraPenalty = 0
): CollageLayoutResult | null {
  if (!columns.length) return null

  const canvasSize = getCanvasSizeFromRatio(ratio)

  const innerX = padding.value
  const innerY = padding.value
  const innerWidth = canvasSize.width - padding.value * 2
  const innerHeight = canvasSize.height - padding.value * 2

  if (innerWidth <= 0 || innerHeight <= 0) return null

  const totalColumnGap = gap.value * (columns.length - 1)
  const availableColumnsWidth = innerWidth - totalColumnGap

  if (availableColumnsWidth <= 0) return null

  const columnWeights = columns.map(getColumnNaturalRatio)
  const totalColumnWeight = columnWeights.reduce((sum, value) => sum + value, 0)

  if (totalColumnWeight <= 0) return null

  let currentX = innerX

  const cells: CollageLayoutResult['cells'] = []

  columns.forEach((column, columnIndex) => {
    const columnWidth = availableColumnsWidth * (columnWeights[columnIndex] / totalColumnWeight)

    const totalRowGap = gap.value * (column.length - 1)
    const availableRowsHeight = innerHeight - totalRowGap

    if (availableRowsHeight <= 0) return

    const rowWeights = column.map((image) => {
      return 1 / getImageRatio(image)
    })

    const totalRowWeight = rowWeights.reduce((sum, value) => sum + value, 0)

    let currentY = innerY

    column.forEach((image, rowIndex) => {
      const cellHeight = availableRowsHeight * (rowWeights[rowIndex] / totalRowWeight)

      cells.push({
        image,
        x: currentX,
        y: currentY,
        width: columnWidth,
        height: cellHeight
      })

      currentY += cellHeight + gap.value
    })

    currentX += columnWidth + gap.value
  })

  const columnCountPenalty = Math.max(0, columns.length - 5) * 0.1
  const tinyColumnPenalty = columns.some((column) => column.length >= 4) ? 0.08 : 0

  return createLayoutResult(
    canvasSize.width,
    canvasSize.height,
    ratio,
    cells,
    columns.length,
    Math.max(...columns.map((column) => column.length)),
    extraPenalty + columnCountPenalty + tinyColumnPenalty
  )
}

function solveTreemapGroup(
  items: CollageImageItem[],
  rect: TreemapRect,
  depth = 0
): TreemapCandidate[] {
  if (!items.length) {
    return []
  }

  if (items.length === 1) {
    const image = items[0]
    const imageRatio = getImageRatio(image)
    const rectRatio = rect.width / rect.height

    return [
      {
        cells: [
          {
            image,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        ],
        score: getCropScore(imageRatio, rectRatio)
      }
    ]
  }

  const candidates: TreemapCandidate[] = []
  const splitIndexes = getTreemapSplitIndexes(items.length)

  for (const splitIndex of splitIndexes) {
    const groupA = items.slice(0, splitIndex)
    const groupB = items.slice(splitIndex)

    for (const direction of ['vertical', 'horizontal'] as const) {
      const splitRatios = getTreemapSplitRatios(groupA, groupB, direction)

      for (const splitRatio of splitRatios) {
        const [rectA, rectB] = splitTreemapRect(rect, direction, splitRatio)

        if (
          rectA.width <= 16 ||
          rectA.height <= 16 ||
          rectB.width <= 16 ||
          rectB.height <= 16
        ) {
          continue
        }

        const candidatesA = solveTreemapGroup(groupA, rectA, depth + 1)
        const candidatesB = solveTreemapGroup(groupB, rectB, depth + 1)

        const bestA = candidatesA[0]
        const bestB = candidatesB[0]

        if (!bestA || !bestB) continue

        const cells = [...bestA.cells, ...bestB.cells]

        const balancePenalty = Math.abs(groupA.length - groupB.length) * 0.015
        const depthPenalty = depth * 0.004

        candidates.push({
          cells,
          score: calculateLayoutScore(cells) + balancePenalty + depthPenalty
        })
      }
    }
  }

  return candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
}

function createAdaptiveColumnLayoutsForRatio(ratio: number): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (images.value.length < 3) return result

  const portraitImages = images.value.filter((image) => getImageRatio(image) < 0.9)
  const landscapeImages = images.value.filter((image) => getImageRatio(image) >= 0.9)

  if (!portraitImages.length || !landscapeImages.length) return result

  const variants: CollageImageItem[][][] = []
  const signatures = new Set<string>()

  const portraitSingleColumns = portraitImages.map((image) => [image])

  for (const landscapeStackSize of [1, 2, 3]) {
    const landscapeColumns = chunkImages(landscapeImages, landscapeStackSize)

    const splitIndex = Math.ceil(portraitSingleColumns.length / 2)

    const leftPortraits = portraitSingleColumns.slice(0, splitIndex)
    const rightPortraits = portraitSingleColumns.slice(splitIndex)

    pushUniqueColumnVariant(
      variants,
      signatures,
      [
        ...leftPortraits,
        ...landscapeColumns,
        ...rightPortraits
      ]
    )

    pushUniqueColumnVariant(
      variants,
      signatures,
      [
        ...portraitSingleColumns,
        ...landscapeColumns
      ]
    )

    pushUniqueColumnVariant(
      variants,
      signatures,
      [
        ...landscapeColumns,
        ...portraitSingleColumns
      ]
    )

    pushUniqueColumnVariant(
      variants,
      signatures,
      interleaveColumns(portraitSingleColumns, landscapeColumns)
    )

    pushUniqueColumnVariant(
      variants,
      signatures,
      interleaveColumns(landscapeColumns, portraitSingleColumns)
    )
  }

  const sortedByRatio = getSortedImagesByRatio()

  for (const columnCount of [2, 3, 4, 5]) {
    if (columnCount > images.value.length) continue

    const columns: CollageImageItem[][] = Array.from(
      { length: columnCount },
      () => []
    )

    sortedByRatio.forEach((image, index) => {
      columns[index % columnCount].push(image)
    })

    pushUniqueColumnVariant(variants, signatures, columns)
  }

  for (const columns of variants) {
    const layout = createLayoutFromColumns(ratio, columns, 0.035)

    if (layout) {
      result.push(layout)
    }
  }

  return result
}

function createGridLayoutForRatio(ratio: number): CollageLayoutResult | null {
  if (!images.value.length) return null

  const imageCount = images.value.length
  const canvasSize = getCanvasSizeFromRatio(ratio)

  let bestLayout: CollageLayoutResult | null = null

  for (let columns = 1; columns <= imageCount; columns++) {
    const rows = Math.ceil(imageCount / columns)

    const innerWidth = canvasSize.width - padding.value * 2 - gap.value * (columns - 1)
    const innerHeight = canvasSize.height - padding.value * 2 - gap.value * (rows - 1)

    if (innerWidth <= 0 || innerHeight <= 0) continue

    const cellWidth = innerWidth / columns
    const cellHeight = innerHeight / rows

    const cells = images.value.map((image, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)

      return {
        image,
        x: padding.value + column * (cellWidth + gap.value),
        y: padding.value + row * (cellHeight + gap.value),
        width: cellWidth,
        height: cellHeight
      }
    })

    const emptyCells = columns * rows - imageCount
    const emptyCellsPenalty = emptyCells * 0.22
    const tooManyColumnsPenalty = columns > 4 ? (columns - 4) * 0.14 : 0

    const layout = createLayoutResult(
      canvasSize.width,
      canvasSize.height,
      ratio,
      cells,
      columns,
      rows,
      emptyCellsPenalty + tooManyColumnsPenalty
    )

    if (!bestLayout || layout.score < bestLayout.score) {
      bestLayout = layout
    }
  }

  return bestLayout
}

function createSideHeroLayoutsForRatio(ratio: number): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (images.value.length < 3) return result

  const canvasSize = getCanvasSizeFromRatio(ratio)

  const innerX = padding.value
  const innerY = padding.value
  const innerWidth = canvasSize.width - padding.value * 2
  const innerHeight = canvasSize.height - padding.value * 2

  if (innerWidth <= 0 || innerHeight <= 0) return result

  const sorted = getSortedImagesByRatio()
  const portraitCandidate = sorted[0]
  const otherImages = images.value.filter((item) => item.id !== portraitCandidate.id)

  const portraitRatio = portraitCandidate.width / portraitCandidate.height

  if (portraitRatio > 0.9) return result

  const heroWidthRatios = [0.34, 0.38, 0.42, 0.46, 0.5]

  for (const heroWidthRatio of heroWidthRatios) {
    const heroWidth = (innerWidth - gap.value) * heroWidthRatio
    const stackWidth = innerWidth - heroWidth - gap.value

    if (heroWidth <= 0 || stackWidth <= 0) continue

    const stackRows = otherImages.length
    const stackCellHeight = (innerHeight - gap.value * (stackRows - 1)) / stackRows

    if (stackCellHeight <= 0) continue

    const leftHeroCells = [
      {
        image: portraitCandidate,
        x: innerX,
        y: innerY,
        width: heroWidth,
        height: innerHeight
      },
      ...otherImages.map((image, index) => ({
        image,
        x: innerX + heroWidth + gap.value,
        y: innerY + index * (stackCellHeight + gap.value),
        width: stackWidth,
        height: stackCellHeight
      }))
    ]

    const rightHeroCells = [
      ...otherImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (stackCellHeight + gap.value),
        width: stackWidth,
        height: stackCellHeight
      })),
      {
        image: portraitCandidate,
        x: innerX + stackWidth + gap.value,
        y: innerY,
        width: heroWidth,
        height: innerHeight
      }
    ]

    const sideHeroPenalty = 0.04

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        leftHeroCells,
        2,
        stackRows,
        sideHeroPenalty
      )
    )

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        rightHeroCells,
        2,
        stackRows,
        sideHeroPenalty
      )
    )
  }

  return result
}

function createSplitGroupLayoutsForRatio(ratio: number): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (images.value.length < 4) return result

  const canvasSize = getCanvasSizeFromRatio(ratio)

  const innerX = padding.value
  const innerY = padding.value
  const innerWidth = canvasSize.width - padding.value * 2
  const innerHeight = canvasSize.height - padding.value * 2

  if (innerWidth <= 0 || innerHeight <= 0) return result

  const portraitImages = images.value.filter((item) => item.width / item.height < 0.9)
  const landscapeImages = images.value.filter((item) => item.width / item.height >= 0.9)

  if (!portraitImages.length || !landscapeImages.length) return result

  const splitRatios = [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65]

  for (const splitRatio of splitRatios) {
    const leftWidth = (innerWidth - gap.value) * splitRatio
    const rightWidth = innerWidth - leftWidth - gap.value

    if (leftWidth <= 0 || rightWidth <= 0) continue

    const portraitCellHeight = (innerHeight - gap.value * (portraitImages.length - 1)) / portraitImages.length
    const landscapeCellHeight = (innerHeight - gap.value * (landscapeImages.length - 1)) / landscapeImages.length

    if (portraitCellHeight <= 0 || landscapeCellHeight <= 0) continue

    const leftPortraitCells = [
      ...portraitImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (portraitCellHeight + gap.value),
        width: leftWidth,
        height: portraitCellHeight
      })),
      ...landscapeImages.map((image, index) => ({
        image,
        x: innerX + leftWidth + gap.value,
        y: innerY + index * (landscapeCellHeight + gap.value),
        width: rightWidth,
        height: landscapeCellHeight
      }))
    ]

    const rightPortraitCells = [
      ...landscapeImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (landscapeCellHeight + gap.value),
        width: leftWidth,
        height: landscapeCellHeight
      })),
      ...portraitImages.map((image, index) => ({
        image,
        x: innerX + leftWidth + gap.value,
        y: innerY + index * (portraitCellHeight + gap.value),
        width: rightWidth,
        height: portraitCellHeight
      }))
    ]

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        leftPortraitCells,
        2,
        Math.max(portraitImages.length, landscapeImages.length),
        0.08
      )
    )

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        rightPortraitCells,
        2,
        Math.max(portraitImages.length, landscapeImages.length),
        0.08
      )
    )
  }

  return result
}

function createLayout(): CollageLayoutResult | null {
  if (!images.value.length) return null

  const ratios = getCandidateRatios()

  let bestLayout: CollageLayoutResult | null = null

  for (const ratio of ratios) {
    const candidates: CollageLayoutResult[] = []

    candidates.push(...createTreemapLayoutsForRatio(ratio))

    const gridLayout = createGridLayoutForRatio(ratio)

    if (gridLayout) {
      candidates.push(gridLayout)
    }

    candidates.push(...createSideHeroLayoutsForRatio(ratio))
    candidates.push(...createSplitGroupLayoutsForRatio(ratio))
    candidates.push(...createAdaptiveColumnLayoutsForRatio(ratio))

    for (const layout of candidates) {
      if (!bestLayout || layout.score < bestLayout.score) {
        bestLayout = layout
      }
    }
  }

  return bestLayout
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio = image.naturalWidth / image.naturalHeight
  const cellRatio = width / height

  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight

  if (imageRatio > cellRatio) {
    sourceWidth = image.naturalHeight * cellRatio
    sourceX = (image.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = image.naturalWidth / cellRatio
    sourceY = (image.naturalHeight - sourceHeight) / 2
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  )
}

function createTreemapLayoutsForRatio(ratio: number): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (images.value.length < 2) return result

  const canvasSize = getCanvasSizeFromRatio(ratio)

  const rootRect: TreemapRect = {
    x: padding.value,
    y: padding.value,
    width: canvasSize.width - padding.value * 2,
    height: canvasSize.height - padding.value * 2
  }

  if (rootRect.width <= 0 || rootRect.height <= 0) return result

  const orderVariants = getTreemapOrderVariants()

  for (const orderedImages of orderVariants) {
    const candidates = solveTreemapGroup(orderedImages, rootRect)

    for (const candidate of candidates) {
      result.push(
        createLayoutResult(
          canvasSize.width,
          canvasSize.height,
          ratio,
          candidate.cells,
          0,
          0,
          0.015
        )
      )
    }
  }

  return result
}

function stopVideoRenderer() {
  videoRenderer?.destroy()
  videoRenderer = null
}

function getVideoSources(): CanvasSliderImageSource[] {
  return images.value.map((item) => ({
    src: item.url,
    image: item.image
  }))
}

function drawVideoEmptyState() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = videoWidth.value
  canvas.height = videoHeight.value

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = backgroundColor.value
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '500 44px sans-serif'
  ctx.fillText('Add images to create video', canvas.width / 2, canvas.height / 2)

  previewInfo.value = {
    width: canvas.width,
    height: canvas.height,
    ratio: canvas.width / canvas.height,
    columns: 0,
    rows: 0
  }
}

async function renderVideoPreview() {
  if (activeMode.value !== 'video') return

  await nextTick()

  const canvas = canvasRef.value
  if (!canvas) return

  stopVideoRenderer()

  if (!images.value.length) {
    drawVideoEmptyState()
    return
  }

  const width = Math.max(1, Math.round(videoWidth.value))
  const height = Math.max(1, Math.round(videoHeight.value))

  videoRenderer = createCanvasSliderRenderer({
    canvas,
    sources: getVideoSources(),
    width,
    height,
    dpr: 1,
    interval: videoInterval.value,
    transitionDuration: videoTransitionDuration.value,
    edgeBlur: videoEdgeBlur.value,
    random: videoLoop.value || normalizedVideoRepeat.value > 1
      ? false
      : videoRandom.value,
    initialIndex: 0,
    backgroundColor: backgroundColor.value
  })

  videoRenderer.setPointer(width / 2, height / 2)
  videoRenderer.start()

  previewInfo.value = {
    width,
    height,
    ratio: width / height,
    columns: 0,
    rows: 0
  }
}

async function renderCurrentMode() {
  if (activeMode.value === 'video') {
    await renderVideoPreview()
    return
  }

  stopVideoRenderer()
  await renderCanvas()
}

async function renderCanvas() {

  if (activeMode.value !== 'image') return

  stopVideoRenderer();

  const canvas = canvasRef.value
  if (!canvas) return

  isRendering.value = true

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    isRendering.value = false
    return
  }

  const layout = createLayout()

  if (!layout) {
    canvas.width = 1200
    canvas.height = 1200

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    previewInfo.value = {
      width: canvas.width,
      height: canvas.height,
      ratio: 1,
      columns: 0,
      rows: 0
    }

    isRendering.value = false
    return
  }

  canvas.width = layout.width
  canvas.height = layout.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = backgroundColor.value
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const cell of layout.cells) {
    ctx.save()

    drawRoundedRect(ctx, cell.x, cell.y, cell.width, cell.height, 28)
    ctx.clip()

    drawImageCover(ctx, cell.image.image, cell.x, cell.y, cell.width, cell.height)

    ctx.restore()
  }

  const brandOverlay = await createBrandOverlayCanvas()

  if (brandOverlay) {
    const rect = getBrandOverlayRect(
      canvas.width,
      canvas.height,
      brandOverlay.width,
      brandOverlay.height
    )

    ctx.save()

    ctx.globalAlpha = watermarkOpacity.value
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 8

    ctx.drawImage(
      brandOverlay,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    )

    ctx.restore()
  }

  previewInfo.value = {
    width: layout.width,
    height: layout.height,
    ratio: layout.ratio,
    columns: layout.columns,
    rows: layout.rows
  }

  isRendering.value = false
}

function getExportBlob(type = 'image/png', quality = 0.96): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = canvasRef.value

    if (!canvas) {
      resolve(null)
      return
    }

    canvas.toBlob((blob) => {
      resolve(blob)
    }, type, quality)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not convert blob to data URL'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function writeBlobToNativeCache(blob: Blob) {
  const dataUrl = await blobToDataUrl(blob)
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const fileName = `collage-${Date.now()}.png`

  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache
  })

  return result.uri
}

async function shareBlobNative(blob: Blob) {
  const uri = await writeBlobToNativeCache(blob)

  await Share.share({
    title: 'Prompt Draft Collage',
    text: 'Created with Prompt Draft',
    files: [uri],
    dialogTitle: 'Share collage'
  })
}

async function getOrCreatePromptDraftAlbumIdentifier() {
  const albumName = 'Prompt Draft'

  const currentAlbums = await Media.getAlbums()
  const existingAlbum = currentAlbums.albums.find(
    (album) => album.name === albumName
  )

  if (existingAlbum) {
    return existingAlbum.identifier
  }

  await Media.createAlbum({
    name: albumName
  })

  const updatedAlbums = await Media.getAlbums()
  const createdAlbum = updatedAlbums.albums.find(
    (album) => album.name === albumName
  )

  if (!createdAlbum) {
    throw new Error('Could not create Prompt Draft album')
  }

  return createdAlbum.identifier
}

async function saveBlobToGalleryNative(blob: Blob) {
  const dataUrl = await blobToDataUrl(blob)
  const albumIdentifier = await getOrCreatePromptDraftAlbumIdentifier()

  await Media.savePhoto({
    path: dataUrl,
    albumIdentifier,
    fileName: `collage-${Date.now()}`
  })
}

function getSupportedVideoMimeType() {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function recordCanvasAsVideo(
  canvas: HTMLCanvasElement,
  durationMs: number,
  fps: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!canvas.captureStream) {
      reject(new Error('Canvas captureStream is not supported in this browser.'))
      return
    }

    if (!window.MediaRecorder) {
      reject(new Error('MediaRecorder is not supported in this browser.'))
      return
    }

    const stream = canvas.captureStream(fps)
    const mimeType = getSupportedVideoMimeType()

    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    )

    const chunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop())
      reject(recorder.error || new Error('Video recording failed.'))
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())

      const blob = new Blob(chunks, {
        type: mimeType || 'video/webm'
      })

      resolve(blob)
    }

    recorder.start(250)

    window.setTimeout(() => {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    }, Math.max(durationMs, 1000))
  })
}

function downloadVideoBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `prompt-draft-video-${Date.now()}.webm`
  link.click()

  URL.revokeObjectURL(url)
}

async function writeVideoBlobToNativeCache(blob: Blob) {
  const dataUrl = await blobToDataUrl(blob)
  const base64 = dataUrl.split(',')[1] || ''
  const fileName = `prompt-draft-video-${Date.now()}.webm`

  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache
  })

  return result.uri
}

async function shareVideoBlobNative(blob: Blob) {
  const uri = await writeVideoBlobToNativeCache(blob)

  await Share.share({
    title: 'Prompt Draft Video',
    text: 'Created with Prompt Draft',
    files: [uri],
    dialogTitle: 'Share video'
  })
}

async function exportSliderVideo() {
  if (!images.value.length) return

  const canvas = canvasRef.value
  if (!canvas) return

  try {
    isRecordingVideo.value = true

    await renderVideoPreview()
    await waitFrame()

    const blob = await recordCanvasAsVideo(
      canvas,
      videoDurationMs.value,
      videoFps.value
    )

    if (Capacitor.isNativePlatform()) {
      await shareVideoBlobNative(blob)
      return
    }

    downloadVideoBlob(blob)
  } catch (error) {
    console.error('Video export failed:', error)
    alert('Could not export video in this browser.')
  } finally {
    isRecordingVideo.value = false
  }
}

async function downloadCanvas() {
  const blob = await getExportBlob('image/png')

  if (!blob) return

  if (Capacitor.isNativePlatform()) {
    try {
      await saveBlobToGalleryNative(blob)
      alert('Collage saved to gallery.')
    } catch (error) {
      console.error('Native save failed:', error)

      try {
        await shareBlobNative(blob)
      } catch (shareError) {
        console.error('Native share failed:', shareError)
        alert('Could not save or share collage.')
      }
    }

    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `collage-${Date.now()}.png`
  link.click()

  URL.revokeObjectURL(url)
}

async function copyCanvas() {
  const blob = await getExportBlob('image/png')

  if (!blob) return

  if (Capacitor.isNativePlatform()) {
    try {
      await shareBlobNative(blob)
    } catch (error) {
      console.error('Native share failed:', error)
      alert('Could not share collage.')
    }

    return
  }

  if (!navigator.clipboard || !window.ClipboardItem) {
    alert('Clipboard image copy is not supported in this browser.')
    return
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob
    })
  ])
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not convert canvas to PNG blob'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

// function blobToDataUrl(blob: Blob): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()

//     reader.onloadend = () => {
//       if (typeof reader.result !== 'string') {
//         reject(new Error('Could not read blob as data URL'))
//         return
//       }

//       resolve(reader.result)
//     }

//     reader.onerror = () => reject(reader.error)
//     reader.readAsDataURL(blob)
//   })
// }

async function shareCanvasNative() {
  const canvas = canvasRef.value
  if (!canvas) return

  const { uri } = await writeCanvasToNativeCache(canvas)

  await Share.share({
    title: 'Prompt Draft Collage',
    text: 'Created with Prompt Draft',
    files: [uri],
    dialogTitle: 'Save or share collage'
  })
}

async function canvasToPngDataUrl(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas)
  return blobToDataUrl(blob)
}

async function writeCanvasToNativeCache(canvas: HTMLCanvasElement) {
  const dataUrl = await canvasToPngDataUrl(canvas)
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const fileName = `prompt-draft-collage-${Date.now()}.png`

  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache
  })

  return {
    fileName,
    uri: result.uri
  }
}

function waitFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

let renderAfterRotateTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRenderAfterRotate() {
  if (!images.value.length) return

  if (renderAfterRotateTimer) {
    clearTimeout(renderAfterRotateTimer)
  }

  renderAfterRotateTimer = setTimeout(async () => {
    renderAfterRotateTimer = null

    await nextTick()
    await waitFrame()
    await waitFrame()

    if (!canvasRef.value) return

    await renderCanvas()
  }, 120)
}

watch(
  [orientation, mini],
  () => {
    const canShowCollage =
      !mini.value || orientation.value === 'landscape'

    if (!canShowCollage) return

    scheduleRenderAfterRotate()
  },
  {
    flush: 'post'
  }
)

watch(
  [
    activeMode,
    images,
    watermarkPosition,
    watermarkSize,
    watermarkOpacity,
    padding,
    gap,
    backgroundColor,
    brandOverlayTheme,
    telegramPostId,
    brandOverlayGap
  ],
  () => {
    if (activeMode.value !== 'image') return

    renderCanvas()
  },
  {
    deep: true
  }
)

watch(
  [
    activeMode,
    images,
    videoWidth,
    videoHeight,
    videoInterval,
    videoTransitionDuration,
    videoEdgeBlur,
    videoRandom,
    backgroundColor,
    videoLoop,
    videoRepeat,
  ],
  () => {
    if (activeMode.value !== 'video') return

    renderVideoPreview()
  },
  {
    deep: true,
    flush: 'post'
  }
)

onMounted(async () => {
  window.addEventListener('paste', handlePaste)
  await renderCurrentMode()
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)

  for (const item of images.value) {
    stopVideoRenderer()
    URL.revokeObjectURL(item.url)
  }
})
</script>

<template>
  <el-flex rules="ccc" v-if="orientation === 'portrait' && mini" class="w100 h100" :radius="24" :br="1" bt="d" bd="b4"
    bc="red">
    <el-icon :size="80" color="normal50" icon="rotate-left" />
    <el-text :size="14" color="normal80">
      {{ $t('pages.collage.rotateYourPhone') }}
    </el-text>
  </el-flex>
  <el-grid v-show="!mini || orientation === 'landscape'" type="main" class="ofha w100"
    :cols="[mini ? '260px' : '360px', 'minmax(0, 1fr)']" :gap="8" @drop="handleDrop" @dragover="handleDragOver"
    @dragleave="handleDragLeave">
    <el-grid type="aside" class="ofha mxh100" :radius="16" :cols="1" :gap="16" :p="16" bg="normal5">
      <el-grid class="collage-sidebar__head" :gap="6">
        <el-text type="h1" :size="22" weight="700">
          {{ $t('pages.collage.title') }}
        </el-text>

        <el-text type="p" :size="13" color="normal60">
          {{ $t('pages.collage.description') }}
        </el-text>
      </el-grid>

      <input ref="fileInputRef" class="collage-file-input" type="file" accept="image/*" multiple
        @change="handleFileInput">

      <el-flex rules="ccc" :class="{ 'collage-dropzone--active': isDragging }" :gap="6" :p="24" :radius="18" :br="1"
        bc="normal30" bg="normal5" @click="openFilePicker">
        <el-icon icon="gallery-add" :size="40" color="blue" />

        <el-text :size="15" weight="700">
          {{ $t('pages.collage.dropzone.title') }}
        </el-text>

        <el-text :size="12" color="normal55">
          {{ $t('pages.collage.dropzone.description') }}
        </el-text>
      </el-flex>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-flex rules="rbc" :gap="8">
          <el-text :size="14" weight="700" icon="gallery">
            {{ $t('pages.collage.images.title') }}
          </el-text>

          <el-text :size="12" color="normal55" localize>
            {{ images.length }}
          </el-text>
        </el-flex>

        <el-grid v-if="images.length" class="collage-images" :gap="10">
          <el-grid v-for="item in images" :key="item.id" class="collage-image-item"
            :cols="['52px', 'minmax(0, 1fr)', 'auto']" :gap="10" :p="8" :radius="14" bg="normal5" align-items="center">
            <img :src="item.url" :alt="item.name">

            <el-grid class="collage-image-meta" :gap="2">
              <el-text class="collage-image-name" :size="12" weight="700">
                {{ item.name }}
              </el-text>

              <el-text :size="11" color="normal55" localize>
                {{ item.width }}×{{ item.height }}
              </el-text>
            </el-grid>

            <el-button :label="$t('pages.collage.actions.remove')" :size="12" mode="flat" type="fab" color="red"
              icon="trash" @click="removeImage(item.id)" />
          </el-grid>
        </el-grid>

        <el-flex v-else rules="ccc" class="collage-empty" :p="14">
          <el-text :size="13" color="normal45">
            {{ $t('pages.collage.images.empty') }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-text :size="14" weight="700" icon="setting-2">
          Output Mode
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Mode
          </el-text>

          <select v-model="activeMode">
            <option value="image">
              Image Collage
            </option>

            <option value="video">
              Video Slider
            </option>
          </select>
        </label>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5"
        v-if="activeMode === 'image'">
        <el-text :size="14" weight="700" icon="drop">
          {{ $t('pages.collage.brand.title') }}
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.telegramPostId') }}
          </el-text>

          <input v-model="telegramPostId" type="text"
            :placeholder="$t('pages.collage.brand.telegramPostIdPlaceholder')">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.logoColor') }}
          </el-text>

          <select v-model="brandOverlayTheme">
            <option value="white">
              {{ $t('pages.collage.brand.logoThemes.white') }}
            </option>

            <option value="black">
              {{ $t('pages.collage.brand.logoThemes.black') }}
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.position') }}
          </el-text>

          <select v-model="watermarkPosition">
            <option v-for="position in watermarkPositions" :key="position.value" :value="position.value">
              {{ $t(`pages.collage.brand.positions.${position.value}`) }}
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.height', { value: watermarkSize }) }}
          </el-text>

          <input v-model.number="watermarkSize" type="range" min="48" max="260" step="4">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.opacity', { value: Math.round(watermarkOpacity * 100) }) }}
          </el-text>

          <input v-model.number="watermarkOpacity" type="range" min="0.1" max="1" step="0.01">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.gap', { value: brandOverlayGap }) }}
          </el-text>

          <input v-model.number="brandOverlayGap" type="range" min="0" max="48" step="2">
        </label>

        <el-text type="small" class="collage-help" :size="11" color="normal45">
          {{ $t('pages.collage.brand.help') }}
        </el-text>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5"
        v-if="activeMode === 'image'">
        <el-text :size="14" weight="700" icon="grid-1">
          {{ $t('pages.collage.canvas.title') }}
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.canvas.padding', { value: padding }) }}
          </el-text>

          <input v-model.number="padding" type="range" min="0" max="96" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.canvas.gap', { value: gap }) }}
          </el-text>

          <input v-model.number="gap" type="range" min="0" max="64" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.canvas.backgroundColor') }}
          </el-text>

          <input v-model="backgroundColor" type="color">
        </label>
      </el-grid>

      <el-grid v-if="activeMode === 'video'" class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10"
        bg="normal5">
        <el-text :size="14" weight="700" icon="video-play">
          Video Slider
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Preset
          </el-text>

          <select v-model="videoPreset" @change="handleVideoPresetChange">
            <option value="1080x1920">
              Story / Reel — 1080×1920
            </option>

            <option value="1080x1350">
              Portrait Post — 1080×1350
            </option>

            <option value="1080x1080">
              Square Post — 1080×1080
            </option>

            <option value="1920x1080">
              Landscape — 1920×1080
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Width
          </el-text>

          <input v-model.number="videoWidth" type="number" min="256" max="4096" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Height
          </el-text>

          <input v-model.number="videoHeight" type="number" min="256" max="4096" step="2">
        </label>

        <el-grid :gap="4">
          <el-text type="span" :size="12" color="normal70">
            Calculated Duration
          </el-text>
          <el-text type="span" :size="11" color="normal55">
            {{ videoTotalSlideCount }} slide views · {{ videoTransitionCount }} transitions
          </el-text>
          <el-text type="span" :size="13" weight="700" color="normal90">
            {{ videoDurationLabel }}
          </el-text>
        </el-grid>

        <label class="collage-field collage-checkbox-field">
          <input v-model="videoLoop" type="checkbox">

          <el-text type="span" :size="12" color="normal70">
            Seamless loop back to first image
          </el-text>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Repeat: {{ normalizedVideoRepeat }}×
          </el-text>

          <input v-model.number="videoRepeat" type="range" min="1" max="10" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            FPS: {{ videoFps }}
          </el-text>

          <input v-model.number="videoFps" type="range" min="24" max="60" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Image Interval: {{ videoInterval }}ms
          </el-text>

          <input v-model.number="videoInterval" type="range" min="800" max="8000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Transition: {{ videoTransitionDuration }}ms
          </el-text>

          <input v-model.number="videoTransitionDuration" type="range" min="300" max="4000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Edge Blur: {{ videoEdgeBlur }}
          </el-text>

          <input v-model.number="videoEdgeBlur" type="range" min="0" max="400" step="10">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Background Color
          </el-text>

          <input v-model="backgroundColor" type="color">
        </label>

        <label class="collage-field collage-checkbox-field">
          <input v-model="videoRandom" type="checkbox" :disabled="videoLoop || normalizedVideoRepeat > 1">

          <el-text type="span" :size="12" color="normal70">
            Random order
          </el-text>
        </label>

        <el-text v-if="videoLoop || normalizedVideoRepeat > 1" type="span" :size="11" color="normal55">
          Random order is disabled for loop/repeat so the sequence can stay seamless.
        </el-text>
      </el-grid>

      <el-grid v-if="activeMode === 'image'" :cols="3" :gap="10">
        <el-button :label="$t('pages.collage.actions.save')" :p="[12, 24]" :size="14" type="fab" icon="ram" color="prim"
          tooltip-position="top" :disable="!canExportImage" @click="downloadCanvas" />

        <el-button :label="$t('pages.collage.actions.copy')" :p="[12, 24]" :size="14" type="fab" icon="document-copy"
          color="normal10" tooltip-position="top" :disable="!canExportImage" @click="copyCanvas" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10" :disable="!images.length"
          @click="clearImages" />
      </el-grid>

      <el-grid v-else :cols="2" :gap="10">
        <el-button :label="isRecordingVideo ? 'Recording...' : 'Export Video'" :p="[12, 24]" :size="14" type="fab"
          icon="video-play" color="prim" tooltip-position="top" :disable="!canExportVideo" @click="exportSliderVideo" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10"
          :disable="!images.length || isRecordingVideo" @click="clearImages" />
      </el-grid>

    </el-grid>

    <el-grid type="section" class="collage-workspace" :rows="['auto', 'minmax(0, 1fr)']" :gap="8" :p="0">
      <el-flex class="collage-preview-head" rules="rbc" :gap="16" :p="[14, 16]" :radius="18" :br="1" bc="normal10"
        bg="normal5">
        <el-flex rules="rsc" :gap="12">
          <el-text :size="14" weight="700" localize>
            {{ previewInfo.width }}×{{ previewInfo.height }}
          </el-text>

          {{
            activeMode === 'video'
              ? `Video Slider · ${videoWidth}×${videoHeight} · ${videoDurationLabel} · ${videoFps}fps ·
          ${normalizedVideoRepeat}×${videoLoop ? ' · loop' : ''}`
              : $t('pages.collage.preview.grid', { columns: previewInfo.columns, rows: previewInfo.rows })
          }}
        </el-flex>

        <el-text v-if="isRendering" :size="12" color="normal55">
          {{ $t('pages.collage.preview.rendering') }}
        </el-text>
        <el-text v-if="isRecordingVideo" :size="12" color="normal55">
          Recording video...
        </el-text>
      </el-flex>

      <el-grid class="collage-canvas-wrap" :p="22" :radius="24" :br="1" bc="normal10" place-items="start center">
        <canvas ref="canvasRef" />
      </el-grid>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.collage-file-input {
  display: none;
}

.collage-dropzone {
  cursor: pointer;
  min-height: 112px;
  border-style: dashed !important;
  transition: 0.2s ease;
}

.collage-dropzone:hover,
.collage-dropzone--active {
  border-color: var(--primary) !important;
  background: var(--normalText10) !important;
}

.collage-panel {
  min-width: 0;
}

.collage-images {
  min-width: 0;
}

.collage-image-item {
  min-width: 0;
}

.collage-image-item img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
}

.collage-image-meta {
  min-width: 0;
}

.collage-image-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collage-empty {
  text-align: center;
}

.collage-field {
  display: grid;
  gap: 8px;
}

.collage-help {
  line-height: 1.7;
}

.collage-actions {
  margin-top: auto;
}

.collage-actions :deep(.collage-actions__danger .txt-themeRed),
.collage-actions__danger {
  color: var(--themeRed) !important;
}

.collage-workspace {
  min-width: 0;
  height: 100%;
  overflow: auto;
}

.collage-preview-head {
  min-width: 0;
}

.collage-canvas-wrap {
  min-height: 0;
  overflow: auto;
  background:
    linear-gradient(45deg, var(--normalText15) 25%, transparent 25%),
    linear-gradient(-45deg, var(--normalText15) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--normalText10) 75%),
    linear-gradient(-45deg, transparent 75%, var(--normalText10) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.collage-canvas-wrap canvas {
  display: block;
  width: min(100%, 1000px);
  background-color: var(--themeSurface);
  height: auto;
  border-radius: 18px;
  box-shadow: 0 24px 80px var(--themeBlack25);
}

@media (max-width: 900px) {
  .collage-page {
    grid-template-columns: 1fr !important;
  }

  .collage-sidebar,
  .collage-workspace {
    height: auto;
  }

  .collage-workspace {
    min-height: 70vh;
  }
}
</style>