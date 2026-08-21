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

function isVariableToken(value: string) {
  return /^\{[^{}]+\}$/.test(value.trim())
}

function displayContent(value: unknown) {
  const text = cleanText(value)
  if (!text) return ""
  return isVariableToken(text) ? text : JSON.stringify(text)
}

function naturalJoin(values: string[]) {
  const items = values.filter(Boolean)
  if (!items.length) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function formatPosition(value: unknown) {
  if (typeof value === "string") return cleanText(value)
  if (!isRecord(value)) return ""

  return (
    cleanText(value.region) ||
    cleanText(value.preset) ||
    cleanText(value.custom)
  )
}

function formatGroupLayout(value: unknown) {
  if (typeof value === "string") return cleanText(value)
  if (!isRecord(value)) return ""

  return [
    cleanText(value.direction),
    cleanText(value.writingDirection),
    cleanText(value.alignment),
    cleanText(value.distribution),
  ].filter(Boolean).join(", ")
}

function formatPurposeClause(purpose: string) {
  if (!purpose) return ""

  if (/^(poster header|poster footer|product information area|event information area|music cover information area|advertising copy area|credits area|main title|subtitle|slogan|artist name|brand name|product name|price|discount|date|time|location|call-to-action text)$/i.test(purpose)) {
    return `as the ${purpose}`
  }

  return `as a ${purpose}`
}

function formatArrangement(contents: string, layout: string) {
  if (!layout) return `arrange ${contents}`

  const parts = layout.split(",").map((part) => part.trim()).filter(Boolean)
  const first = parts.shift() || ""
  let sentence = `arrange ${contents}`

  if (/horizontal row/i.test(first)) {
    sentence += " horizontally"
  } else if (/vertical column/i.test(first)) {
    sentence += " vertically"
  } else if (first) {
    sentence += ` in ${first}`
  }

  parts.forEach((part) => {
    if (/spacing|placement/i.test(part) && !/^(with|using)\b/i.test(part)) {
      sentence += `, with ${part}`
      return
    }

    if (/writing direction/i.test(part) && !/^using\b/i.test(part)) {
      sentence += `, using ${part}`
      return
    }

    sentence += `, ${part}`
  })

  return sentence
}

function getLegacyTypography(value: Record<string, unknown>) {
  const typography = isRecord(value.typography) ? value.typography : {}

  return {
    style: cleanText(value.style) || cleanText(typography.fontStyle),
    size: cleanText(value.size) || cleanText(typography.fontSize),
    weight: cleanText(value.weight) || cleanText(typography.fontWeight),
  }
}

function textReference(
  value: Record<string, unknown>,
  options: TypographyNaturalOptions,
) {
  const content = displayContent(value.content)
  if (!content) return ""

  const key = cleanText(value.key)
  const shouldExposeKey = Boolean(key && options.referencedTextKeys?.has(key))
  return shouldExposeKey ? `${key} (${content})` : content
}

function formatTextInstruction(
  value: unknown,
  options: TypographyNaturalOptions,
) {
  if (!isRecord(value)) return ""

  const reference = textReference(value, options)
  if (!reference) return ""

  const purpose = cleanText(value.purpose)
  const description = cleanText(value.description)
  const { style, size, weight } = getLegacyTypography(value)
  const hasDetail = Boolean(purpose || description || style || size || weight)
  const key = cleanText(value.key)
  const exposesKey = Boolean(key && options.referencedTextKeys?.has(key))

  if (!hasDetail && !exposesKey) return ""

  const parts: string[] = []

  if (purpose) {
    parts.push(formatPurposeClause(purpose))
  }

  const visualParts = [size, style].filter(Boolean)
  if (visualParts.length) {
    parts.push(`using ${visualParts.join(" ")}`)
  }

  if (weight) {
    parts.push(`with ${weight} weight`)
  }

  if (description) {
    parts.push(description)
  }

  return `• Style ${reference}${parts.length ? ` ${parts.join(", ")}` : ""}.`
}

function formatGroup(
  value: unknown,
  options: TypographyNaturalOptions,
) {
  if (!isRecord(value)) return [] as string[]

  const key = cleanText(value.key)
  const purpose = cleanText(value.purpose)
  const position = formatPosition(value.position)
  const layout = formatGroupLayout(value.layout)
  const description = cleanText(value.description)
  const rawTexts = Array.isArray(value.texts) ? value.texts : []
  const textRecords = rawTexts.filter(isRecord)
  const contents = textRecords
    .map((item) => textReference(item, options))
    .filter(Boolean)

  if (!contents.length) return [] as string[]

  const shouldExposeKey = Boolean(key && options.referencedGroupKeys?.has(key))
  const prefix = shouldExposeKey ? `${key}: ` : ""
  const positionPrefix = position
    ? isVariableToken(position)
      ? `In ${position}, `
      : `At ${position}, `
    : ""
  const purposeClause = formatPurposeClause(purpose)

  let summary = `• ${prefix}${positionPrefix}${formatArrangement(
    naturalJoin(contents),
    layout,
  )}`

  if (purposeClause) {
    summary += `, ${purposeClause}`
  }

  summary += "."

  if (description) {
    summary += ` ${description}.`
  }

  const textInstructions = textRecords
    .map((item) => formatTextInstruction(item, options))
    .filter(Boolean)

  return [summary, ...textInstructions]
}

function formatAccuracy(output: Record<string, unknown>) {
  const directAccuracy = cleanText(output.textAccuracy)
  const legacyRules = isRecord(output.renderRules) ? output.renderRules : {}
  const accuracy = directAccuracy || cleanText(legacyRules.accuracy)

  if (accuracy === "flexible") {
    return "Keep listed text content recognizable while allowing flexible lettering."
  }

  if (accuracy === "readable") {
    return "Render listed text values clearly and readably."
  }

  return "Render listed text values exactly as defined."
}

export function compileTypographyNaturalBlock(
  output: Record<string, unknown>,
  options: TypographyNaturalOptions = {},
) {
  const groups = Array.isArray(output.groups)
    ? output.groups.flatMap((group) => formatGroup(group, options))
    : []

  if (!groups.length) return ""

  const extraDetails = cleanText(output.extraDetails)
  const lines = ["Typography:", ...groups, "", formatAccuracy(output)]

  if (extraDetails) {
    lines.push("", `Additional typography instructions: ${extraDetails}.`)
  }

  return lines.join("\n")
}
