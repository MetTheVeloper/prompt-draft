import type { CollageImageFitMode } from '~/types/collage'

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  )
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

export type ImageCellDrawOptions = {
  fit?: CollageImageFitMode
  panX?: number
  panY?: number
}

export type ImageCellDrawMetrics = {
  scale: number
  drawWidth: number
  drawHeight: number
  drawX: number
  drawY: number
  overflowX: number
  overflowY: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function normalizeImageCellPan(value?: number) {
  return clamp(Number.isFinite(value || 0) ? value || 0 : 0, -1, 1)
}

export function getImageCellDrawMetrics(
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ImageCellDrawOptions = {},
): ImageCellDrawMetrics {
  const imageWidth = Math.max(1, image.naturalWidth || image.width || 1)
  const imageHeight = Math.max(1, image.naturalHeight || image.height || 1)

  const coverScale = Math.max(width / imageWidth, height / imageHeight)
  const scale = options.fit === 'detail' ? Math.max(coverScale, 1) : coverScale

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  const overflowX = Math.max(0, drawWidth - width)
  const overflowY = Math.max(0, drawHeight - height)

  const panX = normalizeImageCellPan(options.panX)
  const panY = normalizeImageCellPan(options.panY)

  const drawX = x - overflowX * ((panX + 1) / 2)
  const drawY = y - overflowY * ((panY + 1) / 2)

  return {
    scale,
    drawWidth,
    drawHeight,
    drawX,
    drawY,
    overflowX,
    overflowY,
  }
}

export function drawImageInCell(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ImageCellDrawOptions = {},
) {
  const metrics = getImageCellDrawMetrics(image, x, y, width, height, options)

  ctx.drawImage(
    image,
    metrics.drawX,
    metrics.drawY,
    metrics.drawWidth,
    metrics.drawHeight,
  )
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawImageInCell(ctx, image, x, y, width, height, {
    fit: 'cover',
    panX: 0,
    panY: 0,
  })
}
