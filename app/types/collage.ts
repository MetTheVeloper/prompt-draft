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

interface TreemapRect {
  x: number
  y: number
  width: number
  height: number
}

interface TreemapCandidate {
  cells: CollageLayoutResult['cells']
  score: number
}