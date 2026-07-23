import type { LayoutRegion, LayoutRegionsValue } from "../modules/layout.types"
import { findAspectRatioOption } from "../constants/aspectRatios"
import { normalizeLayoutRegionsState } from "./layoutRegions"

type LayoutSchemaRatio = {
  width: number
  height: number
}

export type CreateLayoutSchemaOptions = {
  regions: LayoutRegionsValue | unknown
  aspectRatioValue?: string
  maxLongEdge?: number
}

const REGION_PALETTE = [
  { fill: "rgba(96, 165, 250, 0.20)", stroke: "#2563eb" },
  { fill: "rgba(192, 132, 252, 0.20)", stroke: "#7c3aed" },
  { fill: "rgba(250, 204, 21, 0.20)", stroke: "#ca8a04" },
  { fill: "rgba(74, 222, 128, 0.20)", stroke: "#16a34a" },
  { fill: "rgba(244, 114, 182, 0.20)", stroke: "#db2777" },
  { fill: "rgba(251, 146, 60, 0.20)", stroke: "#ea580c" },
  { fill: "rgba(45, 212, 191, 0.20)", stroke: "#0f766e" },
  { fill: "rgba(129, 140, 248, 0.20)", stroke: "#4f46e5" },
]

function parseRatio(value: string): LayoutSchemaRatio | null {
  const parts = value
    .split(":")
    .map((part) => Number(part.trim()))

  if (parts.length !== 2) return null

  const [width, height] = parts

  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null

  return { width, height }
}

function resolveAspectRatio(value = ""): LayoutSchemaRatio {
  const option = findAspectRatioOption(value)
  const parsedOption = option?.ratio ? parseRatio(option.ratio) : null
  const parsedValue = parseRatio(value)

  return parsedOption || parsedValue || { width: 1, height: 1 }
}

function getCanvasSize(ratio: LayoutSchemaRatio, maxLongEdge: number) {
  const safeLongEdge = Math.max(640, Math.min(2400, Math.round(maxLongEdge)))
  const normalizedRatio = ratio.width / ratio.height

  if (normalizedRatio >= 1) {
    return {
      width: safeLongEdge,
      height: Math.max(320, Math.round(safeLongEdge / normalizedRatio)),
    }
  }

  return {
    width: Math.max(320, Math.round(safeLongEdge * normalizedRatio)),
    height: safeLongEdge,
  }
}

function normalizeContentToken(value: unknown) {
  if (typeof value !== "string") return ""

  const clean = value.trim().replace(/^\{+/, "").replace(/\}+$/, "")

  return clean ? `{${clean}}` : ""
}

function getRegionLabel(region: LayoutRegion, index: number) {
  return (
    normalizeContentToken(region.contentKey) ||
    region.name.trim() ||
    `region_${index + 1}`
  )
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  label: string,
  maxWidth: number,
  maxHeight: number,
) {
  const initialSize = Math.max(
    14,
    Math.min(54, Math.round(Math.min(maxWidth, maxHeight) * 0.18)),
  )

  let fontSize = initialSize

  while (fontSize > 12) {
    context.font = `600 ${fontSize}px Arial, sans-serif`

    if (context.measureText(label).width <= maxWidth * 0.82) {
      break
    }

    fontSize -= 2
  }

  return fontSize
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error("Could not create the layout schema image."))
    }, "image/png")
  })
}

export async function createLayoutSchemaBlob(
  options: CreateLayoutSchemaOptions,
) {
  if (typeof document === "undefined") {
    throw new Error("Layout schema rendering is only available in the browser.")
  }

  const state = normalizeLayoutRegionsState(options.regions)

  if (!state.regions.length) {
    throw new Error("At least one layout region is required.")
  }

  const ratio = resolveAspectRatio(options.aspectRatioValue)
  const canvasSize = getCanvasSize(ratio, options.maxLongEdge || 1600)
  const canvas = document.createElement("canvas")

  canvas.width = canvasSize.width
  canvas.height = canvasSize.height

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Canvas rendering is not available.")
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)

  const orderedRegions = state.regions
    .map((region, index) => ({ region, index }))
    .sort((a, b) => {
      const aLayer = Number.isFinite(Number(a.region.layer))
        ? Number(a.region.layer)
        : a.index
      const bLayer = Number.isFinite(Number(b.region.layer))
        ? Number(b.region.layer)
        : b.index

      return aLayer - bLayer || a.index - b.index
    })

  for (const [paintIndex, item] of orderedRegions.entries()) {
    const { region, index } = item
    const palette = REGION_PALETTE[paintIndex % REGION_PALETTE.length]
    const x = Math.round(region.x * canvas.width)
    const y = Math.round(region.y * canvas.height)
    const width = Math.max(1, Math.round(region.width * canvas.width))
    const height = Math.max(1, Math.round(region.height * canvas.height))
    const inset = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.0025))
    const label = getRegionLabel(region, index)

    context.fillStyle = palette.fill
    context.fillRect(x, y, width, height)

    context.lineWidth = Math.max(
      3,
      Math.round(Math.min(canvas.width, canvas.height) * 0.004),
    )
    context.strokeStyle = palette.stroke
    context.strokeRect(
      x + inset,
      y + inset,
      Math.max(0, width - inset * 2),
      Math.max(0, height - inset * 2),
    )

    const fontSize = fitFontSize(context, label, width, height)

    context.save()
    context.font = `600 ${fontSize}px Arial, sans-serif`
    context.fillStyle = "rgba(17, 24, 39, 0.58)"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(
      label,
      x + width / 2,
      y + height / 2,
      Math.max(1, width * 0.84),
    )
    context.restore()
  }

  context.lineWidth = Math.max(
    4,
    Math.round(Math.min(canvas.width, canvas.height) * 0.005),
  )
  context.strokeStyle = "#111827"
  context.strokeRect(
    context.lineWidth / 2,
    context.lineWidth / 2,
    canvas.width - context.lineWidth,
    canvas.height - context.lineWidth,
  )

  return canvasToPngBlob(canvas)
}

export async function copyLayoutSchemaBlobToClipboard(blob: Blob) {
  if (typeof navigator === "undefined") {
    throw new Error("Clipboard access is not available.")
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard is not supported in this browser.")
  }

  const pngBlob =
    blob.type === "image/png"
      ? blob
      : new Blob([await blob.arrayBuffer()], { type: "image/png" })

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlob,
    }),
  ])
}

export function createLayoutSchemaFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  return `prompt-draft-layout-schema-${timestamp}.png`
}

export function downloadLayoutSchemaBlob(
  blob: Blob,
  filename = createLayoutSchemaFilename(),
) {
  if (typeof document === "undefined") return

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.style.display = "none"

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}
