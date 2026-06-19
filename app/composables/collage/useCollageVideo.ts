import type {
  Ref,
} from 'vue'

import {
  exportCanvasSliderMp4,
} from '~/utils/exportCanvasSliderMp4'

import type {
  CanvasSliderImageSource,
} from '~/utils/canvasSliderRenderer'

import type {
  CollageImageItem,
  VideoQualityPreset,
} from '~/types/collage'

import {
  isNativePlatform,
} from '~/utils/collage/nativeShare'

type UseCollageVideoOptions = {
  images: Ref<CollageImageItem[]>
  canvasRef: Ref<HTMLCanvasElement | null>
  backgroundColor: Ref<string>

  renderVideoPreview: () => Promise<void>
  waitFrame: () => Promise<void>

  createCompositeOverlayCanvas: (
    canvasWidth: number,
    canvasHeight: number
  ) => Promise<HTMLCanvasElement | null>

  drawOverlayCanvas: (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement
  ) => void

  downloadVideoBlob: (blob: Blob) => void
  shareVideoBlobNative: (blob: Blob) => Promise<void>

  downloadMp4Blob: (blob: Blob) => void
  shareMp4BlobNative: (blob: Blob) => Promise<void>
}

export function useCollageVideo(options: UseCollageVideoOptions) {
  const videoWidth = ref(1080)
  const videoHeight = ref(1920)
  const videoFps = ref(30)
  const videoInterval = ref(2500)
  const videoTransitionDuration = ref(1200)
  const videoEdgeBlur = ref(160)
  const videoRandom = ref(true)
  const videoPreset = ref('1080x1920')
  const videoLoop = ref(false)
  const videoRepeat = ref(1)

  const isRecordingVideo = ref(false)

  const isExportingMp4 = ref(false)
  const mp4ExportProgress = ref(0)
  const mp4ExportStatus = ref('')

  const videoAudioFile = ref<File | null>(null)
  const videoQualityPreset = ref<VideoQualityPreset>('balanced')

  const videoAudioLabel = computed(() => {
    return videoAudioFile.value?.name || 'No audio selected'
  })

  const videoImageCount = computed(() => {
    return options.images.value.length
  })

  const normalizedVideoRepeat = computed(() => {
    return Math.max(1, Math.round(videoRepeat.value || 1))
  })

  const videoTotalSlideCount = computed(() => {
    return videoImageCount.value * normalizedVideoRepeat.value
  })

  const videoTransitionCount = computed(() => {
    const totalSlides = videoTotalSlideCount.value

    if (totalSlides <= 1) return 0

    return videoLoop.value ? totalSlides : totalSlides - 1
  })

  const videoDurationMs = computed(() => {
    const imageCount = videoImageCount.value

    if (!imageCount) return 0

    const repeat = normalizedVideoRepeat.value
    const interval = Math.max(videoInterval.value, 0)
    const transition = Math.max(videoTransitionDuration.value, 0)

    if (imageCount === 1) {
      return repeat * Math.max(interval, 3000)
    }

    return (
      videoTotalSlideCount.value * interval +
      videoTransitionCount.value * transition
    )
  })

  const videoDurationLabel = computed(() => {
    const seconds = videoDurationMs.value / 1000

    if (!seconds) return '0s'

    if (seconds < 10) {
      return `${seconds.toFixed(1)}s`
    }

    return `${Math.round(seconds)}s`
  })

  const videoQualitySettings = computed(() => {
    if (videoQualityPreset.value === 'compact') {
      return {
        crf: 24,
        preset: 'veryfast',
        frameQuality: 0.86,
        audioBitrate: '128k',
      }
    }

    if (videoQualityPreset.value === 'high') {
      return {
        crf: 17,
        preset: 'fast',
        frameQuality: 0.96,
        audioBitrate: '192k',
      }
    }

    return {
      crf: 20,
      preset: 'veryfast',
      frameQuality: 0.92,
      audioBitrate: '160k',
    }
  })

  function handleVideoAudioInput(event: Event) {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]

    videoAudioFile.value = file || null
  }

  function clearVideoAudio() {
    videoAudioFile.value = null
  }

  function applyVideoPreset(value: string) {
    videoPreset.value = value

    const [width, height] = value.split('x').map(Number)

    if (!width || !height) return

    videoWidth.value = width
    videoHeight.value = height
  }

  function handleVideoPresetChange(event: Event) {
    const target = event.target as HTMLSelectElement | null
    if (!target) return

    applyVideoPreset(target.value)
  }

  function getVideoSources(): CanvasSliderImageSource[] {
    return options.images.value.map((item) => ({
      src: item.url,
      image: item.image,
    }))
  }

  function getSupportedVideoMimeType() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ]

    return types.find((type) => MediaRecorder.isTypeSupported(type)) || ''
  }

  function recordCanvasAsVideo(
    canvas: HTMLCanvasElement,
    durationMs: number,
    fps: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!canvas.captureStream) {
        reject(new Error('Canvas captureStream is not supported in this browser.'))
        return
      }

      if (!window.MediaRecorder) {
        reject(new Error('MediaRecorder is not supported in this browser.'))
        return
      }

      const stream = canvas.captureStream(fps)
      const mimeType = getSupportedVideoMimeType()

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop())
        reject(recorder.error || new Error('Video recording failed.'))
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())

        const blob = new Blob(chunks, {
          type: mimeType || 'video/webm',
        })

        resolve(blob)
      }

      recorder.start(250)

      window.setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop()
        }
      }, Math.max(durationMs, 1000))
    })
  }

  function clampProgress(value: number) {
    if (!Number.isFinite(value)) return 0

    return Math.min(100, Math.max(0, Math.round(value)))
  }

  function normalizeProgress(value: number) {
    if (!Number.isFinite(value)) return 0

    return Math.min(1, Math.max(0, value))
  }

  function setMp4Progress(value: number) {
    mp4ExportProgress.value = clampProgress(value)
  }

  async function exportSliderVideo() {
    if (!options.images.value.length) return

    const canvas = options.canvasRef.value
    if (!canvas) return

    try {
      isRecordingVideo.value = true

      await options.renderVideoPreview()
      await options.waitFrame()

      const blob = await recordCanvasAsVideo(
        canvas,
        videoDurationMs.value,
        videoFps.value
      )

      if (isNativePlatform()) {
        await options.shareVideoBlobNative(blob)
        return
      }

      options.downloadVideoBlob(blob)
    } catch (error) {
      console.error('Video export failed:', error)
      alert('Could not export video in this browser.')
    } finally {
      isRecordingVideo.value = false
    }
  }

  async function exportSliderMp4() {
    if (!options.images.value.length) return

    try {
      isExportingMp4.value = true
      mp4ExportProgress.value = 0
      mp4ExportStatus.value = 'Preparing MP4 export...'

      const overlayCanvas = await options.createCompositeOverlayCanvas(
        videoWidth.value,
        videoHeight.value
      )

      const quality = videoQualitySettings.value

      const blob = await exportCanvasSliderMp4({
        sources: getVideoSources(),
        width: videoWidth.value,
        height: videoHeight.value,
        fps: videoFps.value,
        durationMs: videoDurationMs.value,
        interval: videoInterval.value,
        transitionDuration: videoTransitionDuration.value,
        edgeBlur: videoEdgeBlur.value,
        repeat: normalizedVideoRepeat.value,
        loop: videoLoop.value,
        backgroundColor: options.backgroundColor.value,

        crf: quality.crf,
        preset: quality.preset,
        frameQuality: quality.frameQuality,

        audioFile: videoAudioFile.value,
        audioBitrate: quality.audioBitrate,

        onAfterDrawFrame: ({ canvas, ctx }) => {
          if (!overlayCanvas) return

          options.drawOverlayCanvas(
            ctx,
            canvas.width,
            canvas.height,
            overlayCanvas
          )
        },

        onProgress: ({ phase, progress, message }) => {
          const safeProgress = normalizeProgress(progress)

          if (phase === 'loading') {
            setMp4Progress(safeProgress * 5)
          }

          if (phase === 'frames') {
            setMp4Progress(5 + safeProgress * 70)
          }

          if (phase === 'encoding') {
            setMp4Progress(75 + safeProgress * 24)
          }

          if (phase === 'done') {
            setMp4Progress(100)
          }

          mp4ExportStatus.value = message || ''
        },
      })

      if (isNativePlatform()) {
        await options.shareMp4BlobNative(blob)
        return
      }

      options.downloadMp4Blob(blob)
    } catch (error) {
      console.error('MP4 export failed:', error)
      alert('Could not export MP4 video.')
    } finally {
      isExportingMp4.value = false
    }
  }

  return {
    videoWidth,
    videoHeight,
    videoFps,
    videoInterval,
    videoTransitionDuration,
    videoEdgeBlur,
    videoRandom,
    videoPreset,
    videoLoop,
    videoRepeat,

    isRecordingVideo,

    isExportingMp4,
    mp4ExportProgress,
    mp4ExportStatus,

    videoAudioFile,
    videoAudioLabel,
    videoQualityPreset,
    videoQualitySettings,

    videoImageCount,
    normalizedVideoRepeat,
    videoTotalSlideCount,
    videoTransitionCount,
    videoDurationMs,
    videoDurationLabel,

    handleVideoAudioInput,
    clearVideoAudio,
    applyVideoPreset,
    handleVideoPresetChange,

    getVideoSources,

    exportSliderVideo,
    exportSliderMp4,
  }
}