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

export interface PromptValidationIssue {
  id: string
  code: PromptValidationIssueCode
  level: PromptValidationIssueLevel
  moduleKey?: string
  moduleLabel?: string
  variableKey?: string
  token?: string
}

function isEmpty(value: string) {
  return !value.trim()
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
    settings.imageToImage.referenceSubjectType === 'custom' &&
    isEmpty(settings.imageToImage.customSubject)
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

  if (outputs) {
    issues.push(...validateVariableReferencesFromOutputs(outputs))
  }

  return issues
}

function validateVariableReferencesFromOutputs(
  outputs: ModuleOutputMap
): PromptValidationIssue[] {
  const variablesOutput = outputs[VARIABLES_MODULE_KEY]?.trim() || ''
  const definedKeys = new Set(
    parseVariableDefinitions(variablesOutput).map((variable) => variable.key)
  )

  const textsToScan = Object.entries(outputs)
    .filter(([key]) => key !== VARIABLES_MODULE_KEY)
    .map(([, output]) => output)

  const references = new Set(
    textsToScan.flatMap((text) => extractVariableReferences(text))
  )

  const issues: PromptValidationIssue[] = []

  references.forEach((key) => {
    if (isReservedVariableKey(key)) return

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
