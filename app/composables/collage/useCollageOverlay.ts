import QRCode from 'qrcode'

import type {
  Ref,
} from 'vue'

import type {
  BrandOverlayTheme,
  CollageMode,
  CollageWatermarkPosition,
  OverlayInternalAlign,
  TextOverlayFontOption,
} from '~/types/collage'

import {
  COLLAGE_LOGO_ASPECT_RATIO,
  COLLAGE_OVERLAY_SAFE_AREA_OPTIONS,
  COLLAGE_TELEGRAM_CHANNEL_BASE,
  COLLAGE_TEXT_OVERLAY_FONT_GROUPS,
  COLLAGE_WATERMARK_POSITIONS,
} from '~/constants/collage'

import {
  drawRoundedRect,
} from '~/utils/collage/drawing'

import {
  getOverlayPlacement,
  getOverlaySafeAreaRect,
  type OverlaySafeAreaPreset,
} from '~/utils/overlayPlacement'

type UseCollageOverlayOptions = {
  activeMode: Ref<CollageMode>
}

export function useCollageOverlay(options: UseCollageOverlayOptions) {
  const overlaySafeAreaPreset = ref<OverlaySafeAreaPreset>('none')

  const overlaySafeAreaOptions = COLLAGE_OVERLAY_SAFE_AREA_OPTIONS
  const watermarkPositions = COLLAGE_WATERMARK_POSITIONS
  const textOverlayFontGroups = COLLAGE_TEXT_OVERLAY_FONT_GROUPS

  const watermarkPosition = ref<CollageWatermarkPosition>('bottom-center')
  const watermarkSize = ref(80)
  const watermarkOpacity = ref(1)

  const brandOverlayTheme = ref<BrandOverlayTheme>('white')
  const telegramPostId = ref('')
  const brandOverlayGap = ref(14)

  const textOverlayEnabled = ref(true)
  const textOverlayText = ref('پرامپت تبدیل به ')
  const textOverlayFontSize = ref(72)
  const textOverlayColor = ref('#ffffff')
  const textOverlayGap = ref(0)
  const textOverlayMaxWidthRatio = ref(0.86)

  const textOverlayFontFamily = ref('Vazirmatn')
  const textOverlayFontWeight = ref(800)

  const logoCache = new Map<string, HTMLImageElement>()

  const qrCache = ref<{
    url: string
    image: HTMLImageElement | null
  }>({
    url: '',
    image: null,
  })

  const textOverlayFontValue = computed(() => {
    return `${textOverlayFontFamily.value}::${textOverlayFontWeight.value}`
  })

  function handleOverlaySafeAreaChange(event: Event) {
    const target = event.target as HTMLSelectElement | null
    if (!target) return

    overlaySafeAreaPreset.value = target.value as OverlaySafeAreaPreset
  }

  function handleTextOverlayFontChange(event: Event) {
    const target = event.target as HTMLSelectElement | null
    if (!target) return

    const [family, weight] = target.value.split('::')

    textOverlayFontFamily.value = family
    textOverlayFontWeight.value = Number(weight) || 400
  }

  function getTextOverlayFontOptionValue(option: TextOverlayFontOption) {
    return `${option.family}::${option.weight}`
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

    return `${COLLAGE_TELEGRAM_CHANNEL_BASE}/${cleanPostId}`
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
        image: null,
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
        light: '#ffffff',
      },
    })

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const qrImage = new Image()

      qrImage.onload = () => resolve(qrImage)
      qrImage.onerror = reject
      qrImage.src = dataUrl
    })

    qrCache.value = {
      url,
      image,
    }

    return image
  }

  async function createBrandOverlayCanvas() {
    const overlayHeight = watermarkSize.value

    if (overlayHeight <= 0) return null

    const logoSrc = `/img/logo_${brandOverlayTheme.value}.png`
    const logoImage = await loadImageSource(logoSrc)

    const qrUrl = normalizeTelegramPostUrl()
    const qrImage = await getQrImage(qrUrl)

    const logoWidth = Math.round(overlayHeight * COLLAGE_LOGO_ASPECT_RATIO)
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

  function getOverlayMargin(canvasWidth: number, canvasHeight: number) {
    return Math.max(
      28,
      Math.round(Math.min(canvasWidth, canvasHeight) * 0.025)
    )
  }

  function getActiveOverlaySafeArea(): OverlaySafeAreaPreset {
    return options.activeMode.value === 'video'
      ? overlaySafeAreaPreset.value
      : 'none'
  }

  function getOverlayInternalAlign(
    position: CollageWatermarkPosition
  ): OverlayInternalAlign {
    if (position.endsWith('right')) return 'right'
    if (position === 'center' || position.endsWith('center')) return 'center'
    return 'left'
  }

  function getAlignedChildX(
    parentWidth: number,
    childWidth: number,
    align: OverlayInternalAlign
  ) {
    if (align === 'right') return parentWidth - childWidth
    if (align === 'center') return (parentWidth - childWidth) / 2
    return 0
  }

  function getTextDirection(text: string): CanvasDirection {
    return /[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr'
  }

  function getTextOverlayFont() {
    return `${textOverlayFontWeight.value} ${textOverlayFontSize.value}px "${textOverlayFontFamily.value}", "Vazirmatn", Tahoma, Arial, sans-serif`
  }

  async function ensureTextOverlayFontLoaded() {
    if (!document.fonts) return

    try {
      await document.fonts.load(getTextOverlayFont())
    } catch (error) {
      console.warn('Could not preload text overlay font:', error)
    }
  }

  function wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) {
    const lines: string[] = []
    const paragraphs = text
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean)

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/)
      let line = ''

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const testWidth = ctx.measureText(testLine).width

        if (testWidth > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = testLine
        }
      }

      if (line) {
        lines.push(line)
      }
    }

    return lines
  }

  function createTextOverlayCanvas(config: {
    maxWidth: number
    align: OverlayInternalAlign
  }) {
    if (!textOverlayEnabled.value) return null

    const text = textOverlayText.value.trim()
    if (!text) return null

    const maxWidth = Math.max(80, Math.round(config.maxWidth))
    const fontSize = Math.max(8, Math.round(textOverlayFontSize.value))
    const lineHeight = Math.round(fontSize * 1.16)
    const paddingX = Math.round(fontSize * 0.08)
    const paddingY = Math.round(fontSize * 0.12)

    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    if (!measureCtx) return null

    measureCtx.font = getTextOverlayFont()

    const lines = wrapCanvasText(measureCtx, text, maxWidth)
    if (!lines.length) return null

    const measuredWidth = Math.max(
      ...lines.map((line) => measureCtx.measureText(line).width)
    )

    const canvasWidth = Math.ceil(
      Math.min(maxWidth, measuredWidth) + paddingX * 2
    )

    const canvasHeight = Math.ceil(
      lines.length * lineHeight + paddingY * 2
    )

    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.width = canvasWidth
    overlayCanvas.height = canvasHeight

    const ctx = overlayCanvas.getContext('2d')
    if (!ctx) return null

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.font = getTextOverlayFont()
    ctx.fillStyle = textOverlayColor.value
    ctx.textBaseline = 'top'
    ctx.direction = getTextDirection(text)

    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)'
    ctx.shadowBlur = Math.round(fontSize * 0.16)
    ctx.shadowOffsetY = Math.round(fontSize * 0.05)

    if (config.align === 'right') {
      ctx.textAlign = 'right'
    } else if (config.align === 'center') {
      ctx.textAlign = 'center'
    } else {
      ctx.textAlign = 'left'
    }

    const textX =
      config.align === 'right'
        ? canvasWidth - paddingX
        : config.align === 'center'
          ? canvasWidth / 2
          : paddingX

    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        textX,
        paddingY + index * lineHeight,
        canvasWidth - paddingX * 2
      )
    })

    return overlayCanvas
  }

  async function createCompositeOverlayCanvas(
    canvasWidth: number,
    canvasHeight: number
  ) {
    const brandOverlay = await createBrandOverlayCanvas()
    const align = getOverlayInternalAlign(watermarkPosition.value)

    const margin = getOverlayMargin(canvasWidth, canvasHeight)
    const safeArea = getActiveOverlaySafeArea()

    const safeRect = getOverlaySafeAreaRect({
      canvasWidth,
      canvasHeight,
      safeArea,
      padding: margin,
    })

    await ensureTextOverlayFontLoaded()

    const textOverlay = createTextOverlayCanvas({
      maxWidth: safeRect.width * textOverlayMaxWidthRatio.value,
      align,
    })

    if (!brandOverlay && !textOverlay) return null
    if (!textOverlay) return brandOverlay
    if (!brandOverlay) return textOverlay

    const groupGap = Math.max(0, Math.round(textOverlayGap.value))
    const groupWidth = Math.max(textOverlay.width, brandOverlay.width)
    const groupHeight = textOverlay.height + groupGap + brandOverlay.height

    const groupCanvas = document.createElement('canvas')
    groupCanvas.width = groupWidth
    groupCanvas.height = groupHeight

    const ctx = groupCanvas.getContext('2d')
    if (!ctx) return null

    ctx.clearRect(0, 0, groupWidth, groupHeight)

    const textX = getAlignedChildX(groupWidth, textOverlay.width, align)
    const brandX = getAlignedChildX(groupWidth, brandOverlay.width, align)

    ctx.drawImage(textOverlay, textX, 0)
    ctx.drawImage(brandOverlay, brandX, textOverlay.height + groupGap)

    return groupCanvas
  }

  function getOverlayRect(
    canvasWidth: number,
    canvasHeight: number,
    overlayWidth: number,
    overlayHeight: number
  ) {
    const margin = getOverlayMargin(canvasWidth, canvasHeight)
    const safeArea = getActiveOverlaySafeArea()

    return getOverlayPlacement({
      canvasWidth,
      canvasHeight,
      overlayWidth,
      overlayHeight,
      position: watermarkPosition.value,
      safeArea,
      padding: margin,
      fitInsideSafeArea: safeArea !== 'none',
    })
  }

  function drawOverlayCanvas(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement
  ) {
    const rect = getOverlayRect(
      canvasWidth,
      canvasHeight,
      overlayCanvas.width,
      overlayCanvas.height
    )

    ctx.save()

    ctx.globalAlpha = watermarkOpacity.value
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 8

    ctx.drawImage(
      overlayCanvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    )

    ctx.restore()
  }

  return {
    overlaySafeAreaPreset,
    overlaySafeAreaOptions,
    handleOverlaySafeAreaChange,

    watermarkPosition,
    watermarkSize,
    watermarkOpacity,
    watermarkPositions,

    brandOverlayTheme,
    telegramPostId,
    brandOverlayGap,

    textOverlayEnabled,
    textOverlayText,
    textOverlayFontSize,
    textOverlayColor,
    textOverlayGap,
    textOverlayMaxWidthRatio,
    textOverlayFontFamily,
    textOverlayFontWeight,
    textOverlayFontValue,
    textOverlayFontGroups,
    handleTextOverlayFontChange,
    getTextOverlayFontOptionValue,

    createCompositeOverlayCanvas,
    drawOverlayCanvas,
  }
}