const NOINDEX_EXACT_PATHS = new Set([
  '/create',
  '/collage',
  '/vectorizer',
  '/history',
  '/dashboard',
  '/login',
  '/manage',
  '/wizard',
  '/prompts',
  '/user',
])

const NOINDEX_PREFIXES = [
  '/manage/',
  '/wizard/',
] as const

function stripLocalePrefix(pathname: string) {
  if (pathname === '/fa') return '/'
  if (pathname.startsWith('/fa/')) return pathname.slice(3) || '/'
  return pathname
}

function isNoindexApplicationPath(pathname: string) {
  const basePath = stripLocalePrefix(pathname)
  if (NOINDEX_EXACT_PATHS.has(basePath)) return true
  return NOINDEX_PREFIXES.some(prefix => basePath.startsWith(prefix))
}

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  if (!isNoindexApplicationPath(pathname)) return

  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
})
