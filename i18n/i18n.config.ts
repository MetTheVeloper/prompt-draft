import en from './locales/en'
import fa from './locales/fa'
import backgroundEn from './locales/background.en'
import backgroundFa from './locales/background.fa'
import effectsEn from './locales/effects.en'
import effectsFa from './locales/effects.fa'
import hairEn from './locales/hair.en'
import hairFa from './locales/hair.fa'

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
        hair: {
          ...en.modules.hair,
          ...hairEn,
        },
      },
    },
    fa: {
      ...fa,
      modules: {
        ...fa.modules,
        background: backgroundFa,
        effects: effectsFa,
        hair: {
          ...fa.modules.hair,
          ...hairFa,
        },
      },
    },
  },
}))