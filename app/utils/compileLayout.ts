import type { LayoutRegion } from "../modules/layout.types"
import type { ModuleValues, PromptKeyModule } from "../modules/types"
import { normalizeLayoutRegionsState } from "./layoutRegions"
import { getLayoutRegionVariableToken } from "./structuralVariables"

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function roundLayoutCoordinate(value: unknown) {
  const number = Number(value)

  if (!Number.isFinite(number)) return 0

  const rounded = Math.round((number + Number.EPSILON) * 100) / 100

  return Object.is(rounded, -0) ? 0 : rounded
}

function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
}

function getOptionPromptText(
  module: PromptKeyModule,
  fieldId: string,
  value: unknown,
) {
  if (typeof value !== "string" || !value.trim()) return ""

  const field = module.fields[fieldId]
  const option = field?.options?.find(
    (item: { value: string; promptText?: string }) => item.value === value,
  )

  return option?.promptText || humanize(value)
}

function getRegionRole(region: LayoutRegion) {
  if (region.role === "none") return ""

  if (region.role === "custom") {
    return cleanText(region.customRole)
  }

  return humanize(region.role)
}

function getRegionAlignment(region: LayoutRegion) {
  const horizontal =
    region.horizontalAlign && region.horizontalAlign !== "none"
      ? region.horizontalAlign
      : ""

  const vertical =
    region.verticalAlign && region.verticalAlign !== "none"
      ? region.verticalAlign
      : ""

  if (!horizontal && !vertical) return null

  return {
    ...(horizontal ? { horizontal } : {}),
    ...(vertical ? { vertical } : {}),
  }
}

function getRegionFit(region: LayoutRegion) {
  if (!region.fit || region.fit === "none") return ""

  const map: Record<Exclude<NonNullable<LayoutRegion["fit"]>, "none">, string> = {
    cover: "cover",
    contain: "contain",
    fill: "stretch",
    natural: "intrinsic",
  }

  return map[region.fit]
}

function getRegionOverflow(region: LayoutRegion) {
  if (!region.overflow || region.overflow === "none") return ""

  return region.overflow === "hidden" ? "clip" : "visible"
}

function regionsOverlap(a: LayoutRegion, b: LayoutRegion) {
  const aRight = a.x + a.width
  const aBottom = a.y + a.height
  const bRight = b.x + b.width
  const bBottom = b.y + b.height

  return (
    a.x < bRight &&
    aRight > b.x &&
    a.y < bBottom &&
    aBottom > b.y
  )
}

function getLayeredRegionIndexes(regions: LayoutRegion[]) {
  const indexes = new Set<number>()

  for (let aIndex = 0; aIndex < regions.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < regions.length; bIndex += 1) {
      const a = regions[aIndex]
      const b = regions[bIndex]

      if (!a || !b || !regionsOverlap(a, b)) continue

      const aLayer = Number.isFinite(Number(a.layer)) ? Number(a.layer) : aIndex
      const bLayer = Number.isFinite(Number(b.layer)) ? Number(b.layer) : bIndex

      if (aLayer === bLayer) continue

      indexes.add(aIndex)
      indexes.add(bIndex)
    }
  }

  return indexes
}

function serializeRegion(
  region: LayoutRegion,
  index: number,
  includeLayer: boolean,
) {
  const role = getRegionRole(region)
  const alignment = getRegionAlignment(region)
  const fit = getRegionFit(region)
  const overflow = getRegionOverflow(region)
  const contentKey = cleanText(region.contentKey)
  const description = cleanText(region.description)

  return {
    id: cleanText(region.id),
    key: getLayoutRegionVariableToken(region.id),
    name: cleanText(region.name) || `region_${index + 1}`,
    ...(role ? { role } : {}),
    ...(contentKey ? { contentKey } : {}),
    bounds: {
      x: roundLayoutCoordinate(region.x),
      y: roundLayoutCoordinate(region.y),
      width: roundLayoutCoordinate(region.width),
      height: roundLayoutCoordinate(region.height),
    },
    ...(alignment ? { alignment } : {}),
    ...(fit ? { fit } : {}),
    ...(overflow ? { overflow } : {}),
    ...(includeLayer
      ? {
          layer: Number.isFinite(Number(region.layer))
            ? Number(region.layer)
            : index,
        }
      : {}),
    ...(description ? { description } : {}),
  }
}

export function compileLayoutModule(
  module: PromptKeyModule,
  values: ModuleValues,
): string | Record<string, unknown> {
  const overrideValue = cleanText(values.customText)

  if (overrideValue) {
    return overrideValue
  }

  const regionState = normalizeLayoutRegionsState(values.regions)

  if (!regionState.regions.length) {
    return ""
  }

  const layoutType = getOptionPromptText(module, "layoutType", values.layoutType)
  const density = getOptionPromptText(module, "density", values.density)
  const extraDetails = cleanText(values.extraDetails)
  const layeredRegionIndexes = getLayeredRegionIndexes(regionState.regions)

  return {
    ...(layoutType ? { type: layoutType } : {}),
    ...(density ? { density } : {}),
    coordinateSystem: "normalized values from 0 to 1",
    regions: regionState.regions.map((region, index) =>
      serializeRegion(region, index, layeredRegionIndexes.has(index)),
    ),
    ...(extraDetails ? { extraDetails } : {}),
  }
}
