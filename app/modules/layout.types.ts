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

export type LayoutRegion = {
  id: string
  name: string
  role: LayoutRegionRole
  customRole?: string
  contentKey?: string

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
