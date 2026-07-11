import type { ImageVectorizerPaletteColor } from '~/types/imageVectorizer'
import {
  colorDistanceSquared,
  findNearestPaletteIndex,
  hexToRgb,
  toleranceToDistance,
  TRANSPARENT_INDEX,
} from './colorQuantization'
import type { ColorIndexArray } from './colorQuantization'

export type BackgroundDetection = {
  paletteIndex: number
  color: string | null
  bandSize: number
  confidence: number
}

export function detectBackground(
  indexes: ColorIndexArray,
  width: number,
  height: number,
  palette: ImageVectorizerPaletteColor[],
  manualColor: string | null,
): BackgroundDetection {
  if (!palette.length || !width || !height) {
    return {
      paletteIndex: -1,
      color: null,
      bandSize: 0,
      confidence: 0,
    }
  }

  const manualRgb = hexToRgb(manualColor)

  if (manualRgb) {
    const paletteIndex = findNearestPaletteIndex(manualRgb, palette)

    return {
      paletteIndex,
      color: palette[paletteIndex]?.hex || manualColor,
      bandSize: 0,
      confidence: 1,
    }
  }

  const bandSize = Math.min(
    100,
    Math.max(4, Math.round(Math.min(width, height) * 0.05)),
  )

  const counts = new Uint32Array(palette.length)
  let sampled = 0

  const countPixel = (x: number, y: number) => {
    const paletteIndex = indexes[y * width + x]

    if (paletteIndex === TRANSPARENT_INDEX || paletteIndex >= palette.length) return

    counts[paletteIndex] += 1
    sampled += 1
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (
        x < bandSize ||
        y < bandSize ||
        x >= width - bandSize ||
        y >= height - bandSize
      ) {
        countPixel(x, y)
      }
    }
  }

  let paletteIndex = 0

  for (let index = 1; index < counts.length; index += 1) {
    if (counts[index] > counts[paletteIndex]) {
      paletteIndex = index
    }
  }

  return {
    paletteIndex,
    color: palette[paletteIndex]?.hex || null,
    bandSize,
    confidence: sampled ? counts[paletteIndex] / sampled : 0,
  }
}

export function removeEdgeConnectedBackground(
  indexes: ColorIndexArray,
  width: number,
  height: number,
  palette: ImageVectorizerPaletteColor[],
  backgroundIndex: number,
  tolerance: number,
) {
  if (backgroundIndex < 0 || !palette[backgroundIndex]) return 0

  const background = palette[backgroundIndex]
  const threshold = toleranceToDistance(tolerance)
  const thresholdSquared = threshold * threshold
  const visited = new Uint8Array(indexes.length)
  const queue: number[] = []
  let removed = 0

  const isCandidate = (pixelIndex: number) => {
    const paletteIndex = indexes[pixelIndex]

    if (
      paletteIndex === TRANSPARENT_INDEX ||
      paletteIndex >= palette.length
    ) {
      return false
    }

    return colorDistanceSquared(palette[paletteIndex], background) <= thresholdSquared
  }

  const push = (pixelIndex: number) => {
    if (visited[pixelIndex] || !isCandidate(pixelIndex)) return

    visited[pixelIndex] = 1
    queue.push(pixelIndex)
  }

  for (let x = 0; x < width; x += 1) {
    push(x)
    push((height - 1) * width + x)
  }

  for (let y = 0; y < height; y += 1) {
    push(y * width)
    push(y * width + width - 1)
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head]
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    indexes[pixelIndex] = TRANSPARENT_INDEX
    removed += 1

    if (x > 0) push(pixelIndex - 1)
    if (x + 1 < width) push(pixelIndex + 1)
    if (y > 0) push(pixelIndex - width)
    if (y + 1 < height) push(pixelIndex + width)
  }

  return removed
}
