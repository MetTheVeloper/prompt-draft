import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DISCOVERY_CATALOG = [
  {
    slug: 'portrait-photography',
    title: 'Portraits & Photography',
    description: 'Portraits, photography, avatars, headshots and identity-led visuals.',
    tags: ['portrait', 'photography', 'avatar'],
  },
  {
    slug: '3d-sculpture',
    title: '3D & Sculpture',
    description: '3D characters, crafted objects, figurines and sculptural transformations.',
    tags: ['3d', 'sculpture'],
  },
  {
    slug: 'illustration-animation',
    title: 'Illustration & Animation',
    description: 'Illustration, anime, cartoons and animation-inspired visual styles.',
    tags: ['illustration', 'animation-style', 'anime', 'cartoon'],
  },
  {
    slug: 'posters-editorial',
    title: 'Posters & Editorial',
    description: 'Poster design, covers, editorial compositions and publication-style visuals.',
    tags: ['poster', 'editorial'],
  },
  {
    slug: 'product-fashion',
    title: 'Product & Fashion',
    description: 'Product imagery, advertising, clothing previews and fashion direction.',
    tags: ['product', 'fashion'],
  },
  {
    slug: 'cinematic-game-art',
    title: 'Cinematic & Game Art',
    description: 'Cinematic scenes, game-inspired visuals, characters and dramatic worlds.',
    tags: ['cinematic', 'game-style', 'pixel-art'],
  },
] as const

const PUBLIC_DISCOVERY_ROUTES = DISCOVERY_CATALOG.map(item => `/discover/${item.slug}`)
const STATIC_PUBLIC_ROUTES = ['/', ...PUBLIC_DISCOVERY_ROUTES]
const DISCOVERY_SNAPSHOT_LIMIT = 12
const DISCOVERY_FETCH_TIMEOUT_MS = 5000

type PublicDiscoveryItem = {
  id: number
  title: { en: string; fa: string }
  publishedAt: string
  telegramUrl: string | null
  tags: string[]
  imageCount: number
  coverImage: {
    fullUrl: string
    thumbnailUrl: string
  } | null
  owner: {
    username: string
    avatarUrl: string | null
  } | null
}

function normalizeAbsoluteUrl(value: string | undefined, label: string) {
  const raw = value?.trim() || ''
  if (!raw) return ''

  try {
    const url = new URL(raw)
    return url.toString().replace(/\/+$/, '')
  } catch {
    throw new Error(`${label} must be a valid absolute URL`)
  }
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeJsonForHtml(value: unknown) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
}

function toAbsoluteUrl(siteUrl: string, value: string | null | undefined) {
  const raw = value?.trim() || ''
  if (!raw) return ''

  try {
    return new URL(raw).toString()
  } catch {
    if (!siteUrl) return ''
    try {
      return new URL(raw.startsWith('/') ? raw : `/${raw}`, `${siteUrl}/`).toString()
    } catch {
      return ''
    }
  }
}

function replaceOrAppendHeadTag(html: string, pattern: RegExp, replacement: string) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `  ${replacement}\n</head>`)
}

function setRouteHead(
  sourceHtml: string,
  options: {
    title: string
    description: string
    canonicalUrl: string
    imageUrl: string
    structuredData: unknown
  },
) {
  const fullTitle = `${options.title} · Prompt Draft`
  let html = sourceHtml

  html = replaceOrAppendHeadTag(
    html,
    /<title[^>]*>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(fullTitle)}</title>`,
  )
  html = replaceOrAppendHeadTag(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(options.description)}">`,
  )
  html = replaceOrAppendHeadTag(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}">`,
  )
  html = replaceOrAppendHeadTag(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(options.description)}">`,
  )
  html = replaceOrAppendHeadTag(
    html,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}">`,
  )
  html = replaceOrAppendHeadTag(
    html,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(options.description)}">`,
  )

  if (options.canonicalUrl) {
    html = replaceOrAppendHeadTag(
      html,
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(options.canonicalUrl)}">`,
    )
    html = replaceOrAppendHeadTag(
      html,
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${escapeHtml(options.canonicalUrl)}">`,
    )
  }

  if (options.imageUrl) {
    html = replaceOrAppendHeadTag(
      html,
      /<meta\s+property=["']og:image["'][^>]*>/i,
      `<meta property="og:image" content="${escapeHtml(options.imageUrl)}">`,
    )
    html = replaceOrAppendHeadTag(
      html,
      /<meta\s+name=["']twitter:image["'][^>]*>/i,
      `<meta name="twitter:image" content="${escapeHtml(options.imageUrl)}">`,
    )
    html = replaceOrAppendHeadTag(
      html,
      /<meta\s+name=["']twitter:card["'][^>]*>/i,
      '<meta name="twitter:card" content="summary_large_image">',
    )
  }

  const structuredDataTag = `<script type="application/ld+json" data-public-seo-structured>${escapeJsonForHtml(options.structuredData)}</script>`
  html = html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-public-seo-structured[^>]*>[\s\S]*?<\/script>/i, '')
  html = html.replace('</head>', `  ${structuredDataTag}\n</head>`)

  return html
}

function renderStaticSnapshot(category: typeof DISCOVERY_CATALOG[number], items: PublicDiscoveryItem[]) {
  const itemMarkup = items.map((item) => {
    const image = item.coverImage?.thumbnailUrl || item.coverImage?.fullUrl || ''
    const tags = item.tags.slice(0, 8).map(tag => `<li>${escapeHtml(tag.replaceAll('-', ' '))}</li>`).join('')
    const owner = item.owner?.username
      ? `<p>By <a href="/user?un=${encodeURIComponent(item.owner.username)}">${escapeHtml(item.owner.username)}</a></p>`
      : ''

    return [
      '<article>',
      image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title.en)}" loading="lazy">` : '',
      `<h2><a href="/prompts?id=${item.id}">${escapeHtml(item.title.en)}</a></h2>`,
      `<p>${escapeHtml(item.title.fa)}</p>`,
      owner,
      tags ? `<ul aria-label="Tags">${tags}</ul>` : '',
      '</article>',
    ].join('')
  }).join('')

  return [
    '<main data-public-seo-snapshot>',
    '<header>',
    '<p>Prompt Draft · Public Discovery</p>',
    `<h1>${escapeHtml(category.title)}</h1>`,
    `<p>${escapeHtml(category.description)}</p>`,
    `<p><a href="/prompts?${category.tags.map(tag => `tag=${encodeURIComponent(tag)}`).join('&')}">Explore this category in Prompt Archive</a></p>`,
    '</header>',
    itemMarkup ? `<section aria-label="${escapeHtml(category.title)} prompts">${itemMarkup}</section>` : '',
    '</main>',
  ].join('')
}

function injectStaticSnapshot(sourceHtml: string, snapshot: string) {
  const markerPattern = /<main\s+data-public-seo-snapshot[^>]*>[\s\S]*?<\/main>/i
  if (markerPattern.test(sourceHtml)) return sourceHtml.replace(markerPattern, snapshot)

  const nuxtRootPattern = /(<div[^>]*id=["']__nuxt["'][^>]*>)/i
  if (!nuxtRootPattern.test(sourceHtml)) {
    throw new Error('Generated HTML does not contain the Nuxt app root')
  }

  return sourceHtml.replace(nuxtRootPattern, `$1${snapshot}`)
}

function createStructuredData(
  category: typeof DISCOVERY_CATALOG[number],
  items: PublicDiscoveryItem[],
  canonicalUrl: string,
  siteUrl: string,
) {
  const collectionUrl = canonicalUrl || undefined
  const itemList = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: siteUrl ? new URL(`/prompts?id=${item.id}`, `${siteUrl}/`).toString() : `/prompts?id=${item.id}`,
    name: item.title.en,
    ...(item.coverImage?.fullUrl
      ? { image: toAbsoluteUrl(siteUrl, item.coverImage.fullUrl) || item.coverImage.fullUrl }
      : {}),
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    description: category.description,
    ...(collectionUrl ? { url: collectionUrl } : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemList.length,
      itemListElement: itemList,
    },
  }
}

function isPublicDiscoveryItem(value: unknown): value is PublicDiscoveryItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const id = Number(item.id)
  const title = item.title as Record<string, unknown> | null
  if (!Number.isInteger(id) || id <= 0 || !title) return false
  if (typeof title.en !== 'string' || typeof title.fa !== 'string') return false
  if (!Array.isArray(item.tags) || item.tags.some(tag => typeof tag !== 'string')) return false
  return true
}

async function fetchDiscoveryItems(apiBase: string, category: typeof DISCOVERY_CATALOG[number]) {
  if (!apiBase) return [] as PublicDiscoveryItem[]

  const url = new URL('/api/discover', `${apiBase}/`)
  url.searchParams.set('limit', String(DISCOVERY_SNAPSHOT_LIMIT))
  for (const tag of category.tags) url.searchParams.append('tag', tag)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DISCOVERY_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json() as { ok?: boolean; items?: unknown[] }
    if (payload.ok !== true || !Array.isArray(payload.items)) {
      throw new Error('invalid discovery response')
    }

    return payload.items.filter(isPublicDiscoveryItem).slice(0, DISCOVERY_SNAPSHOT_LIMIT)
  } catch (error) {
    console.warn(`[public-seo] ${category.slug} snapshot fetch skipped: ${error instanceof Error ? error.message : String(error)}`)
    return []
  } finally {
    clearTimeout(timeout)
  }
}

async function enrichDiscoveryHtml(outputDir: string, siteUrl: string, apiBase: string) {
  let enriched = 0

  for (const category of DISCOVERY_CATALOG) {
    const route = `/discover/${category.slug}`
    const filePath = resolve(outputDir, 'discover', category.slug, 'index.html')
    let html = await readFile(filePath, 'utf8')
    const items = await fetchDiscoveryItems(apiBase, category)
    const canonicalUrl = siteUrl ? new URL(route, `${siteUrl}/`).toString() : ''
    const firstImage = items[0]?.coverImage?.fullUrl || items[0]?.coverImage?.thumbnailUrl || ''
    const imageUrl = toAbsoluteUrl(siteUrl, firstImage)

    html = setRouteHead(html, {
      title: category.title,
      description: category.description,
      canonicalUrl,
      imageUrl,
      structuredData: createStructuredData(category, items, canonicalUrl, siteUrl),
    })
    html = injectStaticSnapshot(html, renderStaticSnapshot(category, items))
    await writeFile(filePath, html, 'utf8')
    enriched += 1

    console.log(`[public-seo] enriched ${route} with ${items.length} sanitized items`)
  }

  return enriched
}

async function main() {
  const outputDir = resolve('.output/public')
  await mkdir(outputDir, { recursive: true })

  const siteUrl = normalizeAbsoluteUrl(process.env.NUXT_PUBLIC_SITE_URL, 'NUXT_PUBLIC_SITE_URL')
  const apiBase = normalizeAbsoluteUrl(
    process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:4000',
    'NUXT_PUBLIC_API_BASE',
  )

  const enrichedCount = await enrichDiscoveryHtml(outputDir, siteUrl, apiBase)

  if (!siteUrl) {
    console.log(`[public-seo] enriched ${enrichedCount} discovery routes; NUXT_PUBLIC_SITE_URL is empty so sitemap generation was skipped`)
    return
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_PUBLIC_ROUTES.map((route) => {
      const loc = new URL(route, `${siteUrl}/`).toString()
      return `  <url><loc>${escapeXml(loc)}</loc></url>`
    }),
    '</urlset>',
    '',
  ].join('\n')

  await writeFile(resolve(outputDir, 'sitemap.xml'), sitemap, 'utf8')

  const sourceRobotsPath = resolve('public/robots.txt')
  let robots = await readFile(sourceRobotsPath, 'utf8')
  robots = robots.trimEnd()
  robots += `\nSitemap: ${siteUrl}/sitemap.xml\n`
  await writeFile(resolve(outputDir, 'robots.txt'), robots, 'utf8')

  console.log(`[public-seo] sitemap generated for ${STATIC_PUBLIC_ROUTES.length} public routes`)
}

main().catch((error) => {
  console.error('[public-seo] generation failed', error)
  process.exitCode = 1
})
