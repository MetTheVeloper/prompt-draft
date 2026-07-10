import type { VectorPoint } from './contours'

export type AdaptiveLineSegment = {
  type: 'line'
  start: VectorPoint
  end: VectorPoint
}

export type AdaptiveCurveSegment = {
  type: 'curve'
  start: VectorPoint
  control1: VectorPoint
  control2: VectorPoint
  end: VectorPoint
}

export type AdaptivePathSegment = AdaptiveLineSegment | AdaptiveCurveSegment

export type AdaptiveClosedPath = {
  start: VectorPoint
  segments: AdaptivePathSegment[]
  cornerCount: number
  lineCount: number
  curveCount: number
}

type Vector = VectorPoint

type Anchor = {
  index: number
  isCorner: boolean
}

type CornerCandidate = {
  index: number
  position: number
  turn: number
}

const EPSILON = 1e-8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function add(first: VectorPoint, second: VectorPoint): VectorPoint {
  return {
    x: first.x + second.x,
    y: first.y + second.y,
  }
}

function subtract(first: VectorPoint, second: VectorPoint): VectorPoint {
  return {
    x: first.x - second.x,
    y: first.y - second.y,
  }
}

function multiply(vector: VectorPoint, amount: number): VectorPoint {
  return {
    x: vector.x * amount,
    y: vector.y * amount,
  }
}

function dot(first: VectorPoint, second: VectorPoint) {
  return first.x * second.x + first.y * second.y
}

function length(vector: VectorPoint) {
  return Math.hypot(vector.x, vector.y)
}

function distance(first: VectorPoint, second: VectorPoint) {
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function normalize(vector: VectorPoint): VectorPoint {
  const vectorLength = length(vector)

  if (vectorLength <= EPSILON) {
    return { x: 0, y: 0 }
  }

  return {
    x: vector.x / vectorLength,
    y: vector.y / vectorLength,
  }
}

function negate(vector: VectorPoint): VectorPoint {
  return {
    x: -vector.x,
    y: -vector.y,
  }
}

function samePoint(first: VectorPoint, second: VectorPoint) {
  return first.x === second.x && first.y === second.y
}

function getBoundsDiagonal(points: VectorPoint[]) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return Math.hypot(maxX - minX, maxY - minY)
}

function buildArcPositions(points: VectorPoint[]) {
  const positions = new Array<number>(points.length).fill(0)
  let perimeter = 0

  for (let index = 1; index < points.length; index += 1) {
    perimeter += distance(points[index - 1], points[index])
    positions[index] = perimeter
  }

  perimeter += distance(points[points.length - 1], points[0])

  return {
    positions,
    perimeter,
  }
}

function circularArcDistance(first: number, second: number, perimeter: number) {
  const direct = Math.abs(first - second)
  return Math.min(direct, Math.max(0, perimeter - direct))
}

function getPointAtArcOffset(
  points: VectorPoint[],
  startIndex: number,
  direction: -1 | 1,
  targetDistance: number,
) {
  let currentIndex = startIndex
  let current = points[currentIndex]
  let remaining = Math.max(0, targetDistance)
  let safety = 0

  while (remaining > EPSILON && safety <= points.length + 1) {
    safety += 1

    const nextIndex = (
      currentIndex + direction + points.length
    ) % points.length
    const next = points[nextIndex]
    const segmentLength = distance(current, next)

    if (segmentLength <= EPSILON) {
      currentIndex = nextIndex
      current = next
      continue
    }

    if (remaining <= segmentLength) {
      const ratio = remaining / segmentLength

      return {
        x: current.x + (next.x - current.x) * ratio,
        y: current.y + (next.y - current.y) * ratio,
      }
    }

    remaining -= segmentLength
    currentIndex = nextIndex
    current = next
  }

  return { ...current }
}

function getInteriorAngleDegrees(
  previous: VectorPoint,
  current: VectorPoint,
  next: VectorPoint,
) {
  const incoming = normalize(subtract(previous, current))
  const outgoing = normalize(subtract(next, current))
  const cosine = clamp(dot(incoming, outgoing), -1, 1)

  return Math.acos(cosine) * (180 / Math.PI)
}

function findCornerAnchors(points: VectorPoint[], smooth: number): Anchor[] {
  if (points.length < 4) return []

  const diagonal = Math.max(1, getBoundsDiagonal(points))
  const normalizedSmooth = clamp(smooth, 0, 100) / 100
  const longLookDistance = clamp(
    diagonal * (0.0045 + normalizedSmooth * 0.0015),
    3,
    14,
  )
  const shortLookDistance = Math.max(1.5, longLookDistance * 0.42)
  const minimumCornerTurn = 38
  const minimumShortTurn = 24
  const minimumSeparation = Math.max(3, longLookDistance * 0.7)
  const { positions, perimeter } = buildArcPositions(points)
  const candidates: CornerCandidate[] = []

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const previousLong = getPointAtArcOffset(
      points,
      index,
      -1,
      longLookDistance,
    )
    const nextLong = getPointAtArcOffset(
      points,
      index,
      1,
      longLookDistance,
    )
    const previousShort = getPointAtArcOffset(
      points,
      index,
      -1,
      shortLookDistance,
    )
    const nextShort = getPointAtArcOffset(
      points,
      index,
      1,
      shortLookDistance,
    )
    const longTurn = 180 - getInteriorAngleDegrees(
      previousLong,
      current,
      nextLong,
    )
    const shortTurn = 180 - getInteriorAngleDegrees(
      previousShort,
      current,
      nextShort,
    )

    // A real corner concentrates most of its direction change close to one
    // anchor. A smooth curve accumulates that turn gradually over the window.
    if (
      longTurn >= minimumCornerTurn &&
      shortTurn >= minimumShortTurn &&
      shortTurn >= longTurn * 0.55
    ) {
      candidates.push({
        index,
        position: positions[index],
        turn: shortTurn * 0.7 + longTurn * 0.3,
      })
    }
  }

  candidates.sort((first, second) => second.turn - first.turn)

  const selected: CornerCandidate[] = []

  for (const candidate of candidates) {
    const overlaps = selected.some((current) => {
      return circularArcDistance(
        candidate.position,
        current.position,
        perimeter,
      ) < minimumSeparation
    })

    if (!overlaps) selected.push(candidate)
  }

  return selected
    .sort((first, second) => first.index - second.index)
    .map((candidate) => ({
      index: candidate.index,
      isCorner: true,
    }))
}

function findNearestIndex(
  points: VectorPoint[],
  predicate: (point: VectorPoint) => number,
) {
  let bestIndex = 0
  let bestValue = predicate(points[0])

  for (let index = 1; index < points.length; index += 1) {
    const value = predicate(points[index])

    if (value < bestValue) {
      bestValue = value
      bestIndex = index
    }
  }

  return bestIndex
}

function addHelperAnchors(points: VectorPoint[], anchors: Anchor[]) {
  const byIndex = new Map<number, Anchor>()

  for (const anchor of anchors) {
    byIndex.set(anchor.index, anchor)
  }

  if (!anchors.length) {
    const helperIndexes = [
      findNearestIndex(points, (point) => point.x),
      findNearestIndex(points, (point) => point.y),
      findNearestIndex(points, (point) => -point.x),
      findNearestIndex(points, (point) => -point.y),
    ]

    for (const index of helperIndexes) {
      byIndex.set(index, {
        index,
        isCorner: false,
      })
    }
  }

  const { positions, perimeter } = buildArcPositions(points)
  const desiredCount = byIndex.size === 1 ? 2 : Math.max(2, byIndex.size)

  while (byIndex.size < desiredCount) {
    const existing = [...byIndex.values()]
    let bestIndex = -1
    let bestDistance = -1

    for (let index = 0; index < points.length; index += 1) {
      if (byIndex.has(index)) continue

      const nearestDistance = existing.reduce((minimum, anchor) => {
        return Math.min(
          minimum,
          circularArcDistance(
            positions[index],
            positions[anchor.index],
            perimeter,
          ),
        )
      }, Number.POSITIVE_INFINITY)

      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance
        bestIndex = index
      }
    }

    if (bestIndex < 0) break

    byIndex.set(bestIndex, {
      index: bestIndex,
      isCorner: false,
    })
  }

  if (byIndex.size < 2 && points.length >= 2) {
    byIndex.set(Math.floor(points.length / 2), {
      index: Math.floor(points.length / 2),
      isCorner: false,
    })
  }

  return [...byIndex.values()].sort((first, second) => {
    return first.index - second.index
  })
}

function extractRingSegment(
  points: VectorPoint[],
  startIndex: number,
  endIndex: number,
) {
  const segment: VectorPoint[] = [points[startIndex]]
  let index = startIndex
  let safety = 0

  while (index !== endIndex && safety <= points.length) {
    safety += 1
    index = (index + 1) % points.length

    const point = points[index]
    const previous = segment[segment.length - 1]

    if (!samePoint(previous, point)) segment.push(point)
  }

  return segment
}

function pointLineDistance(
  point: VectorPoint,
  start: VectorPoint,
  end: VectorPoint,
) {
  const line = subtract(end, start)
  const lineLengthSquared = dot(line, line)

  if (lineLengthSquared <= EPSILON) return distance(point, start)

  const ratio = clamp(
    dot(subtract(point, start), line) / lineLengthSquared,
    0,
    1,
  )
  const nearest = add(start, multiply(line, ratio))

  return distance(point, nearest)
}

function getMaximumLineDeviation(points: VectorPoint[]) {
  if (points.length <= 2) return 0

  const start = points[0]
  const end = points[points.length - 1]
  let maximum = 0

  for (let index = 1; index < points.length - 1; index += 1) {
    maximum = Math.max(
      maximum,
      pointLineDistance(points[index], start, end),
    )
  }

  return maximum
}

function getTotalTurnDegrees(points: VectorPoint[]) {
  let total = 0

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousDirection = normalize(
      subtract(points[index], points[index - 1]),
    )
    const nextDirection = normalize(
      subtract(points[index + 1], points[index]),
    )
    const cosine = clamp(dot(previousDirection, nextDirection), -1, 1)

    total += Math.acos(cosine) * (180 / Math.PI)
  }

  return total
}

function shouldFitAsLine(
  points: VectorPoint[],
  smooth: number,
  diagonal: number,
) {
  if (points.length <= 2) return true

  const normalizedSmooth = clamp(smooth, 0, 100) / 100
  const lineTolerance =
    0.55 +
    normalizedSmooth * 1.15 +
    Math.min(0.75, diagonal * 0.00035 * normalizedSmooth)
  const turnLimit = 16 + normalizedSmooth * 12
  const maximumDeviation = getMaximumLineDeviation(points)

  if (maximumDeviation <= lineTolerance) return true

  return (
    maximumDeviation <= lineTolerance * 1.35 &&
    getTotalTurnDegrees(points) <= turnLimit
  )
}

function chordLengthParameterize(points: VectorPoint[]) {
  const parameters = new Array<number>(points.length).fill(0)

  for (let index = 1; index < points.length; index += 1) {
    parameters[index] = parameters[index - 1] + distance(
      points[index - 1],
      points[index],
    )
  }

  const total = parameters[parameters.length - 1]

  if (total <= EPSILON) return parameters

  for (let index = 1; index < parameters.length; index += 1) {
    parameters[index] /= total
  }

  return parameters
}

function bernstein0(value: number) {
  const inverse = 1 - value
  return inverse * inverse * inverse
}

function bernstein1(value: number) {
  const inverse = 1 - value
  return 3 * value * inverse * inverse
}

function bernstein2(value: number) {
  const inverse = 1 - value
  return 3 * value * value * inverse
}

function bernstein3(value: number) {
  return value * value * value
}

function evaluateCubic(
  segment: AdaptiveCurveSegment,
  parameter: number,
): VectorPoint {
  const b0 = bernstein0(parameter)
  const b1 = bernstein1(parameter)
  const b2 = bernstein2(parameter)
  const b3 = bernstein3(parameter)

  return {
    x:
      segment.start.x * b0 +
      segment.control1.x * b1 +
      segment.control2.x * b2 +
      segment.end.x * b3,
    y:
      segment.start.y * b0 +
      segment.control1.y * b1 +
      segment.control2.y * b2 +
      segment.end.y * b3,
  }
}

function generateBezier(
  points: VectorPoint[],
  parameters: number[],
  leftTangent: Vector,
  rightTangent: Vector,
): AdaptiveCurveSegment {
  const start = points[0]
  const end = points[points.length - 1]
  let c00 = 0
  let c01 = 0
  let c11 = 0
  let x0 = 0
  let x1 = 0

  for (let index = 0; index < points.length; index += 1) {
    const parameter = parameters[index]
    const b0 = bernstein0(parameter)
    const b1 = bernstein1(parameter)
    const b2 = bernstein2(parameter)
    const b3 = bernstein3(parameter)
    const a1 = multiply(leftTangent, b1)
    const a2 = multiply(rightTangent, b2)
    const baseline = add(
      multiply(start, b0 + b1),
      multiply(end, b2 + b3),
    )
    const delta = subtract(points[index], baseline)

    c00 += dot(a1, a1)
    c01 += dot(a1, a2)
    c11 += dot(a2, a2)
    x0 += dot(a1, delta)
    x1 += dot(a2, delta)
  }

  const determinant = c00 * c11 - c01 * c01
  let alpha1 = 0
  let alpha2 = 0

  if (Math.abs(determinant) > EPSILON) {
    alpha1 = (x0 * c11 - x1 * c01) / determinant
    alpha2 = (c00 * x1 - c01 * x0) / determinant
  }

  const chord = distance(start, end)
  let polylineLength = 0

  for (let index = 1; index < points.length; index += 1) {
    polylineLength += distance(points[index - 1], points[index])
  }

  const minimumAlpha = chord * 0.01
  const maximumAlpha = Math.max(chord, polylineLength) * 0.75
  const fallbackAlpha = chord / 3

  if (
    !Number.isFinite(alpha1) ||
    !Number.isFinite(alpha2) ||
    alpha1 < minimumAlpha ||
    alpha2 < minimumAlpha ||
    alpha1 > maximumAlpha ||
    alpha2 > maximumAlpha
  ) {
    alpha1 = fallbackAlpha
    alpha2 = fallbackAlpha
  }

  return {
    type: 'curve',
    start,
    control1: add(start, multiply(leftTangent, alpha1)),
    control2: add(end, multiply(rightTangent, alpha2)),
    end,
  }
}

function computeMaximumBezierError(
  points: VectorPoint[],
  segment: AdaptiveCurveSegment,
  parameters: number[],
) {
  let splitIndex = Math.floor(points.length / 2)
  let maximumErrorSquared = 0

  for (let index = 1; index < points.length - 1; index += 1) {
    const fitted = evaluateCubic(segment, parameters[index])
    const delta = subtract(fitted, points[index])
    const errorSquared = dot(delta, delta)

    if (errorSquared >= maximumErrorSquared) {
      maximumErrorSquared = errorSquared
      splitIndex = index
    }
  }

  return {
    errorSquared: maximumErrorSquared,
    splitIndex,
  }
}

function fitCubicRecursive(
  points: VectorPoint[],
  leftTangent: Vector,
  rightTangent: Vector,
  errorSquared: number,
  depth = 0,
): AdaptiveCurveSegment[] {
  if (points.length === 2) {
    const chord = distance(points[0], points[1]) / 3

    return [{
      type: 'curve',
      start: points[0],
      control1: add(points[0], multiply(leftTangent, chord)),
      control2: add(points[1], multiply(rightTangent, chord)),
      end: points[1],
    }]
  }

  const parameters = chordLengthParameterize(points)
  const segment = generateBezier(
    points,
    parameters,
    leftTangent,
    rightTangent,
  )
  const maximumError = computeMaximumBezierError(
    points,
    segment,
    parameters,
  )

  if (maximumError.errorSquared <= errorSquared || depth >= 18) {
    return [segment]
  }

  const splitIndex = clamp(
    maximumError.splitIndex,
    1,
    points.length - 2,
  )
  const centerTangent = normalize(
    subtract(points[splitIndex - 1], points[splitIndex + 1]),
  )
  const safeCenterTangent = length(centerTangent) > EPSILON
    ? centerTangent
    : normalize(subtract(points[splitIndex - 1], points[splitIndex]))
  const left = fitCubicRecursive(
    points.slice(0, splitIndex + 1),
    leftTangent,
    safeCenterTangent,
    errorSquared,
    depth + 1,
  )
  const right = fitCubicRecursive(
    points.slice(splitIndex),
    negate(safeCenterTangent),
    rightTangent,
    errorSquared,
    depth + 1,
  )

  return [...left, ...right]
}

function getOutgoingTangent(
  points: VectorPoint[],
  anchor: Anchor,
  segmentPoints: VectorPoint[],
) {
  if (anchor.isCorner || points.length < 3) {
    return normalize(subtract(segmentPoints[1], segmentPoints[0]))
  }

  const previous = points[(anchor.index - 1 + points.length) % points.length]
  const next = points[(anchor.index + 1) % points.length]
  const tangent = normalize(subtract(next, previous))

  return length(tangent) > EPSILON
    ? tangent
    : normalize(subtract(segmentPoints[1], segmentPoints[0]))
}

function getIncomingTangent(
  points: VectorPoint[],
  anchor: Anchor,
  segmentPoints: VectorPoint[],
) {
  if (anchor.isCorner || points.length < 3) {
    return normalize(
      subtract(
        segmentPoints[segmentPoints.length - 2],
        segmentPoints[segmentPoints.length - 1],
      ),
    )
  }

  const previous = points[(anchor.index - 1 + points.length) % points.length]
  const next = points[(anchor.index + 1) % points.length]
  const tangent = normalize(subtract(previous, next))

  return length(tangent) > EPSILON
    ? tangent
    : normalize(
      subtract(
        segmentPoints[segmentPoints.length - 2],
        segmentPoints[segmentPoints.length - 1],
      ),
    )
}

export function fitAdaptiveClosedPath(
  points: VectorPoint[],
  smooth: number,
): AdaptiveClosedPath | null {
  if (points.length < 3) return null

  const normalizedSmooth = clamp(smooth, 0, 100) / 100
  const diagonal = Math.max(1, getBoundsDiagonal(points))
  const cornerAnchors = findCornerAnchors(points, smooth)
  const anchors = addHelperAnchors(points, cornerAnchors)

  if (anchors.length < 2) return null

  const segments: AdaptivePathSegment[] = []
  const curveError =
    0.7 +
    normalizedSmooth * 1.8 +
    Math.min(0.65, diagonal * 0.0003 * normalizedSmooth)

  for (let index = 0; index < anchors.length; index += 1) {
    const startAnchor = anchors[index]
    const endAnchor = anchors[(index + 1) % anchors.length]
    const segmentPoints = extractRingSegment(
      points,
      startAnchor.index,
      endAnchor.index,
    )

    if (segmentPoints.length < 2) continue

    const start = segmentPoints[0]
    const end = segmentPoints[segmentPoints.length - 1]

    if (
      normalizedSmooth <= 0 ||
      shouldFitAsLine(segmentPoints, smooth, diagonal)
    ) {
      segments.push({
        type: 'line',
        start,
        end,
      })
      continue
    }

    const leftTangent = getOutgoingTangent(
      points,
      startAnchor,
      segmentPoints,
    )
    const rightTangent = getIncomingTangent(
      points,
      endAnchor,
      segmentPoints,
    )
    const fitted = fitCubicRecursive(
      segmentPoints,
      leftTangent,
      rightTangent,
      curveError * curveError,
    )

    segments.push(...fitted)
  }

  if (!segments.length) return null

  return {
    start: points[anchors[0].index],
    segments,
    cornerCount: cornerAnchors.length,
    lineCount: segments.filter((segment) => segment.type === 'line').length,
    curveCount: segments.filter((segment) => segment.type === 'curve').length,
  }
}
