import type {
  ImageVectorizerBounds,
  ImageVectorizerProgress,
  ImageVectorizerResult,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'
import { detectBackground, removeEdgeConnectedBackground } from './background'
import { hexToRgb, quantizeImage, TRANSPARENT_INDEX } from './colorQuantization'
import { traceRegions } from './contours'
import {
  assignLowResTransitionOwnership,
  enhanceLowResolutionImage,
} from './lowRes'
import { findRegions, resolveCropBounds } from './regions'
import { generateSvg } from './svg'

export class ImageVectorizerPipelineError extends Error {
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
    this.name = 'ImageVectorizerPipelineError'
    this.code = code
    this.detectedColorCount = details.detectedColorCount
    this.maxColors = details.maxColors
  }
}

function applyPaletteOverrides(
  palette: ReturnType<typeof quantizeImage>['palette'],
  overrides: Record<string, string>,
) {
  return palette.map((color) => {
    const sourceHex = color.hex.toUpperCase()
    const targetHex = overrides[sourceHex]?.toUpperCase()
    const target = hexToRgb(targetHex)

    if (!target || !targetHex) {
      return {
        ...color,
        hex: sourceHex,
        sourceHex,
      }
    }

    return {
      ...color,
      hex: targetHex,
      sourceHex,
      r: target.r,
      g: target.g,
      b: target.b,
    }
  })
}

function recountPaletteUsage(
  indexes: Uint8Array,
  palette: ReturnType<typeof quantizeImage>['palette'],
) {
  const counts = new Uint32Array(palette.length)
  let total = 0

  for (const paletteIndex of indexes) {
    if (paletteIndex === TRANSPARENT_INDEX || paletteIndex >= palette.length) continue

    counts[paletteIndex] += 1
    total += 1
  }

  for (let index = 0; index < palette.length; index += 1) {
    palette[index].count = counts[index]
    palette[index].percent = total
      ? (counts[index] / total) * 100
      : 0
  }
}

function scaleCropDown(
  crop: ImageVectorizerBounds,
  scaleFactor: number,
): ImageVectorizerBounds {
  const safeScale = Math.max(1, scaleFactor)

  return {
    x: crop.x / safeScale,
    y: crop.y / safeScale,
    width: crop.width / safeScale,
    height: crop.height / safeScale,
  }
}

function collapseForegroundToSingleColor(options: {
  indexes: Uint8Array
  palette: ReturnType<typeof quantizeImage>['palette']
}) {
  const { indexes, palette } = options

  if (!palette.length) return

  const counts = new Uint32Array(palette.length)

  for (const paletteIndex of indexes) {
    if (paletteIndex === TRANSPARENT_INDEX || paletteIndex >= palette.length) continue
    counts[paletteIndex] += 1
  }

  let dominantIndex = -1
  let dominantCount = -1

  for (let paletteIndex = 0; paletteIndex < counts.length; paletteIndex += 1) {
    if (counts[paletteIndex] > dominantCount) {
      dominantCount = counts[paletteIndex]
      dominantIndex = paletteIndex
    }
  }

  if (dominantIndex < 0 || !palette[dominantIndex]) return

  const dominant = palette[dominantIndex]

  for (let pixelIndex = 0; pixelIndex < indexes.length; pixelIndex += 1) {
    if (indexes[pixelIndex] === TRANSPARENT_INDEX) continue
    indexes[pixelIndex] = 0
  }

  palette.splice(0, palette.length, {
    ...dominant,
    hex: dominant.hex.toUpperCase(),
    sourceHex: dominant.sourceHex || dominant.hex.toUpperCase(),
    count: 0,
    percent: 0,
  })

  recountPaletteUsage(indexes, palette)
}

function createRasterPreview(options: {
  indexes: Uint8Array
  labels: Int32Array
  palette: ReturnType<typeof quantizeImage>['palette']
  sourceWidth: number
  sourceHeight: number
  backgroundIndex: number
  backgroundColor: string | null
  removeBackground: boolean
  crop: ImageVectorizerResult['crop']
}) {
  const {
    indexes,
    labels,
    palette,
    sourceWidth,
    sourceHeight,
    backgroundIndex,
    backgroundColor,
    removeBackground,
    crop,
  } = options

  const outputWidth = Math.max(1, Math.round(crop.width))
  const outputHeight = Math.max(1, Math.round(crop.height))
  const pixels = new Uint8ClampedArray(outputWidth * outputHeight * 4)

  if (!removeBackground && backgroundColor && backgroundIndex >= 0) {
    const background = palette[backgroundIndex]

    if (background) {
      for (let offset = 0; offset < pixels.length; offset += 4) {
        pixels[offset] = background.r
        pixels[offset + 1] = background.g
        pixels[offset + 2] = background.b
        pixels[offset + 3] = 255
      }
    }
  }

  for (let sourceY = 0; sourceY < sourceHeight; sourceY += 1) {
    const outputY = sourceY - crop.y

    if (outputY < 0 || outputY >= outputHeight) continue

    for (let sourceX = 0; sourceX < sourceWidth; sourceX += 1) {
      const outputX = sourceX - crop.x

      if (outputX < 0 || outputX >= outputWidth) continue

      const sourceIndex = sourceY * sourceWidth + sourceX
      const paletteIndex = indexes[sourceIndex]

      if (
        paletteIndex === TRANSPARENT_INDEX ||
        labels[sourceIndex] < 0 ||
        (!removeBackground && paletteIndex === backgroundIndex)
      ) {
        continue
      }

      const color = palette[paletteIndex]

      if (!color) continue

      const outputOffset = (outputY * outputWidth + outputX) * 4
      pixels[outputOffset] = color.r
      pixels[outputOffset + 1] = color.g
      pixels[outputOffset + 2] = color.b
      pixels[outputOffset + 3] = 255
    }
  }

  return {
    width: outputWidth,
    height: outputHeight,
    pixels,
  }
}

export function vectorizeImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  settings: ImageVectorizerSettings,
  onProgress?: (progress: ImageVectorizerProgress) => void,
) {
  const sourceWidth = width
  const sourceHeight = height
  const report = (percent: number, stage: ImageVectorizerProgress['stage']) => {
    onProgress?.({ percent, stage })
  }

  report(2, 'preparing')

  if (!width || !height || pixels.length !== width * height * 4) {
    throw new ImageVectorizerPipelineError(
      'INVALID_IMAGE',
      'The supplied image data is invalid.',
    )
  }

  report(8, 'enhancing')

  const enhanced = enhanceLowResolutionImage(
    pixels,
    width,
    height,
    settings,
  )

  pixels = enhanced.pixels
  width = enhanced.width
  height = enhanced.height

  report(24, 'quantizing')

  const maxColors = Math.min(
    32,
    Math.max(1, Math.round(settings.removeBackground ? settings.maxColors : Math.max(2, settings.maxColors))),
  )
  const quantized = quantizeImage(
    pixels,
    maxColors,
    settings.colorTolerance,
  )

  assignLowResTransitionOwnership({
    indexes: quantized.indexes,
    pixels,
    transitionMask: enhanced.transitionMask,
    palette: quantized.palette,
    width,
    height,
    scaleFactor: enhanced.scaleFactor,
  })
  recountPaletteUsage(quantized.indexes, quantized.palette)

  if (
    settings.strictColorLimit &&
    quantized.detectedColorCount > maxColors
  ) {
    throw new ImageVectorizerPipelineError(
      'COLOR_LIMIT_EXCEEDED',
      `The image contains ${quantized.detectedColorCount} detected colors, exceeding the selected limit of ${maxColors}.`,
      {
        detectedColorCount: quantized.detectedColorCount,
        maxColors,
      },
    )
  }

  report(40, 'background')

  const background = enhanced.backgroundWasCut
    ? {
        paletteIndex: -1,
        color: settings.backgroundColor || enhanced.backgroundColor,
        bandSize: 0,
        confidence: 1,
      }
    : detectBackground(
        quantized.indexes,
        width,
        height,
        quantized.palette,
        settings.backgroundColor || enhanced.backgroundColor,
      )

  if (
    settings.removeBackground &&
    !enhanced.backgroundWasCut &&
    background.paletteIndex >= 0
  ) {
    removeEdgeConnectedBackground(
      quantized.indexes,
      width,
      height,
      quantized.palette,
      background.paletteIndex,
      settings.colorTolerance,
    )
  }

  if (settings.removeBackground && maxColors === 1) {
    collapseForegroundToSingleColor({
      indexes: quantized.indexes,
      palette: quantized.palette,
    })
  }

  report(56, 'regions')

  const regionAnalysis = findRegions(
    quantized.indexes,
    width,
    height,
    {
      backgroundIndex: settings.removeBackground ? -1 : background.paletteIndex,
      minRegionSize: settings.minRegionSize * enhanced.scaleFactor,
      edgeCleanup: settings.edgeCleanup * enhanced.scaleFactor,
      sourceScale: enhanced.scaleFactor,
      removeBackground: settings.removeBackground,
      removeEnclosedBackground: settings.removeEnclosedBackground,
    },
  )

  const outputPalette = applyPaletteOverrides(
    quantized.palette,
    settings.paletteOverrides,
  )

  const rasterCrop = resolveCropBounds(
    width,
    height,
    regionAnalysis.contentBounds,
    settings.trimCanvas,
    settings.padding * enhanced.scaleFactor,
  )
  const svgCrop = scaleCropDown(rasterCrop, enhanced.scaleFactor)

  const traceSmooth = enhanced.scaleFactor > 1 && settings.enhanceLowRes && settings.smoothMode === 'post'
    ? 0
    : settings.smooth

  report(72, 'tracing')

  const traced = traceRegions(
    regionAnalysis.regions,
    regionAnalysis.labels,
    width,
    height,
    traceSmooth,
  )

  report(86, 'svg')

  const svg = generateSvg({
    regions: traced.regions,
    palette: outputPalette,
    crop: rasterCrop,
    backgroundColor: background.paletteIndex >= 0
      ? outputPalette[background.paletteIndex]?.hex || background.color
      : background.color,
    removeBackground: settings.removeBackground,
    refineSvg: settings.refineSvg,
    smooth: settings.smooth,
    smoothMode: settings.smoothMode,
    sourceScale: enhanced.scaleFactor,
  })

  const usedPaletteIndexes = new Set(
    regionAnalysis.regions.map((region) => region.paletteIndex),
  )

  if (!settings.removeBackground && background.paletteIndex >= 0) {
    usedPaletteIndexes.add(background.paletteIndex)
  }

  const visiblePalette = outputPalette.filter((_, paletteIndex) => {
    return usedPaletteIndexes.has(paletteIndex)
  })

  const result: ImageVectorizerResult = {
    svg,
    palette: visiblePalette,
    backgroundColor: background.paletteIndex >= 0
      ? outputPalette[background.paletteIndex]?.hex || background.color
      : background.color,
    crop: svgCrop,
    stats: {
      sourceWidth,
      sourceHeight,
      outputWidth: Math.round(svgCrop.width),
      outputHeight: Math.round(svgCrop.height),
      detectedColorCount: quantized.detectedColorCount,
      outputColorCount: new Set(visiblePalette.map((color) => color.hex)).size,
      regionCount: regionAnalysis.regions.length,
      removedRegionCount: regionAnalysis.removedRegionCount,
      originalPointCount: traced.originalPointCount,
      simplifiedPointCount: traced.simplifiedPointCount,
    },
  }

  report(94, 'preview')

  const preview = createRasterPreview({
    indexes: quantized.indexes,
    labels: regionAnalysis.labels,
    palette: outputPalette,
    sourceWidth: width,
    sourceHeight: height,
    backgroundIndex: background.paletteIndex,
    backgroundColor: background.paletteIndex >= 0
      ? outputPalette[background.paletteIndex]?.hex || background.color
      : background.color,
    removeBackground: settings.removeBackground,
    crop: rasterCrop,
  })

  report(98, 'finalizing')

  return {
    result,
    preview,
  }
}
