import type {
  ImageVectorizerPaletteColor,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'
import {
  clamp,
  colorDistanceSquared,
  hexToRgb,
  rgbToHex,
  TRANSPARENT_INDEX,
} from './colorQuantization'

type Rgb = {
  r: number
  g: number
  b: number
}

export type EnhanceLowResResult = {
  pixels: Uint8ClampedArray
  width: number
  height: number
  backgroundColor: string | null
  backgroundWasCut: boolean
  scaleFactor: number
  transitionMask: Uint8Array | null
}

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function colorDistance(first: Rgb, second: Rgb) {
  const dr = first.r - second.r
  const dg = first.g - second.g
  const db = first.b - second.b

  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function sampleBorderPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const band = Math.max(1, Math.min(6, Math.round(Math.min(width, height) * 0.08)))
  const samples: Rgb[] = []

  const push = (x: number, y: number) => {
    const offset = (y * width + x) * 4
    const alpha = pixels[offset + 3]

    if (alpha < 16) return

    samples.push({
      r: pixels[offset],
      g: pixels[offset + 1],
      b: pixels[offset + 2],
    })
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x < band || y < band || x >= width - band || y >= height - band) {
        push(x, y)
      }
    }
  }

  return samples
}

function detectDominantBorderColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const samples = sampleBorderPixels(pixels, width, height)

  if (!samples.length) return null

  const bins = new Map<number, { count: number; sumR: number; sumG: number; sumB: number }>()

  for (const sample of samples) {
    const key = ((sample.r >> 4) << 8) | ((sample.g >> 4) << 4) | (sample.b >> 4)
    const current = bins.get(key)

    if (current) {
      current.count += 1
      current.sumR += sample.r
      current.sumG += sample.g
      current.sumB += sample.b
    } else {
      bins.set(key, {
        count: 1,
        sumR: sample.r,
        sumG: sample.g,
        sumB: sample.b,
      })
    }
  }

  let best = null as null | { count: number; sumR: number; sumG: number; sumB: number }

  for (const entry of bins.values()) {
    if (!best || entry.count > best.count) {
      best = entry
    }
  }

  if (!best) return null

  return {
    r: best.sumR / best.count,
    g: best.sumG / best.count,
    b: best.sumB / best.count,
  }
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0

  const sorted = [...values].sort((first, second) => first - second)
  const index = clamp(Math.round((sorted.length - 1) * ratio), 0, sorted.length - 1)

  return sorted[index]
}

function floodFillBackground(
  candidates: Uint8Array,
  width: number,
  height: number,
) {
  const connected = new Uint8Array(width * height)
  const queue: number[] = []

  const push = (index: number) => {
    if (!candidates[index] || connected[index]) return
    connected[index] = 1
    queue.push(index)
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
    const index = queue[head]
    const x = index % width
    const y = Math.floor(index / width)

    if (x > 0) push(index - 1)
    if (x + 1 < width) push(index + 1)
    if (y > 0) push(index - width)
    if (y + 1 < height) push(index + width)
  }

  return connected
}

function boxBlurChannel(
  input: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  if (radius <= 0) return new Float32Array(input)

  const temporary = new Float32Array(input.length)
  const output = new Float32Array(input.length)
  const diameter = radius * 2 + 1

  for (let y = 0; y < height; y += 1) {
    let accumulator = 0

    for (let sample = -radius; sample <= radius; sample += 1) {
      const clampedX = clamp(sample, 0, width - 1)
      accumulator += input[y * width + clampedX]
    }

    for (let x = 0; x < width; x += 1) {
      temporary[y * width + x] = accumulator / diameter

      const removeX = clamp(x - radius, 0, width - 1)
      const addX = clamp(x + radius + 1, 0, width - 1)
      accumulator += input[y * width + addX] - input[y * width + removeX]
    }
  }

  for (let x = 0; x < width; x += 1) {
    let accumulator = 0

    for (let sample = -radius; sample <= radius; sample += 1) {
      const clampedY = clamp(sample, 0, height - 1)
      accumulator += temporary[clampedY * width + x]
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = accumulator / diameter

      const removeY = clamp(y - radius, 0, height - 1)
      const addY = clamp(y + radius + 1, 0, height - 1)
      accumulator += temporary[addY * width + x] - temporary[removeY * width + x]
    }
  }

  return output
}

function resizeChannelBilinear(
  input: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
    return new Float32Array(input)
  }

  const output = new Float32Array(targetWidth * targetHeight)
  const scaleX = sourceWidth / targetWidth
  const scaleY = sourceHeight / targetHeight

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) * scaleY - 0.5
    const y0 = clamp(Math.floor(sourceY), 0, sourceHeight - 1)
    const y1 = clamp(y0 + 1, 0, sourceHeight - 1)
    const fy = clamp(sourceY - y0, 0, 1)

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) * scaleX - 0.5
      const x0 = clamp(Math.floor(sourceX), 0, sourceWidth - 1)
      const x1 = clamp(x0 + 1, 0, sourceWidth - 1)
      const fx = clamp(sourceX - x0, 0, 1)

      const topLeft = input[y0 * sourceWidth + x0]
      const topRight = input[y0 * sourceWidth + x1]
      const bottomLeft = input[y1 * sourceWidth + x0]
      const bottomRight = input[y1 * sourceWidth + x1]
      const top = topLeft * (1 - fx) + topRight * fx
      const bottom = bottomLeft * (1 - fx) + bottomRight * fx

      output[y * targetWidth + x] = top * (1 - fy) + bottom * fy
    }
  }

  return output
}

function findContentBounds(
  alpha: Float32Array,
  width: number,
  height: number,
) {
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] < 0.04) continue

      bounds.minX = Math.min(bounds.minX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.maxY = Math.max(bounds.maxY, y)
    }
  }

  if (!Number.isFinite(bounds.minX)) {
    return null
  }

  return {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
  }
}


function applySourceHaloCleanup(options: {
  alpha: Float32Array
  red: Float32Array
  green: Float32Array
  blue: Float32Array
  width: number
  height: number
}) {
  const {
    alpha,
    red,
    green,
    blue,
    width,
    height,
  } = options

  if (!width || !height) return 0

  const nextAlpha = new Float32Array(alpha)
  const nextRed = new Float32Array(red)
  const nextGreen = new Float32Array(green)
  const nextBlue = new Float32Array(blue)
  const solidThreshold = 0.9
  const fringeMin = 0.04
  const fringeMax = 0.88
  let updated = 0

  const visitNeighbors = (
    x: number,
    y: number,
    callback: (neighborIndex: number) => void,
  ) => {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue

        const nextX = x + offsetX
        const nextY = y + offsetY

        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
          continue
        }

        callback(nextY * width + nextX)
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const value = alpha[pixelIndex]

      if (value <= fringeMin || value >= fringeMax) continue

      let solidCount = 0
      let backgroundCount = 0
      let sumR = 0
      let sumG = 0
      let sumB = 0
      let sumWeight = 0

      visitNeighbors(x, y, (neighborIndex) => {
        const neighborAlpha = alpha[neighborIndex]

        if (neighborAlpha <= fringeMin) {
          backgroundCount += 1
          return
        }

        if (neighborAlpha < solidThreshold) return

        solidCount += 1
        sumWeight += neighborAlpha
        sumR += red[neighborIndex] * neighborAlpha
        sumG += green[neighborIndex] * neighborAlpha
        sumB += blue[neighborIndex] * neighborAlpha
      })

      if (!solidCount || !backgroundCount || sumWeight <= 0) continue

      nextRed[pixelIndex] = sumR / sumWeight
      nextGreen[pixelIndex] = sumG / sumWeight
      nextBlue[pixelIndex] = sumB / sumWeight
      nextAlpha[pixelIndex] = Math.max(alpha[pixelIndex], 0.96)
      updated += 1
    }
  }

  if (!updated) return 0

  alpha.set(nextAlpha)
  red.set(nextRed)
  green.set(nextGreen)
  blue.set(nextBlue)

  return updated
}

function resolveScaleFactor(
  settings: ImageVectorizerSettings,
  contentBounds: Bounds | null,
) {
  if (!settings.enhanceLowRes) return 1

  if (settings.lowResScale > 0) {
    return clamp(Math.round(settings.lowResScale), 1, 8)
  }

  if (!contentBounds) return 1

  const contentWidth = contentBounds.maxX - contentBounds.minX + 1
  const contentHeight = contentBounds.maxY - contentBounds.minY + 1
  const shortEdge = Math.max(1, Math.min(contentWidth, contentHeight))

  if (shortEdge >= 220) return 1

  return clamp(Math.ceil(280 / shortEdge), 2, 8)
}

export function enhanceLowResolutionImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  settings: ImageVectorizerSettings,
): EnhanceLowResResult {
  if (!settings.enhanceLowRes || !width || !height) {
    return {
      pixels,
      width,
      height,
      backgroundColor: settings.backgroundColor,
      backgroundWasCut: false,
      scaleFactor: 1,
      transitionMask: null,
    }
  }

  const background = hexToRgb(settings.backgroundColor)
    || detectDominantBorderColor(pixels, width, height)

  if (!background) {
    return {
      pixels,
      width,
      height,
      backgroundColor: settings.backgroundColor,
      backgroundWasCut: false,
      scaleFactor: 1,
      transitionMask: null,
    }
  }

  const distanceValues = new Float32Array(width * height)
  const edgeDistances: number[] = []
  const candidateBackground = new Uint8Array(width * height)
  const thresholdProbe = 18

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const offset = pixelIndex * 4
      const color = {
        r: pixels[offset],
        g: pixels[offset + 1],
        b: pixels[offset + 2],
      }
      const distance = colorDistance(color, background)

      distanceValues[pixelIndex] = distance

      if (
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1
      ) {
        edgeDistances.push(distance)
      }

      if (distance <= thresholdProbe) {
        candidateBackground[pixelIndex] = 1
      }
    }
  }

  const noiseFloor = percentile(edgeDistances, 0.9)
  const candidateThreshold = clamp(noiseFloor + 8, 10, 28)

  for (let index = 0; index < distanceValues.length; index += 1) {
    candidateBackground[index] = distanceValues[index] <= candidateThreshold ? 1 : 0
  }

  const edgeConnectedBackground = floodFillBackground(
    candidateBackground,
    width,
    height,
  )

  const feather = clamp(48 - settings.lowResRecovery * 0.3, 10, 48)
  const sourceAlpha = new Float32Array(width * height)
  const sourceRed = new Float32Array(width * height)
  const sourceGreen = new Float32Array(width * height)
  const sourceBlue = new Float32Array(width * height)

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4
    const rawR = pixels[offset]
    const rawG = pixels[offset + 1]
    const rawB = pixels[offset + 2]
    const distance = distanceValues[index]
    const isCandidateBackground = candidateBackground[index] === 1
    const isTransparentBackground = settings.removeBackground && (
      edgeConnectedBackground[index] === 1 ||
      (settings.removeEnclosedBackground && isCandidateBackground)
    )

    let alpha = 0

    if (isTransparentBackground) {
      alpha = 0
    } else if (isCandidateBackground) {
      alpha = 1
    } else {
      alpha = clamp((distance - candidateThreshold) / feather, 0, 1)
    }

    sourceAlpha[index] = alpha

    if (alpha <= 0.001) continue

    const safeAlpha = Math.max(0.1, alpha)
    sourceRed[index] = clamp(background.r + (rawR - background.r) / safeAlpha, 0, 255)
    sourceGreen[index] = clamp(background.g + (rawG - background.g) / safeAlpha, 0, 255)
    sourceBlue[index] = clamp(background.b + (rawB - background.b) / safeAlpha, 0, 255)
  }

  if (settings.removeBackground) {
    applySourceHaloCleanup({
      alpha: sourceAlpha,
      red: sourceRed,
      green: sourceGreen,
      blue: sourceBlue,
      width,
      height,
    })
  }

  const preBlurRadius = settings.lowResRecovery >= 45 ? 1 : 0
  const blurredSourceAlpha = boxBlurChannel(sourceAlpha, width, height, preBlurRadius)
  const contentBounds = findContentBounds(blurredSourceAlpha, width, height)
  const scaleFactor = resolveScaleFactor(settings, contentBounds)

  if (scaleFactor <= 1) {
    return {
      pixels,
      width,
      height,
      backgroundColor: rgbToHex(background.r, background.g, background.b).toUpperCase(),
      backgroundWasCut: false,
      scaleFactor: 1,
      transitionMask: null,
    }
  }

  const targetWidth = Math.max(1, Math.round(width * scaleFactor))
  const targetHeight = Math.max(1, Math.round(height * scaleFactor))

  let alpha = resizeChannelBilinear(
    blurredSourceAlpha,
    width,
    height,
    targetWidth,
    targetHeight,
  )
  const red = resizeChannelBilinear(sourceRed, width, height, targetWidth, targetHeight)
  const green = resizeChannelBilinear(sourceGreen, width, height, targetWidth, targetHeight)
  const blue = resizeChannelBilinear(sourceBlue, width, height, targetWidth, targetHeight)

  if (settings.lowResRecovery > 0) {
    alpha = boxBlurChannel(alpha, targetWidth, targetHeight, settings.lowResRecovery >= 70 ? 1 : 0)
  }

  const contrast = 1 + settings.lowResRecovery / 35
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4)
  const transitionMask = settings.removeBackground
    ? new Uint8Array(targetWidth * targetHeight)
    : null

  // The 0.5 confidence boundary is the actual recovered silhouette. Pixels
  // inside that boundary but not solid enough are deliberately excluded from
  // quantization and assigned to a neighboring solid region afterwards.
  const silhouetteThreshold = 0.5
  const solidThreshold = clamp(0.9 - settings.lowResRecovery * 0.001, 0.8, 0.9)

  for (let index = 0; index < alpha.length; index += 1) {
    const confidence = clamp(alpha[index], 0, 1)
    let refinedAlpha = clamp((confidence - 0.5) * contrast + 0.5, 0, 1)

    if (refinedAlpha < 0.025) refinedAlpha = 0
    if (refinedAlpha > 0.985) refinedAlpha = 1

    const offset = index * 4

    if (settings.removeBackground) {
      output[offset] = Math.round(red[index])
      output[offset + 1] = Math.round(green[index])
      output[offset + 2] = Math.round(blue[index])

      if (confidence < silhouetteThreshold) {
        output[offset + 3] = 0
      } else if (confidence < solidThreshold) {
        transitionMask![index] = 1
        output[offset + 3] = 0
      } else {
        output[offset + 3] = 255
      }
    } else {
      output[offset] = Math.round(background.r * (1 - refinedAlpha) + red[index] * refinedAlpha)
      output[offset + 1] = Math.round(background.g * (1 - refinedAlpha) + green[index] * refinedAlpha)
      output[offset + 2] = Math.round(background.b * (1 - refinedAlpha) + blue[index] * refinedAlpha)
      output[offset + 3] = 255
    }
  }

  return {
    pixels: output,
    width: targetWidth,
    height: targetHeight,
    backgroundColor: rgbToHex(background.r, background.g, background.b).toUpperCase(),
    backgroundWasCut: settings.removeBackground,
    scaleFactor,
    transitionMask,
  }
}


function transitionPixelColor(
  pixels: Uint8ClampedArray,
  pixelIndex: number,
) {
  const offset = pixelIndex * 4

  return {
    r: pixels[offset],
    g: pixels[offset + 1],
    b: pixels[offset + 2],
  }
}

/**
 * Gives recovered anti-aliased pixels to the nearest real palette region.
 * Transition pixels never become independent gray/fringe regions.
 */
export function assignLowResTransitionOwnership(options: {
  indexes: Uint8Array
  pixels: Uint8ClampedArray
  transitionMask: Uint8Array | null
  palette: ImageVectorizerPaletteColor[]
  width: number
  height: number
  scaleFactor: number
}) {
  const {
    indexes,
    pixels,
    transitionMask,
    palette,
    width,
    height,
    scaleFactor,
  } = options

  if (!transitionMask || !palette.length || transitionMask.length !== indexes.length) {
    return 0
  }

  const owner = new Int16Array(indexes.length)
  owner.fill(-1)
  const distance = new Uint16Array(indexes.length)
  distance.fill(0xffff)
  const queue = new Int32Array(indexes.length)
  let queueStart = 0
  let queueEnd = 0
  let assignedCount = 0
  const maxDistance = Math.max(2, Math.ceil(scaleFactor * 2.25))

  const visitNeighbors = (
    pixelIndex: number,
    callback: (neighborIndex: number) => void,
  ) => {
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue

        const nextX = x + offsetX
        const nextY = y + offsetY

        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
          continue
        }

        callback(nextY * width + nextX)
      }
    }
  }

  // Seed the wavefront with transition pixels that directly touch a solid
  // palette pixel. The closest palette color wins when two regions meet.
  for (let pixelIndex = 0; pixelIndex < transitionMask.length; pixelIndex += 1) {
    if (!transitionMask[pixelIndex]) continue

    const pixelColor = transitionPixelColor(pixels, pixelIndex)
    let bestOwner = -1
    let bestColorDistance = Number.POSITIVE_INFINITY

    visitNeighbors(pixelIndex, (neighborIndex) => {
      if (transitionMask[neighborIndex]) return

      const paletteIndex = indexes[neighborIndex]

      if (paletteIndex === TRANSPARENT_INDEX || paletteIndex >= palette.length) {
        return
      }

      const candidateDistance = colorDistanceSquared(
        pixelColor,
        palette[paletteIndex],
      )

      if (candidateDistance < bestColorDistance) {
        bestColorDistance = candidateDistance
        bestOwner = paletteIndex
      }
    })

    if (bestOwner < 0) continue

    owner[pixelIndex] = bestOwner
    distance[pixelIndex] = 1
    indexes[pixelIndex] = bestOwner
    queue[queueEnd] = pixelIndex
    queueEnd += 1
    assignedCount += 1
  }

  // Expand ownership only through the recovered transition band. Background
  // pixels are never crossed, so neighboring shapes cannot bleed through a
  // real transparent gap.
  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart]
    queueStart += 1

    const currentOwner = owner[pixelIndex]
    const nextDistance = distance[pixelIndex] + 1

    if (currentOwner < 0 || nextDistance > maxDistance) continue

    visitNeighbors(pixelIndex, (neighborIndex) => {
      if (!transitionMask[neighborIndex]) return

      if (nextDistance < distance[neighborIndex]) {
        owner[neighborIndex] = currentOwner
        distance[neighborIndex] = nextDistance
        indexes[neighborIndex] = currentOwner
        queue[queueEnd] = neighborIndex
        queueEnd += 1
        assignedCount += 1
        return
      }

      if (nextDistance !== distance[neighborIndex]) return

      const previousOwner = owner[neighborIndex]

      if (previousOwner < 0 || !palette[previousOwner]) return

      const pixelColor = transitionPixelColor(pixels, neighborIndex)
      const previousDistance = colorDistanceSquared(
        pixelColor,
        palette[previousOwner],
      )
      const candidateDistance = colorDistanceSquared(
        pixelColor,
        palette[currentOwner],
      )

      if (candidateDistance < previousDistance) {
        owner[neighborIndex] = currentOwner
        indexes[neighborIndex] = currentOwner
      }
    })
  }

  return assignedCount
}
