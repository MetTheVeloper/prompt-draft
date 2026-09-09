import {
  normalizePublicCreatorAttribution,
  type PublicCreatorAttribution,
} from '~/utils/publicCreatorAttribution'

export type PublicPromptLocale = 'en' | 'fa'
export type PublicPromptModel = 'dall-e' | 'gpt-image-1'

export type PublicPromptImage = {
  position: number
  fullUrl: string
  thumbnailUrl: string
}

export type PublicPrompt = {
  id: number
  title: Partial<Record<PublicPromptLocale, string>>
  description: Partial<Record<PublicPromptLocale, string>>
  availableLocales: PublicPromptLocale[]
  publishedAt: string
  telegramMessageId: number | null
  tags: string[]
  model: {
    previewGeneratedWith: PublicPromptModel
    optimizedFor: PublicPromptModel[]
  }
  images: PublicPromptImage[]
  creator: PublicCreatorAttribution | null
}

type PublicPromptResponse = {
  ok: true
  prompt: unknown
}

const PUBLIC_PROMPT_LOCALES = new Set<PublicPromptLocale>(['en', 'fa'])
const PUBLIC_PROMPT_MODELS = new Set<PublicPromptModel>(['dall-e', 'gpt-image-1'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function normalizeLocalizedText(value: unknown) {
  if (!isPlainObject(value)) return null

  const localized: Partial<Record<PublicPromptLocale, string>> = {}

  for (const locale of PUBLIC_PROMPT_LOCALES) {
    const text = typeof value[locale] === 'string' ? value[locale].trim() : ''
    if (text) localized[locale] = text
  }

  return Object.keys(localized).length ? localized : null
}

function normalizeAvailableLocales(
  value: unknown,
  title: Partial<Record<PublicPromptLocale, string>>,
  description: Partial<Record<PublicPromptLocale, string>>,
) {
  if (!Array.isArray(value)) return null

  const locales: PublicPromptLocale[] = []
  const seen = new Set<PublicPromptLocale>()

  for (const locale of value) {
    if (typeof locale !== 'string' || !PUBLIC_PROMPT_LOCALES.has(locale as PublicPromptLocale)) return null
    const normalized = locale as PublicPromptLocale
    if (!title[normalized] || !description[normalized] || seen.has(normalized)) return null
    seen.add(normalized)
    locales.push(normalized)
  }

  const titleLocales = Object.keys(title) as PublicPromptLocale[]
  const descriptionLocales = Object.keys(description) as PublicPromptLocale[]

  if (!locales.length) return null
  if (locales.length !== titleLocales.length || locales.length !== descriptionLocales.length) return null
  if (titleLocales.some(locale => !seen.has(locale))) return null
  if (descriptionLocales.some(locale => !seen.has(locale))) return null

  return locales
}

function normalizeModel(value: unknown) {
  if (!isPlainObject(value)) return null

  const previewGeneratedWith = value.previewGeneratedWith
  const optimizedFor = value.optimizedFor

  if (
    typeof previewGeneratedWith !== 'string' ||
    !PUBLIC_PROMPT_MODELS.has(previewGeneratedWith as PublicPromptModel) ||
    !Array.isArray(optimizedFor) ||
    optimizedFor.some(model => typeof model !== 'string' || !PUBLIC_PROMPT_MODELS.has(model as PublicPromptModel))
  ) {
    return null
  }

  return {
    previewGeneratedWith: previewGeneratedWith as PublicPromptModel,
    optimizedFor: optimizedFor as PublicPromptModel[],
  }
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value) || value.some(tag => typeof tag !== 'string')) return null
  return value.map(tag => tag.trim()).filter(Boolean)
}

function normalizeTelegramMessageId(value: unknown) {
  if (value === null || value === undefined) return null
  const telegramMessageId = Number(value)
  return Number.isSafeInteger(telegramMessageId) && telegramMessageId > 0
    ? telegramMessageId
    : undefined
}

function normalizeImage(value: unknown): PublicPromptImage | null {
  if (!isPlainObject(value)) return null

  const position = Number(value.position)
  const fullUrl = typeof value.fullUrl === 'string' ? value.fullUrl.trim() : ''
  const thumbnailUrl = typeof value.thumbnailUrl === 'string'
    ? value.thumbnailUrl.trim()
    : fullUrl

  if (!Number.isInteger(position) || position < 0 || !fullUrl) return null

  return {
    position,
    fullUrl,
    thumbnailUrl: thumbnailUrl || fullUrl,
  }
}

export function normalizePublicPrompt(value: unknown): PublicPrompt | null {
  if (!isPlainObject(value)) return null

  const id = Number(value.id)
  const title = normalizeLocalizedText(value.title)
  const description = normalizeLocalizedText(value.description)
  const publishedAt = typeof value.publishedAt === 'string' ? value.publishedAt : ''
  const telegramMessageId = normalizeTelegramMessageId(value.telegramMessageId)
  const model = normalizeModel(value.model)
  const tags = normalizeTags(value.tags)
  const creator = normalizePublicCreatorAttribution(value.creator)

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !title ||
    !description ||
    !publishedAt ||
    Number.isNaN(Date.parse(publishedAt)) ||
    telegramMessageId === undefined ||
    !model ||
    !tags ||
    creator === undefined ||
    !Array.isArray(value.images)
  ) {
    return null
  }

  const availableLocales = normalizeAvailableLocales(value.availableLocales, title, description)
  const images = value.images.map(normalizeImage)
  if (!availableLocales || images.some(image => !image)) return null

  const normalizedImages = images as PublicPromptImage[]
  const positions = normalizedImages.map(image => image.position)
  if (new Set(positions).size !== positions.length) return null

  return {
    id,
    title,
    description,
    availableLocales,
    publishedAt: new Date(publishedAt).toISOString(),
    telegramMessageId,
    tags,
    model,
    images: normalizedImages.sort((first, second) => first.position - second.position),
    creator,
  }
}

export function usePublicPrompt() {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(
    import.meta.server ? config.apiBaseInternal : config.public.apiBase,
  )

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  async function load(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('Invalid public Prompt id')
    }

    const response = await $fetch<PublicPromptResponse>(endpoint(`/api/public/prompts/${id}`))
    if (!response || response.ok !== true) {
      throw new Error('Invalid public Prompt response')
    }

    const prompt = normalizePublicPrompt(response.prompt)
    if (!prompt || prompt.id !== id) {
      throw new Error('Invalid public Prompt response')
    }

    return prompt
  }

  return { load }
}
