import type {
  LayoutEditorGrid,
  LayoutFit,
  LayoutHorizontalAlign,
  LayoutOverflow,
  LayoutRegion,
  LayoutRegionRole,
  LayoutRegionsState,
  LayoutRegionsValue,
  LayoutVerticalAlign,
} from "../modules/layout.types"

export const DEFAULT_LAYOUT_GRID_SIZE = 12
export const MIN_LAYOUT_GRID_SIZE = 2
export const MAX_LAYOUT_GRID_SIZE = 24

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function clampNumber(value: unknown, min: number, max: number) {
  const number = Number(value)

  if (!Number.isFinite(number)) return min

  return Math.min(max, Math.max(min, number))
}

export function clampUnit(value: unknown) {
  return clampNumber(value, 0, 1)
}

const LAYOUT_REGION_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"
const LAYOUT_REGION_ID_LENGTH = 3

function createRandomRegionIdSuffix() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = crypto.getRandomValues(
      new Uint8Array(LAYOUT_REGION_ID_LENGTH),
    )

    return Array.from(bytes, (byte) => {
      return LAYOUT_REGION_ID_ALPHABET[
        byte % LAYOUT_REGION_ID_ALPHABET.length
      ]
    }).join("")
  }

  return Array.from({ length: LAYOUT_REGION_ID_LENGTH }, () => {
    const index = Math.floor(
      Math.random() * LAYOUT_REGION_ID_ALPHABET.length,
    )

    return LAYOUT_REGION_ID_ALPHABET[index]
  }).join("")
}

export function createLayoutRegionId() {
  return `region-${createRandomRegionIdSuffix()}`
}

export function normalizeLayoutGrid(value?: Partial<LayoutEditorGrid> | null): LayoutEditorGrid {
  return {
    columns: Math.round(
      clampNumber(
        value?.columns ?? DEFAULT_LAYOUT_GRID_SIZE,
        MIN_LAYOUT_GRID_SIZE,
        MAX_LAYOUT_GRID_SIZE,
      ),
    ),
    rows: Math.round(
      clampNumber(
        value?.rows ?? DEFAULT_LAYOUT_GRID_SIZE,
        MIN_LAYOUT_GRID_SIZE,
        MAX_LAYOUT_GRID_SIZE,
      ),
    ),
  }
}

function normalizeRegionRole(value: unknown): LayoutRegionRole {
  const roles: LayoutRegionRole[] = [
    "none",
    "background",
    "hero_image",
    "supporting_image",
    "text",
    "logo",
    "badge",
    "cta",
    "metadata",
    "decoration",
    "empty_space",
    "custom",
  ]

  return roles.includes(value as LayoutRegionRole)
    ? (value as LayoutRegionRole)
    : "none"
}

function normalizeHorizontalAlign(value: unknown): LayoutHorizontalAlign {
  const values: LayoutHorizontalAlign[] = ["none", "start", "center", "end", "stretch"]

  return values.includes(value as LayoutHorizontalAlign)
    ? (value as LayoutHorizontalAlign)
    : "none"
}

function normalizeVerticalAlign(value: unknown): LayoutVerticalAlign {
  const values: LayoutVerticalAlign[] = ["none", "start", "center", "end", "stretch"]

  return values.includes(value as LayoutVerticalAlign)
    ? (value as LayoutVerticalAlign)
    : "none"
}

function normalizeFit(value: unknown): LayoutFit {
  const values: LayoutFit[] = ["none", "cover", "contain", "fill", "natural"]

  return values.includes(value as LayoutFit)
    ? (value as LayoutFit)
    : "none"
}

function normalizeOverflow(value: unknown): LayoutOverflow {
  const values: LayoutOverflow[] = ["none", "visible", "hidden"]

  return values.includes(value as LayoutOverflow)
    ? (value as LayoutOverflow)
    : "none"
}

export function normalizeLayoutRegion(
  value: unknown,
  index = 0,
): LayoutRegion {
  const source = isRecord(value) ? value : {}
  const x = clampUnit(source.x)
  const y = clampUnit(source.y)
  const width = clampUnit(source.width ?? 0.5)
  const height = clampUnit(source.height ?? 0.5)

  return {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : createLayoutRegionId(),
    name: typeof source.name === "string" ? source.name : "",
    role: normalizeRegionRole(source.role),
    customRole:
      typeof source.customRole === "string" ? source.customRole : "",
    contentKey:
      typeof source.contentKey === "string" ? source.contentKey : "",
    x,
    y,
    width: Math.min(width, 1 - x),
    height: Math.min(height, 1 - y),
    horizontalAlign: normalizeHorizontalAlign(source.horizontalAlign),
    verticalAlign: normalizeVerticalAlign(source.verticalAlign),
    fit: normalizeFit(source.fit),
    overflow: normalizeOverflow(source.overflow),
    layer: Number.isFinite(Number(source.layer))
      ? Number(source.layer)
      : index,
    description:
      typeof source.description === "string" ? source.description : "",
  }
}

export function cloneLayoutRegion(region: LayoutRegion): LayoutRegion {
  return JSON.parse(JSON.stringify(region)) as LayoutRegion
}

export function cloneLayoutRegions(regions: LayoutRegion[]) {
  return regions.map(cloneLayoutRegion)
}

export function normalizeLayoutRegionsState(
  value?: LayoutRegionsValue | unknown,
): LayoutRegionsState {
  if (Array.isArray(value)) {
    return {
      grid: normalizeLayoutGrid(),
      regions: value.map((region, index) => normalizeLayoutRegion(region, index)),
    }
  }

  if (isRecord(value)) {
    const sourceRegions = Array.isArray(value.regions) ? value.regions : []
    const sourceGrid = isRecord(value.grid)
      ? (value.grid as Partial<LayoutEditorGrid>)
      : undefined

    return {
      grid: normalizeLayoutGrid(sourceGrid),
      regions: sourceRegions.map((region, index) =>
        normalizeLayoutRegion(region, index),
      ),
    }
  }

  return {
    grid: normalizeLayoutGrid(),
    regions: [],
  }
}

export function cloneLayoutRegionsState(
  value?: LayoutRegionsValue | unknown,
): LayoutRegionsState {
  const state = normalizeLayoutRegionsState(value)

  return {
    grid: { ...state.grid },
    regions: cloneLayoutRegions(state.regions),
  }
}

export function createLayoutRegion(
  index: number,
  patch: Partial<LayoutRegion> = {},
): LayoutRegion {
  return normalizeLayoutRegion(
    {
      id: createLayoutRegionId(),
      name: "",
      role: "none",
      customRole: "",
      contentKey: "",
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      horizontalAlign: "none",
      verticalAlign: "none",
      fit: "none",
      overflow: "none",
      layer: index,
      description: "",
      ...patch,
    },
    index,
  )
}
