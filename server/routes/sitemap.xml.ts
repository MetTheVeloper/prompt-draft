import {
  buildPublicUrlInventory,
  renderSitemapXml,
} from '../../scripts/public-url-inventory'
import {
  fetchRuntimePublicInventory,
  isPublicIndexingEnabled,
  loadRuntimeBlogPublicInventory,
  normalizePublicAbsoluteUrl,
} from '../utils/public-seo-inventory'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = normalizePublicAbsoluteUrl(config.public.siteUrl)
  const indexingEnabled = isPublicIndexingEnabled(config.public.noindex)

  if (!siteUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Public site URL is not configured',
    })
  }

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  if (!indexingEnabled) {
    setHeader(event, 'Cache-Control', 'no-store')
    return renderSitemapXml([], siteUrl)
  }

  const apiBase = normalizePublicAbsoluteUrl(
    config.apiBaseInternal || config.public.apiBase,
  )

  if (!apiBase) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Public inventory API is not configured',
    })
  }

  try {
    const [dynamicInventory, blogArticles] = await Promise.all([
      fetchRuntimePublicInventory(apiBase),
      loadRuntimeBlogPublicInventory(),
    ])
    const publicInventory = buildPublicUrlInventory({
      dynamicInventory,
      blogArticles,
      indexingEnabled: true,
    })

    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return renderSitemapXml(publicInventory, siteUrl)
  } catch (error) {
    console.error('[public-seo] runtime sitemap inventory failed', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Public sitemap is temporarily unavailable',
    })
  }
})
