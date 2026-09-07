import { computed, toValue, type MaybeRefOrGetter } from 'vue'

type PublicSeoStructuredData = Record<string, unknown> | Record<string, unknown>[]

type PublicSeoOptions = {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  canonicalPath: MaybeRefOrGetter<string>
  imageUrl?: MaybeRefOrGetter<string | null | undefined>
  contentType?: MaybeRefOrGetter<'website' | 'article'>
  noindex?: MaybeRefOrGetter<boolean>
  structuredData?: MaybeRefOrGetter<PublicSeoStructuredData | null | undefined>
}

function normalizeSiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    const url = new URL(raw)
    return url.toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

function toAbsoluteUrl(siteUrl: string, value: string | null | undefined) {
  const raw = value?.trim() || ''
  if (!raw) return ''

  try {
    return new URL(raw).toString()
  } catch {
    if (!siteUrl) return ''

    try {
      return new URL(raw.startsWith('/') ? raw : `/${raw}`, `${siteUrl}/`).toString()
    } catch {
      return ''
    }
  }
}

function serializeStructuredData(value: PublicSeoStructuredData | null | undefined) {
  if (!value) return ''

  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
}

export function usePublicSeo(options: PublicSeoOptions) {
  const config = useRuntimeConfig()

  const siteUrl = computed(() => normalizeSiteUrl(config.public.siteUrl))
  const title = computed(() => toValue(options.title).trim() || 'Prompt Draft')
  const description = computed(() => toValue(options.description).trim())
  const canonicalPath = computed(() => toValue(options.canonicalPath).trim())
  const canonicalUrl = computed(() => toAbsoluteUrl(siteUrl.value, canonicalPath.value))
  const imageUrl = computed(() => toAbsoluteUrl(siteUrl.value, toValue(options.imageUrl ?? null)))
  const contentType = computed(() => toValue(options.contentType ?? 'website'))
  const globalNoindex = computed(() => String(config.public.noindex).toLowerCase() === 'true')
  const noindex = computed(() => globalNoindex.value || Boolean(toValue(options.noindex ?? false)))
  const fullTitle = computed(() => title.value === 'Prompt Draft'
    ? title.value
    : `${title.value} · Prompt Draft`)
  const structuredData = computed(() => serializeStructuredData(toValue(options.structuredData ?? null)))

  useSeoMeta({
    title: () => fullTitle.value,
    description: () => description.value,
    ogTitle: () => fullTitle.value,
    ogDescription: () => description.value,
    ogType: () => contentType.value,
    ogUrl: () => canonicalUrl.value || undefined,
    ogImage: () => imageUrl.value || undefined,
    twitterCard: () => imageUrl.value ? 'summary_large_image' : 'summary',
    twitterTitle: () => fullTitle.value,
    twitterDescription: () => description.value,
    twitterImage: () => imageUrl.value || undefined,
    robots: () => noindex.value ? 'noindex, nofollow, noarchive' : 'index, follow',
  })

  useHead(() => ({
    link: canonicalUrl.value
      ? [
          {
            rel: 'canonical',
            href: canonicalUrl.value,
            key: 'canonical',
          },
        ]
      : [],
    script: structuredData.value
      ? [
          {
            type: 'application/ld+json',
            key: 'public-seo-structured',
            innerHTML: structuredData.value,
          },
        ]
      : [],
  }))

  return {
    siteUrl,
    canonicalUrl,
    imageUrl,
    noindex,
  }
}
