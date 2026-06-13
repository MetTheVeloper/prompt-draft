import en from './locales/en'
import fa from './locales/fa'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',

  messages: {
    en,
    fa,
  },
}))