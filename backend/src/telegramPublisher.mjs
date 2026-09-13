const TELEGRAM_API_ORIGIN = 'https://api.telegram.org'
const DEFAULT_TIMEOUT_MS = 15_000

function keyboardFor(ctas) {
  return {
    inline_keyboard: ctas.map(cta => [{ text: cta.label, url: cta.url }]),
  }
}

function publicMessageUrl(destinationChatId, messageId) {
  if (typeof destinationChatId !== 'string' || !destinationChatId.startsWith('@')) return null
  return `https://t.me/${destinationChatId.slice(1)}/${messageId}`
}

function mapTelegramMessage(message, ordinal, role, destinationChatId) {
  const messageId = Number(message?.message_id)
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    throw new TelegramDeliveryUnknownError('Telegram returned an invalid message identity')
  }

  return {
    ordinal,
    role,
    telegramChatId: String(message?.chat?.id ?? destinationChatId),
    telegramMessageId: messageId,
    telegramUrl: publicMessageUrl(destinationChatId, messageId),
    mediaGroupId: typeof message?.media_group_id === 'string' ? message.media_group_id : null,
  }
}

export class TelegramApiError extends Error {
  constructor(message, { httpStatus = null, errorCode = null, details = {} } = {}) {
    super(message)
    this.name = 'TelegramApiError'
    this.kind = 'failed'
    this.httpStatus = httpStatus
    this.errorCode = errorCode
    this.details = details
    this.partialMessages = []
  }
}

export class TelegramDeliveryUnknownError extends Error {
  constructor(message, { httpStatus = null, errorCode = null, details = {}, partialMessages = [] } = {}) {
    super(message)
    this.name = 'TelegramDeliveryUnknownError'
    this.kind = 'delivery_unknown'
    this.httpStatus = httpStatus
    this.errorCode = errorCode
    this.details = details
    this.partialMessages = partialMessages
  }
}

export async function callTelegramBotApi(
  method,
  payload,
  {
    botToken,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  },
) {
  if (typeof fetchImpl !== 'function') {
    throw new TelegramDeliveryUnknownError('Telegram transport is unavailable')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetchImpl(
      `${TELEGRAM_API_ORIGIN}/bot${botToken}/${method}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    )
  } catch (error) {
    throw new TelegramDeliveryUnknownError(
      error?.name === 'AbortError'
        ? 'Telegram request timed out; delivery state is unknown'
        : 'Telegram request failed before a trustworthy response was received',
      { errorCode: error?.name === 'AbortError' ? 'TELEGRAM_TIMEOUT' : 'TELEGRAM_TRANSPORT_ERROR' },
    )
  } finally {
    clearTimeout(timer)
  }

  let body
  try {
    body = await response.json()
  } catch {
    throw new TelegramDeliveryUnknownError(
      'Telegram returned an unreadable response; delivery state is unknown',
      { httpStatus: response.status, errorCode: 'TELEGRAM_RESPONSE_INVALID' },
    )
  }

  if (!body || body.ok !== true) {
    const errorCode = Number.isInteger(body?.error_code) ? body.error_code : null
    const retryAfter = Number(body?.parameters?.retry_after)
    throw new TelegramApiError(
      typeof body?.description === 'string' && body.description.trim()
        ? body.description.trim()
        : 'Telegram rejected the publication request',
      {
        httpStatus: response.status,
        errorCode: errorCode === null ? 'TELEGRAM_API_REJECTED' : `TELEGRAM_API_${errorCode}`,
        details: Number.isSafeInteger(retryAfter) && retryAfter > 0
          ? { retryAfterSeconds: retryAfter }
          : {},
      },
    )
  }

  return {
    result: body.result,
    httpStatus: response.status,
  }
}

function mediaGroupPayload(post, destinationChatId) {
  return {
    chat_id: destinationChatId,
    media: post.media.map((media, index) => ({
      type: 'photo',
      media: media.url,
      ...(index === 0 && post.caption ? { caption: post.caption } : {}),
    })),
  }
}

function ctaMessageText(post) {
  return post.multiMediaCtaText || post.ctas[0]?.label || 'Open in Prompt Draft'
}

export async function publishTelegramPost(
  normalized,
  config,
  options = {},
) {
  const { post, destinationChatId } = normalized
  const transportOptions = {
    botToken: config.botToken,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
  }
  const replyMarkup = keyboardFor(post.ctas)
  const messages = []
  let lastHttpStatus = null

  if (post.media.length === 0) {
    const response = await callTelegramBotApi('sendMessage', {
      chat_id: destinationChatId,
      text: post.caption,
      reply_markup: replyMarkup,
    }, transportOptions)
    lastHttpStatus = response.httpStatus
    messages.push(mapTelegramMessage(response.result, 0, 'content', destinationChatId))
    return { messages, httpStatus: lastHttpStatus, methods: ['sendMessage'] }
  }

  if (post.media.length === 1) {
    const response = await callTelegramBotApi('sendPhoto', {
      chat_id: destinationChatId,
      photo: post.media[0].url,
      ...(post.caption ? { caption: post.caption } : {}),
      reply_markup: replyMarkup,
    }, transportOptions)
    lastHttpStatus = response.httpStatus
    messages.push(mapTelegramMessage(response.result, 0, 'content', destinationChatId))
    return { messages, httpStatus: lastHttpStatus, methods: ['sendPhoto'] }
  }

  const albumResponse = await callTelegramBotApi(
    'sendMediaGroup',
    mediaGroupPayload(post, destinationChatId),
    transportOptions,
  )
  lastHttpStatus = albumResponse.httpStatus
  if (!Array.isArray(albumResponse.result) || albumResponse.result.length !== post.media.length) {
    throw new TelegramDeliveryUnknownError(
      'Telegram album response did not match the requested media set',
      { httpStatus: albumResponse.httpStatus, errorCode: 'TELEGRAM_ALBUM_RESPONSE_INVALID' },
    )
  }

  try {
    for (const [index, message] of albumResponse.result.entries()) {
      messages.push(mapTelegramMessage(message, index, 'content', destinationChatId))
    }
  } catch (error) {
    throw new TelegramDeliveryUnknownError(
      'Telegram album was sent but its message identities could not be fully confirmed',
      {
        httpStatus: albumResponse.httpStatus,
        errorCode: 'TELEGRAM_ALBUM_RESPONSE_INVALID',
        partialMessages: messages,
      },
    )
  }

  try {
    const ctaResponse = await callTelegramBotApi('sendMessage', {
      chat_id: destinationChatId,
      text: ctaMessageText(post),
      reply_markup: replyMarkup,
    }, transportOptions)
    lastHttpStatus = ctaResponse.httpStatus
    messages.push(mapTelegramMessage(
      ctaResponse.result,
      messages.length,
      'cta',
      destinationChatId,
    ))
  } catch (error) {
    throw new TelegramDeliveryUnknownError(
      'Telegram album was sent but its CTA message could not be confirmed',
      {
        httpStatus: error?.httpStatus ?? lastHttpStatus,
        errorCode: error?.errorCode ?? 'TELEGRAM_PARTIAL_DELIVERY',
        details: error?.details ?? {},
        partialMessages: messages,
      },
    )
  }

  return {
    messages,
    httpStatus: lastHttpStatus,
    methods: ['sendMediaGroup', 'sendMessage'],
  }
}
