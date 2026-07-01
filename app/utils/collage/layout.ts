import type {
  CollageImageItem,
  CollageLayoutConstraintMode,
  CollageLayoutResult,
  TreemapCandidate,
  TreemapRect,
} from '~/types/collage'

import {
  COLLAGE_CANDIDATE_RATIOS,
  COLLAGE_CANVAS_MAX_SIDE,
} from '~/constants/collage'

import { seededShuffle } from '~/utils/collage/shuffle'

type CollageLayoutContext = {
  images: CollageImageItem[]
  padding: number
  gap: number
  maxSide: number
  constraintMode: CollageLayoutConstraintMode
  layoutShuffleSeed: number
}

const COLLAGE_FREE_CANDIDATE_RATIOS = [
  ...COLLAGE_CANDIDATE_RATIOS,
  9 / 16,
  2 / 3,
  3 / 4,
  4 / 5,
  5 / 4,
  4 / 3,
  3 / 2,
  16 / 9,
  2 / 1,
  1 / 2,
]

function getCandidateRatios(mode: CollageLayoutConstraintMode) {
  const ratios =
    mode === 'free' ? COLLAGE_FREE_CANDIDATE_RATIOS : COLLAGE_CANDIDATE_RATIOS

  return [...new Set(ratios.map((ratio) => Number(ratio.toFixed(4))))]
}

export type CreateCollageLayoutOptions = {
  images: CollageImageItem[]
  padding: number
  gap: number
  maxSide?: number
  ratios?: number[]
  layoutShuffleSeed?: number
  constraintMode?: CollageLayoutConstraintMode
}

export function createCollageLayout(
  options: CreateCollageLayoutOptions,
): CollageLayoutResult | null {
  if (!options.images.length) return null

  const layoutShuffleSeed = options.layoutShuffleSeed || 0
  const constraintMode = options.constraintMode || 'controlled'

  const context: CollageLayoutContext = {
    images:
      layoutShuffleSeed > 0
        ? seededShuffle(options.images, layoutShuffleSeed)
        : options.images,
    padding: options.padding,
    gap: options.gap,
    maxSide: options.maxSide || COLLAGE_CANVAS_MAX_SIDE,
    constraintMode,
    layoutShuffleSeed,
  }

  const ratios = options.ratios || getCandidateRatios(constraintMode)
  const allCandidates: CollageLayoutResult[] = []

  for (const ratio of ratios) {
    const candidates: CollageLayoutResult[] = []

    candidates.push(...createTreemapLayoutsForRatio(context, ratio))

    const gridLayout = createGridLayoutForRatio(context, ratio)

    if (gridLayout) {
      candidates.push(gridLayout)
    }

    candidates.push(...createSideHeroLayoutsForRatio(context, ratio))
    candidates.push(...createSplitGroupLayoutsForRatio(context, ratio))
    candidates.push(...createAdaptiveColumnLayoutsForRatio(context, ratio))

    allCandidates.push(...candidates)
  }

  return pickLayoutCandidate(allCandidates, layoutShuffleSeed)
}

function pickLayoutCandidate(
  candidates: CollageLayoutResult[],
  seed: number,
): CollageLayoutResult | null {
  if (!candidates.length) return null

  const sorted = [...candidates].sort((a, b) => a.score - b.score)

  if (seed <= 0) return sorted[0]

  const bestScore = sorted[0].score
  const pool = sorted.filter((layout, index) => {
    return index < 18 && layout.score <= bestScore + 0.28
  })

  return (
    seededShuffle(pool.length ? pool : sorted.slice(0, 8), seed)[0] || sorted[0]
  )
}

function getCanvasSizeFromRatio(context: CollageLayoutContext, ratio: number) {
  const maxSide = context.maxSide

  if (ratio >= 1) {
    return {
      width: maxSide,
      height: Math.round(maxSide / ratio),
    }
  }

  return {
    width: Math.round(maxSide * ratio),
    height: maxSide,
  }
}

function getCropScore(imageRatio: number, cellRatio: number) {
  return Math.abs(Math.log(imageRatio / cellRatio))
}

function calculateLayoutScore(cells: CollageLayoutResult['cells']) {
  if (!cells.length) return Number.POSITIVE_INFINITY

  const cropScores = cells.map((cell) => {
    const imageRatio = cell.image.width / cell.image.height
    const cellRatio = cell.width / cell.height

    return getCropScore(imageRatio, cellRatio)
  })

  const averageCrop =
    cropScores.reduce((sum, value) => sum + value, 0) / cropScores.length

  const maxCrop = Math.max(...cropScores)

  const areas = cells.map((cell) => cell.width * cell.height)
  const averageArea =
    areas.reduce((sum, value) => sum + value, 0) / areas.length

  const areaVariance =
    areas.reduce((sum, area) => {
      return sum + Math.abs(area / averageArea - 1)
    }, 0) / areas.length

  return averageCrop + maxCrop * 0.42 + areaVariance * 0.08
}

function createLayoutResult(
  width: number,
  height: number,
  ratio: number,
  cells: CollageLayoutResult['cells'],
  columns = 0,
  rows = 0,
  extraPenalty = 0,
): CollageLayoutResult {
  return {
    width,
    height,
    ratio,
    columns,
    rows,
    cells,
    score: calculateLayoutScore(cells) + extraPenalty,
  }
}

function getImageRatio(image: CollageImageItem) {
  return image.width / image.height
}

function getSortedImagesByRatio(context: CollageLayoutContext) {
  return [...context.images].sort((a, b) => {
    return getImageRatio(a) - getImageRatio(b)
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getAverageLogRatio(items: CollageImageItem[]) {
  if (!items.length) return 1

  const averageLog =
    items.reduce((sum, image) => {
      return sum + Math.log(getImageRatio(image))
    }, 0) / items.length

  return Math.exp(averageLog)
}

function getTreemapOrderVariants(context: CollageLayoutContext) {
  const original = [...context.images]

  const ratioAscending = [...context.images].sort((a, b) => {
    return getImageRatio(a) - getImageRatio(b)
  })

  const portraits = ratioAscending.filter((image) => getImageRatio(image) < 0.9)
  const landscapes = ratioAscending.filter(
    (image) => getImageRatio(image) >= 0.9,
  )

  const portraitEdges = [
    ...portraits.slice(0, Math.ceil(portraits.length / 2)),
    ...landscapes,
    ...portraits.slice(Math.ceil(portraits.length / 2)),
  ]

  const alternating: CollageImageItem[] = []
  const maxLength = Math.max(portraits.length, landscapes.length)

  for (let index = 0; index < maxLength; index++) {
    if (portraits[index]) alternating.push(portraits[index])
    if (landscapes[index]) alternating.push(landscapes[index])
  }

  const variants = [original, ratioAscending, portraitEdges, alternating]

  const signatures = new Set<string>()

  return variants.filter((variant) => {
    const signature = variant.map((image) => image.id).join(',')

    if (signatures.has(signature)) return false

    signatures.add(signature)

    return true
  })
}

function getTreemapSplitIndexes(length: number) {
  if (length <= 1) return []

  const indexes = new Set<number>()

  indexes.add(Math.floor(length / 2))
  indexes.add(Math.ceil(length / 2))

  if (length <= 5) {
    indexes.add(1)
    indexes.add(length - 1)
  }

  return [...indexes].filter((index) => index > 0 && index < length)
}

function getTreemapSplitRatios(
  context: CollageLayoutContext,
  groupA: CollageImageItem[],
  groupB: CollageImageItem[],
  direction: 'vertical' | 'horizontal',
) {
  const countRatio = groupA.length / (groupA.length + groupB.length)

  const ratioA = getAverageLogRatio(groupA)
  const ratioB = getAverageLogRatio(groupB)

  let idealRatio = 0.5

  if (direction === 'vertical') {
    idealRatio = ratioA / (ratioA + ratioB)
  } else {
    const heightDemandA = 1 / ratioA
    const heightDemandB = 1 / ratioB

    idealRatio = heightDemandA / (heightDemandA + heightDemandB)
  }

  const rawRatios = [idealRatio, 0.5, countRatio]

  const uniqueRatios = new Set<number>()

  const minSplit = context.constraintMode === 'free' ? 0.16 : 0.22
  const maxSplit = context.constraintMode === 'free' ? 0.84 : 0.78

  for (const ratio of rawRatios) {
    uniqueRatios.add(Number(clamp(ratio, minSplit, maxSplit).toFixed(3)))
  }

  return [...uniqueRatios]
}

function splitTreemapRect(
  context: CollageLayoutContext,
  rect: TreemapRect,
  direction: 'vertical' | 'horizontal',
  splitRatio: number,
): [TreemapRect, TreemapRect] {
  const gap = context.gap

  if (direction === 'vertical') {
    const firstWidth = rect.width * splitRatio

    return [
      {
        x: rect.x,
        y: rect.y,
        width: firstWidth - gap / 2,
        height: rect.height,
      },
      {
        x: rect.x + firstWidth + gap / 2,
        y: rect.y,
        width: rect.width - firstWidth - gap / 2,
        height: rect.height,
      },
    ]
  }

  const firstHeight = rect.height * splitRatio

  return [
    {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: firstHeight - gap / 2,
    },
    {
      x: rect.x,
      y: rect.y + firstHeight + gap / 2,
      width: rect.width,
      height: rect.height - firstHeight - gap / 2,
    },
  ]
}

function chunkImages<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function interleaveColumns<T>(first: T[], second: T[]) {
  const result: T[] = []
  const maxLength = Math.max(first.length, second.length)

  for (let index = 0; index < maxLength; index++) {
    if (first[index]) result.push(first[index])
    if (second[index]) result.push(second[index])
  }

  return result
}

function getColumnNaturalRatio(column: CollageImageItem[]) {
  const totalInverseRatio = column.reduce((sum, image) => {
    return sum + 1 / getImageRatio(image)
  }, 0)

  if (totalInverseRatio <= 0) return 1

  return 1 / totalInverseRatio
}

function getColumnSignature(columns: CollageImageItem[][]) {
  return columns
    .map((column) => column.map((image) => image.id).join(','))
    .join('|')
}

function pushUniqueColumnVariant(
  variants: CollageImageItem[][][],
  signatures: Set<string>,
  columns: CollageImageItem[][],
) {
  const cleanColumns = columns.filter((column) => column.length > 0)

  if (!cleanColumns.length) return

  const signature = getColumnSignature(cleanColumns)

  if (signatures.has(signature)) return

  signatures.add(signature)
  variants.push(cleanColumns)
}

function createLayoutFromColumns(
  context: CollageLayoutContext,
  ratio: number,
  columns: CollageImageItem[][],
  extraPenalty = 0,
): CollageLayoutResult | null {
  if (!columns.length) return null

  const canvasSize = getCanvasSizeFromRatio(context, ratio)

  const innerX = context.padding
  const innerY = context.padding
  const innerWidth = canvasSize.width - context.padding * 2
  const innerHeight = canvasSize.height - context.padding * 2

  if (innerWidth <= 0 || innerHeight <= 0) return null

  const totalColumnGap = context.gap * (columns.length - 1)
  const availableColumnsWidth = innerWidth - totalColumnGap

  if (availableColumnsWidth <= 0) return null

  const columnWeights = columns.map(getColumnNaturalRatio)
  const totalColumnWeight = columnWeights.reduce((sum, value) => sum + value, 0)

  if (totalColumnWeight <= 0) return null

  let currentX = innerX

  const cells: CollageLayoutResult['cells'] = []

  columns.forEach((column, columnIndex) => {
    const columnWidth =
      availableColumnsWidth * (columnWeights[columnIndex] / totalColumnWeight)

    const totalRowGap = context.gap * (column.length - 1)
    const availableRowsHeight = innerHeight - totalRowGap

    if (availableRowsHeight <= 0) return

    const rowWeights = column.map((image) => {
      return 1 / getImageRatio(image)
    })

    const totalRowWeight = rowWeights.reduce((sum, value) => sum + value, 0)

    let currentY = innerY

    column.forEach((image, rowIndex) => {
      const cellHeight =
        availableRowsHeight * (rowWeights[rowIndex] / totalRowWeight)

      cells.push({
        image,
        x: currentX,
        y: currentY,
        width: columnWidth,
        height: cellHeight,
      })

      currentY += cellHeight + context.gap
    })

    currentX += columnWidth + context.gap
  })

  const columnCountPenalty = Math.max(0, columns.length - 5) * 0.1
  const tinyColumnPenalty = columns.some((column) => column.length >= 4)
    ? 0.08
    : 0

  return createLayoutResult(
    canvasSize.width,
    canvasSize.height,
    ratio,
    cells,
    columns.length,
    Math.max(...columns.map((column) => column.length)),
    extraPenalty + columnCountPenalty + tinyColumnPenalty,
  )
}

function solveTreemapGroup(
  context: CollageLayoutContext,
  items: CollageImageItem[],
  rect: TreemapRect,
  depth = 0,
): TreemapCandidate[] {
  if (!items.length) {
    return []
  }

  if (items.length === 1) {
    const image = items[0]
    const imageRatio = getImageRatio(image)
    const rectRatio = rect.width / rect.height

    return [
      {
        cells: [
          {
            image,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        ],
        score: getCropScore(imageRatio, rectRatio),
      },
    ]
  }

  const candidates: TreemapCandidate[] = []
  const splitIndexes = getTreemapSplitIndexes(items.length)

  for (const splitIndex of splitIndexes) {
    const groupA = items.slice(0, splitIndex)
    const groupB = items.slice(splitIndex)

    for (const direction of ['vertical', 'horizontal'] as const) {
      const splitRatios = getTreemapSplitRatios(
        context,
        groupA,
        groupB,
        direction,
      )

      for (const splitRatio of splitRatios) {
        const [rectA, rectB] = splitTreemapRect(
          context,
          rect,
          direction,
          splitRatio,
        )

        const minimumCellSide = context.constraintMode === 'free' ? 8 : 16

        if (
          rectA.width <= minimumCellSide ||
          rectA.height <= minimumCellSide ||
          rectB.width <= minimumCellSide ||
          rectB.height <= minimumCellSide
        ) {
          continue
        }

        const candidatesA = solveTreemapGroup(context, groupA, rectA, depth + 1)
        const candidatesB = solveTreemapGroup(context, groupB, rectB, depth + 1)

        const bestA = candidatesA[0]
        const bestB = candidatesB[0]

        if (!bestA || !bestB) continue

        const cells = [...bestA.cells, ...bestB.cells]

        const balancePenalty = Math.abs(groupA.length - groupB.length) * 0.015
        const depthPenalty = depth * 0.004

        candidates.push({
          cells,
          score: calculateLayoutScore(cells) + balancePenalty + depthPenalty,
        })
      }
    }
  }

  return candidates.sort((a, b) => a.score - b.score).slice(0, 2)
}

function createAdaptiveColumnLayoutsForRatio(
  context: CollageLayoutContext,
  ratio: number,
): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (context.images.length < 3) return result

  const portraitImages = context.images.filter((image) => {
    return getImageRatio(image) < 0.9
  })

  const landscapeImages = context.images.filter((image) => {
    return getImageRatio(image) >= 0.9
  })

  if (!portraitImages.length || !landscapeImages.length) return result

  const variants: CollageImageItem[][][] = []
  const signatures = new Set<string>()

  const portraitSingleColumns = portraitImages.map((image) => [image])

  for (const landscapeStackSize of [1, 2, 3]) {
    const landscapeColumns = chunkImages(landscapeImages, landscapeStackSize)

    const splitIndex = Math.ceil(portraitSingleColumns.length / 2)

    const leftPortraits = portraitSingleColumns.slice(0, splitIndex)
    const rightPortraits = portraitSingleColumns.slice(splitIndex)

    pushUniqueColumnVariant(variants, signatures, [
      ...leftPortraits,
      ...landscapeColumns,
      ...rightPortraits,
    ])

    pushUniqueColumnVariant(variants, signatures, [
      ...portraitSingleColumns,
      ...landscapeColumns,
    ])

    pushUniqueColumnVariant(variants, signatures, [
      ...landscapeColumns,
      ...portraitSingleColumns,
    ])

    pushUniqueColumnVariant(
      variants,
      signatures,
      interleaveColumns(portraitSingleColumns, landscapeColumns),
    )

    pushUniqueColumnVariant(
      variants,
      signatures,
      interleaveColumns(landscapeColumns, portraitSingleColumns),
    )
  }

  const sortedByRatio = getSortedImagesByRatio(context)

  const adaptiveColumnCounts =
    context.constraintMode === 'free' ? [2, 3, 4, 5, 6] : [2, 3, 4, 5]

  for (const columnCount of adaptiveColumnCounts) {
    if (columnCount > context.images.length) continue

    const columns: CollageImageItem[][] = Array.from(
      { length: columnCount },
      () => [],
    )

    sortedByRatio.forEach((image, index) => {
      columns[index % columnCount].push(image)
    })

    pushUniqueColumnVariant(variants, signatures, columns)
  }

  for (const columns of variants) {
    const layout = createLayoutFromColumns(context, ratio, columns, 0.035)

    if (layout) {
      result.push(layout)
    }
  }

  return result
}

function createGridLayoutForRatio(
  context: CollageLayoutContext,
  ratio: number,
): CollageLayoutResult | null {
  if (!context.images.length) return null

  const imageCount = context.images.length
  const canvasSize = getCanvasSizeFromRatio(context, ratio)

  let bestLayout: CollageLayoutResult | null = null

  for (let columns = 1; columns <= imageCount; columns++) {
    const rows = Math.ceil(imageCount / columns)

    const innerWidth =
      canvasSize.width - context.padding * 2 - context.gap * (columns - 1)

    const innerHeight =
      canvasSize.height - context.padding * 2 - context.gap * (rows - 1)

    if (innerWidth <= 0 || innerHeight <= 0) continue

    const cellWidth = innerWidth / columns
    const cellHeight = innerHeight / rows

    const cells = context.images.map((image, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)

      return {
        image,
        x: context.padding + column * (cellWidth + context.gap),
        y: context.padding + row * (cellHeight + context.gap),
        width: cellWidth,
        height: cellHeight,
      }
    })

    const emptyCells = columns * rows - imageCount
    const emptyCellsPenalty =
      emptyCells * (context.constraintMode === 'free' ? 0.12 : 0.22)
    const preferredMaxColumns = context.constraintMode === 'free' ? 6 : 4
    const tooManyColumnsPenalty =
      columns > preferredMaxColumns
        ? (columns - preferredMaxColumns) *
          (context.constraintMode === 'free' ? 0.06 : 0.14)
        : 0

    const layout = createLayoutResult(
      canvasSize.width,
      canvasSize.height,
      ratio,
      cells,
      columns,
      rows,
      emptyCellsPenalty + tooManyColumnsPenalty,
    )

    if (!bestLayout || layout.score < bestLayout.score) {
      bestLayout = layout
    }
  }

  return bestLayout
}

function createSideHeroLayoutsForRatio(
  context: CollageLayoutContext,
  ratio: number,
): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (context.images.length < 3) return result

  const canvasSize = getCanvasSizeFromRatio(context, ratio)

  const innerX = context.padding
  const innerY = context.padding
  const innerWidth = canvasSize.width - context.padding * 2
  const innerHeight = canvasSize.height - context.padding * 2

  if (innerWidth <= 0 || innerHeight <= 0) return result

  const sorted = getSortedImagesByRatio(context)
  const portraitCandidate = sorted[0]
  const otherImages = context.images.filter((item) => {
    return item.id !== portraitCandidate.id
  })

  const portraitRatio = getImageRatio(portraitCandidate)

  if (portraitRatio > 0.9) return result

  const heroWidthRatios =
    context.constraintMode === 'free'
      ? [0.26, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5, 0.56, 0.62]
      : [0.34, 0.38, 0.42, 0.46, 0.5]

  for (const heroWidthRatio of heroWidthRatios) {
    const heroWidth = (innerWidth - context.gap) * heroWidthRatio
    const stackWidth = innerWidth - heroWidth - context.gap

    if (heroWidth <= 0 || stackWidth <= 0) continue

    const stackRows = otherImages.length
    const stackCellHeight =
      (innerHeight - context.gap * (stackRows - 1)) / stackRows

    if (stackCellHeight <= 0) continue

    const leftHeroCells = [
      {
        image: portraitCandidate,
        x: innerX,
        y: innerY,
        width: heroWidth,
        height: innerHeight,
      },
      ...otherImages.map((image, index) => ({
        image,
        x: innerX + heroWidth + context.gap,
        y: innerY + index * (stackCellHeight + context.gap),
        width: stackWidth,
        height: stackCellHeight,
      })),
    ]

    const rightHeroCells = [
      ...otherImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (stackCellHeight + context.gap),
        width: stackWidth,
        height: stackCellHeight,
      })),
      {
        image: portraitCandidate,
        x: innerX + stackWidth + context.gap,
        y: innerY,
        width: heroWidth,
        height: innerHeight,
      },
    ]

    const sideHeroPenalty = 0.04

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        leftHeroCells,
        2,
        stackRows,
        sideHeroPenalty,
      ),
    )

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        rightHeroCells,
        2,
        stackRows,
        sideHeroPenalty,
      ),
    )
  }

  return result
}

function createSplitGroupLayoutsForRatio(
  context: CollageLayoutContext,
  ratio: number,
): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (context.images.length < 4) return result

  const canvasSize = getCanvasSizeFromRatio(context, ratio)

  const innerX = context.padding
  const innerY = context.padding
  const innerWidth = canvasSize.width - context.padding * 2
  const innerHeight = canvasSize.height - context.padding * 2

  if (innerWidth <= 0 || innerHeight <= 0) return result

  const portraitImages = context.images.filter((item) => {
    return getImageRatio(item) < 0.9
  })

  const landscapeImages = context.images.filter((item) => {
    return getImageRatio(item) >= 0.9
  })

  if (!portraitImages.length || !landscapeImages.length) return result

  const splitRatios =
    context.constraintMode === 'free'
      ? [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75]
      : [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65]

  for (const splitRatio of splitRatios) {
    const leftWidth = (innerWidth - context.gap) * splitRatio
    const rightWidth = innerWidth - leftWidth - context.gap

    if (leftWidth <= 0 || rightWidth <= 0) continue

    const portraitCellHeight =
      (innerHeight - context.gap * (portraitImages.length - 1)) /
      portraitImages.length

    const landscapeCellHeight =
      (innerHeight - context.gap * (landscapeImages.length - 1)) /
      landscapeImages.length

    if (portraitCellHeight <= 0 || landscapeCellHeight <= 0) continue

    const leftPortraitCells = [
      ...portraitImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (portraitCellHeight + context.gap),
        width: leftWidth,
        height: portraitCellHeight,
      })),
      ...landscapeImages.map((image, index) => ({
        image,
        x: innerX + leftWidth + context.gap,
        y: innerY + index * (landscapeCellHeight + context.gap),
        width: rightWidth,
        height: landscapeCellHeight,
      })),
    ]

    const rightPortraitCells = [
      ...landscapeImages.map((image, index) => ({
        image,
        x: innerX,
        y: innerY + index * (landscapeCellHeight + context.gap),
        width: leftWidth,
        height: landscapeCellHeight,
      })),
      ...portraitImages.map((image, index) => ({
        image,
        x: innerX + leftWidth + context.gap,
        y: innerY + index * (portraitCellHeight + context.gap),
        width: rightWidth,
        height: portraitCellHeight,
      })),
    ]

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        leftPortraitCells,
        2,
        Math.max(portraitImages.length, landscapeImages.length),
        0.08,
      ),
    )

    result.push(
      createLayoutResult(
        canvasSize.width,
        canvasSize.height,
        ratio,
        rightPortraitCells,
        2,
        Math.max(portraitImages.length, landscapeImages.length),
        0.08,
      ),
    )
  }

  return result
}

function createTreemapLayoutsForRatio(
  context: CollageLayoutContext,
  ratio: number,
): CollageLayoutResult[] {
  const result: CollageLayoutResult[] = []

  if (context.images.length < 2) return result

  const canvasSize = getCanvasSizeFromRatio(context, ratio)

  const rootRect: TreemapRect = {
    x: context.padding,
    y: context.padding,
    width: canvasSize.width - context.padding * 2,
    height: canvasSize.height - context.padding * 2,
  }

  if (rootRect.width <= 0 || rootRect.height <= 0) return result

  const orderVariants = getTreemapOrderVariants(context)

  for (const orderedImages of orderVariants) {
    const candidates = solveTreemapGroup(context, orderedImages, rootRect)

    for (const candidate of candidates) {
      result.push(
        createLayoutResult(
          canvasSize.width,
          canvasSize.height,
          ratio,
          candidate.cells,
          0,
          0,
          0.015,
        ),
      )
    }
  }

  return result
}
