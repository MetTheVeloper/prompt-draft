import type {
  CollageImageItem,
} from '~/types/collage'

export function loadCollageImageFile(file: File): Promise<CollageImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        image,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Cannot load image: ${file.name}`))
    }

    image.src = url
  })
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.96
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not convert canvas to blob'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not convert blob to data URL'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(reader.error)
    }

    reader.readAsDataURL(blob)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}