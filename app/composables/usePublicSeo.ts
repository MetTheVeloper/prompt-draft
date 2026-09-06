type PublicSeoOptions = {
  title: string
  description: string
  canonicalPath: string
  imageUrl?: string | null
  contentType?: 'website' | 'article'
  noindex?: boolean
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

export function usePublicSeo(options: PublicSeoOptions) {
  const config = useRuntimeConfig()
  const siteUrl = normalizeSiteUrl(config.public.siteUrl)
  const canonicalUrl = toAbsoluteUrl(siteUrl, options.canonicalPath)
  const imageUrl = toAbsoluteUrl(siteUrl, options.imageUrl)
  const fullTitle = options.title === 'Prompt Draft'
    ? options.title
    : `${options.title} · Prompt Draft`

  useSeoMeta({
    title: fullTitle,
    description: options.description,
    ogTitle: fullTitle,
    ogDescription: options.description,
    ogType: options.contentType || 'website',
    ...(canonicalUrl ? { ogUrl: canonicalUrl } : {}),
    ...(imageUrl ? { ogImage: imageUrl } : {}),
    twitterCard: imageUrl ? 'summary_large_image' : 'summary',
    twitterTitle: fullTitle,
    twitterDescription: options.description,
    ...(imageUrl ? { twitterImage: imageUrl } : {}),
    robots: options.noindex ? 'noindex, nofollow' : 'index, follow',
  })

  if (canonicalUrl) {
    useHead({
      link: [
        {
          rel: 'canonical',
          href: canonicalUrl,
        },
      ],
    })
  }

  return {
    siteUrl,
    canonicalUrl,
    imageUrl,
  }
}
