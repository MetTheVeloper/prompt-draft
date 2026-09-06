import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const PUBLIC_DISCOVERY_ROUTES = [
  '/discover/portrait-photography',
  '/discover/3d-sculpture',
  '/discover/illustration-animation',
  '/discover/posters-editorial',
  '/discover/product-fashion',
  '/discover/cinematic-game-art',
]

const STATIC_PUBLIC_ROUTES = [
  '/',
  ...PUBLIC_DISCOVERY_ROUTES,
]

function normalizeSiteUrl(value: string | undefined) {
  const raw = value?.trim() || ''
  if (!raw) return ''

  try {
    const url = new URL(raw)
    return url.toString().replace(/\/+$/, '')
  } catch {
    throw new Error('NUXT_PUBLIC_SITE_URL must be a valid absolute URL')
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

async function main() {
  const outputDir = resolve('.output/public')
  await mkdir(outputDir, { recursive: true })

  const siteUrl = normalizeSiteUrl(process.env.NUXT_PUBLIC_SITE_URL)
  if (!siteUrl) {
    console.log('[public-seo] NUXT_PUBLIC_SITE_URL is empty; sitemap generation skipped')
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
