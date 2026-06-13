import { StyleModule } from '../modules/style.module'

type StyleFieldId = keyof typeof StyleModule.fields

export type StyleValues = {
  preset?: string
  medium?: string
  realism?: string
  genre?: string
  intensity?: string
  customText?: string
}

function getOptionPromptText(fieldId: StyleFieldId, value?: string): string {
  if (!value) return ''

  const field = StyleModule.fields[fieldId]
  const options = 'options' in field ? field.options : undefined

  if (!options) return value

  const option = options.find((item) => item.value === value)

  return option?.promptText || value
}

export function getStylePresetValues(presetKey: keyof typeof StyleModule.presets): StyleValues {
  return StyleModule.presets[presetKey]?.values || {}
}

export function compileStyle(values: StyleValues): string {
  const customOutput = values.customText?.trim()

  if (customOutput) {
    return customOutput
  }

  const parts = [
    getOptionPromptText('preset', values.preset),
    getOptionPromptText('medium', values.medium),
    getOptionPromptText('realism', values.realism),
    getOptionPromptText('genre', values.genre),
    getOptionPromptText('intensity', values.intensity)
  ]

  return parts.filter(Boolean).join(', ')
}