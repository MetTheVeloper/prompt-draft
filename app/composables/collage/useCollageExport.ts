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
  const { t } = useI18n()

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

        alert(t('pages.collage.share.savedToGallery'))
      } catch (error) {
        console.error('Native save failed:', error)

        try {
          await shareBlobNative(blob, {
            fileName: `collage-${Date.now()}.png`,
            title: t('pages.collage.share.collageTitle'),
            text: t('pages.collage.share.createdWith'),
            dialogTitle: t('pages.collage.share.collageDialogTitle'),
          })
        } catch (shareError) {
          console.error('Native share failed:', shareError)
          alert(t('pages.collage.share.saveOrShareFailed'))
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
          title: t('pages.collage.share.collageTitle'),
          text: t('pages.collage.share.createdWith'),
          dialogTitle: t('pages.collage.share.collageDialogTitle'),
        })
      } catch (error) {
        console.error('Native share failed:', error)
        alert(t('pages.collage.share.shareFailed'))
      }

      return
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      alert(t('pages.collage.share.clipboardUnsupported'))
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
      title: t('pages.collage.share.videoTitle'),
      text: t('pages.collage.share.createdWith'),
      dialogTitle: t('pages.collage.share.videoDialogTitle'),
    })
  }

  function downloadMp4Blob(blob: Blob) {
    downloadBlob(blob, `prompt-draft-video-${Date.now()}.mp4`)
  }

  async function shareMp4BlobNative(blob: Blob) {
    await shareBlobNative(blob, {
      fileName: `prompt-draft-video-${Date.now()}.mp4`,
      title: t('pages.collage.share.videoTitle'),
      text: t('pages.collage.share.createdWith'),
      dialogTitle: t('pages.collage.share.videoDialogTitle'),
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
