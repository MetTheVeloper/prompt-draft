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

  return parts.length ? `content alignment: ${parts.join(", ")}` : ""
}

function formatRegion(value: unknown, index: number) {
  if (!isRecord(value)) return ""

  // Keep the canonical structural token here. Prompt-facing compilation owns
  // the semantic alias ({topLeft}, etc.) so every cross-module reference is
  // rewritten from one identity registry instead of inventing a local alias.
  const sourceToken = cleanText(value.key) || `{layout_region_${index + 1}}`
  const role = cleanText(value.role)
  const contentKey = cleanText(value.contentKey)
  const bounds = formatBounds(value.bounds)
  const alignment = formatAlignment(value.alignment)
  const fit = cleanText(value.fit)
  const overflow = cleanText(value.overflow)
  const description = cleanText(value.description)
  const hasLayer =
    Object.prototype.hasOwnProperty.call(value, "layer") &&
    Number.isFinite(Number(value.layer))
  const layer = hasLayer ? Number(value.layer).toString() : ""

  const details = [
    role ? `role: ${role}` : "",
    contentKey ? `content: ${contentKey}` : "",
    bounds ? `bounds: ${bounds}` : "",
    alignment,
    fit ? `content fit: ${fit}` : "",
    overflow ? `content overflow: ${overflow}` : "",
    layer ? `layer: ${layer}` : "",
    description ? `instructions: ${description}` : "",
  ].filter(Boolean)

  return details.length
    ? `• ${sourceToken} (${details.join("; ")}).`
    : `• ${sourceToken}.`
}

function layoutIntro(output: Record<string, unknown>) {
  const type = cleanText(output.type)
  const density = cleanText(output.density)

  if (type && density) {
    return `Use a ${type} with ${density}.`
  }

  if (type) {
    return `Use a ${type}.`
  }

  if (density) {
    return `Use a structured layout with ${density}.`
  }

  return "Use a structured layout."
}

export function compileLayoutNaturalBlock(
  output: Record<string, unknown>,
  _options: CompileLayoutNaturalOptions = {},
) {
  const regions = Array.isArray(output.regions)
    ? output.regions
        .map((region, index) => formatRegion(region, index))
        .filter(Boolean)
    : []
  const type = cleanText(output.type)
  const density = cleanText(output.density)
  const extraDetails = cleanText(output.extraDetails)
  const hasExplicitLayoutSemantics = Boolean(type || density || extraDetails)

  if (!regions.length && !hasExplicitLayoutSemantics) return ""

  const lines = [layoutIntro(output)]

  if (regions.length) {
    lines.push(
      "Interpret all region bounds as percentages from 0% to 100%.",
      "",
      "Regions:",
      ...regions,
    )
  }

  if (extraDetails) {
    lines.push("", `Additional layout instructions: ${extraDetails}.`)
  }

  return lines.join("\n")
}

export const compileLayoutNaturalSentence = compileLayoutNaturalBlock
