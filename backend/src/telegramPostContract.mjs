import { createHash } from 'node:crypto'

const SOURCE_TYPES = new Set(['manual', 'prompt_archive', 'campaign'])
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/
const START_PARAM_PATTERN = /^[A-Za-z0-9_-]{1,512}$/
const BOT_USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/
const APP_SHORT_NAME_PATTERN = /^[A-Za-z0-9_]{3,64}$/
const CHANNEL_USERNAME_PATTERN = /^@[A-Za-z][A-Za-z0-9_]{4,31}$/
const NUMERIC_CHAT_PATTERN = /^-?\d+$/
const MAX_CAPTION_WITH_MEDIA = 1024
const MAX_MESSAGE_TEXT = 4096
const MAX_MEDIA = 10
const MAX_CTA = 8
const MAX_CTA_LABEL = 64
const MAX_CTA_MESSAGE = 256
const MAX_SOURCE_ID = 200
const MAX_SOURCE_VERSION = 160
const MAX_URL_LENGTH = 2048

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeText(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').trim()
}

function fieldError(field, message) {
  return { field, message }
}

function normalizeSource(source, errors) {
  const value = source === undefined ? { type: 'manual' } : source
  if (!isObject(value) || !SOURCE_TYPES.has(value.type)) {
    errors.push(fieldError('source.type', 'source.type must be manual, prompt_archive, or campaign'))
    return null
  }

  const type = value.type
  const id = normalizeText(value.id)
  const version = normalizeText(value.version)

  if (type === 'manual') {
    if (value.id !== undefined && value.id !== null && id) {
      errors.push(fieldError('source.id', 'manual publications must not set source.id'))
    }
  } else if (!id || id.length > MAX_SOURCE_ID) {
    errors.push(fieldError('source.id', `source.id must be 1-${MAX_SOURCE_ID} characters`))
  }

  if (version.length > MAX_SOURCE_VERSION) {
    errors.push(fieldError('source.version', `source.version must be at most ${MAX_SOURCE_VERSION} characters`))
  }

  return {
    type,
    id: type === 'manual' ? null : id,
    version: version || null,
  }
}

function normalizeHttpsUrl(raw, field, errors) {
  const value = normalizeText(raw)
  if (!value || value.length > MAX_URL_LENGTH) {
    errors.push(fieldError(field, `URL must be 1-${MAX_URL_LENGTH} characters`))
    return null
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) {
      errors.push(fieldError(field, 'URL must be credential-free HTTPS'))
      return null
    }
    return url.toString()
  } catch {
    errors.push(fieldError(field, 'URL must be valid HTTPS'))
    return null
  }
}

function normalizeMedia(media, errors) {
  if (media === undefined) return []
  if (!Array.isArray(media) || media.length > MAX_MEDIA) {
    errors.push(fieldError('post.media', `post.media must contain 0-${MAX_MEDIA} items`))
    return []
  }

  return media.map((item, index) => {
    const base = `post.media[${index}]`
    if (!isObject(item) || item.type !== 'photo') {
      errors.push(fieldError(`${base}.type`, 'TG1 media type must be photo'))
      return null
    }
    const url = normalizeHttpsUrl(item.url, `${base}.url`, errors)
    return url ? { type: 'photo', url } : null
  }).filter(Boolean)
}

function normalizeCtas(ctas, routing, errors) {
  if (!Array.isArray(ctas) || ctas.length < 1 || ctas.length > MAX_CTA) {
    errors.push(fieldError('post.ctas', `post.ctas must contain 1-${MAX_CTA} items`))
    return []
  }

  return ctas.map((cta, index) => {
    const base = `post.ctas[${index}]`
    if (!isObject(cta)) {
      errors.push(fieldError(base, 'CTA must be an object'))
      return null
    }

    const label = normalizeText(cta.label)
    const hasStartParam = cta.startParam !== undefined && cta.startParam !== null
    const hasUrl = cta.url !== undefined && cta.url !== null

    if (!label || label.length > MAX_CTA_LABEL) {
      errors.push(fieldError(`${base}.label`, `CTA label must be 1-${MAX_CTA_LABEL} characters`))
    }
    if (hasStartParam === hasUrl) {
      errors.push(fieldError(base, 'CTA must set exactly one of startParam or url'))
      return null
    }

    if (hasStartParam) {
      const startParam = normalizeText(cta.startParam)
      if (!START_PARAM_PATTERN.test(startParam)) {
        errors.push(fieldError(`${base}.startParam`, 'startParam must be 1-512 ASCII letters, digits, underscore, or dash'))
      }
      if (!label || !START_PARAM_PATTERN.test(startParam) || !routing) return null
      return {
        label,
        startParam,
        url: buildTelegramMiniAppUrl(routing, startParam),
      }
    }

    const url = normalizeHttpsUrl(cta.url, `${base}.url`, errors)
    if (!label || !url) return null
    return { label, url }
  }).filter(Boolean)
}

export function readTelegramRoutingConfig(env = process.env) {
  const botToken = normalizeText(env.TELEGRAM_BOT_TOKEN)
  const destinationChatId = normalizeText(env.TELEGRAM_CHANNEL_ID)
  const botUsername = normalizeText(env.TELEGRAM_BOT_USERNAME).replace(/^@/, '')
  const miniAppShortName = normalizeText(env.TELEGRAM_MINI_APP_SHORT_NAME)

  const errors = []
  if (!botToken) errors.push('TELEGRAM_BOT_TOKEN is required')
  if (!CHANNEL_USERNAME_PATTERN.test(destinationChatId) && !NUMERIC_CHAT_PATTERN.test(destinationChatId)) {
    errors.push('TELEGRAM_CHANNEL_ID must be a channel @username or numeric chat id')
  }
  if (!BOT_USERNAME_PATTERN.test(botUsername)) {
    errors.push('TELEGRAM_BOT_USERNAME is invalid')
  }
  if (!APP_SHORT_NAME_PATTERN.test(miniAppShortName)) {
    errors.push('TELEGRAM_MINI_APP_SHORT_NAME is invalid')
  }

  return {
    configured: errors.length === 0,
    errors,
    botToken,
    destinationChatId,
    botUsername,
    miniAppShortName,
  }
}

export function publicTelegramRoutingConfig(config) {
  return {
    configured: Boolean(config?.configured),
    destinationChatId: config?.destinationChatId || null,
    botUsername: config?.botUsername || null,
    miniAppShortName: config?.miniAppShortName || null,
    maxMedia: MAX_MEDIA,
    maxCtas: MAX_CTA,
  }
}

export function buildTelegramMiniAppUrl(config, startParam) {
  if (!config?.botUsername || !config?.miniAppShortName) {
    throw new Error('Telegram Mini App routing is not configured')
  }
  if (!START_PARAM_PATTERN.test(startParam)) {
    throw new Error('Invalid Telegram Mini App start parameter')
  }
  return `https://t.me/${config.botUsername}/${config.miniAppShortName}?startapp=${encodeURIComponent(startParam)}`
}

export function validateTelegramPublicationInput(input, config) {
  const errors = []
  if (!config?.configured) {
    return {
      ok: false,
      code: 'TELEGRAM_NOT_CONFIGURED',
      errors: (config?.errors ?? ['Telegram is not configured']).map(message => fieldError('configuration', message)),
    }
  }
  if (!isObject(input)) {
    return { ok: false, code: 'TELEGRAM_POST_INVALID', errors: [fieldError('body', 'JSON body must be an object')] }
  }

  const idempotencyKey = normalizeText(input.idempotencyKey)
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
    errors.push(fieldError('idempotencyKey', 'idempotencyKey must be 1-200 path-safe characters'))
  }

  const source = normalizeSource(input.source, errors)
  if (!isObject(input.post)) {
    errors.push(fieldError('post', 'post must be an object'))
  }

  const post = isObject(input.post) ? input.post : {}
  const caption = normalizeText(post.caption)
  const media = normalizeMedia(post.media, errors)
  const ctas = normalizeCtas(post.ctas, config, errors)
  const multiMediaCtaText = normalizeText(post.multiMediaCtaText)

  const captionLimit = media.length > 0 ? MAX_CAPTION_WITH_MEDIA : MAX_MESSAGE_TEXT
  if (caption.length > captionLimit) {
    errors.push(fieldError('post.caption', `caption must be at most ${captionLimit} characters`))
  }
  if (media.length === 0 && !caption) {
    errors.push(fieldError('post.caption', 'caption is required when no media is provided'))
  }
  if (multiMediaCtaText.length > MAX_CTA_MESSAGE) {
    errors.push(fieldError('post.multiMediaCtaText', `multiMediaCtaText must be at most ${MAX_CTA_MESSAGE} characters`))
  }

  if (errors.length) return { ok: false, code: 'TELEGRAM_POST_INVALID', errors }

  const normalized = {
    source,
    destinationChatId: config.destinationChatId,
    post: {
      caption,
      media,
      ctas,
      multiMediaCtaText: multiMediaCtaText || null,
    },
  }
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')

  return {
    ok: true,
    idempotencyKey,
    normalized,
    payloadHash,
  }
}

export const TELEGRAM_POST_LIMITS = Object.freeze({
  maxCaptionWithMedia: MAX_CAPTION_WITH_MEDIA,
  maxMessageText: MAX_MESSAGE_TEXT,
  maxMedia: MAX_MEDIA,
  maxCtas: MAX_CTA,
  maxStartParam: 512,
})
