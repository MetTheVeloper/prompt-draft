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
  audioStartOffsetMs?: number
  musicVisualizationEnabled?: boolean
  musicVisualizationMaxHeightPercent?: number

  onAfterDrawFrame?: (payload: {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    frameIndex: number
    timeMs: number
  }) => void | Promise<void>

  onProgress?: (progress: ExportCanvasSliderMp4Progress) => void
}

type SoftWaveEdge = 'top' | 'bottom'

const FRAME_PREFIX = 'frame_'
const FRAME_EXTENSION = 'jpg'
const OUTPUT_FILE = 'output.mp4'
const AUDIO_FADE_DURATION_SECONDS = 0.3

const MUSIC_VISUALIZATION_FADE_DURATION_MS = 300

type AudioVisualizationSource = {
  durationMs: number
  sampleRate: number
  length: number
  channels: Float32Array[]
}

type SoftWaveLayerConfig = {
  opacity: number
  amplitudeMultiplier: number
  baseHeightRatio: number
  amplitudeRatio: number
  pointCount: number
  frequencyA: number
  frequencyB: number
  frequencyC: number
  speedA: number
  speedB: number
  speedC: number
  phaseA: number
  phaseB: number
  phaseC: number
}

const SOFT_WAVE_MIN_SPEED_MULTIPLIER = 0.65
const SOFT_WAVE_MAX_SPEED_MULTIPLIER = 1.8

const SOFT_WAVE_LAYERS: SoftWaveLayerConfig[] = [
  {
    opacity: 1,
    amplitudeMultiplier: 1,
    baseHeightRatio: 0.048,
    amplitudeRatio: 0.030,
    pointCount: 8,
    frequencyA: 1.15,
    frequencyB: 2.35,
    frequencyC: 0.72,
    speedA: 1.0,
    speedB: 1.5,
    speedC: 0.8,
    phaseA: 0.2,
    phaseB: 1.1,
    phaseC: 2.0
  },
  {
    opacity: 0.5,
    amplitudeMultiplier: 1.2,
    baseHeightRatio: 0.054,
    amplitudeRatio: 0.036,
    pointCount: 8,
    frequencyA: 1.45,
    frequencyB: 2.8,
    frequencyC: 0.95,
    speedA: 1.2,
    speedB: 1.8,
    speedC: 0.9,
    phaseA: 1.6,
    phaseB: 2.4,
    phaseC: 0.7
  },
  {
    opacity: 0.25,
    amplitudeMultiplier: 1.5,
    baseHeightRatio: 0.060,
    amplitudeRatio: 0.042,
    pointCount: 8,
    frequencyA: 1.8,
    frequencyB: 3.2,
    frequencyC: 1.15,
    speedA: 1.4,
    speedB: 2.1,
    speedC: 1.1,
    phaseA: 2.7,
    phaseB: 0.9,
    phaseC: 1.9
  }
]

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min

  return Math.min(max, Math.max(min, value))
}

function getSoftWaveSpeedMultiplier(loudness: number) {
  const safeLoudness = clampNumber(loudness, 0, 1)

  return (
    SOFT_WAVE_MIN_SPEED_MULTIPLIER +
    safeLoudness *
    (SOFT_WAVE_MAX_SPEED_MULTIPLIER - SOFT_WAVE_MIN_SPEED_MULTIPLIER)
  )
}

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

function getAudioFadeFilter(durationMs: number) {
  const durationSeconds = Math.max(durationMs / 1000, 0.001)
  const fadeDuration = Math.min(
    AUDIO_FADE_DURATION_SECONDS,
    durationSeconds / 2
  )

  const fadeOutStart = Math.max(0, durationSeconds - fadeDuration)

  return [
    `afade=t=in:st=0:d=${fadeDuration.toFixed(3)}`,
    `afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeDuration.toFixed(3)}`
  ].join(',')
}

function getAudioContextConstructor() {
  return (
    window.AudioContext ||
    (window as Window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext ||
    null
  )
}

async function createAudioVisualizationSource(
  file: File
): Promise<AudioVisualizationSource | null> {
  const AudioContextConstructor = getAudioContextConstructor()

  if (!AudioContextConstructor) {
    console.warn('[audio-visualization] AudioContext is not supported.')
    return null
  }

  const context = new AudioContextConstructor()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0))

    return {
      durationMs: audioBuffer.duration * 1000,
      sampleRate: audioBuffer.sampleRate,
      length: audioBuffer.length,
      channels: Array.from(
        { length: audioBuffer.numberOfChannels },
        (_, index) => audioBuffer.getChannelData(index)
      )
    }
  } catch (error) {
    console.warn('[audio-visualization] Could not decode audio file.', error)
    return null
  } finally {
    try {
      await context.close()
    } catch {
      // ignore close errors
    }
  }
}

function getWrappedTimeMs(timeMs: number, durationMs: number) {
  if (!durationMs) return 0

  const wrapped = timeMs % durationMs
  return wrapped >= 0 ? wrapped : wrapped + durationMs
}

function getAudioLoudnessAtTime(
  source: AudioVisualizationSource,
  timeMs: number
) {
  if (!source.length || !source.channels.length || !source.durationMs) {
    return 0
  }

  const wrappedTimeMs = getWrappedTimeMs(timeMs, source.durationMs)

  const centerSample = Math.max(
    0,
    Math.min(
      source.length - 1,
      Math.floor((wrappedTimeMs / 1000) * source.sampleRate)
    )
  )

  const windowSize = Math.max(512, Math.floor(source.sampleRate * 0.05))
  const halfWindow = Math.floor(windowSize / 2)

  const startSample = Math.max(0, centerSample - halfWindow)
  const endSample = Math.min(source.length - 1, centerSample + halfWindow)
  const step = Math.max(1, Math.floor(windowSize / 256))

  let sumSquares = 0
  let count = 0

  for (
    let sampleIndex = startSample;
    sampleIndex <= endSample;
    sampleIndex += step
  ) {
    let mixed = 0

    for (const channel of source.channels) {
      mixed += channel[sampleIndex] || 0
    }

    mixed /= source.channels.length || 1

    sumSquares += mixed * mixed
    count += 1
  }

  if (!count) return 0

  const rms = Math.sqrt(sumSquares / count)

  return Math.min(1, rms * 4.5)
}

function getVisualizationFadeGain(timeMs: number, durationMs: number) {
  const fadeDurationMs = Math.min(
    MUSIC_VISUALIZATION_FADE_DURATION_MS,
    durationMs / 2
  )

  if (fadeDurationMs <= 0) return 1

  const fadeInGain = Math.min(1, timeMs / fadeDurationMs)
  const fadeOutGain = Math.min(1, (durationMs - timeMs) / fadeDurationMs)

  return Math.max(0, Math.min(fadeInGain, fadeOutGain, 1))
}

function drawSoftWaveLayer(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  timeMs: number,
  loudness: number,
  layer: SoftWaveLayerConfig,
  maxHeightPercent: number,
  edge: SoftWaveEdge
) {
  const timeSeconds = timeMs / 1000
  const speedMultiplier = getSoftWaveSpeedMultiplier(loudness)

  const safeBaseMaxHeightPercent = clampNumber(maxHeightPercent, 0, 50)

  if (safeBaseMaxHeightPercent <= 0) return

  const layerMaxHeightPercent = Math.min(
    100,
    safeBaseMaxHeightPercent * layer.amplitudeMultiplier
  )

  const maxWaveHeight = canvasHeight * (layerMaxHeightPercent / 100)

  const baseHeight = Math.min(
    canvasHeight * layer.baseHeightRatio,
    maxWaveHeight * 0.85
  )

  const amplitude = Math.min(
    canvasHeight *
      layer.amplitudeRatio *
      layer.amplitudeMultiplier *
      (0.35 + loudness * 0.65),
    maxWaveHeight * 0.75
  )

  const isTop = edge === 'top'

  const baseY = isTop
    ? baseHeight + amplitude * 0.55
    : canvasHeight - baseHeight - amplitude * 0.55

  const minBottomY = canvasHeight - maxWaveHeight
  const maxTopY = maxWaveHeight

  const points: { x: number; y: number }[] = []

  for (let index = 0; index <= layer.pointCount; index++) {
    const t = index / layer.pointCount
    const x = canvasWidth * t

    const waveValue =
      Math.sin(
        t * Math.PI * 2 * layer.frequencyA +
          timeSeconds * layer.speedA * speedMultiplier +
          layer.phaseA
      ) *
        0.5 +
      Math.sin(
        t * Math.PI * 2 * layer.frequencyB -
          timeSeconds * layer.speedB * speedMultiplier +
          layer.phaseB
      ) *
        0.3 +
      Math.cos(
        t * Math.PI * 2 * layer.frequencyC +
          timeSeconds * layer.speedC * speedMultiplier +
          layer.phaseC
      ) *
        0.2

    const rawY = isTop
      ? baseY + waveValue * amplitude
      : baseY - waveValue * amplitude

    const y = isTop
      ? Math.min(maxTopY, Math.max(0, rawY))
      : Math.max(minBottomY, Math.min(canvasHeight, rawY))

    points.push({ x, y })
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  if (!firstPoint || !lastPoint) return

  ctx.beginPath()

  if (isTop) {
    ctx.moveTo(0, 0)
  } else {
    ctx.moveTo(0, canvasHeight)
  }

  ctx.lineTo(firstPoint.x, firstPoint.y)

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]

    if (!current || !next) continue

    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2

    ctx.quadraticCurveTo(current.x, current.y, midX, midY)
  }

  ctx.lineTo(lastPoint.x, lastPoint.y)

  if (isTop) {
    ctx.lineTo(canvasWidth, 0)
  } else {
    ctx.lineTo(canvasWidth, canvasHeight)
  }

  ctx.closePath()

  ctx.fillStyle = `rgba(0, 0, 0, ${layer.opacity})`
  ctx.fill()
}

function drawSoftWaveMusicVisualization(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  timeMs: number,
  loudness: number,
  maxHeightPercent: number
) {
  ctx.save()

  for (const layer of SOFT_WAVE_LAYERS) {
    drawSoftWaveLayer(
      ctx,
      canvasWidth,
      canvasHeight,
      timeMs,
      loudness,
      layer,
      maxHeightPercent,
      'bottom'
    )

    drawSoftWaveLayer(
      ctx,
      canvasWidth,
      canvasHeight,
      timeMs,
      loudness,
      layer,
      maxHeightPercent,
      'top'
    )
  }

  ctx.restore()
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
    audioStartOffsetMs: number
  }
) {
  const {
    fps,
    durationMs,
    crf,
    preset,
    audioInputName,
    audioBitrate,
    audioStartOffsetMs
  } = options

  const inputArgs = [
    '-framerate',
    String(fps),
    '-i',
    `${FRAME_PREFIX}%06d.${FRAME_EXTENSION}`
  ]

  if (audioInputName) {
    const safeAudioStartOffsetSeconds = Math.max(
      0,
      audioStartOffsetMs / 1000
    ).toFixed(3)

    inputArgs.push(
      '-stream_loop',
      '-1',
      '-ss',
      safeAudioStartOffsetSeconds,
      '-i',
      audioInputName
    )
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
      audioBitrate,
      '-af',
      getAudioFadeFilter(durationMs)
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
      ? [
        '-map',
        '1:a:0',
        '-c:a',
        'aac',
        '-b:a',
        audioBitrate,
        '-af',
        getAudioFadeFilter(durationMs)
      ]
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
    audioStartOffsetMs = 0,
    musicVisualizationEnabled = false,
    musicVisualizationMaxHeightPercent = 5,

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

  const audioVisualizationSource =
    audioFile && musicVisualizationEnabled
      ? await createAudioVisualizationSource(audioFile)
      : null

  let smoothedVisualizationLoudness = 0

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


      if (ctx && audioVisualizationSource && musicVisualizationEnabled) {
        const currentAudioTimeMs = audioStartOffsetMs + timeMs

        const rawLoudness = getAudioLoudnessAtTime(
          audioVisualizationSource,
          currentAudioTimeMs
        )

        const fadeGain = getVisualizationFadeGain(timeMs, safeDurationMs)
        const targetLoudness = rawLoudness * fadeGain

        smoothedVisualizationLoudness =
          smoothedVisualizationLoudness * 0.78 +
          targetLoudness * 0.22

        drawSoftWaveMusicVisualization(
          ctx,
          canvas.width,
          canvas.height,
          timeMs,
          smoothedVisualizationLoudness,
          musicVisualizationMaxHeightPercent
        )
      }

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
      audioBitrate,
      audioStartOffsetMs
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