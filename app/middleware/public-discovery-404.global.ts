import { DISCOVERY_INTERESTS } from '~/composables/useDiscoveryPreferences'

const PUBLIC_DISCOVERY_SLUGS = new Set(
  DISCOVERY_INTERESTS.map(item => item.slug),
)

export default defineNuxtRouteMiddleware((to) => {
  const match = to.path.match(/^\/(?:fa\/)?discover\/([^/]+)\/?$/)
  if (!match) return

  const slug = decodeURIComponent(match[1] || '').trim().toLowerCase()
  if (PUBLIC_DISCOVERY_SLUGS.has(slug)) return

  throw createError({
    statusCode: 404,
    statusMessage: 'Discovery page not found',
  })
})
