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

function formatCoordinate(value: unknown) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "0"

  return Number(number.toFixed(4)).toString()
}

function formatBounds(value: unknown) {
  if (!isRecord(value)) return ""

  return [
    `x ${formatCoordinate(value.x)}`,
    `y ${formatCoordinate(value.y)}`,
    `width ${formatCoordinate(value.width)}`,
    `height ${formatCoordinate(value.height)}`,
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

  return parts.length ? `alignment ${parts.join(", ")}` : ""
}

function formatRegion(value: unknown, index: number) {
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
    key ? `key ${key}` : "",
    role ? `role ${role}` : "",
    contentKey ? `content ${contentKey}` : "",
    bounds ? `bounds ${bounds}` : "",
    alignment,
    fit ? `fit ${fit}` : "",
    overflow ? `overflow ${overflow}` : "",
    `layer ${layer}`,
    description ? `description ${description}` : "",
  ].filter(Boolean)

  return `${name} (${details.join(", ")})`
}

export function compileLayoutNaturalSentence(
  output: Record<string, unknown>,
) {
  const regions = Array.isArray(output.regions)
    ? output.regions.map(formatRegion).filter(Boolean)
    : []

  if (!regions.length) return ""

  const type = cleanText(output.type)
  const density = cleanText(output.density)
  const extraDetails = cleanText(output.extraDetails)

  const qualifiers = [
    type ? `artifact type ${type}` : "",
    density ? `density ${density}` : "",
  ].filter(Boolean)

  const prefix = qualifiers.length
    ? `Use a structured layout with ${qualifiers.join(" and ")}`
    : "Use a structured layout"

  const extra = extraDetails
    ? ` Additional layout instructions: ${extraDetails}.`
    : ""

  return `${prefix}. Interpret all region bounds as normalized coordinates from 0 to 1. Regions: ${regions.join("; ")}.${extra}`
}
