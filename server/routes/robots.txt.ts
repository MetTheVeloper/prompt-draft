import { renderPublicRobotsTxt } from '../../shared/public-robots'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const indexingEnabled = String(config.public.noindex ?? '').toLowerCase() !== 'true'

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return renderPublicRobotsTxt({
    siteUrl: String(config.public.siteUrl ?? ''),
    indexingEnabled,
  })
})
