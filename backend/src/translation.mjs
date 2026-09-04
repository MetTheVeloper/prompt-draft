const translationBaseUrl = (
  process.env.TRANSLATION_BASE_URL ?? 'http://translator:5000'
).replace(/\/+$/, '')

const configuredTimeoutMs = Number(process.env.TRANSLATION_TIMEOUT_MS ?? 20000)
const translationTimeoutMs =
  Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : 20000

function createTimeoutSignal() {
  return AbortSignal.timeout(translationTimeoutMs)
}

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function getTranslationServiceStatus() {
  try {
    const response = await fetch(`${translationBaseUrl}/languages`, {
      headers: {
        Accept: 'application/json',
      },
      signal: createTimeoutSignal(),
    })

    if (!response.ok) {
      return {
        available: false,
        languages: [],
      }
    }

    const body = await readJsonResponse(response)
    const languages = Array.isArray(body)
      ? body
          .map((language) => {
            if (
              language === null ||
              typeof language !== 'object' ||
              typeof language.code !== 'string'
            ) {
              return null
            }

            return {
              code: language.code,
              name: typeof language.name === 'string' ? language.name : language.code,
            }
          })
          .filter(Boolean)
      : []

    return {
      available: true,
      languages,
    }
  } catch (error) {
    console.warn('[Prompt Draft API] translation service status check failed', error)

    return {
      available: false,
      languages: [],
    }
  }
}

export async function translateText({ text, source, target, alternatives }) {
  const response = await fetch(`${translationBaseUrl}/translate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
      alternatives,
    }),
    signal: createTimeoutSignal(),
  })

  if (!response.ok) {
    throw new Error(`LibreTranslate returned HTTP ${response.status}`)
  }

  const body = await readJsonResponse(response)

  if (
    body === null ||
    typeof body !== 'object' ||
    typeof body.translatedText !== 'string'
  ) {
    throw new Error('LibreTranslate returned an invalid response')
  }

  return {
    translatedText: body.translatedText,
    alternatives: Array.isArray(body.alternatives)
      ? body.alternatives.filter((value) => typeof value === 'string')
      : [],
    detectedLanguage:
      body.detectedLanguage !== null &&
      typeof body.detectedLanguage === 'object'
        ? body.detectedLanguage
        : null,
  }
}
