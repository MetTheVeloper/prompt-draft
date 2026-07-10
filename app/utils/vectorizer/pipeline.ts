import type {
  ImageVectorizerResult,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'
import { detectBackground, removeEdgeConnectedBackground } from './background'
import { quantizeImage, TRANSPARENT_INDEX } from './colorQuantization'
import { traceRegions } from './contours'
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
        paletteIndex === backgroundIndex ||
        labels[sourceIndex] < 0
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
) {
  if (!width || !height || pixels.length !== width * height * 4) {
    throw new ImageVectorizerPipelineError(
      'INVALID_IMAGE',
      'The supplied image data is invalid.',
    )
  }

  const maxColors = Math.min(32, Math.max(2, Math.round(settings.maxColors)))
  const quantized = quantizeImage(
    pixels,
    maxColors,
    settings.colorTolerance,
  )

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

  const background = detectBackground(
    quantized.indexes,
    width,
    height,
    quantized.palette,
    settings.backgroundColor,
  )

  if (settings.removeBackground && background.paletteIndex >= 0) {
    removeEdgeConnectedBackground(
      quantized.indexes,
      width,
      height,
      quantized.palette,
      background.paletteIndex,
      settings.colorTolerance,
    )
  }

  const regionAnalysis = findRegions(
    quantized.indexes,
    width,
    height,
    background.paletteIndex,
    settings.minRegionSize,
  )

  const crop = resolveCropBounds(
    width,
    height,
    regionAnalysis.contentBounds,
    settings.trimCanvas,
    settings.padding,
  )

  const traced = traceRegions(
    regionAnalysis.regions,
    regionAnalysis.labels,
    width,
    height,
    settings.smooth,
  )

  const svg = generateSvg({
    regions: traced.regions,
    palette: quantized.palette,
    crop,
    backgroundColor: background.color,
    removeBackground: settings.removeBackground,
    smooth: settings.smooth,
  })

  const usedPaletteIndexes = new Set(
    regionAnalysis.regions.map((region) => region.paletteIndex),
  )

  if (!settings.removeBackground && background.paletteIndex >= 0) {
    usedPaletteIndexes.add(background.paletteIndex)
  }

  const result: ImageVectorizerResult = {
    svg,
    palette: quantized.palette,
    backgroundColor: background.color,
    crop,
    stats: {
      sourceWidth: width,
      sourceHeight: height,
      outputWidth: Math.round(crop.width),
      outputHeight: Math.round(crop.height),
      detectedColorCount: quantized.detectedColorCount,
      outputColorCount: usedPaletteIndexes.size,
      regionCount: regionAnalysis.regions.length,
      removedRegionCount: regionAnalysis.removedRegionCount,
      originalPointCount: traced.originalPointCount,
      simplifiedPointCount: traced.simplifiedPointCount,
    },
  }

  const preview = createRasterPreview({
    indexes: quantized.indexes,
    labels: regionAnalysis.labels,
    palette: quantized.palette,
    sourceWidth: width,
    sourceHeight: height,
    backgroundIndex: background.paletteIndex,
    backgroundColor: background.color,
    removeBackground: settings.removeBackground,
    crop,
  })

  return {
    result,
    preview,
  }
}
