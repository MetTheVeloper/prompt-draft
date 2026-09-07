export default defineEventHandler((event) => {
  const noindex = String(process.env.NUXT_PUBLIC_NOINDEX ?? '').toLowerCase() === 'true'

  if (!noindex) return

  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
})
