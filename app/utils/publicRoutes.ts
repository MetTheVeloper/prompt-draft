function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

function normalizeUsername(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) {
    throw new Error('Invalid public Creator username')
  }
  return normalized
}

export const PUBLIC_ROUTE_PATHS = {
  home: '/',
  guide: '/guide',
  blog: '/blog',
} as const

export function publicDiscoveryPath(slug: string) {
  const normalized = normalizeSlug(slug)
  if (!normalized) throw new Error('Invalid public discovery slug')
  return `/discover/${encodeURIComponent(normalized)}`
}

export function publicPromptPath(id: number | string) {
  const normalized = Number(id)
  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw new Error('Invalid public Prompt id')
  }
  return `/prompt/${normalized}`
}

export function publicCreatorPath(username: string) {
  return `/creator/${encodeURIComponent(normalizeUsername(username))}`
}

export function publicBlogPostPath(slug: string) {
  const normalized = normalizeSlug(slug)
  if (!normalized) throw new Error('Invalid public Blog slug')
  return `/blog/${encodeURIComponent(normalized)}`
}
