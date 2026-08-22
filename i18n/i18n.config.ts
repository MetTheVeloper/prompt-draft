import en from './locales/en'
import fa from './locales/fa'
import backgroundEn from './locales/background.en'
import backgroundFa from './locales/background.fa'
import effectsEn from './locales/effects.en'
import effectsFa from './locales/effects.fa'
import hairEn from './locales/hair.en'
import hairFa from './locales/hair.fa'
import outfitEn from './locales/outfit.en'
import outfitFa from './locales/outfit.fa'
import variablesEn from './locales/variables.en'
import variablesFa from './locales/variables.fa'
import consolidatedControlsEn from './locales/consolidated-controls.en'
import consolidatedControlsFa from './locales/consolidated-controls.fa'
import consolidatedUiCleanupEn from './locales/consolidated-ui-cleanup.en'
import consolidatedUiCleanupFa from './locales/consolidated-ui-cleanup.fa'
import consolidatedCoreFa from './locales/consolidated-core.fa'
import consolidatedCameraFramingFa from './locales/consolidated-camera-framing.fa'
import consolidatedFormFa from './locales/consolidated-form.fa'
import consolidatedLightingTexture1Fa from './locales/consolidated-lighting-texture-1.fa'
import consolidatedLightingTexture2Fa from './locales/consolidated-lighting-texture-2.fa'
import consolidatedLightingTexture3Fa from './locales/consolidated-lighting-texture-3.fa'
import consolidatedStylePoseExpression1Fa from './locales/consolidated-style-pose-expression-1.fa'
import consolidatedStylePoseExpression2Fa from './locales/consolidated-style-pose-expression-2.fa'
import consolidatedStylePoseExpression3Fa from './locales/consolidated-style-pose-expression-3.fa'

type LocaleObject = Record<string, any>

function isPlainObject(value: unknown): value is LocaleObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(target: LocaleObject = {}, source: LocaleObject = {}): LocaleObject {
  const output: LocaleObject = { ...target }

  for (const [key, value] of Object.entries(source)) {
    output[key] = isPlainObject(value)
      ? deepMerge(isPlainObject(output[key]) ? output[key] : {}, value)
      : value
  }

  return output
}

function flatToNested(flat: Record<string, string>): LocaleObject {
  const output: LocaleObject = {}

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.').filter(Boolean)
    if (!parts.length) continue

    let current = output
    parts.forEach((part, index) => {
      if (index === parts.length - 1) current[part] = value
      else {
        if (!isPlainObject(current[part])) current[part] = {}
        current = current[part]
      }
    })
  }

  return output
}

function withModuleFragments(
  base: LocaleObject,
  fragments: Array<[string, LocaleObject]>,
): LocaleObject {
  return fragments.reduce(
    (messages, [moduleKey, fragment]) =>
      deepMerge(messages, { modules: { [moduleKey]: fragment } }),
    base,
  )
}

const enConsolidated = {
  ...consolidatedControlsEn,
  ...consolidatedUiCleanupEn,
}

const enMessages = deepMerge(
  withModuleFragments(en, [
    ['background', backgroundEn],
    ['effects', effectsEn],
    ['hair', hairEn],
    ['outfit', outfitEn],
    ['variables', variablesEn],
  ]),
  flatToNested(enConsolidated),
)

const faConsolidated = {
  ...consolidatedControlsFa,
  ...consolidatedUiCleanupFa,
  ...consolidatedCoreFa,
  ...consolidatedCameraFramingFa,
  ...consolidatedFormFa,
  ...consolidatedLightingTexture1Fa,
  ...consolidatedLightingTexture2Fa,
  ...consolidatedLightingTexture3Fa,
  ...consolidatedStylePoseExpression1Fa,
  ...consolidatedStylePoseExpression2Fa,
  ...consolidatedStylePoseExpression3Fa,
}

const faMessages = deepMerge(
  withModuleFragments(fa, [
    ['background', backgroundFa],
    ['effects', effectsFa],
    ['hair', hairFa],
    ['outfit', outfitFa],
    ['variables', variablesFa],
  ]),
  flatToNested(faConsolidated),
)

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: enMessages,
    fa: faMessages,
  },
}))
