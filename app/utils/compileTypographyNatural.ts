type TypographyNaturalOptions = {
  referencedGroupKeys?: Set<string>
  referencedTextKeys?: Set<string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function quoteExactText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? JSON.stringify(value.trim())
    : ""
}

function formatPosition(value: unknown) {
  if (!isRecord(value)) return ""

  const region = cleanText(value.region)
  if (region) return `position: layout region ${region}`

  const preset = cleanText(value.preset)
  if (preset) return `position: ${preset}`

  const custom = cleanText(value.custom)
  if (custom) return `position: ${custom}`

  return ""
}

function formatGroupLayout(value: unknown) {
  if (!isRecord(value)) return ""

  const parts = [
    cleanText(value.direction),
    cleanText(value.writingDirection),
    cleanText(value.alignment),
    cleanText(value.distribution),
  ].filter(Boolean)

  return parts.length ? `layout: ${parts.join(", ")}` : ""
}

function formatTextTypography(value: unknown) {
  if (!isRecord(value)) return ""

  return [
    cleanText(value.fontStyle),
    cleanText(value.fontSize),
    cleanText(value.fontWeight),
  ].filter(Boolean).join(", ")
}

function formatTextBlock(
  value: unknown,
  options: TypographyNaturalOptions,
) {
  if (!isRecord(value)) return ""

  const content = quoteExactText(value.content)
  if (!content) return ""

  const key = cleanText(value.key)
  const purpose = cleanText(value.purpose)
  const typography = formatTextTypography(value.typography)
  const description = cleanText(value.description)
  const shouldExposeKey = Boolean(key && options.referencedTextKeys?.has(key))

  const details = [
    purpose ? `purpose: ${purpose}` : "",
    typography ? `typography: ${typography}` : "",
    description ? `description: ${description}` : "",
  ].filter(Boolean)

  const prefix = shouldExposeKey ? `${key}: ` : ""
  return `  ◦ ${prefix}${content}${details.length ? ` (${details.join("; ")})` : ""}.`
}

function formatGroup(
  value: unknown,
  index: number,
  options: TypographyNaturalOptions,
) {
  if (!isRecord(value)) return [] as string[]

  const key = cleanText(value.key)
  const purpose = cleanText(value.purpose)
  const position = formatPosition(value.position)
  const layout = formatGroupLayout(value.layout)
  const description = cleanText(value.description)
  const texts = Array.isArray(value.texts)
    ? value.texts.map((item) => formatTextBlock(item, options)).filter(Boolean)
    : []

  if (!texts.length) return [] as string[]

  const details = [
    purpose ? `purpose: ${purpose}` : "",
    position,
    layout,
    description ? `description: ${description}` : "",
  ].filter(Boolean)

  const shouldExposeKey = Boolean(key && options.referencedGroupKeys?.has(key))
  const keySuffix = shouldExposeKey ? ` ${key}` : ""
  const header = `• Group ${index + 1}${keySuffix}${details.length ? ` (${details.join("; ")})` : ""}:`

  return [header, ...texts]
}

function formatRenderRules(value: unknown) {
  if (!isRecord(value)) return ""

  const accuracy = cleanText(value.accuracy)
  const renderTextValuesOnly = value.renderTextValuesOnly === true
  const preserveSpelling = value.preserveSpelling === true
  const rules: string[] = []

  if (renderTextValuesOnly) {
    rules.push("render only the listed text values")
  }

  if (accuracy) {
    rules.push(`use ${accuracy} text accuracy`)
  }

  if (preserveSpelling) {
    rules.push("preserve spelling exactly")
  }

  if (!rules.length) return ""

  return `Typography render rules: ${rules.join("; ")}.`
}

export function compileTypographyNaturalBlock(
  output: Record<string, unknown>,
  options: TypographyNaturalOptions = {},
) {
  const groups = Array.isArray(output.groups)
    ? output.groups.flatMap((group, index) => formatGroup(group, index, options))
    : []

  if (!groups.length) return ""

  const extraDetails = cleanText(output.extraDetails)
  const renderRules = formatRenderRules(output.renderRules)
  const lines = ["Typography:", ...groups]

  if (renderRules) {
    lines.push("", renderRules)
  }

  if (extraDetails) {
    lines.push("", `Additional typography instructions: ${extraDetails}.`)
  }

  return lines.join("\n")
}
