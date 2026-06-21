// app/utils/optimizeNaturalPrompt.ts
export type NaturalOptimizeOptions = {
  mode?: string
  transformationStrength?: string
  referenceSubjectType?: string
}

type ApplyGroup =
  | 'transformation'
  | 'style'
  | 'framing'
  | 'pose'
  | 'outfit'
  | 'background'
  | 'lighting'
  | 'camera'
  | 'texture'
  | 'other'

const APPLY_GROUP_ORDER: ApplyGroup[] = [
  'transformation',
  'style',
  'framing',
  'pose',
  'outfit',
  'background',
  'lighting',
  'camera',
  'texture',
  'other'
]

const APPLY_GROUP_LIMITS: Record<ApplyGroup, number> = {
  transformation: 7,
  style: 5,
  framing: 5,
  pose: 4,
  outfit: 3,
  background: 5,
  lighting: 5,
  camera: 5,
  texture: 5,
  other: 8
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function removeTrailingPunctuation(value: string) {
  return cleanText(value).replace(/[.,;:!?]+$/, '')
}

function ensureSentence(value: string) {
  const cleaned = cleanText(value)

  if (!cleaned) return ''

  if (/[.!?]$/.test(cleaned)) {
    return cleaned
  }

  return `${cleaned}.`
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2)
}

function splitIntoSentences(value: string) {
  const result: string[] = []
  let buffer = ''

  for (const char of value) {
    buffer += char

    if (char === '.' || char === '!' || char === '?') {
      const sentence = cleanText(buffer)

      if (sentence) {
        result.push(sentence)
      }

      buffer = ''
    }
  }

  const lastSentence = cleanText(buffer)

  if (lastSentence) {
    result.push(lastSentence)
  }

  return result
}

function extractRulesSection(prompt: string) {
  const marker = 'Follow these rules:'
  const markerIndex = prompt.toLowerCase().indexOf(marker.toLowerCase())

  if (markerIndex === -1) {
    return {
      body: prompt,
      rules: ''
    }
  }

  return {
    body: prompt.slice(0, markerIndex).trim(),
    rules: prompt.slice(markerIndex + marker.length).trim()
  }
}

function compactIntroSentence(sentence: string) {
  let output = ensureSentence(sentence)

  output = output.replace(
    /^Transform the attached reference image featuring (the .+? in the attached reference image) based on this idea:/i,
    'Transform $1 based on this idea:'
  )

  output = output.replace(
    /^Transform the attached reference image featuring (.+?) based on this idea:/i,
    'Transform $1 based on this idea:'
  )

  const sameSubjectIdeaMatch = output.match(
    /^Transform (the .+? in the attached reference image) based on this idea:\s*((?:Turn|Transform|Convert|Change)\s+\1\s+.+)$/i
  )

  if (sameSubjectIdeaMatch?.[2]) {
    return ensureSentence(sameSubjectIdeaMatch[2])
  }

  return ensureSentence(output)
}

function isApplySentence(sentence: string) {
  return /^Apply\s+/i.test(sentence)
}

function isAspectSentence(sentence: string) {
  return /^Use\s+(an?\s+)?[\w:-]+\s+aspect ratio\.?$/i.test(sentence)
}

function parseApplyParts(sentence: string) {
  const body = removeTrailingPunctuation(
    sentence.replace(/^Apply\s+/i, '')
  ).replace(/,\s*and\s+/gi, ', ')

  return body
    .split(',')
    .map(removeTrailingPunctuation)
    .filter(Boolean)
}

function detectApplyGroup(value: string): ApplyGroup {
  const text = normalizeText(value)

  if (
    /bodybuilder|muscular|muscle|physique|biceps|triceps|abs|chest|shoulders|grotesque|exaggeration|exaggerated|comically|unrealistic|impossibly|absurd|deformation|distortion/.test(
      text
    )
  ) {
    return 'transformation'
  }

  if (
    /background|backdrop|environment|interior|exterior|scene|studio background|seamless|wall mirror|mirror|gym|machines|dumbbells|weight racks|location/.test(
      text
    )
  ) {
    return 'background'
  }

  if (
    /lighting|light|overhead|diffused|illumination|shadow|shadows|highlight|highlights|reflection|reflections|contrast|rim light|backlit|volumetric/.test(
      text
    )
  ) {
    return 'lighting'
  }

  if (
    /camera|lens|shot|focus|perspective|snapshot|selfie|smartphone|phone camera|catalog shot|depth of field|macro|wide angle/.test(
      text
    )
  ) {
    return 'camera'
  }

  if (
    /framing|composition|centered|isolated|spacing|visibility|foreground|midground|background layers|dominant|full product|clear full|symmetrical|negative space/.test(
      text
    )
  ) {
    return 'framing'
  }

  if (
    /pose|posture|standing|seated|placement|front facing|best selling angle|positioning|holding|flexed|structured|balanced positioning|readable form/.test(
      text
    )
  ) {
    return 'pose'
  }

  if (
    /outfit|wear|clothing|clothes|tank|sleeveless|shorts|dress|suit|costume|accessories/.test(
      text
    )
  ) {
    return 'outfit'
  }

  if (
    /texture|surface|material|materials|skin|sweat|sheen|finish|readability|clarity|detail|details|grain|glossy|matte|polished|rough|premium surface/.test(
      text
    )
  ) {
    return 'texture'
  }

  if (
    /style|aesthetic|rendering|realistic|photo|photoreal|photo real|cinematic|commercial|polished|high detail|premium|studio quality|clean/.test(
      text
    )
  ) {
    return 'style'
  }

  return 'other'
}

function removeContradictoryApplyParts(
  parts: string[],
  options: NaturalOptimizeOptions
) {
  const hasExtremeTransformation =
    options.transformationStrength === 'extreme' ||
    parts.some((part) =>
      /grotesque|comically|unrealistic|impossibly|absurd|extreme|exaggerated/i.test(
        part
      )
    )

  if (!hasExtremeTransformation) {
    return parts
  }

  return parts.filter((part) => {
    const text = normalizeText(part)

    if (text.includes('minimal exaggeration')) return false

    if (text.includes('subtle stylization')) return false

    return true
  })
}

function dedupeParts(parts: string[]) {
  const result: string[] = []
  const normalizedItems: string[] = []

  parts.forEach((part) => {
    const normalized = normalizeText(part)

    if (!normalized) return

    const existingIndex = normalizedItems.findIndex((item) => {
      return item === normalized || item.includes(normalized) || normalized.includes(item)
    })

    if (existingIndex === -1) {
      result.push(part)
      normalizedItems.push(normalized)
      return
    }

    if (normalized.length > normalizedItems[existingIndex].length) {
      result[existingIndex] = part
      normalizedItems[existingIndex] = normalized
    }
  })

  return result
}

function compactApplySentence(
  sentence: string,
  options: NaturalOptimizeOptions
) {
  const rawParts = parseApplyParts(sentence)
  const safeParts = removeContradictoryApplyParts(rawParts, options)
  const dedupedParts = dedupeParts(safeParts)

  const grouped = new Map<ApplyGroup, string[]>()

  dedupedParts.forEach((part) => {
    const group = detectApplyGroup(part)
    const groupParts = grouped.get(group) || []

    groupParts.push(part)
    grouped.set(group, groupParts)
  })

  const compactedGroups = APPLY_GROUP_ORDER.map((group) => {
    const groupParts = grouped.get(group)

    if (!groupParts?.length) return ''

    return dedupeParts(groupParts).slice(0, APPLY_GROUP_LIMITS[group]).join(', ')
  }).filter(Boolean)

  if (!compactedGroups.length) return ''

  return ensureSentence(`Apply ${compactedGroups.join('; ')}`)
}

function calculateOverlapRatio(a: string, b: string) {
  const aTokens = new Set(tokenize(a))
  const bTokens = new Set(tokenize(b))

  if (!aTokens.size || !bTokens.size) return 0

  let overlap = 0

  aTokens.forEach((token) => {
    if (bTokens.has(token)) {
      overlap += 1
    }
  })

  return overlap / aTokens.size
}

function splitRules(rules: string) {
  return rules
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|;\s*/g)
    .map(removeTrailingPunctuation)
    .filter(Boolean)
}

function compactRulesSection(rules: string, optimizedBody: string) {
  const ruleParts = dedupeParts(splitRules(rules))

  if (!ruleParts.length) return ''

  const bodyText = normalizeText(optimizedBody)

  const filteredRules = ruleParts.filter((rule) => {
    const normalizedRule = normalizeText(rule)

    if (!normalizedRule) return false

    const isHardRule =
      /avoid|do not|dont|must|keep|preserve|only|never|without|no extra|exact/i.test(
        rule
      )

    if (isHardRule) return true

    const overlapRatio = calculateOverlapRatio(normalizedRule, bodyText)

    return overlapRatio < 0.55
  })

  if (!filteredRules.length) return ''

  return ensureSentence(`Follow these rules: ${filteredRules.join('. ')}`)
}

export function optimizeNaturalPrompt(
  prompt: string,
  options: NaturalOptimizeOptions = {}
) {
  const cleanedPrompt = cleanText(prompt)

  if (!cleanedPrompt) return ''

  const { body, rules } = extractRulesSection(cleanedPrompt)
  const bodySentences = splitIntoSentences(body)

  const optimizedBodySentences: string[] = []

  bodySentences.forEach((sentence, index) => {
    const cleanedSentence = cleanText(sentence)

    if (!cleanedSentence) return

    if (index === 0 && /^(Transform|Create)\s+/i.test(cleanedSentence)) {
      optimizedBodySentences.push(compactIntroSentence(cleanedSentence))
      return
    }

    if (isApplySentence(cleanedSentence)) {
      const compactedApply = compactApplySentence(cleanedSentence, options)

      if (compactedApply) {
        optimizedBodySentences.push(compactedApply)
      }

      return
    }

    optimizedBodySentences.push(ensureSentence(cleanedSentence))
  })

  const bodyOutput = dedupeParts(optimizedBodySentences)
    .map(ensureSentence)
    .join(' ')

  const rulesOutput = compactRulesSection(rules, bodyOutput)

  return [bodyOutput, rulesOutput]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
}