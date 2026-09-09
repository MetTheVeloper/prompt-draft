import { isNoindexApplicationPath } from '../../shared/seo-route-policy'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  if (!isNoindexApplicationPath(pathname)) return

  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
})
