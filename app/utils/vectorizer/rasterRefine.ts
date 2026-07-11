import type { ColorIndexArray } from './colorQuantization'
import { TRANSPARENT_INDEX } from './colorQuantization'

type NeighborSummary = {
  dominant: number
  dominantCount: number
  currentCount: number
  transparentCount: number
  coloredCount: number
  hasOppositeBridge: boolean
}

function summarizeNeighbors(
  indexes: ColorIndexArray,
  width: number,
  height: number,
  x: number,
  y: number,
  current: number,
): NeighborSummary {
  const values = new Uint16Array(8)
  const counts = new Uint8Array(8)
  let uniqueCount = 0
  let transparentCount = 0
  let coloredCount = 0

  const add = (value: number) => {
    if (value === TRANSPARENT_INDEX) {
      transparentCount += 1
    } else {
      coloredCount += 1
    }

    for (let index = 0; index < uniqueCount; index += 1) {
      if (values[index] === value) {
        counts[index] += 1
        return
      }
    }

    values[uniqueCount] = value
    counts[uniqueCount] = 1
    uniqueCount += 1
  }

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) continue

      const nextX = x + offsetX
      const nextY = y + offsetY

      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
        add(TRANSPARENT_INDEX)
        continue
      }

      add(indexes[nextY * width + nextX])
    }
  }

  let dominant = TRANSPARENT_INDEX
  let dominantCount = -1
  let currentCount = 0

  for (let index = 0; index < uniqueCount; index += 1) {
    if (values[index] === current) currentCount = counts[index]

    if (counts[index] > dominantCount) {
      dominant = values[index]
      dominantCount = counts[index]
    }
  }

  const at = (offsetX: number, offsetY: number) => {
    const nextX = x + offsetX
    const nextY = y + offsetY

    if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
      return TRANSPARENT_INDEX
    }

    return indexes[nextY * width + nextX]
  }

  const horizontal = at(-1, 0)
  const vertical = at(0, -1)
  const diagonalA = at(-1, -1)
  const diagonalB = at(1, -1)
  const hasOppositeBridge = (
    horizontal !== TRANSPARENT_INDEX && horizontal === at(1, 0)
  ) || (
    vertical !== TRANSPARENT_INDEX && vertical === at(0, 1)
  ) || (
    diagonalA !== TRANSPARENT_INDEX && diagonalA === at(1, 1)
  ) || (
    diagonalB !== TRANSPARENT_INDEX && diagonalB === at(-1, 1)
  )

  return {
    dominant,
    dominantCount,
    currentCount,
    transparentCount,
    coloredCount,
    hasOppositeBridge,
  }
}

export function refineRasterGaps(
  indexes: ColorIndexArray,
  width: number,
  height: number,
  passes = 1,
) {
  let totalChanges = 0
  const passCount = Math.max(1, Math.min(3, Math.round(passes)))

  for (let pass = 0; pass < passCount; pass += 1) {
    const next = new Uint16Array(indexes)
    let changes = 0

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x

        if (indexes[pixelIndex] !== TRANSPARENT_INDEX) continue

        const summary = summarizeNeighbors(
          indexes,
          width,
          height,
          x,
          y,
          TRANSPARENT_INDEX,
        )

        if (summary.dominant === TRANSPARENT_INDEX) continue

        const shouldFill = summary.hasOppositeBridge || (
          summary.coloredCount >= 5 && summary.dominantCount >= 3
        )

        if (!shouldFill) continue

        next[pixelIndex] = summary.dominant
        changes += 1
      }
    }

    indexes.set(next)
    totalChanges += changes

    if (!changes) break
  }

  return totalChanges
}

export function smoothRasterEdges(
  indexes: ColorIndexArray,
  width: number,
  height: number,
  strength: number,
) {
  const normalized = Math.max(0, Math.min(100, strength))

  if (normalized <= 0) return 0

  const passCount = 1 + Math.floor(normalized / 34)
  const replaceThreshold = normalized >= 80
    ? 5
    : normalized >= 45
      ? 6
      : 7
  const fillThreshold = normalized >= 75 ? 4 : 5
  let totalChanges = 0

  for (let pass = 0; pass < passCount; pass += 1) {
    const next = new Uint16Array(indexes)
    let changes = 0

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x
        const current = indexes[pixelIndex]
        const summary = summarizeNeighbors(
          indexes,
          width,
          height,
          x,
          y,
          current,
        )

        if (current === TRANSPARENT_INDEX) {
          if (
            summary.dominant !== TRANSPARENT_INDEX &&
            (summary.hasOppositeBridge || summary.dominantCount >= fillThreshold)
          ) {
            next[pixelIndex] = summary.dominant
            changes += 1
          }
          continue
        }

        if (
          summary.dominant !== current &&
          summary.dominant !== TRANSPARENT_INDEX &&
          summary.dominantCount >= replaceThreshold &&
          summary.currentCount <= 2
        ) {
          next[pixelIndex] = summary.dominant
          changes += 1
          continue
        }

        if (
          summary.dominant === TRANSPARENT_INDEX &&
          summary.transparentCount >= 7 &&
          summary.currentCount <= 1 &&
          normalized >= 70
        ) {
          next[pixelIndex] = TRANSPARENT_INDEX
          changes += 1
        }
      }
    }

    indexes.set(next)
    totalChanges += changes

    if (!changes) break
  }

  return totalChanges
}
