// app/utils/compilePrompt.ts
import type { ModuleSubjectType, PromptKeyModule } from '../modules/types'
import { optimizeNaturalPrompt } from './optimizeNaturalPrompt'
import { VARIABLES_MODULE_KEY, variableDefinitionsToRecord } from './promptVariables'
import { usePromptVariables } from '~/composables/prompt/usePromptVariables'
import { usePromptSubjectContext } from '~/composables/prompt/usePromptSubjectContext'
import {
  getAspectRatioRatio,
  getDefaultAspectRatioValue,
} from "../constants/aspectRatios";

export type ModuleOutputValue = string | Record<string, any>

export type ModuleOutputMap = Record<string, ModuleOutputValue>

export type PromptOutputFormat = 'modular' | 'natural' | 'json'

export type PromptMode = 'text_to_image' | 'image_to_image'

export type PromptSubjectType = ModuleSubjectType

export type ReferenceUsage = 'strict' | 'balanced' | 'loose'

export type TransformationStrength = 'subtle' | 'balanced' | 'strong' | 'extreme'

export type ImageToImageSettings = {
  referenceUsage: ReferenceUsage
  transformationStrength: TransformationStrength
  preserveMainSubject: boolean
  preserveIdentity: boolean
  preservePose: boolean
  preserveOutfit: boolean
  preserveComposition: boolean
  preserveColors: boolean
  preserveMaterials: boolean
  preserveLighting: boolean
}

export type PromptSettings = {
  mode: PromptMode
  idea: string
  subject: string
  subjectType: PromptSubjectType
  aspectRatio: string
  globalRules: string
  imageToImage: ImageToImageSettings
}

export function createDefaultPromptSettings(): PromptSettings {
  return {
    mode: 'image_to_image',
    idea: '',
    subject: '',
    subjectType: 'unspecified',
    aspectRatio: getDefaultAspectRatioValue(),
    globalRules: '',
    imageToImage: {
      referenceUsage: 'balanced',
      transformationStrength: 'balanced',
      preserveMainSubject: true,
      preserveIdentity: true,
      preservePose: false,
      preserveOutfit: false,
      preserveComposition: true,
      preserveColors: false,
      preserveMaterials: false,
      preserveLighting: false
    }
  }
}

function getOrderedModuleOutputs(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap
) {
  return modules
    .map((module) => {
      if (module.key === VARIABLES_MODULE_KEY) return null

      const output = outputs[module.key]

      if (
        output === undefined ||
        output === null ||
        (typeof output === "string" && !output.trim())
      ) {
        return null
      }

      return {
        key: module.key,
        output
      }
    })
    .filter(Boolean) as Array<{
      key: string
      output: string
    }>
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function cleanNaturalPart(value: string) {
  return cleanText(value).replace(/[.,;]+$/, '')
}

function naturalJoin(parts: string[]) {
  const cleanedParts = parts.map(cleanNaturalPart).filter(Boolean)

  if (cleanedParts.length === 0) return ''
  if (cleanedParts.length === 1) return cleanedParts[0]
  if (cleanedParts.length === 2) return `${cleanedParts[0]} and ${cleanedParts[1]}`

  const lastPart = cleanedParts[cleanedParts.length - 1]
  const firstParts = cleanedParts.slice(0, -1)

  return `${firstParts.join(', ')}, and ${lastPart}`
}

function addIndefiniteArticle(value: string) {
  const cleanedValue = cleanNaturalPart(value)

  if (!cleanedValue) return ''

  if (/^(a|an|the|this|that|these|those)\s/i.test(cleanedValue)) {
    return cleanedValue
  }

  const article = /^[aeiou]/i.test(cleanedValue) ? 'an' : 'a'

  return `${article} ${cleanedValue}`
}

function normalizeTransformationIdea(value: string) {
  const idea = cleanNaturalPart(value)

  if (!idea) return ''

  if (/^(transform|convert|turn|change)\s/i.test(idea)) {
    return idea
  }

  return idea
    .replace(/^(create|generate|make)\s+/i, '')
    .replace(/^(an?|the)\s+/i, (match) => match.toLowerCase())
}

function modeToPromptText(mode: PromptMode) {
  if (mode === 'image_to_image') {
    return 'image to image'
  }

  return 'text to image'
}

function subjectTypeToText(type: PromptSubjectType) {
  const map: Record<PromptSubjectType, string> = {
    unspecified: '',
    person: 'person',
    object: 'object',
    animal: 'animal',
    building: 'building or architectural subject',
    product: 'product',
    vehicle: 'vehicle',
    scene: 'scene or environment',
    typography: 'typography',
    abstract: 'abstract forms',
    custom: ''
  }

  return map[type]
}

function subjectTypeToReferenceText(type: PromptSubjectType) {
  const subjectTypeText = subjectTypeToText(type)

  return subjectTypeText
    ? `${subjectTypeText} in {reference}`
    : 'subject in {reference}'
}

function subjectTypeToNaturalReferenceText(type: PromptSubjectType) {
  const map: Record<PromptSubjectType, string> = {
    unspecified: 'the subject in the attached reference image',
    person: 'the person in the attached reference image',
    object: 'the object in the attached reference image',
    animal: 'the animal in the attached reference image',
    building: 'the building or architectural subject in the attached reference image',
    product: 'the product in the attached reference image',
    vehicle: 'the vehicle in the attached reference image',
    scene: 'the scene or environment in the attached reference image',
    typography: 'the typography in the attached reference image',
    abstract: 'the abstract forms in the attached reference image',
    custom: 'the subject in the attached reference image'
  }

  return map[type]
}

export function buildPromptSubject(settings: PromptSettings) {
  const subjectDetails = cleanText(settings.subject)
  const subjectType = settings.subjectType || 'unspecified'

  if (settings.mode === 'text_to_image') {
    return subjectDetails || subjectTypeToText(subjectType)
  }

  if (subjectType === 'custom') {
    return subjectDetails
      ? `${subjectDetails} in {reference}`
      : subjectTypeToReferenceText('custom')
  }

  const baseSubject = subjectTypeToReferenceText(subjectType)

  return [baseSubject, subjectDetails].filter(Boolean).join(', ')
}

function buildNaturalSubject(settings: PromptSettings) {
  const subjectDetails = cleanNaturalPart(settings.subject)
  const subjectType = settings.subjectType || 'unspecified'

  if (settings.mode === 'text_to_image') {
    return subjectDetails || subjectTypeToText(subjectType)
  }

  if (subjectType === 'custom' && subjectDetails) {
    return `${subjectDetails} in the attached reference image`
  }

  const baseSubject = subjectTypeToNaturalReferenceText(subjectType)

  return [baseSubject, subjectDetails].filter(Boolean).join(', ')
}

function referenceUsageToPromptText(usage: ReferenceUsage) {
  const map: Record<ReferenceUsage, string> = {
    strict: 'strictly follow the attached reference image',
    balanced: 'preserve the main reference while allowing controlled stylistic changes',
    loose: 'use the attached reference image as loose visual inspiration'
  }

  return map[usage]
}

function referenceUsageToNaturalSentence(usage: ReferenceUsage) {
  const map: Record<ReferenceUsage, string> = {
    strict: 'Strictly follow the attached reference image.',
    balanced: 'Preserve the main reference while allowing controlled stylistic changes.',
    loose: 'Use the attached reference image as loose visual inspiration.'
  }

  return map[usage]
}

function transformationStrengthToPromptText(strength: TransformationStrength) {
  const map: Record<TransformationStrength, string> = {
    subtle: 'subtle transformation',
    balanced: 'balanced transformation',
    strong: 'strong stylized transformation',
    extreme: 'extreme creative transformation'
  }

  return map[strength]
}

function getPreserveParts(settings: PromptSettings) {
  if (settings.mode !== 'image_to_image') return []

  const imageSettings = settings.imageToImage
  const parts: string[] = []

  if (imageSettings.preserveMainSubject) {
    parts.push('main subject')
  }

  if (
    settings.subjectType === 'person' &&
    imageSettings.preserveIdentity
  ) {
    parts.push("person's identity")
  }

  if (imageSettings.preservePose) {
    parts.push('pose')
  }

  if (
    settings.subjectType === 'person' &&
    imageSettings.preserveOutfit
  ) {
    parts.push('outfit and visible accessories')
  }

  if (imageSettings.preserveComposition) {
    parts.push('original composition')
  }

  if (imageSettings.preserveColors) {
    parts.push('main color impression')
  }

  if (imageSettings.preserveMaterials) {
    parts.push('materials and surface details')
  }

  if (imageSettings.preserveLighting) {
    parts.push('original lighting and mood')
  }

  return parts
}

function getNaturalPreserveParts(settings: PromptSettings) {
  return getPreserveParts(settings).map((part) => {
    if (part === "person's identity") return "the person's identity"
    if (part === 'materials and surface details') {
      return 'visible materials and surface details'
    }

    return `the ${part}`
  })
}

function getPreservePromptText(settings: PromptSettings) {
  return getPreserveParts(settings).join(', ')
}

function getModuleNaturalParts(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>
) {
  const parts = moduleOutputs
    .filter((item) => typeof item.output === "string")
    .flatMap((item) => {
      return item.output
        .split(",")
        .map(cleanNaturalPart)
        .filter(Boolean)
    })

  const seen = new Set<string>()

  return parts.filter((part) => {
    const normalized = part.toLowerCase()

    if (seen.has(normalized)) {
      return false
    }

    seen.add(normalized)
    return true
  })
}

function getVariablesOutput(outputs: ModuleOutputMap) {
  const output = outputs[VARIABLES_MODULE_KEY]
  return typeof output === 'string' ? output.trim() : ''
}

function createSystemVariable(
  key: string,
  value: ModuleOutputValue,
  options: { insertable?: boolean } = {}
) {
  const stringValue =
    typeof value === "string"
      ? cleanText(value)
      : JSON.stringify(value, null, 2)

  return {
    id: `system:${key}`,
    key,
    value: stringValue,
    description: "Generated from active prompt settings or active module output.",
    type: "system" as const,
    source: "system" as const,
    entityType: "setup" as const,
    enabled: Boolean(key.trim() && stringValue.trim()),
    insertable: options.insertable,
  }
}

function getSystemPromptVariables(
  settings: PromptSettings,
) {
  const variables = [
    createSystemVariable("mode", modeToPromptText(settings.mode), {
      insertable: false,
    }),
  ]

  const subject = buildPromptSubject(settings)

  if (settings.mode === "image_to_image") {
    variables.push(
      createSystemVariable("reference", "attached reference image", {
        insertable: true,
      })
    )
  }

  if (settings.idea.trim()) {
    variables.push(
      createSystemVariable("idea", settings.idea, {
        insertable: true,
      })
    )
  }

  if (subject) {
    variables.push(
      createSystemVariable("subject", subject, {
        insertable: true,
      })
    )
  }

  if (settings.mode === "image_to_image") {
    variables.push(
      createSystemVariable(
        "reference_usage",
        referenceUsageToPromptText(settings.imageToImage.referenceUsage),
        { insertable: false }
      )
    )

    const preserveText = getPreservePromptText(settings)

    if (preserveText) {
      variables.push(
        createSystemVariable("preserve", preserveText, {
          insertable: false,
        })
      )
    }

    variables.push(
      createSystemVariable(
        "transformation_strength",
        transformationStrengthToPromptText(settings.imageToImage.transformationStrength),
        { insertable: false }
      )
    )
  }

  const aspectRatio = getAspectRatioRatio(settings.aspectRatio)

  if (aspectRatio.trim()) {
    variables.push(
      createSystemVariable("aspect", aspectRatio, {
        insertable: true,
      })
    )
  }

  if (settings.globalRules.trim()) {
    variables.push(
      createSystemVariable("rules", settings.globalRules, {
        insertable: true,
      })
    )
  }

  return variables
}

function syncActiveSystemPromptVariables(
  settings: PromptSettings,
) {
  const { setSystemPromptVariables } = usePromptVariables()

  setSystemPromptVariables(getSystemPromptVariables(settings))
}

function syncActivePromptSubjectContext(settings: PromptSettings) {
  const { setSubjectType } = usePromptSubjectContext()

  setSubjectType(settings.subjectType || 'unspecified')
}

function compileModularOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  variablesOutput = ''
) {
  const parts: string[] = []

  if (variablesOutput) {
    parts.push(variablesOutput)
    parts.push('')
  }

  parts.push(`{mode} = ${modeToPromptText(settings.mode)}`)

  const subject = buildPromptSubject(settings)

  if (settings.mode === 'image_to_image') {
    parts.push('{reference} = attached reference image')
  }

  if (settings.idea.trim()) {
    parts.push(`{idea} = ${cleanText(settings.idea)}`)
  }

  if (subject) {
    parts.push(`{subject} = ${subject}`)
  }

  if (settings.mode === 'image_to_image') {
    parts.push(
      `{reference_usage} = ${referenceUsageToPromptText(
        settings.imageToImage.referenceUsage
      )}`
    )

    const preserveText = getPreservePromptText(settings)

    if (preserveText) {
      parts.push(`{preserve} = ${preserveText}`)
    }

    parts.push(
      `{transformation_strength} = ${transformationStrengthToPromptText(
        settings.imageToImage.transformationStrength
      )}`
    )
  }

  const aspectRatio = getAspectRatioRatio(settings.aspectRatio)

  if (aspectRatio.trim()) {
    parts.push(`{aspect} = ${cleanText(aspectRatio)}`)
  }

  if (settings.globalRules.trim()) {
    parts.push(`{rules} = ${cleanText(settings.globalRules)}`)
  }

  moduleOutputs.forEach((item) => {
    const value =
      typeof item.output === "string"
        ? item.output
        : JSON.stringify(item.output, null, 2)

    parts.push(`{${item.key}} = ${value}`)
  })

  return parts.join('\n')
}

function compileNaturalOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>
) {
  const idea = normalizeTransformationIdea(settings.idea)
  const subject = buildNaturalSubject(settings)
  const aspectRatio = cleanNaturalPart(getAspectRatioRatio(settings.aspectRatio))
  const globalRules = cleanNaturalPart(settings.globalRules)
  const moduleParts = getModuleNaturalParts(moduleOutputs)
  const sentences: string[] = []

  if (settings.mode === 'image_to_image') {
    let intro = 'Transform the attached reference image'

    if (subject) {
      intro += ` featuring ${subject}`
    }

    if (idea) {
      if (/^(transform|convert|turn|change)\s/i.test(idea)) {
        intro += ` based on this idea: ${idea}`
      } else {
        intro += ` into ${idea}`
      }
    }

    sentences.push(`${intro}.`)
    sentences.push(referenceUsageToNaturalSentence(settings.imageToImage.referenceUsage))

    const preserveParts = getNaturalPreserveParts(settings)

    if (preserveParts.length) {
      sentences.push(`Preserve ${naturalJoin(preserveParts)}.`)
    }

    const transformationStrength = transformationStrengthToPromptText(
      settings.imageToImage.transformationStrength
    )

    sentences.push(`Use ${addIndefiniteArticle(transformationStrength)}.`)
  } else {
    let intro = 'Create an image'

    if (subject) {
      intro += ` of ${subject}`
    }

    if (idea) {
      intro += ` based on this idea: ${idea}`
    }

    sentences.push(`${intro}.`)
  }

  if (moduleParts.length) {
    sentences.push(`Apply ${naturalJoin(moduleParts)}.`)
  }

  if (aspectRatio) {
    sentences.push(`Use ${aspectRatio}.`)
  }

  if (globalRules) {
    sentences.push(`Follow these rules: ${globalRules}.`)
  }

  return sentences.join(' ')
}

function compileJsonOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  variablesOutput = ''
) {
  const modules = moduleOutputs.reduce<
    Record<string, ModuleOutputValue>
  >((result, item) => {
    result[item.key] = item.output
    return result
  }, {})

  const variables = variableDefinitionsToRecord(variablesOutput)
  const hasVariables = Object.keys(variables).length > 0

  const baseOutput = {
    ...(hasVariables ? { variables } : {}),
    mode: settings.mode,
    idea: settings.idea.trim(),
    subject: buildPromptSubject(settings),
    subjectType: settings.subjectType,
    aspectRatio: getAspectRatioRatio(settings.aspectRatio).trim(),
    aspectRatioValue: settings.aspectRatio.trim(),
    globalRules: settings.globalRules.trim(),
    modules
  }

  if (settings.mode !== 'image_to_image') {
    return JSON.stringify(baseOutput, null, 2)
  }

  return JSON.stringify(
    {
      ...baseOutput,
      reference: {
        source: 'attached reference image',
        subjectType: settings.subjectType,
        subject: settings.subject.trim(),
        referenceUsage: settings.imageToImage.referenceUsage,
        transformationStrength: settings.imageToImage.transformationStrength,
        preserve: getPreserveParts(settings)
      }
    },
    null,
    2
  )
}

function getNaturalOptimizerOptions(settings: PromptSettings) {
  return {
    mode: settings.mode,
    transformationStrength:
      settings.mode === 'image_to_image'
        ? settings.imageToImage.transformationStrength
        : undefined,
    referenceSubjectType:
      settings.mode === 'image_to_image'
        ? settings.subjectType
        : undefined
  }
}

function isNaturalOptimizerLogEnabled() {
  if (import.meta.dev) return true

  if (typeof window === 'undefined') return false

  return window.localStorage.getItem('promptDraft:logNaturalOptimizer') === '1'
}

function logNaturalOptimizerResult(payload: {
  settings: PromptSettings
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>
  rawOutput: string
  optimizedOutput: string
}) {
  if (!isNaturalOptimizerLogEnabled()) return

  const rawLength = payload.rawOutput.length
  const optimizedLength = payload.optimizedOutput.length
  const reduction =
    rawLength > 0
      ? Math.round(((rawLength - optimizedLength) / rawLength) * 100)
      : 0

  console.groupCollapsed(
    `[Prompt Draft] Natural Output Optimizer | ${rawLength} → ${optimizedLength} chars | ${reduction}% shorter`
  )

  console.clear();
  console.log('Settings:', payload.settings)
  console.log('Module outputs:', payload.moduleOutputs)

  console.log('Raw natural output:')
  console.log(payload.rawOutput)

  console.log('Optimized natural output:')
  console.log(payload.optimizedOutput)

  console.table({
    rawLength,
    optimizedLength,
    reductionPercent: reduction
  })

  console.groupEnd()
}

export function compilePromptOutput(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap,
  settings: PromptSettings,
  format: PromptOutputFormat = 'modular'
) {
  const moduleOutputs = getOrderedModuleOutputs(modules, outputs)
  const variablesOutput = getVariablesOutput(outputs)

  syncActivePromptSubjectContext(settings)
  syncActiveSystemPromptVariables(settings)

  const hasSettingsOutput =
    settings.idea.trim() ||
    buildPromptSubject(settings) ||
    settings.aspectRatio.trim() ||
    settings.globalRules.trim()

  if (!moduleOutputs.length && !hasSettingsOutput && !variablesOutput) {
    return ''
  }

  if (format === 'json') {
    return compileJsonOutput(settings, moduleOutputs, variablesOutput)
  }

  if (format === 'natural') {
    const rawOutput = compileNaturalOutput(settings, moduleOutputs)

    const optimizedOutput = optimizeNaturalPrompt(
      rawOutput,
      getNaturalOptimizerOptions(settings)
    )

    // logNaturalOptimizerResult({
    //   settings,
    //   moduleOutputs,
    //   rawOutput,
    //   optimizedOutput
    // })

    return variablesOutput ? `${variablesOutput}\n\n${optimizedOutput}` : optimizedOutput
  }

  return compileModularOutput(settings, moduleOutputs, variablesOutput)
}
