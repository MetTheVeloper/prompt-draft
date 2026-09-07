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
  alternateLocales?: MaybeRefOrGetter<readonly string[]>
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

function normalizeLocaleLanguage(value: unknown, fallback: string) {
  const language = typeof value === 'string' ? value.trim() : ''
  return language || fallback
}

export function usePublicSeo(options: PublicSeoOptions) {
  const config = useRuntimeConfig()
  const localePath = useLocalePath()
  const { locale, locales } = useI18n()

  const localeDefinitions = computed(() => locales.value.map((item) => {
    if (typeof item === 'string') {
      return { code: item, language: item }
    }

    return {
      code: item.code,
      language: normalizeLocaleLanguage(item.language, item.code),
    }
  }))

  const siteUrl = computed(() => normalizeSiteUrl(config.public.siteUrl))
  const title = computed(() => toValue(options.title).trim() || 'Prompt Draft')
  const description = computed(() => toValue(options.description).trim())
  const canonicalPath = computed(() => toValue(options.canonicalPath).trim())
  const localizedCanonicalPath = computed(() => canonicalPath.value
    ? localePath(canonicalPath.value, locale.value)
    : '')
  const canonicalUrl = computed(() => toAbsoluteUrl(siteUrl.value, localizedCanonicalPath.value))
  const imageUrl = computed(() => toAbsoluteUrl(siteUrl.value, toValue(options.imageUrl ?? null)))
  const contentType = computed(() => toValue(options.contentType ?? 'website'))
  const globalNoindex = computed(() => String(config.public.noindex).toLowerCase() === 'true')
  const noindex = computed(() => globalNoindex.value || Boolean(toValue(options.noindex ?? false)))
  const fullTitle = computed(() => title.value === 'Prompt Draft'
    ? title.value
    : `${title.value} · Prompt Draft`)
  const structuredData = computed(() => serializeStructuredData(toValue(options.structuredData ?? null)))

  const alternateLocaleCodes = computed(() => {
    const configuredCodes = new Set(localeDefinitions.value.map(item => item.code))
    const requested = options.alternateLocales
      ? [...toValue(options.alternateLocales)]
      : [locale.value]

    const codes = Array.from(new Set(
      requested
        .map(code => code.trim())
        .filter(code => configuredCodes.has(code)),
    ))

    if (!codes.includes(locale.value)) codes.push(locale.value)
    return codes
  })

  const alternateLinks = computed(() => {
    if (!canonicalPath.value || !siteUrl.value) return []

    const links = alternateLocaleCodes.value.flatMap((code) => {
      const definition = localeDefinitions.value.find(item => item.code === code)
      if (!definition) return []

      const href = toAbsoluteUrl(siteUrl.value, localePath(canonicalPath.value, code))
      if (!href) return []

      return [{
        rel: 'alternate',
        hreflang: definition.language,
        href,
        key: `alternate-${code}`,
      }]
    })

    const defaultCode = alternateLocaleCodes.value.includes('en') ? 'en' : alternateLocaleCodes.value[0]
    if (defaultCode) {
      const defaultHref = toAbsoluteUrl(siteUrl.value, localePath(canonicalPath.value, defaultCode))
      if (defaultHref) {
        links.push({
          rel: 'alternate',
          hreflang: 'x-default',
          href: defaultHref,
          key: 'alternate-x-default',
        })
      }
    }

    return links
  })

  const currentLocaleDefinition = computed(() => {
    return localeDefinitions.value.find(item => item.code === locale.value) ?? null
  })

  const alternateOgLocales = computed(() => alternateLocaleCodes.value
    .filter(code => code !== locale.value)
    .map((code) => {
      const definition = localeDefinitions.value.find(item => item.code === code)
      return definition?.language.replace('-', '_') || ''
    })
    .filter(Boolean))

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
    link: [
      ...(canonicalUrl.value
        ? [
            {
              rel: 'canonical',
              href: canonicalUrl.value,
              key: 'canonical',
            },
          ]
        : []),
      ...alternateLinks.value,
    ],
    meta: [
      ...(currentLocaleDefinition.value
        ? [
            {
              property: 'og:locale',
              content: currentLocaleDefinition.value.language.replace('-', '_'),
              key: 'og-locale',
            },
          ]
        : []),
      ...alternateOgLocales.value.map((value) => ({
        property: 'og:locale:alternate',
        content: value,
        key: `og-locale-alternate-${value}`,
      })),
    ],
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
    canonicalPath,
    localizedCanonicalPath,
    canonicalUrl,
    imageUrl,
    noindex,
    alternateLocaleCodes,
  }
}
