import type { ImageVectorizerPaletteColor } from '~/types/imageVectorizer'

type HistogramBin = {
  r: number
  g: number
  b: number
  count: number
}

type MutableColorCluster = HistogramBin & {
  sumR: number
  sumG: number
  sumB: number
}

export type QuantizedImage = {
  indexes: Uint8Array
  palette: ImageVectorizerPaletteColor[]
  detectedColorCount: number
}

const TRANSPARENT_INDEX = 255
const MAX_DETECTED_CLUSTERS = 256
const HISTOGRAM_BITS = 5
const HISTOGRAM_SHIFT = 8 - HISTOGRAM_BITS
const HISTOGRAM_MASK = (1 << HISTOGRAM_BITS) - 1

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

export function hexToRgb(hex: string | null | undefined) {
  if (!hex) return null

  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())

  if (!match) return null

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  }
}

export function colorDistanceSquared(
  first: Pick<HistogramBin, 'r' | 'g' | 'b'>,
  second: Pick<HistogramBin, 'r' | 'g' | 'b'>,
) {
  const dr = first.r - second.r
  const dg = first.g - second.g
  const db = first.b - second.b

  return dr * dr + dg * dg + db * db
}

export function toleranceToDistance(tolerance: number) {
  const normalized = clamp(tolerance, 0, 100) / 100

  // 6 keeps exact PNG colors separate while 96 absorbs most JPEG ringing.
  return 6 + normalized * 90
}

function buildHistogram(pixels: Uint8ClampedArray) {
  const bins = new Map<number, MutableColorCluster>()
  let opaquePixelCount = 0

  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3]

    if (alpha < 16) continue

    opaquePixelCount += 1

    const r = pixels[offset]
    const g = pixels[offset + 1]
    const b = pixels[offset + 2]

    const key =
      ((r >> HISTOGRAM_SHIFT) & HISTOGRAM_MASK) << (HISTOGRAM_BITS * 2) |
      ((g >> HISTOGRAM_SHIFT) & HISTOGRAM_MASK) << HISTOGRAM_BITS |
      ((b >> HISTOGRAM_SHIFT) & HISTOGRAM_MASK)

    const existing = bins.get(key)

    if (existing) {
      existing.count += 1
      existing.sumR += r
      existing.sumG += g
      existing.sumB += b
    } else {
      bins.set(key, {
        r,
        g,
        b,
        count: 1,
        sumR: r,
        sumG: g,
        sumB: b,
      })
    }
  }

  const minimumMeaningfulCount = Math.max(2, Math.floor(opaquePixelCount * 0.0002))

  const histogram: HistogramBin[] = []

  for (const bin of bins.values()) {
    if (bin.count < minimumMeaningfulCount) continue

    histogram.push({
      r: bin.sumR / bin.count,
      g: bin.sumG / bin.count,
      b: bin.sumB / bin.count,
      count: bin.count,
    })
  }

  histogram.sort((first, second) => second.count - first.count)

  return {
    histogram,
    opaquePixelCount,
  }
}

function detectColorClusters(histogram: HistogramBin[], tolerance: number) {
  const threshold = toleranceToDistance(tolerance)
  const thresholdSquared = threshold * threshold
  const clusters: MutableColorCluster[] = []
  let overflow = false

  for (const bin of histogram) {
    let bestIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < clusters.length; index += 1) {
      const distance = colorDistanceSquared(bin, clusters[index])

      if (distance <= thresholdSquared && distance < bestDistance) {
        bestIndex = index
        bestDistance = distance
      }
    }

    if (bestIndex >= 0) {
      const cluster = clusters[bestIndex]
      const nextCount = cluster.count + bin.count

      cluster.sumR += bin.r * bin.count
      cluster.sumG += bin.g * bin.count
      cluster.sumB += bin.b * bin.count
      cluster.count = nextCount
      cluster.r = cluster.sumR / nextCount
      cluster.g = cluster.sumG / nextCount
      cluster.b = cluster.sumB / nextCount
    } else if (clusters.length < MAX_DETECTED_CLUSTERS) {
      clusters.push({
        ...bin,
        sumR: bin.r * bin.count,
        sumG: bin.g * bin.count,
        sumB: bin.b * bin.count,
      })
    } else {
      overflow = true
    }
  }

  clusters.sort((first, second) => second.count - first.count)

  return {
    clusters,
    detectedColorCount: clusters.length + (overflow ? 1 : 0),
  }
}

function chooseInitialCenters(histogram: HistogramBin[], count: number) {
  if (!histogram.length || count <= 0) return []

  const centers: HistogramBin[] = [{ ...histogram[0] }]

  while (centers.length < count) {
    let bestBin = histogram[0]
    let bestScore = -1

    for (const bin of histogram) {
      let nearestDistance = Number.POSITIVE_INFINITY

      for (const center of centers) {
        nearestDistance = Math.min(
          nearestDistance,
          colorDistanceSquared(bin, center),
        )
      }

      const score = nearestDistance * Math.sqrt(bin.count)

      if (score > bestScore) {
        bestScore = score
        bestBin = bin
      }
    }

    centers.push({ ...bestBin })
  }

  return centers
}

function weightedKMeans(histogram: HistogramBin[], count: number) {
  if (!histogram.length) return []

  const desiredCount = clamp(Math.round(count), 1, histogram.length)
  let centers = chooseInitialCenters(histogram, desiredCount)

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const sums = centers.map(() => ({
      sumR: 0,
      sumG: 0,
      sumB: 0,
      count: 0,
    }))

    for (const bin of histogram) {
      let bestIndex = 0
      let bestDistance = Number.POSITIVE_INFINITY

      for (let index = 0; index < centers.length; index += 1) {
        const distance = colorDistanceSquared(bin, centers[index])

        if (distance < bestDistance) {
          bestDistance = distance
          bestIndex = index
        }
      }

      const target = sums[bestIndex]
      target.sumR += bin.r * bin.count
      target.sumG += bin.g * bin.count
      target.sumB += bin.b * bin.count
      target.count += bin.count
    }

    const nextCenters: HistogramBin[] = []

    for (let index = 0; index < sums.length; index += 1) {
      const sum = sums[index]

      if (!sum.count) continue

      nextCenters.push({
        r: sum.sumR / sum.count,
        g: sum.sumG / sum.count,
        b: sum.sumB / sum.count,
        count: sum.count,
      })
    }

    centers = nextCenters
  }

  return centers.sort((first, second) => second.count - first.count)
}

function mergeNearbyCenters(centers: HistogramBin[], tolerance: number) {
  const threshold = toleranceToDistance(tolerance) * 0.7
  const thresholdSquared = threshold * threshold
  const merged: MutableColorCluster[] = []

  for (const center of centers) {
    let targetIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < merged.length; index += 1) {
      const distance = colorDistanceSquared(center, merged[index])

      if (distance <= thresholdSquared && distance < bestDistance) {
        targetIndex = index
        bestDistance = distance
      }
    }

    if (targetIndex < 0) {
      merged.push({
        ...center,
        sumR: center.r * center.count,
        sumG: center.g * center.count,
        sumB: center.b * center.count,
      })
      continue
    }

    const target = merged[targetIndex]
    const nextCount = target.count + center.count

    target.sumR += center.r * center.count
    target.sumG += center.g * center.count
    target.sumB += center.b * center.count
    target.count = nextCount
    target.r = target.sumR / nextCount
    target.g = target.sumG / nextCount
    target.b = target.sumB / nextCount
  }

  return merged.sort((first, second) => second.count - first.count)
}

function nearestPaletteIndex(
  r: number,
  g: number,
  b: number,
  palette: HistogramBin[],
) {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  const color = { r, g, b }

  for (let index = 0; index < palette.length; index += 1) {
    const distance = colorDistanceSquared(color, palette[index])

    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

export function quantizeImage(
  pixels: Uint8ClampedArray,
  maxColors: number,
  tolerance: number,
): QuantizedImage {
  const { histogram, opaquePixelCount } = buildHistogram(pixels)

  if (!histogram.length || !opaquePixelCount) {
    return {
      indexes: new Uint8Array(pixels.length / 4).fill(TRANSPARENT_INDEX),
      palette: [],
      detectedColorCount: 0,
    }
  }

  const detected = detectColorClusters(histogram, tolerance)
  const detectedClusters = detected.clusters
  const targetCount = clamp(Math.round(maxColors), 2, 32)

  const quantizedCenters = detected.detectedColorCount <= targetCount
    ? detectedClusters
    : weightedKMeans(histogram, targetCount)

  const finalCenters = mergeNearbyCenters(quantizedCenters, tolerance)
    .slice(0, targetCount)

  const indexes = new Uint8Array(pixels.length / 4)
  const counts = new Uint32Array(finalCenters.length)

  for (let pixelIndex = 0, offset = 0; offset < pixels.length; pixelIndex += 1, offset += 4) {
    if (pixels[offset + 3] < 16) {
      indexes[pixelIndex] = TRANSPARENT_INDEX
      continue
    }

    const paletteIndex = nearestPaletteIndex(
      pixels[offset],
      pixels[offset + 1],
      pixels[offset + 2],
      finalCenters,
    )

    indexes[pixelIndex] = paletteIndex
    counts[paletteIndex] += 1
  }

  const palette = finalCenters.map((center, index) => ({
    hex: rgbToHex(center.r, center.g, center.b),
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    count: counts[index],
    percent: opaquePixelCount
      ? (counts[index] / opaquePixelCount) * 100
      : 0,
  }))

  return {
    indexes,
    palette,
    detectedColorCount: detected.detectedColorCount,
  }
}

export function findNearestPaletteIndex(
  color: { r: number; g: number; b: number },
  palette: ImageVectorizerPaletteColor[],
) {
  if (!palette.length) return -1

  return nearestPaletteIndex(color.r, color.g, color.b, palette)
}

export { TRANSPARENT_INDEX }
