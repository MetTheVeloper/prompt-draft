export type LayoutRegionRole =
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

export type LayoutHorizontalAlign = "start" | "center" | "end" | "stretch"
export type LayoutVerticalAlign = "start" | "center" | "end" | "stretch"
export type LayoutFit = "cover" | "contain" | "fill" | "natural"
export type LayoutOverflow = "visible" | "hidden"

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
