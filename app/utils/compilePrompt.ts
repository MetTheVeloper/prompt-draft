// app/utils/compilePrompt.ts
import type { PromptKeyModule } from '../modules/types'
import { optimizeNaturalPrompt } from './optimizeNaturalPrompt'
import { VARIABLES_MODULE_KEY, variableDefinitionsToRecord } from './promptVariables'

export type ModuleOutputMap = Record<string, string>

export type PromptOutputFormat = 'modular' | 'natural' | 'json'

export type PromptMode = 'text_to_image' | 'image_to_image'

export type ReferenceSubjectType =
  | 'person'
  | 'object'
  | 'animal'
  | 'building'
  | 'product'
  | 'vehicle'
  | 'scene'
  | 'custom'

export type ReferenceUsage = 'strict' | 'balanced' | 'loose'

export type TransformationStrength = 'subtle' | 'balanced' | 'strong' | 'extreme'

export type ImageToImageSettings = {
  referenceSubjectType: ReferenceSubjectType
  customSubject: string
  subjectDescription: string
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
  aspectRatio: string
  globalRules: string
  imageToImage: ImageToImageSettings
}

export function createDefaultPromptSettings(): PromptSettings {
  return {
    mode: 'image_to_image',
    idea: '',
    subject: '',
    aspectRatio: '4:5',
    globalRules: '',
    imageToImage: {
      referenceSubjectType: 'person',
      customSubject: '',
      subjectDescription: '',
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

      const output = outputs[module.key]?.trim()

      if (!output) return null

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

function referenceSubjectTypeToText(type: ReferenceSubjectType) {
  const map: Record<ReferenceSubjectType, string> = {
    person: 'person in the attached reference image',
    object: 'object in the attached reference image',
    animal: 'animal in the attached reference image',
    building: 'building or architectural subject in the attached reference image',
    product: 'product in the attached reference image',
    vehicle: 'vehicle in the attached reference image',
    scene: 'scene or environment in the attached reference image',
    custom: 'subject in the attached reference image'
  }

  return map[type]
}

function referenceSubjectTypeToNaturalText(type: ReferenceSubjectType) {
  const map: Record<ReferenceSubjectType, string> = {
    person: 'the person in the attached reference image',
    object: 'the object in the attached reference image',
    animal: 'the animal in the attached reference image',
    building: 'the building or architectural subject in the attached reference image',
    product: 'the product in the attached reference image',
    vehicle: 'the vehicle in the attached reference image',
    scene: 'the scene or environment in the attached reference image',
    custom: 'the subject in the attached reference image'
  }

  return map[type]
}

export function buildPromptSubject(settings: PromptSettings) {
  if (settings.mode === 'text_to_image') {
    return cleanText(settings.subject)
  }

  const imageSettings = settings.imageToImage

  const baseSubject =
    imageSettings.referenceSubjectType === 'custom'
      ? cleanText(imageSettings.customSubject) ||
      referenceSubjectTypeToText('custom')
      : referenceSubjectTypeToText(imageSettings.referenceSubjectType)

  const description = cleanText(imageSettings.subjectDescription)

  return [baseSubject, description].filter(Boolean).join(', ')
}

function buildNaturalSubject(settings: PromptSettings) {
  if (settings.mode === 'text_to_image') {
    return cleanNaturalPart(settings.subject)
  }

  const imageSettings = settings.imageToImage
  const description = cleanNaturalPart(imageSettings.subjectDescription)

  if (description) {
    return addIndefiniteArticle(description)
  }

  if (imageSettings.referenceSubjectType === 'custom') {
    return (
      cleanNaturalPart(imageSettings.customSubject) ||
      referenceSubjectTypeToNaturalText('custom')
    )
  }

  return referenceSubjectTypeToNaturalText(imageSettings.referenceSubjectType)
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
    parts.push('the main subject')
  }

  if (
    imageSettings.referenceSubjectType === 'person' &&
    imageSettings.preserveIdentity
  ) {
    parts.push("the person's identity")
  }

  if (imageSettings.preservePose) {
    parts.push('the pose')
  }

  if (
    imageSettings.referenceSubjectType === 'person' &&
    imageSettings.preserveOutfit
  ) {
    parts.push('the outfit and visible accessories')
  }

  if (imageSettings.preserveComposition) {
    parts.push('the original composition')
  }

  if (imageSettings.preserveColors) {
    parts.push('the main color impression')
  }

  if (imageSettings.preserveMaterials) {
    parts.push('visible materials and surface details')
  }

  if (imageSettings.preserveLighting) {
    parts.push('the original lighting and mood')
  }

  return parts
}

function getPreservePromptText(settings: PromptSettings) {
  const preserveParts = getPreserveParts(settings)

  if (!preserveParts.length) return ''

  return preserveParts.map((part) => `preserve ${part}`).join(', ')
}

function getModuleNaturalParts(
  moduleOutputs: Array<{ key: string; output: string }>
) {
  const parts = moduleOutputs.flatMap((item) => {
    return item.output
      .split(',')
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
  return outputs[VARIABLES_MODULE_KEY]?.trim() || ''
}

function compileModularOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: string }>,
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

  if (settings.aspectRatio.trim()) {
    parts.push(`{aspect} = ${cleanText(settings.aspectRatio)}`)
  }

  if (settings.globalRules.trim()) {
    parts.push(`{rules} = ${cleanText(settings.globalRules)}`)
  }

  moduleOutputs.forEach((item) => {
    parts.push(`{${item.key}} = ${item.output}`)
  })

  return parts.join('\n')
}

function compileNaturalOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: string }>
) {
  const idea = normalizeTransformationIdea(settings.idea)
  const subject = buildNaturalSubject(settings)
  const aspectRatio = cleanNaturalPart(settings.aspectRatio)
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

    const preserveParts = getPreserveParts(settings)

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
    sentences.push(`Use a ${aspectRatio} aspect ratio.`)
  }

  if (globalRules) {
    sentences.push(`Follow these rules: ${globalRules}.`)
  }

  return sentences.join(' ')
}

function compileJsonOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: string }>,
  variablesOutput = ''
) {
  const modules = moduleOutputs.reduce<Record<string, string>>((result, item) => {
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
    aspectRatio: settings.aspectRatio.trim(),
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
        subjectType: settings.imageToImage.referenceSubjectType,
        customSubject: settings.imageToImage.customSubject.trim(),
        subjectDescription: settings.imageToImage.subjectDescription.trim(),
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
        ? settings.imageToImage.referenceSubjectType
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
  moduleOutputs: Array<{ key: string; output: string }>
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

    logNaturalOptimizerResult({
      settings,
      moduleOutputs,
      rawOutput,
      optimizedOutput
    })

    return variablesOutput ? `${variablesOutput}\n\n${optimizedOutput}` : optimizedOutput
  }

  return compileModularOutput(settings, moduleOutputs, variablesOutput)
}