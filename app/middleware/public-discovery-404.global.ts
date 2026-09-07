import { DISCOVERY_INTERESTS } from '~/composables/useDiscoveryPreferences'

const PUBLIC_DISCOVERY_SLUGS = new Set(
  DISCOVERY_INTERESTS.map(item => item.slug),
)

function notFound(): never {
  throw createError({
    statusCode: 404,
    statusMessage: 'Discovery page not found',
  })
}

export default defineNuxtRouteMiddleware((to) => {
  const match = to.path.match(/^\/(fa\/)?discover\/([^/]+)\/?$/)
  if (!match) return

  let slug = ''
  try {
    slug = decodeURIComponent(match[2] || '').trim().toLowerCase()
  } catch {
    return notFound()
  }

  if (!PUBLIC_DISCOVERY_SLUGS.has(slug)) return notFound()

  const localePrefix = match[1] ? '/fa' : ''
  const canonicalPath = `${localePrefix}/discover/${encodeURIComponent(slug)}`

  if (to.path !== canonicalPath) {
    return navigateTo(
      {
        path: canonicalPath,
        query: to.query,
        hash: to.hash,
      },
      {
        redirectCode: 301,
        replace: true,
      },
    )
  }
})
