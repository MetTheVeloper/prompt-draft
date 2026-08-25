export type LayoutRegionRole =
  | "none"
  | "background"
  | "hero_image"
  | "supporting_image"
  | "text"
  | "logo"
  | "badge"
  | "cta"
  | "metadata"
  | "decoration"
  | "empty_space"
  | "custom"

export type LayoutHorizontalAlign = "none" | "start" | "center" | "end" | "stretch"
export type LayoutVerticalAlign = "none" | "start" | "center" | "end" | "stretch"
export type LayoutFit = "none" | "cover" | "contain" | "fill" | "natural"
export type LayoutOverflow = "none" | "visible" | "hidden"

/**
 * Stable identity for content bound to a Layout Region.
 *
 * `contentKey` remains the prompt-facing/backward-compatible representation,
 * while `contentRef` owns cross-module identity. Tokens and labels are cached
 * presentation metadata only and may be refreshed when the referenced entity
 * is renamed.
 */
export type LayoutRegionContentRef = {
  kind: "scene"
  entityId: string
  token?: string
  label?: string
}

export type LayoutRegion = {
  id: string
  name: string
  role: LayoutRegionRole
  customRole?: string
  contentKey?: string
  contentRef?: LayoutRegionContentRef

  x: number
  y: number
  width: number
  height: number

  horizontalAlign?: LayoutHorizontalAlign
  verticalAlign?: LayoutVerticalAlign
  fit?: LayoutFit
  overflow?: LayoutOverflow
  layer?: number

  description?: string
}

export type LayoutEditorGrid = {
  columns: number
  rows: number
}

export type LayoutRegionsState = {
  grid: LayoutEditorGrid
  regions: LayoutRegion[]
}

export type LayoutRegionsValue = LayoutRegionsState | LayoutRegion[]
