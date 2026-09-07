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
  availableLocales: PublicPromptLocale[]
  publishedAt: string
  tags: string[]
  model: {
    previewGeneratedWith: PublicPromptModel
    optimizedFor: PublicPromptModel[]
  }
  images: PublicPromptImage[]
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

function normalizeTitle(value: unknown) {
  if (!isPlainObject(value)) return null

  const title: Partial<Record<PublicPromptLocale, string>> = {}

  for (const locale of PUBLIC_PROMPT_LOCALES) {
    const localized = typeof value[locale] === 'string' ? value[locale].trim() : ''
    if (localized) title[locale] = localized
  }

  return Object.keys(title).length ? title : null
}

function normalizeAvailableLocales(value: unknown, title: Partial<Record<PublicPromptLocale, string>>) {
  if (!Array.isArray(value)) return null

  const locales: PublicPromptLocale[] = []
  const seen = new Set<PublicPromptLocale>()

  for (const locale of value) {
    if (typeof locale !== 'string' || !PUBLIC_PROMPT_LOCALES.has(locale as PublicPromptLocale)) return null
    const normalized = locale as PublicPromptLocale
    if (!title[normalized] || seen.has(normalized)) return null
    seen.add(normalized)
    locales.push(normalized)
  }

  const titleLocales = Object.keys(title) as PublicPromptLocale[]
  if (!locales.length || locales.length !== titleLocales.length) return null
  if (titleLocales.some(locale => !seen.has(locale))) return null

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
  const title = normalizeTitle(value.title)
  const publishedAt = typeof value.publishedAt === 'string' ? value.publishedAt : ''
  const model = normalizeModel(value.model)
  const tags = normalizeTags(value.tags)

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !title ||
    !publishedAt ||
    Number.isNaN(Date.parse(publishedAt)) ||
    !model ||
    !tags ||
    !Array.isArray(value.images)
  ) {
    return null
  }

  const availableLocales = normalizeAvailableLocales(value.availableLocales, title)
  const images = value.images.map(normalizeImage)
  if (!availableLocales || images.some(image => !image)) return null

  const normalizedImages = images as PublicPromptImage[]
  const positions = normalizedImages.map(image => image.position)
  if (new Set(positions).size !== positions.length) return null

  return {
    id,
    title,
    availableLocales,
    publishedAt: new Date(publishedAt).toISOString(),
    tags,
    model,
    images: normalizedImages.sort((first, second) => first.position - second.position),
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
