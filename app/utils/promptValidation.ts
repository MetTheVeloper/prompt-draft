import type { ModuleOutputMap, PromptSettings } from './compilePrompt'
import { VARIABLES_MODULE_KEY, parseVariableDefinitions, extractVariableReferences, isReservedVariableKey } from './promptVariables'

export type PromptValidationIssueLevel = 'error' | 'warning'

export type PromptValidationIssueCode =
  | 'no_modules_selected'
  | 'custom_override_empty'
  | 'text_to_image_missing_context'
  | 'custom_subject_empty'
  | 'idea_empty'
  | 'undefined_variable_reference'
  | 'unused_variable'
  | 'framing_preserve_composition_conflict'
  | 'texture_preserve_materials_conflict'
  | 'pose_preserve_pose_conflict'
  | 'scene_missing_content_reference'
  | 'scene_missing_component_reference'
  | 'scene_component_cardinality_conflict'

export interface PromptValidationIssue {
  id: string
  code: PromptValidationIssueCode
  level: PromptValidationIssueLevel
  moduleKey?: string
  moduleLabel?: string
  variableKey?: string
  token?: string
}

const FRAMING_CROP_SAFETY_ONLY_PARTS = new Set([
  'preserve important subject details within the frame',
  'preserve the face fully within the frame',
  'preserve the hands fully within the frame',
  'preserve the complete readable silhouette within the frame',
  'keep additional margin around the visible subject area',
])

function isEmpty(value: string) {
  return !value.trim()
}

function hasOutput(value: unknown) {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return Boolean(value.trim())
  return typeof value === 'object' && Object.keys(value).length > 0
}

function framingChangesComposition(outputs?: ModuleOutputMap) {
  const output = outputs?.framing

  if (!output) return false
  if (typeof output !== 'string') return true

  const parts = output
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  if (!parts.length) return false

  return parts.some((part) => !FRAMING_CROP_SAFETY_ONLY_PARTS.has(part))
}

function textureChangesMaterials(outputs?: ModuleOutputMap) {
  const output = outputs?.texture

  if (!output) return false
  if (typeof output !== 'string') return true

  return Boolean(output.trim())
}

function poseChangesPose(outputs?: ModuleOutputMap) {
  const output = outputs?.pose

  if (!output) return false
  if (typeof output !== 'string') return true

  return Boolean(output.trim())
}

export function validatePromptSettings(
  settings: PromptSettings,
  outputs?: ModuleOutputMap
): PromptValidationIssue[] {
  const issues: PromptValidationIssue[] = []

  const ideaIsEmpty = isEmpty(settings.idea)
  const subjectIsEmpty = isEmpty(settings.subject)

  if (
    settings.mode === 'text_to_image' &&
    ideaIsEmpty &&
    subjectIsEmpty
  ) {
    issues.push({
      id: 'setup:text_to_image_missing_context',
      code: 'text_to_image_missing_context',
      level: 'error'
    })
  }

  if (
    settings.mode === 'image_to_image' &&
    settings.subjectType === 'custom' &&
    subjectIsEmpty
  ) {
    issues.push({
      id: 'setup:custom_subject_empty',
      code: 'custom_subject_empty',
      level: 'error'
    })
  }

  if (
    ideaIsEmpty &&
    !issues.some((issue) => issue.code === 'text_to_image_missing_context')
  ) {
    issues.push({
      id: 'setup:idea_empty',
      code: 'idea_empty',
      level: 'warning'
    })
  }

  if (
    settings.mode === 'image_to_image' &&
    settings.imageToImage.preserveComposition &&
    framingChangesComposition(outputs)
  ) {
    issues.push({
      id: 'setup:framing_preserve_composition_conflict',
      code: 'framing_preserve_composition_conflict',
      level: 'warning',
      moduleKey: 'framing',
    })
  }

  if (
    settings.mode === 'image_to_image' &&
    settings.imageToImage.preserveMaterials &&
    textureChangesMaterials(outputs)
  ) {
    issues.push({
      id: 'setup:texture_preserve_materials_conflict',
      code: 'texture_preserve_materials_conflict',
      level: 'warning',
      moduleKey: 'texture',
    })
  }

  if (
    settings.mode === 'image_to_image' &&
    settings.imageToImage.preservePose &&
    poseChangesPose(outputs)
  ) {
    issues.push({
      id: 'setup:pose_preserve_pose_conflict',
      code: 'pose_preserve_pose_conflict',
      level: 'warning',
      moduleKey: 'pose',
    })
  }

  if (outputs) {
    issues.push(...validateVariableReferencesFromOutputs(outputs))
  }

  return issues
}

function validateVariableReferencesFromOutputs(
  outputs: ModuleOutputMap
): PromptValidationIssue[] {
  const variablesOutput =
    typeof outputs[VARIABLES_MODULE_KEY] === 'string'
      ? outputs[VARIABLES_MODULE_KEY].trim()
      : ''

  const definedKeys = new Set(
    parseVariableDefinitions(variablesOutput).map((variable) => variable.key)
  )

  const definedModuleKeys = new Set(
    Object.entries(outputs)
      .filter(([key, output]) => key !== VARIABLES_MODULE_KEY && hasOutput(output))
      .map(([key]) => key)
  )

  const textsToScan = Object.entries(outputs)
    .filter(([key]) => key !== VARIABLES_MODULE_KEY)
    .map(([, output]) =>
      typeof output === 'string' ? output : JSON.stringify(output)
    )

  const references = new Set(
    textsToScan.flatMap((text) => extractVariableReferences(text))
  )

  const issues: PromptValidationIssue[] = []

  references.forEach((key) => {
    if (isReservedVariableKey(key)) return
    if (definedModuleKeys.has(key)) return

    if (!definedKeys.has(key)) {
      issues.push({
        id: `variables:reference:${key}:undefined`,
        code: 'undefined_variable_reference',
        level: 'warning',
        variableKey: key,
        token: `{${key}}`
      })
    }
  })

  definedKeys.forEach((key) => {
    if (!references.has(key)) {
      issues.push({
        id: `variables:reference:${key}:unused`,
        code: 'unused_variable',
        level: 'warning',
        variableKey: key,
        token: `{${key}}`
      })
    }
  })

  return issues
}
