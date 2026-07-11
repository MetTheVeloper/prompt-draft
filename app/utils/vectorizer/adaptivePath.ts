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
type AnchorKind = 'corner' | 'line' | 'helper'

type Anchor = {
  index: number
  kind: AnchorKind
}

type CornerCandidate = {
  index: number
  position: number
  turn: number
}

type LineRun = {
  startIndex: number
  endIndex: number
  length: number
}

type BezierError = {
  errorSquared: number
  splitIndex: number
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

function cross(first: VectorPoint, second: VectorPoint) {
  return first.x * second.y - first.y * second.x
}

function length(vector: VectorPoint) {
  return Math.hypot(vector.x, vector.y)
}

function distance(first: VectorPoint, second: VectorPoint) {
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function normalize(vector: VectorPoint): VectorPoint {
  const vectorLength = length(vector)

  if (vectorLength <= EPSILON) return { x: 0, y: 0 }

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

function vectorAngleDegrees(first: VectorPoint, second: VectorPoint) {
  const firstLength = length(first)
  const secondLength = length(second)

  if (firstLength <= EPSILON || secondLength <= EPSILON) return 0

  const cosine = clamp(
    dot(first, second) / (firstLength * secondLength),
    -1,
    1,
  )

  return Math.acos(cosine) * (180 / Math.PI)
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

  return { positions, perimeter }
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

/**
 * Corner placement is intentionally independent from smoothness. Smoothness
 * may reduce the number of curve commands, but it must never move a protected
 * break or change the primitive segmentation of the contour.
 */
function findCornerAnchors(points: VectorPoint[]): Anchor[] {
  if (points.length < 4) return []

  const diagonal = Math.max(1, getBoundsDiagonal(points))
  const longLookDistance = clamp(diagonal * 0.0052, 3.5, 13)
  const shortLookDistance = Math.max(1.5, longLookDistance * 0.42)
  const minimumCornerTurn = 38
  const minimumShortTurn = 24
  const minimumSeparation = Math.max(3, longLookDistance * 0.72)
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
      kind: 'corner' as const,
    }))
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

function extractRingIndexes(length: number, startIndex: number, endIndex: number) {
  const indexes = [startIndex]
  let index = startIndex
  let safety = 0

  while (index !== endIndex && safety <= length) {
    safety += 1
    index = (index + 1) % length
    indexes.push(index)
  }

  return indexes
}

function pointInfiniteLineDistance(
  point: VectorPoint,
  start: VectorPoint,
  end: VectorPoint,
) {
  const line = subtract(end, start)
  const lineLength = length(line)

  if (lineLength <= EPSILON) return distance(point, start)

  return Math.abs(cross(subtract(point, start), line)) / lineLength
}

function pointSegmentDistanceSquared(
  point: VectorPoint,
  start: VectorPoint,
  end: VectorPoint,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (Math.abs(dx) <= EPSILON && Math.abs(dy) <= EPSILON) {
    const px = point.x - start.x
    const py = point.y - start.y
    return px * px + py * py
  }

  const ratio = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) /
      (dx * dx + dy * dy),
    0,
    1,
  )
  const nearestX = start.x + ratio * dx
  const nearestY = start.y + ratio * dy
  const distanceX = point.x - nearestX
  const distanceY = point.y - nearestY

  return distanceX * distanceX + distanceY * distanceY
}

function getMaximumLineDeviation(points: VectorPoint[]) {
  if (points.length <= 2) return 0

  const start = points[0]
  const end = points[points.length - 1]
  let maximum = 0

  for (let index = 1; index < points.length - 1; index += 1) {
    maximum = Math.max(
      maximum,
      pointInfiniteLineDistance(points[index], start, end),
    )
  }

  return maximum
}

function getPolylineLength(points: VectorPoint[]) {
  let result = 0

  for (let index = 1; index < points.length; index += 1) {
    result += distance(points[index - 1], points[index])
  }

  return result
}

function simplifyOpenIndexed(
  points: VectorPoint[],
  indexes: number[],
  toleranceSquared: number,
): number[] {
  if (indexes.length <= 2) return indexes

  const firstIndex = indexes[0]
  const lastIndex = indexes[indexes.length - 1]
  const first = points[firstIndex]
  const last = points[lastIndex]
  let farthestPosition = -1
  let farthestDistance = 0

  for (let position = 1; position < indexes.length - 1; position += 1) {
    const currentDistance = pointSegmentDistanceSquared(
      points[indexes[position]],
      first,
      last,
    )

    if (currentDistance > farthestDistance) {
      farthestDistance = currentDistance
      farthestPosition = position
    }
  }

  if (farthestPosition >= 0 && farthestDistance > toleranceSquared) {
    const left = simplifyOpenIndexed(
      points,
      indexes.slice(0, farthestPosition + 1),
      toleranceSquared,
    )
    const right = simplifyOpenIndexed(
      points,
      indexes.slice(farthestPosition),
      toleranceSquared,
    )

    return [...left.slice(0, -1), ...right]
  }

  return [firstIndex, lastIndex]
}

function simplifyClosedRingIndexes(points: VectorPoint[], tolerance: number) {
  if (points.length <= 4 || tolerance <= 0) {
    return points.map((_, index) => index)
  }

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
    const currentDistance = dx * dx + dy * dy

    if (currentDistance > farthestDistance) {
      farthestDistance = currentDistance
      oppositeIndex = index
    }
  }

  if (oppositeIndex === firstIndex) {
    return points.map((_, index) => index)
  }

  const toleranceSquared = tolerance * tolerance
  const firstHalf = simplifyOpenIndexed(
    points,
    extractRingIndexes(points.length, firstIndex, oppositeIndex),
    toleranceSquared,
  )
  const secondHalf = simplifyOpenIndexed(
    points,
    extractRingIndexes(points.length, oppositeIndex, firstIndex),
    toleranceSquared,
  )

  return [
    ...firstHalf.slice(0, -1),
    ...secondHalf.slice(0, -1),
  ]
}

function simplifyOpenLine(points: VectorPoint[], tolerance: number) {
  if (points.length <= 2 || tolerance <= 0) return points

  const indexes = points.map((_, index) => index)
  const simplifiedIndexes = simplifyOpenIndexed(
    points,
    indexes,
    tolerance * tolerance,
  )

  return simplifiedIndexes.map((index) => points[index])
}

function getEndpointDirection(
  points: VectorPoint[],
  fromStart: boolean,
  targetDistance: number,
) {
  if (points.length < 2) return { x: 0, y: 0 }

  const anchor = fromStart ? points[0] : points[points.length - 1]
  let accumulated = 0

  if (fromStart) {
    for (let index = 1; index < points.length; index += 1) {
      accumulated += distance(points[index - 1], points[index])

      if (accumulated >= targetDistance || index === points.length - 1) {
        return normalize(subtract(points[index], anchor))
      }
    }
  } else {
    for (let index = points.length - 2; index >= 0; index -= 1) {
      accumulated += distance(points[index + 1], points[index])

      if (accumulated >= targetDistance || index === 0) {
        return normalize(subtract(anchor, points[index]))
      }
    }
  }

  return { x: 0, y: 0 }
}

function isStableLineSegment(
  points: VectorPoint[],
  diagonal: number,
  allowShort = false,
) {
  if (points.length < 2) return false

  const start = points[0]
  const end = points[points.length - 1]
  const chord = subtract(end, start)
  const chordLength = length(chord)
  const minimumLength = allowShort
    ? clamp(diagonal * 0.004, 5, 10)
    : clamp(diagonal * 0.015, 14, 28)

  if (chordLength < minimumLength) return false

  const lineTolerance = 0.86 + Math.min(0.24, diagonal * 0.00018)
  const maximumDeviation = getMaximumLineDeviation(points)

  if (maximumDeviation > lineTolerance) return false

  const polylineLength = getPolylineLength(points)

  // A raster diagonal can be about sqrt(2) longer than its chord. Values well
  // above this usually indicate a curved or reversing run rather than stairs.
  if (polylineLength > chordLength * 1.48 + 2) return false

  const tangentDistance = clamp(chordLength * 0.18, 3, 12)
  const startDirection = getEndpointDirection(points, true, tangentDistance)
  const endDirection = getEndpointDirection(points, false, tangentDistance)
  const maximumEndpointAngle = allowShort ? 7 : 3.6

  return (
    vectorAngleDegrees(startDirection, chord) <= maximumEndpointAngle &&
    vectorAngleDegrees(endDirection, chord) <= maximumEndpointAngle
  )
}

function canMergeLineRuns(
  points: VectorPoint[],
  first: LineRun,
  second: LineRun,
  diagonal: number,
) {
  if (first.endIndex !== second.startIndex) return false

  const firstDirection = subtract(
    points[first.endIndex],
    points[first.startIndex],
  )
  const secondDirection = subtract(
    points[second.endIndex],
    points[second.startIndex],
  )

  if (vectorAngleDegrees(firstDirection, secondDirection) > 3.2) return false

  const combined = extractRingSegment(
    points,
    first.startIndex,
    second.endIndex,
  )

  return isStableLineSegment(combined, diagonal)
}

/**
 * Detect maximal straight runs on the dense contour before any curve fitting.
 * Their boundaries become hard anchors, which prevents one cubic from trying
 * to represent both the end of an arc and the following straight edge.
 */
function findLineRuns(points: VectorPoint[], diagonal: number): LineRun[] {
  if (points.length < 4) return []

  const featureTolerance = 0.72 + Math.min(0.18, diagonal * 0.00012)
  const featureIndexes = simplifyClosedRingIndexes(points, featureTolerance)
  const candidates: LineRun[] = []

  for (let position = 0; position < featureIndexes.length; position += 1) {
    const startIndex = featureIndexes[position]
    const endIndex = featureIndexes[(position + 1) % featureIndexes.length]
    const support = extractRingSegment(points, startIndex, endIndex)

    if (!isStableLineSegment(support, diagonal)) continue

    candidates.push({
      startIndex,
      endIndex,
      length: distance(points[startIndex], points[endIndex]),
    })
  }

  if (!candidates.length) return []

  const merged: LineRun[] = []

  for (const candidate of candidates) {
    const previous = merged[merged.length - 1]

    if (previous && canMergeLineRuns(points, previous, candidate, diagonal)) {
      previous.endIndex = candidate.endIndex
      previous.length = distance(
        points[previous.startIndex],
        points[previous.endIndex],
      )
    } else {
      merged.push({ ...candidate })
    }
  }

  if (merged.length > 1) {
    const first = merged[0]
    const last = merged[merged.length - 1]

    if (canMergeLineRuns(points, last, first, diagonal)) {
      first.startIndex = last.startIndex
      first.length = distance(
        points[first.startIndex],
        points[first.endIndex],
      )
      merged.pop()
    }
  }

  return merged
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

function mergeAnchors(
  points: VectorPoint[],
  corners: Anchor[],
  lineRuns: LineRun[],
) {
  const byIndex = new Map<number, Anchor>()

  for (const corner of corners) byIndex.set(corner.index, corner)

  for (const run of lineRuns) {
    for (const index of [run.startIndex, run.endIndex]) {
      if (!byIndex.has(index)) {
        byIndex.set(index, { index, kind: 'line' })
      }
    }
  }

  if (!byIndex.size) {
    const helperIndexes = [
      findNearestIndex(points, (point) => point.x),
      findNearestIndex(points, (point) => point.y),
      findNearestIndex(points, (point) => -point.x),
      findNearestIndex(points, (point) => -point.y),
    ]

    for (const index of helperIndexes) {
      byIndex.set(index, { index, kind: 'helper' })
    }
  }

  if (byIndex.size === 1) {
    const only = [...byIndex.values()][0]
    byIndex.set((only.index + Math.floor(points.length / 2)) % points.length, {
      index: (only.index + Math.floor(points.length / 2)) % points.length,
      kind: 'helper',
    })
  }

  return [...byIndex.values()].sort((first, second) => {
    return first.index - second.index
  })
}

function isExactLineRun(startIndex: number, endIndex: number, runs: LineRun[]) {
  return runs.some((run) => {
    return run.startIndex === startIndex && run.endIndex === endIndex
  })
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
  const polylineLength = getPolylineLength(points)
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

function computeForwardBezierError(
  points: VectorPoint[],
  segment: AdaptiveCurveSegment,
  parameters: number[],
): BezierError {
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

function computeReverseBezierError(
  points: VectorPoint[],
  segment: AdaptiveCurveSegment,
): BezierError {
  let maximumErrorSquared = 0
  let splitIndex = Math.floor(points.length / 2)
  const sampleCount = clamp(Math.ceil(points.length * 0.65), 16, 48)

  for (let sampleIndex = 1; sampleIndex < sampleCount; sampleIndex += 1) {
    const point = evaluateCubic(segment, sampleIndex / sampleCount)
    let nearestDistanceSquared = Number.POSITIVE_INFINITY
    let nearestSegmentIndex = 0

    for (let index = 0; index < points.length - 1; index += 1) {
      const currentDistanceSquared = pointSegmentDistanceSquared(
        point,
        points[index],
        points[index + 1],
      )

      if (currentDistanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = currentDistanceSquared
        nearestSegmentIndex = index
      }
    }

    if (nearestDistanceSquared > maximumErrorSquared) {
      maximumErrorSquared = nearestDistanceSquared
      splitIndex = clamp(nearestSegmentIndex + 1, 1, points.length - 2)
    }
  }

  return {
    errorSquared: maximumErrorSquared,
    splitIndex,
  }
}

function createLinearCurve(
  start: VectorPoint,
  end: VectorPoint,
): AdaptiveCurveSegment {
  const chord = subtract(end, start)

  return {
    type: 'curve',
    start,
    control1: add(start, multiply(chord, 1 / 3)),
    control2: add(start, multiply(chord, 2 / 3)),
    end,
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
  const forwardError = computeForwardBezierError(
    points,
    segment,
    parameters,
  )
  const reverseError = computeReverseBezierError(points, segment)
  const reverseToleranceSquared = (
    Math.sqrt(errorSquared) * 1.65 + 0.65
  ) ** 2

  if (
    forwardError.errorSquared <= errorSquared &&
    reverseError.errorSquared <= reverseToleranceSquared
  ) {
    return [segment]
  }

  if (depth >= 18) {
    const safe: AdaptiveCurveSegment[] = []

    for (let index = 1; index < points.length; index += 1) {
      safe.push(createLinearCurve(points[index - 1], points[index]))
    }

    return safe
  }

  const forwardRatio = forwardError.errorSquared / Math.max(errorSquared, EPSILON)
  const reverseRatio = reverseError.errorSquared /
    Math.max(reverseToleranceSquared, EPSILON)
  const requestedSplit = reverseRatio > forwardRatio
    ? reverseError.splitIndex
    : forwardError.splitIndex
  const splitIndex = clamp(requestedSplit, 1, points.length - 2)
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
  if (anchor.kind !== 'helper' || points.length < 3) {
    return getEndpointDirection(
      segmentPoints,
      true,
      clamp(getPolylineLength(segmentPoints) * 0.08, 2, 8),
    )
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
  if (anchor.kind !== 'helper' || points.length < 3) {
    return negate(getEndpointDirection(
      segmentPoints,
      false,
      clamp(getPolylineLength(segmentPoints) * 0.08, 2, 8),
    ))
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

function shouldFlattenCurveToLine(
  segment: AdaptiveCurveSegment,
  diagonal: number,
) {
  const chord = subtract(segment.end, segment.start)
  const chordLength = length(chord)

  if (chordLength < 8) return false

  const lineTolerance = 0.72 + Math.min(0.18, diagonal * 0.00012)
  const startTangent = subtract(segment.control1, segment.start)
  const endTangent = subtract(segment.end, segment.control2)

  if (
    vectorAngleDegrees(startTangent, chord) > 5 ||
    vectorAngleDegrees(endTangent, chord) > 5
  ) {
    return false
  }

  if (
    pointInfiniteLineDistance(
      segment.control1,
      segment.start,
      segment.end,
    ) > lineTolerance * 2.2 ||
    pointInfiniteLineDistance(
      segment.control2,
      segment.start,
      segment.end,
    ) > lineTolerance * 2.2
  ) {
    return false
  }

  for (let index = 1; index < 12; index += 1) {
    if (
      pointInfiniteLineDistance(
        evaluateCubic(segment, index / 12),
        segment.start,
        segment.end,
      ) > lineTolerance
    ) {
      return false
    }
  }

  return true
}

function auditFittedSegments(
  segments: AdaptiveCurveSegment[],
  diagonal: number,
): AdaptivePathSegment[] {
  return segments.map((segment) => {
    if (!shouldFlattenCurveToLine(segment, diagonal)) return segment

    return {
      type: 'line',
      start: segment.start,
      end: segment.end,
    }
  })
}

export function fitAdaptiveClosedPath(
  points: VectorPoint[],
  smooth: number,
): AdaptiveClosedPath | null {
  if (points.length < 3) return null

  const normalizedSmooth = clamp(smooth, 0, 100) / 100
  const diagonal = Math.max(1, getBoundsDiagonal(points))
  const cornerAnchors = findCornerAnchors(points)
  const lineRuns = findLineRuns(points, diagonal)
  const anchors = mergeAnchors(points, cornerAnchors, lineRuns)

  if (anchors.length < 2) return null

  const segments: AdaptivePathSegment[] = []
  const curveError =
    0.7 +
    normalizedSmooth * 1.8 +
    Math.min(0.65, diagonal * 0.0003 * normalizedSmooth)
  const preparationTolerance = 1.02 + Math.min(0.28, diagonal * 0.00016)

  for (let index = 0; index < anchors.length; index += 1) {
    const startAnchor = anchors[index]
    const endAnchor = anchors[(index + 1) % anchors.length]
    const denseSegmentPoints = extractRingSegment(
      points,
      startAnchor.index,
      endAnchor.index,
    )

    if (denseSegmentPoints.length < 2) continue

    const start = denseSegmentPoints[0]
    const end = denseSegmentPoints[denseSegmentPoints.length - 1]
    const isDetectedLine = isExactLineRun(
      startAnchor.index,
      endAnchor.index,
      lineRuns,
    )

    if (
      isDetectedLine ||
      isStableLineSegment(denseSegmentPoints, diagonal, true)
    ) {
      segments.push({ type: 'line', start, end })
      continue
    }

    const segmentPoints = simplifyOpenLine(
      denseSegmentPoints,
      preparationTolerance,
    )

    if (segmentPoints.length < 2) continue

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

    segments.push(...auditFittedSegments(fitted, diagonal))
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
