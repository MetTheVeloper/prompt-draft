import { FFmpeg } from '@ffmpeg/ffmpeg'

import {
  createCanvasSliderRenderer,
  type CanvasSliderImageSource
} from '~/utils/canvasSliderRenderer'

export type ExportCanvasSliderMp4Progress = {
  phase: 'loading' | 'frames' | 'encoding' | 'done'
  progress: number
  message?: string
}

export type ExportCanvasSliderMp4Options = {
  sources: CanvasSliderImageSource[]
  width: number
  height: number
  fps: number
  durationMs: number
  interval: number
  transitionDuration: number
  edgeBlur: number
  repeat: number
  loop: boolean
  backgroundColor?: string

  crf?: number
  preset?: string
  frameQuality?: number

  audioFile?: File | null
  audioBitrate?: string

  onAfterDrawFrame?: (payload: {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    frameIndex: number
    timeMs: number
  }) => void | Promise<void>

  onProgress?: (progress: ExportCanvasSliderMp4Progress) => void
}

const FRAME_PREFIX = 'frame_'
const FRAME_EXTENSION = 'jpg'
const OUTPUT_FILE = 'output.mp4'

function padFrameIndex(index: number) {
  return String(index).padStart(6, '0')
}

function getFrameName(index: number) {
  return `${FRAME_PREFIX}${padFrameIndex(index)}.${FRAME_EXTENSION}`
}

function getFfmpegCoreBaseUrl() {
  return `${window.location.origin}/ffmpeg`
}

function getSafeFileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'audio'

  return extension.replace(/[^a-z0-9]/g, '') || 'audio'
}

function getAudioInputName(file: File) {
  return `audio.${getSafeFileExtension(file)}`
}

function getDurationSeconds(durationMs: number) {
  return Math.max(durationMs / 1000, 0.001).toFixed(3)
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    promise
      .then((result) => {
        window.clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create frame blob.'))
          return
        }

        resolve(blob)
      },
      type,
      quality
    )
  })
}

async function blobToUint8Array(blob: Blob) {
  return new Uint8Array(await blob.arrayBuffer())
}

async function waitForBrowserTick() {
  await new Promise((resolve) => window.setTimeout(resolve, 0))
}

async function loadFfmpeg(
  onProgress?: (progress: ExportCanvasSliderMp4Progress) => void
) {
  const ffmpeg = new FFmpeg()
  const baseURL = getFfmpegCoreBaseUrl()

  onProgress?.({
    phase: 'loading',
    progress: 0,
    message: 'Loading ffmpeg...'
  })

  ffmpeg.on('log', ({ message }) => {
    console.log('[ffmpeg]', message)
  })

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.({
      phase: 'encoding',
      progress: Math.max(0, Math.min(progress || 0, 1)),
      message: 'Encoding MP4...'
    })
  })

  await withTimeout(
    ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`
    }),
    30000,
    'FFmpeg load timed out. Check /ffmpeg/ffmpeg-core.js and /ffmpeg/ffmpeg-core.wasm.'
  )

  onProgress?.({
    phase: 'loading',
    progress: 1,
    message: 'ffmpeg loaded.'
  })

  return ffmpeg
}

async function encodeFramesToMp4(
  ffmpeg: FFmpeg,
  options: {
    fps: number
    durationMs: number
    crf: number
    preset: string
    audioInputName?: string
    audioBitrate: string
  }
) {
  const {
    fps,
    durationMs,
    crf,
    preset,
    audioInputName,
    audioBitrate
  } = options

  const inputArgs = [
    '-framerate',
    String(fps),
    '-i',
    `${FRAME_PREFIX}%06d.${FRAME_EXTENSION}`
  ]

  if (audioInputName) {
    inputArgs.push('-i', audioInputName)
  }

  const outputArgs = [
    '-t',
    getDurationSeconds(durationMs),
    '-map',
    '0:v:0'
  ]

  if (audioInputName) {
    outputArgs.push(
      '-map',
      '1:a:0',
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate
    )
  } else {
    outputArgs.push('-an')
  }

  outputArgs.push(
    '-c:v',
    'libx264',
    '-preset',
    preset,
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    OUTPUT_FILE
  )

  try {
    await ffmpeg.exec([
      ...inputArgs,
      ...outputArgs
    ])

    return
  } catch (error) {
    console.warn('[ffmpeg] libx264 failed, falling back to default mp4 encoder.', error)
  }

  await ffmpeg.exec([
    ...inputArgs,
    '-t',
    getDurationSeconds(durationMs),
    '-map',
    '0:v:0',
    ...(audioInputName
      ? ['-map', '1:a:0', '-c:a', 'aac', '-b:a', audioBitrate]
      : ['-an']),
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    OUTPUT_FILE
  ])
}

export async function exportCanvasSliderMp4(
  options: ExportCanvasSliderMp4Options
) {
  const {
    sources,
    width,
    height,
    fps,
    durationMs,
    interval,
    transitionDuration,
    edgeBlur,
    repeat,
    loop,
    backgroundColor,

    crf = 20,
    preset = 'veryfast',
    frameQuality = 0.92,

    audioFile = null,
    audioBitrate = '160k',

    onAfterDrawFrame,
    onProgress
  } = options

  if (!sources.length) {
    throw new Error('No image sources provided.')
  }

  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const safeFps = Math.max(1, Math.round(fps))
  const safeDurationMs = Math.max(1000, Math.round(durationMs))

  const frameCount = Math.max(
    1,
    Math.ceil((safeDurationMs / 1000) * safeFps)
  )

  const canvas = document.createElement('canvas')

  const renderer = createCanvasSliderRenderer({
    canvas,
    sources,
    width: safeWidth,
    height: safeHeight,
    dpr: 1,
    interval,
    transitionDuration,
    edgeBlur,
    random: false,
    initialIndex: 0,
    backgroundColor
  })

  const ffmpeg = await loadFfmpeg(onProgress)

  let audioInputName = ''

  if (audioFile) {
    audioInputName = getAudioInputName(audioFile)

    await ffmpeg.writeFile(
      audioInputName,
      await blobToUint8Array(audioFile)
    )
  }

  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const isLastFrame = frameIndex === frameCount - 1

      const timeMs = loop && isLastFrame
        ? safeDurationMs
        : (frameIndex / safeFps) * 1000

      renderer.drawFrameAt(timeMs, {
        repeat,
        loop,
        originX: safeWidth / 2,
        originY: safeHeight / 2
      })

      const ctx = canvas.getContext('2d')

      if (ctx && onAfterDrawFrame) {
        await onAfterDrawFrame({
          canvas,
          ctx,
          frameIndex,
          timeMs
        })
      }

      const frameBlob = await canvasToBlob(
        canvas,
        'image/jpeg',
        frameQuality
      )

      await ffmpeg.writeFile(
        getFrameName(frameIndex),
        await blobToUint8Array(frameBlob)
      )

      onProgress?.({
        phase: 'frames',
        progress: (frameIndex + 1) / frameCount,
        message: `Rendering frame ${frameIndex + 1} / ${frameCount}`
      })

      if (frameIndex % 5 === 0) {
        await waitForBrowserTick()
      }
    }

    onProgress?.({
      phase: 'encoding',
      progress: 0,
      message: 'Encoding MP4...'
    })

    await encodeFramesToMp4(ffmpeg, {
      fps: safeFps,
      durationMs: safeDurationMs,
      crf,
      preset,
      audioInputName,
      audioBitrate
    })

    const data = await ffmpeg.readFile(OUTPUT_FILE)

    const bytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(String(data))

    onProgress?.({
      phase: 'done',
      progress: 1,
      message: 'MP4 export finished.'
    })

    return new Blob([bytes], {
      type: 'video/mp4'
    })
  } finally {
    renderer.destroy()

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      try {
        await ffmpeg.deleteFile(getFrameName(frameIndex))
        if (audioInputName) {
          try {
            await ffmpeg.deleteFile(audioInputName)
          } catch {
            // ignore cleanup errors
          }
        }
      } catch {
        // ignore cleanup errors
      }
    }

    try {
      await ffmpeg.deleteFile(OUTPUT_FILE)
      if (audioInputName) {
        try {
          await ffmpeg.deleteFile(audioInputName)
        } catch {
          // ignore cleanup errors
        }
      }
    } catch {
      // ignore cleanup errors
    }

    ffmpeg.terminate()
  }
}