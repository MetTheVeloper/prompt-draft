import type {
  ImageVectorizerBounds,
  ImageVectorizerPaletteColor,
  ImageVectorizerSmoothMode,
} from '~/types/imageVectorizer'
import type { TracedRegion, VectorContour, VectorPoint } from './contours'
import { fitAdaptiveClosedPath } from './adaptivePath'

function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

function scaleBounds(crop: ImageVectorizerBounds, sourceScale: number) {
  const safeScale = Math.max(1, sourceScale)

  return {
    x: crop.x / safeScale,
    y: crop.y / safeScale,
    width: crop.width / safeScale,
    height: crop.height / safeScale,
  }
}

function normalizePoint(
  point: VectorPoint,
  crop: ImageVectorizerBounds,
  divisor: number,
) {
  return {
    x: (point.x - crop.x) / divisor,
    y: (point.y - crop.y) / divisor,
  }
}

function getContourPoints(
  contour: VectorContour,
  smooth: number,
  smoothMode: ImageVectorizerSmoothMode,
  usePostScaleSmoothing: boolean,
) {
  if (smooth <= 0) return contour.points

  if (usePostScaleSmoothing && smoothMode === 'both') {
    return contour.points
  }

  return contour.densePoints
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

function getRefineStrokeWidth(crop: ImageVectorizerBounds, smooth: number) {
  const minEdge = Math.min(crop.width, crop.height)
  const sizeFactor = minEdge >= 1600 ? 1.2 : minEdge >= 900 ? 1 : 0.85
  const smoothFactor = smooth >= 90 ? 1.15 : smooth >= 60 ? 1 : 0.9

  return Math.max(0.7, Math.min(1.6, sizeFactor * smoothFactor))
}

export function generateSvg(options: {
  regions: TracedRegion[]
  palette: ImageVectorizerPaletteColor[]
  crop: ImageVectorizerBounds
  backgroundColor: string | null
  removeBackground: boolean
  refineSvg: boolean
  smooth: number
  smoothMode: ImageVectorizerSmoothMode
  sourceScale?: number
}) {
  const {
    regions,
    palette,
    crop,
    backgroundColor,
    removeBackground,
    refineSvg,
    smooth,
    smoothMode,
    sourceScale = 1,
  } = options

  const safeScale = Math.max(1, sourceScale)
  const outputCrop = scaleBounds(crop, safeScale)
  const effectiveSmoothMode: ImageVectorizerSmoothMode = safeScale > 1
    ? smoothMode
    : 'pre'
  const usePostScaleSmoothing = safeScale > 1 && (
    effectiveSmoothMode === 'post' || effectiveSmoothMode === 'both'
  )
  const pointDivisor = usePostScaleSmoothing ? safeScale : 1
  const groupedPaths = new Map<number, string[]>()

  for (const region of regions) {
    const paths = groupedPaths.get(region.paletteIndex) || []

    for (const contour of region.contours) {
      const sourcePoints = getContourPoints(
        contour,
        smooth,
        effectiveSmoothMode,
        usePostScaleSmoothing,
      )
      const translated = sourcePoints.map((point) => {
        return normalizePoint(point, crop, pointDivisor)
      })
      const path = buildAdaptivePath(translated, smooth)

      if (path) paths.push(path)
    }

    groupedPaths.set(region.paletteIndex, paths)
  }

  const artwork: string[] = []
  const artworkBounds = usePostScaleSmoothing ? outputCrop : crop

  if (!removeBackground && backgroundColor) {
    artwork.push(
      `    <rect width="${formatNumber(artworkBounds.width)}" height="${formatNumber(artworkBounds.height)}" fill="${escapeXml(backgroundColor)}"/>`,
    )
  }

  const refineStrokeWidth = refineSvg
    ? getRefineStrokeWidth(artworkBounds, smooth)
    : 0

  for (const [paletteIndex, paths] of groupedPaths) {
    const color = palette[paletteIndex]?.hex

    if (!color || !paths.length) continue

    if (refineSvg) {
      artwork.push(
        `    <path fill="${escapeXml(color)}" stroke="${escapeXml(color)}" stroke-width="${formatNumber(refineStrokeWidth)}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill" fill-rule="evenodd" d="${paths.join(' ')}"/>`,
      )
      continue
    }

    artwork.push(
      `    <path fill="${escapeXml(color)}" fill-rule="evenodd" d="${paths.join(' ')}"/>`,
    )
  }

  const transform = !usePostScaleSmoothing && safeScale > 1
    ? ` transform="scale(${formatNumber(1 / safeScale)})"`
    : ''

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(outputCrop.width)}" height="${formatNumber(outputCrop.height)}" viewBox="0 0 ${formatNumber(outputCrop.width)} ${formatNumber(outputCrop.height)}" ${refineSvg ? 'shape-rendering="geometricPrecision"' : ''}>`,
    '  <title>Vectorized with Prompt Draft</title>',
    `  <g${transform}>`,
    ...artwork,
    '  </g>',
    '</svg>',
  ].join('\n')
}
