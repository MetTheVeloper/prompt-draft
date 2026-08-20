import en from './locales/en'
import fa from './locales/fa'
import backgroundEn from './locales/background.en'
import backgroundFa from './locales/background.fa'

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
      },
    },
    fa: {
      ...fa,
      modules: {
        ...fa.modules,
        background: backgroundFa,
      },
    },
  },
}))