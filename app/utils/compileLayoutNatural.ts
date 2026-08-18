export type CompileLayoutNaturalOptions = {
  referencedRegionKeys?: ReadonlySet<string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return ""

  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+/g, ",")
    .replace(/,+/g, ",")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*$/, "")
}

function formatPercentage(value: unknown) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "0%"

  const percentage = Number((number * 100).toFixed(2))

  return `${percentage}%`
}

function formatBounds(value: unknown) {
  if (!isRecord(value)) return ""

  return [
    `x: ${formatPercentage(value.x)}`,
    `y: ${formatPercentage(value.y)}`,
    `width: ${formatPercentage(value.width)}`,
    `height: ${formatPercentage(value.height)}`,
  ].join(", ")
}

function formatAlignment(value: unknown) {
  if (!isRecord(value)) return ""

  const horizontal = cleanText(value.horizontal)
  const vertical = cleanText(value.vertical)
  const parts = [
    horizontal ? `horizontal ${horizontal}` : "",
    vertical ? `vertical ${vertical}` : "",
  ].filter(Boolean)

  return parts.length ? `alignment: ${parts.join(", ")}` : ""
}

function formatRegion(
  value: unknown,
  index: number,
  referencedRegionKeys: ReadonlySet<string>,
) {
  if (!isRecord(value)) return ""

  const name = cleanText(value.name) || `region ${index + 1}`
  const key = cleanText(value.key)
  const role = cleanText(value.role)
  const contentKey = cleanText(value.contentKey)
  const bounds = formatBounds(value.bounds)
  const alignment = formatAlignment(value.alignment)
  const fit = cleanText(value.fit)
  const overflow = cleanText(value.overflow)
  const description = cleanText(value.description)
  const layer = Number.isFinite(Number(value.layer))
    ? Number(value.layer).toString()
    : index.toString()

  const details = [
    key && referencedRegionKeys.has(key) ? `key: ${key}` : "",
    role ? `role: ${role}` : "",
    contentKey ? `content: ${contentKey}` : "",
    bounds ? `bounds: ${bounds}` : "",
    alignment,
    fit ? `fit: ${fit}` : "",
    overflow ? `overflow: ${overflow}` : "",
    `layer: ${layer}`,
    description ? `description: ${description}` : "",
  ].filter(Boolean)

  return `• ${name} (${details.join("; ")}).`
}

export function compileLayoutNaturalBlock(
  output: Record<string, unknown>,
  options: CompileLayoutNaturalOptions = {},
) {
  const referencedRegionKeys = options.referencedRegionKeys || new Set<string>()
  const regions = Array.isArray(output.regions)
    ? output.regions
        .map((region, index) =>
          formatRegion(region, index, referencedRegionKeys),
        )
        .filter(Boolean)
    : []

  if (!regions.length) return ""

  const type = cleanText(output.type)
  const density = cleanText(output.density)
  const extraDetails = cleanText(output.extraDetails)

  let intro = "Use a structured layout."

  if (type && density) {
    intro = `Use a ${type} with ${density}.`
  } else if (type) {
    intro = `Use a ${type}.`
  } else if (density) {
    intro = `Use a structured layout with ${density}.`
  }

  const lines = [
    intro,
    "Interpret all region bounds as percentages from 0% to 100%.",
    "",
    "Regions:",
    ...regions,
  ]

  if (extraDetails) {
    lines.push("", `Additional layout instructions: ${extraDetails}.`)
  }

  return lines.join("\n")
}

export const compileLayoutNaturalSentence = compileLayoutNaturalBlock
