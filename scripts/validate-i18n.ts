import en from '../i18n/locales/en'
import fa from '../i18n/locales/fa'
import zh from '../i18n/locales/zh'
import ar from '../i18n/locales/ar'
import ru from '../i18n/locales/ru'

type Messages = Record<string, unknown>

function flatten(value: Messages, prefix = '', out: Record<string, string> = {}) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') out[path] = child
    else if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child as Messages, path, out)
  }
  return out
}

const source = flatten(en as Messages)
const sourceKeys = Object.keys(source).sort()
const interpolationPattern = /\{[^{}]+\}/g
const tokens = (value: string) => [...(value.match(interpolationPattern) || [])].sort()

function validateLocale(code: string, messages: Messages) {
  const target = flatten(messages)
  const targetKeys = Object.keys(target).sort()
  const missing = sourceKeys.filter(key => !(key in target))
  const extra = targetKeys.filter(key => !(key in source))
  const interpolationErrors = sourceKeys.filter(key => key in target && tokens(source[key]).join('|') !== tokens(target[key]).join('|'))
  console.log(`[i18n] ${code}: ${targetKeys.length} strings`)
  if (missing.length) console.error(`[i18n] ${code}: missing`, missing.slice(0, 30))
  if (extra.length) console.error(`[i18n] ${code}: extra`, extra.slice(0, 30))
  if (interpolationErrors.length) console.error(`[i18n] ${code}: interpolation`, interpolationErrors.slice(0, 30))
  return !missing.length && !extra.length && !interpolationErrors.length
}

const locales: Record<string, Messages> = { fa: fa as Messages, zh: zh as Messages, ar: ar as Messages, ru: ru as Messages }
if (!Object.entries(locales).every(([code, messages]) => validateLocale(code, messages))) process.exit(1)
console.log(`[i18n] OK: all locales match canonical en.ts (${sourceKeys.length} strings)`)
