export const APPLICATION_NOINDEX_PATHS = [
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
] as const

const APPLICATION_NOINDEX_NESTED_PATHS = new Set<string>([
  '/manage',
  '/wizard',
])

export const APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS = [
  ...APPLICATION_NOINDEX_PATHS,
  ...APPLICATION_NOINDEX_PATHS
    .filter(path => APPLICATION_NOINDEX_NESTED_PATHS.has(path))
    .map(path => `${path}/**`),
] as const

export function stripPublicLocalePrefix(pathname: string) {
  if (pathname === '/fa') return '/'
  if (pathname.startsWith('/fa/')) return pathname.slice(3) || '/'
  return pathname
}

export function isNoindexApplicationPath(pathname: string) {
  const basePath = stripPublicLocalePrefix(pathname)

  return APPLICATION_NOINDEX_PATHS.some((path) => {
    if (basePath === path) return true
    return APPLICATION_NOINDEX_NESTED_PATHS.has(path) && basePath.startsWith(`${path}/`)
  })
}

export function getRobotsDisallowPaths() {
  return [
    ...APPLICATION_NOINDEX_PATHS,
    ...APPLICATION_NOINDEX_PATHS.map(path => `/fa${path}`),
  ]
}
