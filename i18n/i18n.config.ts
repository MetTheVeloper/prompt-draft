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

function mergeModuleLocale(base: Record<string, any> = {}, fragment: Record<string, any> = {}) {
  return {
    ...base,
    ...fragment,
    ...(base.catalog || fragment.catalog
      ? {
          catalog: {
            ...(base.catalog || {}),
            ...(fragment.catalog || {}),
          },
        }
      : {}),
    ...(base.ui || fragment.ui
      ? {
          ui: {
            ...(base.ui || {}),
            ...(fragment.ui || {}),
          },
        }
      : {}),
  }
}

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',

  messages: {
    en: {
      ...en,
      modules: {
        ...en.modules,
        background: backgroundEn,
        effects: effectsEn,
        hair: mergeModuleLocale(en.modules.hair, hairEn),
        outfit: mergeModuleLocale(en.modules.outfit, outfitEn),
        variables: mergeModuleLocale(en.modules.variables, variablesEn),
      },
    },
    fa: {
      ...fa,
      modules: {
        ...fa.modules,
        background: backgroundFa,
        effects: effectsFa,
        hair: mergeModuleLocale(fa.modules.hair, hairFa),
        outfit: mergeModuleLocale(fa.modules.outfit, outfitFa),
        variables: mergeModuleLocale(fa.modules.variables, variablesFa),
      },
    },
  },
}))