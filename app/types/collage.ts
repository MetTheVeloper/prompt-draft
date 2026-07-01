export type CollageWatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface CollageImageItem {
  id: string
  file: File
  name: string
  url: string
  width: number
  height: number
  image: HTMLImageElement
}

export type CollageImageFitMode = 'cover' | 'detail'

export type CollageImageTransform = {
  fit: CollageImageFitMode
  panX: number
  panY: number
}

export interface CollageLayoutCell {
  image: CollageImageItem
  x: number
  y: number
  width: number
  height: number
  fit?: CollageImageFitMode
}

export interface CollageLayoutResult {
  width: number
  height: number
  ratio: number
  columns: number
  rows: number
  cells: CollageLayoutCell[]
  score: number
}

export type CollageMode = 'image' | 'video'

export type CollageLayoutConstraintMode = 'controlled' | 'free'

export type CollageCanvasAspectRatioLock =
  | 'auto'
  | '1:1'
  | '16:9'
  | '9:16'
  | '2:1'
  | '3:2'
  | '3:1'
  | '3:7'

export type BrandOverlayTheme = 'black' | 'white'

export type VideoQualityPreset = 'compact' | 'balanced' | 'high'

export type VideoQualitySettings = {
  crf: number
  preset: string
  frameQuality: number
  audioBitrate: string
}

export type TextOverlayFontOption = {
  label: string
  family: string
  weight: number
}

export type TextOverlayFontGroup = {
  label: string
  options: TextOverlayFontOption[]
}

export type OverlayInternalAlign = 'left' | 'center' | 'right'

export type TreemapRect = {
  x: number
  y: number
  width: number
  height: number
}

export type TreemapCandidate = {
  cells: CollageLayoutResult['cells']
  score: number
}
