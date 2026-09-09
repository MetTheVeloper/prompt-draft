import { getRobotsDisallowPaths } from './seo-route-policy'

function normalizeSiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function renderPublicRobotsTxt({
  siteUrl,
  indexingEnabled,
}: {
  siteUrl?: string | null
  indexingEnabled: boolean
}) {
  const lines = [
    'User-agent: *',
    'Allow: /',
    ...getRobotsDisallowPaths().map(path => `Disallow: ${path}`),
  ]

  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  if (indexingEnabled && normalizedSiteUrl) {
    lines.push(`Sitemap: ${normalizedSiteUrl}/sitemap.xml`)
  }

  return `${lines.join('\n')}\n`
}
