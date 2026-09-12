import { isPublicIndexingEnabledForRequest } from '../../shared/public-indexing-policy'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const requestHost = getRequestHost(event)

  if (isPublicIndexingEnabledForRequest(config.public.noindex, requestHost)) return

  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
})
