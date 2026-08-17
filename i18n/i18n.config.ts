import en from './locales/en'
import fa from './locales/fa'
import zh from './locales/zh'
import ar from './locales/ar'
import ru from './locales/ru'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',

  messages: {
    en,
    fa,
    zh,
    ar,
    ru,
  },
}))