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

export interface CollageLayoutCell {
  image: CollageImageItem
  x: number
  y: number
  width: number
  height: number
  fit?: 'cover' | 'contain'
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