import type { ImageVectorizerBounds } from '~/types/imageVectorizer'
import { TRANSPARENT_INDEX } from './colorQuantization'

export type VectorRegion = {
  id: number
  paletteIndex: number
  area: number
  bounds: ImageVectorizerBounds
  pixels: number[]
}

type BuiltRegion = VectorRegion & {
  touchesEdge: boolean
  neighborCounts: Map<number, number>
}

export type FindRegionsOptions = {
  backgroundIndex: number
  minRegionSize: number
  edgeCleanup: number
  sourceScale: number
  removeBackground: boolean
  removeEnclosedBackground: boolean
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

  return area <= minimumArea && Math.min(width, height) <= minRegionSize
}

function shouldAbsorbAttachedRegion(
  region: BuiltRegion,
  edgeCleanup: number,
  sourceScale: number,
) {
  if (edgeCleanup <= 0) return false

  const shortEdge = Math.min(region.bounds.width, region.bounds.height)
  const softArea = Math.max(1, edgeCleanup * edgeCleanup * 2)
  let dominantSharedBorder = 0
  let totalSharedBorder = 0

  for (const borderCount of region.neighborCounts.values()) {
    dominantSharedBorder = Math.max(dominantSharedBorder, borderCount)
    totalSharedBorder += borderCount
  }

  // A halo can wrap around a large shape and therefore have a huge bounding
  // box. Area divided by the dominant shared border estimates its real band
  // thickness much better than width/height.
  const estimatedThickness = dominantSharedBorder > 0
    ? region.area / dominantSharedBorder
    : Number.POSITIVE_INFINITY
  const normalizedThickness = estimatedThickness / Math.max(1, sourceScale)
  const sourceCleanup = edgeCleanup / Math.max(1, sourceScale)
  const hasDominantOwner = totalSharedBorder > 0 &&
    dominantSharedBorder / totalSharedBorder >= 0.45

  return (
    shortEdge <= edgeCleanup ||
    region.area <= softArea ||
    (hasDominantOwner && normalizedThickness <= sourceCleanup * 1.15)
  )
}

function buildRegions(
  indexes: Uint8Array,
  width: number,
  height: number,
) {
  const labels = new Int32Array(indexes.length)
  labels.fill(-1)

  const regions: BuiltRegion[] = []

  for (let start = 0; start < indexes.length; start += 1) {
    const paletteIndex = indexes[start]

    if (labels[start] !== -1 || paletteIndex === TRANSPARENT_INDEX) {
      continue
    }

    const queue: number[] = [start]
    const pixels: number[] = []
    labels[start] = -2

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    let touchesEdge = false

    for (let head = 0; head < queue.length; head += 1) {
      const pixelIndex = queue[head]
      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)

      pixels.push(pixelIndex)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      touchesEdge = touchesEdge || x === 0 || y === 0 || x === width - 1 || y === height - 1

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
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      },
      pixels,
      touchesEdge,
      neighborCounts: new Map<number, number>(),
    })
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const regionId = labels[pixelIndex]

      if (regionId < 0) continue

      if (x + 1 < width) {
        const neighborIndex = pixelIndex + 1
        const neighborId = labels[neighborIndex]

        if (neighborId >= 0 && neighborId !== regionId) {
          regions[regionId].neighborCounts.set(
            neighborId,
            (regions[regionId].neighborCounts.get(neighborId) || 0) + 1,
          )
          regions[neighborId].neighborCounts.set(
            regionId,
            (regions[neighborId].neighborCounts.get(regionId) || 0) + 1,
          )
        }
      }

      if (y + 1 < height) {
        const neighborIndex = pixelIndex + width
        const neighborId = labels[neighborIndex]

        if (neighborId >= 0 && neighborId !== regionId) {
          regions[regionId].neighborCounts.set(
            neighborId,
            (regions[regionId].neighborCounts.get(neighborId) || 0) + 1,
          )
          regions[neighborId].neighborCounts.set(
            regionId,
            (regions[neighborId].neighborCounts.get(regionId) || 0) + 1,
          )
        }
      }
    }
  }

  return {
    labels,
    regions,
  }
}

function pickAbsorptionTarget(
  region: BuiltRegion,
  regions: BuiltRegion[],
  backgroundIndex: number,
) {
  let bestRegion: BuiltRegion | null = null
  let bestScore = -1

  for (const [neighborId, borderCount] of region.neighborCounts) {
    const neighbor = regions[neighborId]

    if (!neighbor) continue

    // Prefer real content regions over background-colored holes.
    const backgroundPenalty = neighbor.paletteIndex === backgroundIndex ? 0.35 : 1
    const score = borderCount * backgroundPenalty + neighbor.area * 0.0001

    if (score > bestScore) {
      bestScore = score
      bestRegion = neighbor
    }
  }

  return bestRegion
}

function summarizeKeptRegions(
  builtRegions: BuiltRegion[],
  keptRegionIds: Set<number>,
  totalPixels: number,
) {
  const labels = new Int32Array(totalPixels)
  labels.fill(-1)

  const regions: VectorRegion[] = []
  let contentMinX = Number.POSITIVE_INFINITY
  let contentMinY = Number.POSITIVE_INFINITY
  let contentMaxX = Number.NEGATIVE_INFINITY
  let contentMaxY = Number.NEGATIVE_INFINITY

  for (const builtRegion of builtRegions) {
    if (!keptRegionIds.has(builtRegion.id)) continue

    const id = regions.length

    for (const pixelIndex of builtRegion.pixels) {
      labels[pixelIndex] = id
    }

    regions.push({
      id,
      paletteIndex: builtRegion.paletteIndex,
      area: builtRegion.area,
      bounds: builtRegion.bounds,
      pixels: builtRegion.pixels,
    })

    contentMinX = Math.min(contentMinX, builtRegion.bounds.x)
    contentMinY = Math.min(contentMinY, builtRegion.bounds.y)
    contentMaxX = Math.max(contentMaxX, builtRegion.bounds.x + builtRegion.bounds.width)
    contentMaxY = Math.max(contentMaxY, builtRegion.bounds.y + builtRegion.bounds.height)
  }

  return {
    labels,
    regions,
    contentBounds: regions.length
      ? {
          x: contentMinX,
          y: contentMinY,
          width: contentMaxX - contentMinX,
          height: contentMaxY - contentMinY,
        }
      : null,
  }
}

export function findRegions(
  indexes: Uint8Array,
  width: number,
  height: number,
  options: FindRegionsOptions,
): RegionAnalysis {
  const {
    backgroundIndex,
    minRegionSize,
    edgeCleanup,
    sourceScale,
    removeBackground,
    removeEnclosedBackground,
  } = options

  let removedRegionCount = 0

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const { regions } = buildRegions(indexes, width, height)
    const recolorOps: Array<{ pixels: number[]; paletteIndex: number }> = []
    const clearOps: number[][] = []

    for (const region of regions) {
      const { width: regionWidth, height: regionHeight } = region.bounds
      const isBackgroundRegion = backgroundIndex >= 0 && region.paletteIndex === backgroundIndex
      const hasNeighbors = region.neighborCounts.size > 0

      if (!removeBackground && isBackgroundRegion) {
        continue
      }

      if (removeBackground) {
        if (isBackgroundRegion && region.touchesEdge) {
          clearOps.push(region.pixels)
          removedRegionCount += 1
          continue
        }

        if (isBackgroundRegion && removeEnclosedBackground && !region.touchesEdge) {
          clearOps.push(region.pixels)
          removedRegionCount += 1
          continue
        }
      }

      if (
        hasNeighbors &&
        shouldAbsorbAttachedRegion(region, edgeCleanup, sourceScale)
      ) {
        const target = pickAbsorptionTarget(region, regions, backgroundIndex)

        if (target && target.paletteIndex !== region.paletteIndex) {
          recolorOps.push({
            pixels: region.pixels,
            paletteIndex: target.paletteIndex,
          })
          continue
        }
      }

      if (
        !hasNeighbors &&
        shouldRemoveRegion(
          region.area,
          regionWidth,
          regionHeight,
          Math.max(0, Math.round(minRegionSize)),
        )
      ) {
        clearOps.push(region.pixels)
        removedRegionCount += 1
      }
    }

    if (!recolorOps.length && !clearOps.length) {
      break
    }

    for (const operation of recolorOps) {
      for (const pixelIndex of operation.pixels) {
        indexes[pixelIndex] = operation.paletteIndex
      }
    }

    for (const pixelsToClear of clearOps) {
      for (const pixelIndex of pixelsToClear) {
        indexes[pixelIndex] = TRANSPARENT_INDEX
      }
    }
  }

  const { regions: builtRegions } = buildRegions(indexes, width, height)
  const keptRegionIds = new Set<number>()

  for (const region of builtRegions) {
    const isBackgroundRegion = backgroundIndex >= 0 && region.paletteIndex === backgroundIndex

    if (!removeBackground && isBackgroundRegion) {
      continue
    }

    if (removeBackground && isBackgroundRegion && removeEnclosedBackground) {
      continue
    }

    keptRegionIds.add(region.id)
  }

  const summary = summarizeKeptRegions(builtRegions, keptRegionIds, indexes.length)

  return {
    labels: summary.labels,
    regions: summary.regions,
    removedRegionCount,
    contentBounds: summary.contentBounds,
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
