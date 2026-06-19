import type {
  Ref,
} from 'vue'

import {
  canvasToBlob,
  downloadBlob,
} from '~/utils/collage/file'

import {
  isNativePlatform,
  savePhotoBlobToGalleryNative,
  shareBlobNative,
} from '~/utils/collage/nativeShare'

type UseCollageExportOptions = {
  canvasRef: Ref<HTMLCanvasElement | null>
}

export function useCollageExport(options: UseCollageExportOptions) {
  async function getExportBlob(
    type = 'image/png',
    quality = 0.96
  ): Promise<Blob | null> {
    const canvas = options.canvasRef.value

    if (!canvas) return null

    return canvasToBlob(canvas, type, quality)
  }

  async function downloadCanvas() {
    const blob = await getExportBlob('image/png')

    if (!blob) return

    if (isNativePlatform()) {
      try {
        await savePhotoBlobToGalleryNative(blob, {
          albumName: 'Prompt Draft',
          fileName: `collage-${Date.now()}`,
        })

        alert('Collage saved to gallery.')
      } catch (error) {
        console.error('Native save failed:', error)

        try {
          await shareBlobNative(blob, {
            fileName: `collage-${Date.now()}.png`,
            title: 'Prompt Draft Collage',
            text: 'Created with Prompt Draft',
            dialogTitle: 'Share collage',
          })
        } catch (shareError) {
          console.error('Native share failed:', shareError)
          alert('Could not save or share collage.')
        }
      }

      return
    }

    downloadBlob(blob, `collage-${Date.now()}.png`)
  }

  async function copyCanvas() {
    const blob = await getExportBlob('image/png')

    if (!blob) return

    if (isNativePlatform()) {
      try {
        await shareBlobNative(blob, {
          fileName: `collage-${Date.now()}.png`,
          title: 'Prompt Draft Collage',
          text: 'Created with Prompt Draft',
          dialogTitle: 'Share collage',
        })
      } catch (error) {
        console.error('Native share failed:', error)
        alert('Could not share collage.')
      }

      return
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      alert('Clipboard image copy is not supported in this browser.')
      return
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
  }

  function downloadVideoBlob(blob: Blob) {
    downloadBlob(blob, `prompt-draft-video-${Date.now()}.webm`)
  }

  async function shareVideoBlobNative(blob: Blob) {
    await shareBlobNative(blob, {
      fileName: `prompt-draft-video-${Date.now()}.webm`,
      title: 'Prompt Draft Video',
      text: 'Created with Prompt Draft',
      dialogTitle: 'Share video',
    })
  }

  function downloadMp4Blob(blob: Blob) {
    downloadBlob(blob, `prompt-draft-video-${Date.now()}.mp4`)
  }

  async function shareMp4BlobNative(blob: Blob) {
    await shareBlobNative(blob, {
      fileName: `prompt-draft-video-${Date.now()}.mp4`,
      title: 'Prompt Draft Video',
      text: 'Created with Prompt Draft',
      dialogTitle: 'Share video',
    })
  }

  return {
    getExportBlob,
    downloadCanvas,
    copyCanvas,

    downloadVideoBlob,
    shareVideoBlobNative,

    downloadMp4Blob,
    shareMp4BlobNative,
  }
}