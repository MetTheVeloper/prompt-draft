import type { LayoutRegion } from "../modules/layout.types"
import type { ModuleValues, PromptKeyModule } from "../modules/types"
import { normalizeLayoutRegionsState } from "./layoutRegions"

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
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
  const option = field?.options?.find((item: { value: string; promptText?: string }) => item.value === value)

  return option?.promptText || humanize(value)
}

function serializeRegion(region: LayoutRegion, index: number) {
  const role =
    region.role === "custom"
      ? cleanText(region.customRole) || "custom region"
      : humanize(region.role)

  return {
    id: cleanText(region.id),
    name: cleanText(region.name) || `region_${index + 1}`,
    role,
    contentKey: cleanText(region.contentKey) || undefined,
    bounds: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
    alignment: {
      horizontal: region.horizontalAlign || undefined,
      vertical: region.verticalAlign || undefined,
    },
    fit: region.fit || undefined,
    overflow: region.overflow || undefined,
    layer: Number.isFinite(Number(region.layer))
      ? Number(region.layer)
      : index,
    description: cleanText(region.description) || undefined,
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
    extraDetails: extraDetails || undefined,
  }
}
