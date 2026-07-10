import type { ImageVectorizerBounds } from '~/types/imageVectorizer'
import type { VectorRegion } from './regions'

export type VectorPoint = {
  x: number
  y: number
}

export type VectorContour = {
  points: VectorPoint[]
  isHole: boolean
  signedArea: number
}

export type TracedRegion = {
  id: number
  paletteIndex: number
  area: number
  bounds: ImageVectorizerBounds
  contours: VectorContour[]
}

type BoundaryEdge = {
  from: VectorPoint
  to: VectorPoint
  direction: number
  used: boolean
}

function pointKey(point: VectorPoint) {
  return `${point.x},${point.y}`
}

function samePoint(first: VectorPoint, second: VectorPoint) {
  return first.x === second.x && first.y === second.y
}

function signedArea(points: VectorPoint[]) {
  let area = 0

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    area += current.x * next.y - next.x * current.y
  }

  return area / 2
}

function buildBoundaryEdges(
  region: VectorRegion,
  labels: Int32Array,
  width: number,
  height: number,
) {
  const edges: BoundaryEdge[] = []

  const isRegionPixel = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false
    return labels[y * width + x] === region.id
  }

  for (const pixelIndex of region.pixels) {
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    if (!isRegionPixel(x, y - 1)) {
      edges.push({
        from: { x, y },
        to: { x: x + 1, y },
        direction: 0,
        used: false,
      })
    }

    if (!isRegionPixel(x + 1, y)) {
      edges.push({
        from: { x: x + 1, y },
        to: { x: x + 1, y: y + 1 },
        direction: 1,
        used: false,
      })
    }

    if (!isRegionPixel(x, y + 1)) {
      edges.push({
        from: { x: x + 1, y: y + 1 },
        to: { x, y: y + 1 },
        direction: 2,
        used: false,
      })
    }

    if (!isRegionPixel(x - 1, y)) {
      edges.push({
        from: { x, y: y + 1 },
        to: { x, y },
        direction: 3,
        used: false,
      })
    }
  }

  return edges
}

function selectNextEdge(
  candidates: number[],
  edges: BoundaryEdge[],
  incomingDirection: number,
) {
  const preferredDirections = [
    (incomingDirection + 1) % 4,
    incomingDirection,
    (incomingDirection + 3) % 4,
    (incomingDirection + 2) % 4,
  ]

  for (const direction of preferredDirections) {
    const match = candidates.find((edgeIndex) => {
      const edge = edges[edgeIndex]
      return !edge.used && edge.direction === direction
    })

    if (match !== undefined) return match
  }

  return candidates.find((edgeIndex) => !edges[edgeIndex].used) ?? -1
}

function stitchContours(edges: BoundaryEdge[]) {
  const edgesByStart = new Map<string, number[]>()

  edges.forEach((edge, index) => {
    const key = pointKey(edge.from)
    const indexes = edgesByStart.get(key)

    if (indexes) {
      indexes.push(index)
    } else {
      edgesByStart.set(key, [index])
    }
  })

  const contours: VectorPoint[][] = []

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
    if (edges[edgeIndex].used) continue

    const firstEdge = edges[edgeIndex]
    const start = firstEdge.from
    const points: VectorPoint[] = [start]
    let currentIndex = edgeIndex
    let safety = 0

    while (currentIndex >= 0 && safety <= edges.length + 4) {
      safety += 1

      const edge = edges[currentIndex]
      edge.used = true
      points.push(edge.to)

      if (samePoint(edge.to, start)) break

      const candidates = edgesByStart.get(pointKey(edge.to)) || []
      currentIndex = selectNextEdge(candidates, edges, edge.direction)
    }

    if (points.length >= 4 && samePoint(points[0], points[points.length - 1])) {
      points.pop()
      contours.push(points)
    }
  }

  return contours
}

function removeDuplicateAndCollinearPoints(points: VectorPoint[]) {
  if (points.length <= 3) return points

  const unique: VectorPoint[] = []

  for (const point of points) {
    const previous = unique[unique.length - 1]

    if (!previous || !samePoint(previous, point)) {
      unique.push(point)
    }
  }

  if (unique.length > 1 && samePoint(unique[0], unique[unique.length - 1])) {
    unique.pop()
  }

  const result: VectorPoint[] = []

  for (let index = 0; index < unique.length; index += 1) {
    const previous = unique[(index - 1 + unique.length) % unique.length]
    const current = unique[index]
    const next = unique[(index + 1) % unique.length]

    const cross =
      (current.x - previous.x) * (next.y - current.y) -
      (current.y - previous.y) * (next.x - current.x)

    if (cross !== 0) {
      result.push(current)
    }
  }

  return result.length >= 3 ? result : unique
}

function pointSegmentDistanceSquared(
  point: VectorPoint,
  start: VectorPoint,
  end: VectorPoint,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (dx === 0 && dy === 0) {
    const px = point.x - start.x
    const py = point.y - start.y
    return px * px + py * py
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        (dx * dx + dy * dy),
    ),
  )

  const nearestX = start.x + t * dx
  const nearestY = start.y + t * dy
  const distanceX = point.x - nearestX
  const distanceY = point.y - nearestY

  return distanceX * distanceX + distanceY * distanceY
}

function simplifyOpenLine(
  points: VectorPoint[],
  toleranceSquared: number,
): VectorPoint[] {
  if (points.length <= 2) return points

  const first = points[0]
  const last = points[points.length - 1]
  let farthestIndex = -1
  let farthestDistance = 0

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointSegmentDistanceSquared(points[index], first, last)

    if (distance > farthestDistance) {
      farthestDistance = distance
      farthestIndex = index
    }
  }

  if (farthestIndex >= 0 && farthestDistance > toleranceSquared) {
    const left = simplifyOpenLine(points.slice(0, farthestIndex + 1), toleranceSquared)
    const right = simplifyOpenLine(points.slice(farthestIndex), toleranceSquared)

    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

function simplifyClosedRing(points: VectorPoint[], tolerance: number) {
  if (points.length <= 4 || tolerance <= 0) return points

  let firstIndex = 0

  for (let index = 1; index < points.length; index += 1) {
    if (
      points[index].x < points[firstIndex].x ||
      (
        points[index].x === points[firstIndex].x &&
        points[index].y < points[firstIndex].y
      )
    ) {
      firstIndex = index
    }
  }

  let oppositeIndex = firstIndex
  let farthestDistance = -1
  const firstPoint = points[firstIndex]

  for (let index = 0; index < points.length; index += 1) {
    const dx = points[index].x - firstPoint.x
    const dy = points[index].y - firstPoint.y
    const distance = dx * dx + dy * dy

    if (distance > farthestDistance) {
      farthestDistance = distance
      oppositeIndex = index
    }
  }

  if (oppositeIndex === firstIndex) return points

  const walk = (start: number, end: number) => {
    const result: VectorPoint[] = [points[start]]
    let index = start

    while (index !== end) {
      index = (index + 1) % points.length
      result.push(points[index])
    }

    return result
  }

  const toleranceSquared = tolerance * tolerance
  const firstHalf = simplifyOpenLine(
    walk(firstIndex, oppositeIndex),
    toleranceSquared,
  )
  const secondHalf = simplifyOpenLine(
    walk(oppositeIndex, firstIndex),
    toleranceSquared,
  )

  const simplified = [
    ...firstHalf.slice(0, -1),
    ...secondHalf.slice(0, -1),
  ]

  return simplified.length >= 3 ? simplified : points
}

export function traceRegions(
  regions: VectorRegion[],
  labels: Int32Array,
  width: number,
  height: number,
  smooth: number,
) {
  const normalizedSmooth = Math.max(0, Math.min(100, smooth)) / 100
  const scale = Math.max(1, Math.min(width, height))

  // Keep this first simplification deliberately conservative. Its job is to
  // collapse one-pixel staircase noise before adaptive line/curve fitting,
  // not to reshape the contour. The later fitting stage owns smoothness.
  const simplifyTolerance = normalizedSmooth <= 0
    ? 0
    : Math.min(
        1.65,
        0.85 +
          normalizedSmooth * 0.55 +
          Math.min(0.25, scale * 0.00015 * normalizedSmooth),
      )

  let originalPointCount = 0
  let simplifiedPointCount = 0

  const traced: TracedRegion[] = regions.map((region) => {
    const edges = buildBoundaryEdges(region, labels, width, height)
    const rawContours = stitchContours(edges)

    const contours = rawContours
      .map((rawPoints) => {
        originalPointCount += rawPoints.length

        const clean = removeDuplicateAndCollinearPoints(rawPoints)
        const points = simplifyClosedRing(clean, simplifyTolerance)
        const area = signedArea(points)

        simplifiedPointCount += points.length

        return {
          points,
          isHole: area < 0,
          signedArea: area,
        }
      })
      .filter((contour) => contour.points.length >= 3)

    return {
      id: region.id,
      paletteIndex: region.paletteIndex,
      area: region.area,
      bounds: region.bounds,
      contours,
    }
  })

  return {
    regions: traced,
    originalPointCount,
    simplifiedPointCount,
  }
}
