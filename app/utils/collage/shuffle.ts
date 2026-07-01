import type { CollageImageItem, CollageLayoutCell } from '~/types/collage'

export type SimilarRatioShuffleOptions = {
  seed: number
  tolerance?: number
}

function createSeededRandom(seed: number) {
  let value = seed || 1

  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0

    let result = Math.imul(value ^ (value >>> 15), 1 | value)

    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: T[], seed: number) {
  const result = [...items]
  const random = createSeededRandom(seed)

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))

    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function getImageLogRatio(image: CollageImageItem) {
  return Math.log(image.width / image.height)
}

function getCellImageLogRatio(cell: CollageLayoutCell) {
  return getImageLogRatio(cell.image)
}

function groupCellsBySimilarImageRatio(
  cells: CollageLayoutCell[],
  tolerance: number,
) {
  const sortedCells = [...cells].sort((a, b) => {
    return getCellImageLogRatio(a) - getCellImageLogRatio(b)
  })

  const groups: CollageLayoutCell[][] = []

  for (const cell of sortedCells) {
    const ratio = getCellImageLogRatio(cell)
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup?.length) {
      groups.push([cell])
      continue
    }

    const groupAverage =
      lastGroup.reduce((sum, item) => sum + getCellImageLogRatio(item), 0) /
      lastGroup.length

    if (Math.abs(ratio - groupAverage) <= tolerance) {
      lastGroup.push(cell)
    } else {
      groups.push([cell])
    }
  }

  return groups
}

export function shuffleSimilarRatioCellImages(
  cells: CollageLayoutCell[],
  options: SimilarRatioShuffleOptions,
) {
  if (options.seed <= 0 || cells.length < 2) return cells

  const tolerance = options.tolerance ?? 0.14
  const groups = groupCellsBySimilarImageRatio(cells, tolerance)
  const imageByCell = new Map<CollageLayoutCell, CollageImageItem>()

  groups.forEach((group, groupIndex) => {
    if (group.length < 2) {
      imageByCell.set(group[0], group[0].image)
      return
    }

    const shuffledImages = seededShuffle(
      group.map((cell) => cell.image),
      options.seed + groupIndex * 997,
    )

    group.forEach((cell, index) => {
      imageByCell.set(cell, shuffledImages[index])
    })
  })

  return cells.map((cell) => ({
    ...cell,
    image: imageByCell.get(cell) || cell.image,
  }))
}
