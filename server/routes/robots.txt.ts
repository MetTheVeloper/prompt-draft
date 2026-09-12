import { isPublicIndexingEnabledForRequest } from '../../shared/public-indexing-policy'
import { renderPublicRobotsTxt } from '../../shared/public-robots'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const indexingEnabled = isPublicIndexingEnabledForRequest(
    config.public.noindex,
    getRequestHost(event),
  )

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  if (!indexingEnabled) setHeader(event, 'Cache-Control', 'no-store')

  return renderPublicRobotsTxt({
    siteUrl: String(config.public.siteUrl ?? ''),
    indexingEnabled,
  })
})
