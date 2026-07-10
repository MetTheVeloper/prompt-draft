import type { ImageVectorizerBounds } from '~/types/imageVectorizer'
import { TRANSPARENT_INDEX } from './colorQuantization'

export type VectorRegion = {
  id: number
  paletteIndex: number
  area: number
  bounds: ImageVectorizerBounds
  pixels: number[]
}

export type RegionAnalysis = {
  labels: Int32Array
  regions: VectorRegion[]
  removedRegionCount: number
  contentBounds: ImageVectorizerBounds | null
}

function shouldRemoveRegion(
  area: number,
  width: number,
  height: number,
  minRegionSize: number,
) {
  if (minRegionSize <= 0) return false

  const minimumArea = minRegionSize * minRegionSize

  // A thin but long line can be intentional. Requiring both a small area and
  // one small dimension removes specks without destroying typography strokes.
  return area <= minimumArea && Math.min(width, height) <= minRegionSize
}

export function findRegions(
  indexes: Uint8Array,
  width: number,
  height: number,
  backgroundIndex: number,
  minRegionSize: number,
) : RegionAnalysis {
  const labels = new Int32Array(indexes.length)
  labels.fill(-1)

  const regions: VectorRegion[] = []
  let removedRegionCount = 0
  let contentMinX = Number.POSITIVE_INFINITY
  let contentMinY = Number.POSITIVE_INFINITY
  let contentMaxX = Number.NEGATIVE_INFINITY
  let contentMaxY = Number.NEGATIVE_INFINITY

  for (let start = 0; start < indexes.length; start += 1) {
    const paletteIndex = indexes[start]

    if (
      labels[start] !== -1 ||
      paletteIndex === TRANSPARENT_INDEX ||
      paletteIndex === backgroundIndex
    ) {
      continue
    }

    const queue: number[] = [start]
    const pixels: number[] = []
    labels[start] = -2

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for (let head = 0; head < queue.length; head += 1) {
      const pixelIndex = queue[head]
      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)

      pixels.push(pixelIndex)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      const neighbors = [
        x > 0 ? pixelIndex - 1 : -1,
        x + 1 < width ? pixelIndex + 1 : -1,
        y > 0 ? pixelIndex - width : -1,
        y + 1 < height ? pixelIndex + width : -1,
      ]

      for (const neighbor of neighbors) {
        if (
          neighbor < 0 ||
          labels[neighbor] !== -1 ||
          indexes[neighbor] !== paletteIndex
        ) {
          continue
        }

        labels[neighbor] = -2
        queue.push(neighbor)
      }
    }

    const regionWidth = maxX - minX + 1
    const regionHeight = maxY - minY + 1

    if (
      shouldRemoveRegion(
        pixels.length,
        regionWidth,
        regionHeight,
        Math.max(0, Math.round(minRegionSize)),
      )
    ) {
      removedRegionCount += 1

      for (const pixelIndex of pixels) {
        indexes[pixelIndex] = TRANSPARENT_INDEX
        labels[pixelIndex] = -1
      }

      continue
    }

    const id = regions.length

    for (const pixelIndex of pixels) {
      labels[pixelIndex] = id
    }

    regions.push({
      id,
      paletteIndex,
      area: pixels.length,
      bounds: {
        x: minX,
        y: minY,
        width: regionWidth,
        height: regionHeight,
      },
      pixels,
    })

    contentMinX = Math.min(contentMinX, minX)
    contentMinY = Math.min(contentMinY, minY)
    contentMaxX = Math.max(contentMaxX, maxX + 1)
    contentMaxY = Math.max(contentMaxY, maxY + 1)
  }

  const contentBounds = regions.length
    ? {
        x: contentMinX,
        y: contentMinY,
        width: contentMaxX - contentMinX,
        height: contentMaxY - contentMinY,
      }
    : null

  return {
    labels,
    regions,
    removedRegionCount,
    contentBounds,
  }
}

export function resolveCropBounds(
  sourceWidth: number,
  sourceHeight: number,
  contentBounds: ImageVectorizerBounds | null,
  trimCanvas: boolean,
  padding: number,
): ImageVectorizerBounds {
  if (!trimCanvas || !contentBounds) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
    }
  }

  const safePadding = Math.max(0, Math.round(padding))

  return {
    x: contentBounds.x - safePadding,
    y: contentBounds.y - safePadding,
    width: Math.max(1, contentBounds.width + safePadding * 2),
    height: Math.max(1, contentBounds.height + safePadding * 2),
  }
}
