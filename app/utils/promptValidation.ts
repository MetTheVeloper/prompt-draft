import type { PromptSettings } from './compilePrompt'

export type PromptValidationIssueLevel = 'error' | 'warning'

export type PromptValidationIssueCode =
  | 'no_modules_selected'
  | 'custom_override_empty'
  | 'text_to_image_missing_context'
  | 'custom_subject_empty'
  | 'idea_empty'

export interface PromptValidationIssue {
  id: string
  code: PromptValidationIssueCode
  level: PromptValidationIssueLevel
  moduleKey?: string
  moduleLabel?: string
}

function isEmpty(value: string) {
  return !value.trim()
}

export function validatePromptSettings(
  settings: PromptSettings
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

  return issues
}