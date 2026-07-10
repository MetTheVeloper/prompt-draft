export type ImageConverterFormat = 'jpg' | 'webp'

export type ImageConverterImageItem = {
  id: string
  file: File
  name: string
  size: number
  url: string
}

export type ImageConverterZipEntry = {
  name: string
  data: Blob | ArrayBuffer | Uint8Array
  lastModified?: number
}
