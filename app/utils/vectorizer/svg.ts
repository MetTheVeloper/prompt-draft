import type {
  ImageVectorizerBounds,
  ImageVectorizerPaletteColor,
} from '~/types/imageVectorizer'
import type { TracedRegion, VectorPoint } from './contours'
import { fitAdaptiveClosedPath } from './adaptivePath'

function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

function translatePoint(point: VectorPoint, crop: ImageVectorizerBounds) {
  return {
    x: point.x - crop.x,
    y: point.y - crop.y,
  }
}

function buildPolygonPath(points: VectorPoint[]) {
  if (points.length < 3) return ''

  const commands = [
    `M${formatNumber(points[0].x)} ${formatNumber(points[0].y)}`,
  ]

  for (let index = 1; index < points.length; index += 1) {
    commands.push(
      `L${formatNumber(points[index].x)} ${formatNumber(points[index].y)}`,
    )
  }

  commands.push('Z')

  return commands.join(' ')
}

function buildAdaptivePath(points: VectorPoint[], smooth: number) {
  if (points.length < 3 || smooth <= 0) {
    return buildPolygonPath(points)
  }

  const fitted = fitAdaptiveClosedPath(points, smooth)

  if (!fitted?.segments.length) {
    return buildPolygonPath(points)
  }

  const commands = [
    `M${formatNumber(fitted.start.x)} ${formatNumber(fitted.start.y)}`,
  ]

  for (const segment of fitted.segments) {
    if (segment.type === 'line') {
      commands.push(
        `L${formatNumber(segment.end.x)} ${formatNumber(segment.end.y)}`,
      )
      continue
    }

    commands.push(
      `C${formatNumber(segment.control1.x)} ${formatNumber(segment.control1.y)} ${formatNumber(segment.control2.x)} ${formatNumber(segment.control2.y)} ${formatNumber(segment.end.x)} ${formatNumber(segment.end.y)}`,
    )
  }

  commands.push('Z')

  return commands.join(' ')
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateSvg(options: {
  regions: TracedRegion[]
  palette: ImageVectorizerPaletteColor[]
  crop: ImageVectorizerBounds
  backgroundColor: string | null
  removeBackground: boolean
  smooth: number
}) {
  const {
    regions,
    palette,
    crop,
    backgroundColor,
    removeBackground,
    smooth,
  } = options

  const groupedPaths = new Map<number, string[]>()

  for (const region of regions) {
    const paths = groupedPaths.get(region.paletteIndex) || []

    for (const contour of region.contours) {
      const translated = contour.points.map((point) => translatePoint(point, crop))
      const path = buildAdaptivePath(translated, smooth)

      if (path) paths.push(path)
    }

    groupedPaths.set(region.paletteIndex, paths)
  }

  const elements: string[] = []

  if (!removeBackground && backgroundColor) {
    elements.push(
      `  <rect width="${formatNumber(crop.width)}" height="${formatNumber(crop.height)}" fill="${escapeXml(backgroundColor)}"/>`,
    )
  }

  for (const [paletteIndex, paths] of groupedPaths) {
    const color = palette[paletteIndex]?.hex

    if (!color || !paths.length) continue

    elements.push(
      `  <path fill="${escapeXml(color)}" fill-rule="evenodd" d="${paths.join(' ')}"/>`,
    )
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(crop.width)}" height="${formatNumber(crop.height)}" viewBox="0 0 ${formatNumber(crop.width)} ${formatNumber(crop.height)}">`,
    '  <title>Vectorized with Prompt Draft</title>',
    ...elements,
    '</svg>',
  ].join('\n')
}
