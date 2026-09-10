export type BlogMediaAsset = {
  id: string
  folder: string
  sourceName: string
  createdAt: string
  storageKey: string
  thumbnailStorageKey: string
  fullUrl: string
  thumbnailUrl: string
  width: number
  height: number
  thumbnailWidth: number
  thumbnailHeight: number
}

export type BlogMediaFolder = {
  name: string
  prefix: string
}

export type BlogMediaBrowseResponse = {
  ok: true
  prefix: string
  parentPrefix: string | null
  folders: BlogMediaFolder[]
  assets: BlogMediaAsset[]
  pageInfo: {
    hasMore: boolean
    nextCursor: string | null
  }
}

export type BlogMediaUploadInput = {
  sourceName?: string
  full: {
    base64: string
    width: number
    height: number
    sizeBytes: number
  }
  thumbnail: {
    base64: string
    width: number
    height: number
    sizeBytes: number
  }
}

export type BlogMediaUploadResponse = {
  ok: true
  asset: BlogMediaAsset
}
