// app/utils/compilePrompt.ts
import type { ModuleSubjectType, PromptKeyModule } from '../modules/types'
import { optimizeNaturalPrompt } from './optimizeNaturalPrompt'
import { compileLayoutNaturalBlock } from './compileLayoutNatural'
import { compileTypographyNaturalBlock } from './compileTypographyNatural'
import { formatHairOutputForReferences } from './compileHair'
import { formatOutfitOutputForReferences } from './compileOutfit'
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
      output: ModuleOutputValue
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

function isProtectedBulletOutput(output: ModuleOutputValue) {
  return typeof output === 'string' && output.trim().startsWith('•')
}

function getModuleNaturalParts(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  excludedModuleKeys: Set<string> = new Set(),
) {
  const parts = moduleOutputs
    .filter((item) => {
      return (
        !excludedModuleKeys.has(item.key) &&
        typeof item.output === "string" &&
        !isProtectedBulletOutput(item.output)
      )
    })
    .flatMap((item) => {
      return (item.output as string)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getReferencedLayoutRegionKeys(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  layoutOutput: Record<string, unknown>,
) {
  const referenceText = moduleOutputs
    .filter((item) => item.key !== 'layout')
    .map((item) =>
      typeof item.output === 'string'
        ? item.output
        : JSON.stringify(item.output)
    )
    .join('\n')

  const referencedRegionKeys = new Set<string>()
  const regions = Array.isArray(layoutOutput.regions) ? layoutOutput.regions : []

  regions.forEach((region) => {
    if (!isRecord(region)) return

    const key = typeof region.key === 'string' ? region.key.trim() : ''

    if (key && referenceText.includes(key)) {
      referencedRegionKeys.add(key)
    }
  })

  return referencedRegionKeys
}

function getLayoutNaturalBlock(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>
) {
  const layoutOutput = moduleOutputs.find((item) => item.key === 'layout')?.output

  if (!layoutOutput || typeof layoutOutput === 'string') return ''

  return compileLayoutNaturalBlock(layoutOutput, {
    referencedRegionKeys: getReferencedLayoutRegionKeys(
      moduleOutputs,
      layoutOutput,
    ),
  })
}

function getReferencedTypographyKeys(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  typographyOutput: Record<string, unknown>,
) {
  const referenceText = moduleOutputs
    .filter((item) => item.key !== 'typography')
    .map((item) =>
      typeof item.output === 'string'
        ? item.output
        : JSON.stringify(item.output)
    )
    .join('\n')

  const referencedGroupKeys = new Set<string>()
  const referencedTextKeys = new Set<string>()
  const groups = Array.isArray(typographyOutput.groups) ? typographyOutput.groups : []

  regions: for (const group of groups) {
    if (!isRecord(group)) continue regions

    const groupKey = typeof group.key === 'string' ? group.key.trim() : ''
    if (groupKey && referenceText.includes(groupKey)) {
      referencedGroupKeys.add(groupKey)
    }

    const texts = Array.isArray(group.texts) ? group.texts : []
    texts.forEach((text) => {
      if (!isRecord(text)) return

      const textKey = typeof text.key === 'string' ? text.key.trim() : ''
      if (textKey && referenceText.includes(textKey)) {
        referencedTextKeys.add(textKey)
      }
    })
  }

  return {
    referencedGroupKeys,
    referencedTextKeys,
  }
}

function getTypographyNaturalBlock(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>
) {
  const typographyOutput = moduleOutputs.find(
    (item) => item.key === 'typography'
  )?.output

  if (!typographyOutput || typeof typographyOutput === 'string') return ''

  return compileTypographyNaturalBlock(
    typographyOutput,
    getReferencedTypographyKeys(moduleOutputs, typographyOutput),
  )
}

function humanizeModuleKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function naturalBlockTitle(key: string) {
  if (key === 'texture') return 'Texture / Material'
  return humanizeModuleKey(key)
}

function getProtectedBulletNaturalBlocks(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  excludedModuleKeys: Set<string> = new Set(),
) {
  return moduleOutputs
    .filter((item) =>
      !excludedModuleKeys.has(item.key) && isProtectedBulletOutput(item.output)
    )
    .map((item) => {
      return `${naturalBlockTitle(item.key)}:\n${item.output as string}`
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

function formatPromptDefinition(key: string, value: ModuleOutputValue) {
  const stringValue =
    typeof value === 'string'
      ? value.trim()
      : JSON.stringify(value)

  if (!key.trim() || !stringValue) return ''

  return stringValue.includes('\n') || stringValue.startsWith('•')
    ? `{${key}} =\n${stringValue}`
    : `{${key}} = ${stringValue}`
}

function moduleOutputText(value: ModuleOutputValue) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function buildModuleExternalReferenceText(
  moduleKey: string,
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  settings: PromptSettings,
  variablesOutput: string,
) {
  return [
    settings.idea,
    settings.subject,
    settings.globalRules,
    variablesOutput,
    ...moduleOutputs
      .filter((item) => item.key !== moduleKey)
      .map((item) => moduleOutputText(item.output)),
  ]
    .filter(Boolean)
    .join('\n')
}

function prepareModuleOutputsForPrompt(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  settings: PromptSettings,
  variablesOutput: string,
) {
  return moduleOutputs.map((item) => {
    if (typeof item.output !== 'string') return item

    const externalReferenceText = buildModuleExternalReferenceText(
      item.key,
      moduleOutputs,
      settings,
      variablesOutput,
    )

    if (item.key === 'outfit') {
      return {
        ...item,
        output: formatOutfitOutputForReferences(
          item.output,
          externalReferenceText,
        ),
      }
    }

    if (item.key === 'hair') {
      return {
        ...item,
        output: formatHairOutputForReferences(
          item.output,
          externalReferenceText,
        ),
      }
    }

    return item
  })
}

function getReferencedLinkedModuleKeys(
  modules: PromptKeyModule[],
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  settings: PromptSettings,
  variablesOutput: string,
) {
  const settingText = [
    settings.idea,
    settings.subject,
    settings.globalRules,
    variablesOutput,
  ]
    .filter(Boolean)
    .join('\n')

  const activeOutputKeys = new Set(moduleOutputs.map((item) => item.key))
  const referencedKeys = new Set<string>()

  modules.forEach((module) => {
    if (
      module.semanticTargets?.exposeOutput !== true ||
      !activeOutputKeys.has(module.key)
    ) {
      return
    }

    const token = `{${module.key}}`
    const externalModuleText = moduleOutputs
      .filter((item) => item.key !== module.key)
      .map((item) => moduleOutputText(item.output))
      .join('\n')

    if (`${settingText}\n${externalModuleText}`.includes(token)) {
      referencedKeys.add(module.key)
    }
  })

  return referencedKeys
}

function getLinkedModuleDefinitions(
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  referencedModuleKeys: Set<string>,
) {
  return moduleOutputs
    .filter((item) => referencedModuleKeys.has(item.key))
    .map((item) => formatPromptDefinition(item.key, item.output))
    .filter(Boolean)
    .join('\n')
}

function getReferencedSystemVariableDefinitions(
  settings: PromptSettings,
  referenceText: string,
) {
  const variables = getSystemPromptVariables(settings).filter(
    (variable) => variable.enabled,
  )
  const referencedKeys = new Set<string>()
  let searchableText = referenceText
  let changed = true

  while (changed) {
    changed = false

    variables.forEach((variable) => {
      if (referencedKeys.has(variable.key)) return

      const token = `{${variable.key}}`
      if (!searchableText.includes(token)) return

      referencedKeys.add(variable.key)
      searchableText += `\n${variable.value}`
      changed = true
    })
  }

  return variables
    .filter((variable) => referencedKeys.has(variable.key))
    .map((variable) => formatPromptDefinition(variable.key, variable.value))
    .filter(Boolean)
    .join('\n')
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
        : JSON.stringify(item.output)

    const isBlockValue = typeof value === 'string' && (
      value.includes('\n') || value.trim().startsWith('•')
    )

    parts.push(
      isBlockValue
        ? `{${item.key}} =\n${value}`
        : `{${item.key}} = ${value}`
    )
  })

  return parts.join('\n')
}

function compileNaturalOutput(
  settings: PromptSettings,
  moduleOutputs: Array<{ key: string; output: ModuleOutputValue }>,
  excludedModuleKeys: Set<string> = new Set(),
) {
  const idea = normalizeTransformationIdea(settings.idea)
  const subject = buildNaturalSubject(settings)
  const aspectRatio = cleanNaturalPart(getAspectRatioRatio(settings.aspectRatio))
  const globalRules = cleanNaturalPart(settings.globalRules)
  const moduleParts = getModuleNaturalParts(moduleOutputs, excludedModuleKeys)
  const sentences: string[] = []
  const ideaUsesSubjectToken = settings.idea.includes('{subject}')

  if (settings.mode === 'image_to_image') {
    let intro = 'Transform the attached reference image'

    if (subject && !ideaUsesSubjectToken) {
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

    if (subject && !ideaUsesSubjectToken) {
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
  const rawModuleOutputs = getOrderedModuleOutputs(modules, outputs)
  const variablesOutput = getVariablesOutput(outputs)
  const moduleOutputs = prepareModuleOutputsForPrompt(
    rawModuleOutputs,
    settings,
    variablesOutput,
  )

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
    const referencedLinkedModuleKeys = getReferencedLinkedModuleKeys(
      modules,
      moduleOutputs,
      settings,
      variablesOutput,
    )
    const rawOutput = compileNaturalOutput(
      settings,
      moduleOutputs,
      referencedLinkedModuleKeys,
    )
    const layoutBlock = getLayoutNaturalBlock(moduleOutputs)
    const typographyBlock = getTypographyNaturalBlock(moduleOutputs)
    const protectedBulletBlocks = getProtectedBulletNaturalBlocks(
      moduleOutputs,
      referencedLinkedModuleKeys,
    )

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

    const naturalOutput = [
      optimizedOutput,
      layoutBlock,
      typographyBlock,
      ...protectedBulletBlocks,
    ]
      .filter(Boolean)
      .join('\n\n')

    const linkedModuleDefinitions = getLinkedModuleDefinitions(
      moduleOutputs,
      referencedLinkedModuleKeys,
    )
    const systemVariableDefinitions = getReferencedSystemVariableDefinitions(
      settings,
      [variablesOutput, linkedModuleDefinitions, naturalOutput]
        .filter(Boolean)
        .join('\n'),
    )
    const definitions = [
      variablesOutput,
      systemVariableDefinitions,
      linkedModuleDefinitions,
    ]
      .filter(Boolean)
      .join('\n')

    return definitions ? `${definitions}\n\n${naturalOutput}` : naturalOutput
  }

  return compileModularOutput(settings, moduleOutputs, variablesOutput)
}
