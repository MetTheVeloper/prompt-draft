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

function serializeRegion(region: LayoutRegion, index: number) {
  const role = getRegionRole(region)
  const alignment = getRegionAlignment(region)
  const fit =
    region.fit && region.fit !== "none"
      ? region.fit
      : ""

  const overflow =
    region.overflow && region.overflow !== "none"
      ? region.overflow
      : ""

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
    layer: Number.isFinite(Number(region.layer))
      ? Number(region.layer)
      : index,
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

  const extraDetails = cleanText(values.extraDetails)

  return {
    type: getOptionPromptText(module, "layoutType", values.layoutType) || undefined,
    composition:
      getOptionPromptText(module, "composition", values.composition) || undefined,
    density: getOptionPromptText(module, "density", values.density) || undefined,
    hierarchy:
      getOptionPromptText(module, "hierarchy", values.hierarchy) || undefined,
    coordinateSystem: "normalized values from 0 to 1",
    regions: regionState.regions.map(serializeRegion),
    ...(extraDetails ? { extraDetails } : {}),
  }
}
