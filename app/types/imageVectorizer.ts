export type ImageVectorizerMode = 'vectorize' | 'upscale'

export type ImageVectorizerSmoothMode = 'pre' | 'post' | 'both'

export type ImageVectorizerProgressStage =
  | 'preparing'
  | 'enhancing'
  | 'quantizing'
  | 'background'
  | 'regions'
  | 'refiningImage'
  | 'smoothingEdges'
  | 'tracing'
  | 'svg'
  | 'preview'
  | 'finalizing'

export type ImageVectorizerProgress = {
  percent: number
  stage: ImageVectorizerProgressStage
}

export type ImageVectorizerSettings = {
  mode: ImageVectorizerMode
  maxColors: number
  colorTolerance: number
  strictColorLimit: boolean
  removeBackground: boolean
  backgroundColor: string | null
  trimCanvas: boolean
  padding: number
  minRegionSize: number
  edgeCleanup: number
  removeEnclosedBackground: boolean
  refineSvg: boolean
  refineImage: boolean
  enhanceLowRes: boolean
  lowResScale: number
  lowResRecovery: number
  paletteOverrides: Record<string, string>
  smooth: number
  smoothMode: ImageVectorizerSmoothMode
  edgeSmooth: number
}

export type ImageVectorizerConfigPayload = {
  type: 'prompt-draft.image-vectorizer-config'
  version: 2
  mode: ImageVectorizerMode
  settings: Partial<Omit<ImageVectorizerSettings, 'mode'>>
}

export type ImageVectorizerPaletteColor = {
  hex: string
  sourceHex?: string
  r: number
  g: number
  b: number
  count: number
  percent: number
}

export type ImageVectorizerBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageVectorizerStats = {
  sourceWidth: number
  sourceHeight: number
  outputWidth: number
  outputHeight: number
  detectedColorCount: number
  outputColorCount: number
  regionCount: number
  removedRegionCount: number
  originalPointCount: number
  simplifiedPointCount: number
}

export type ImageVectorizerResult = {
  mode: ImageVectorizerMode
  svg: string | null
  palette: ImageVectorizerPaletteColor[]
  backgroundColor: string | null
  crop: ImageVectorizerBounds
  stats: ImageVectorizerStats
}

export type ImageVectorizerWorkerRequest = {
  type: 'process'
  id: number
  width: number
  height: number
  pixels: ArrayBuffer
  settings: ImageVectorizerSettings
}

export type ImageVectorizerWorkerSuccess = {
  type: 'success'
  id: number
  result: ImageVectorizerResult
  preview: {
    width: number
    height: number
    pixels: ArrayBuffer
  }
}

export type ImageVectorizerWorkerProgress = {
  type: 'progress'
  id: number
  progress: ImageVectorizerProgress
}

export type ImageVectorizerWorkerFailure = {
  type: 'error'
  id: number
  error: {
    code: string
    message: string
    detectedColorCount?: number
    maxColors?: number
  }
}

export type ImageVectorizerWorkerResponse =
  | ImageVectorizerWorkerProgress
  | ImageVectorizerWorkerSuccess
  | ImageVectorizerWorkerFailure

export type ImageVectorizerBackgroundPick = {
  color: string
  x: number
  y: number
}
