import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  projectBlogPublicInventory,
  type BlogPublicInventoryArticle,
} from '../shared/blog-public-inventory'
import { renderPublicRobotsTxt } from '../shared/public-robots'
import { readBlogRepositoryDirectory } from './blog-repository'
import {
  buildPublicUrlInventory,
  isPublicApiInventory,
  renderLlmsTxt,
  renderSitemapXml,
  type PublicApiInventory,
} from './public-url-inventory'

const PUBLIC_INVENTORY_FETCH_TIMEOUT_MS = 5000

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

async function fetchAuthoritativePublicInventory(apiBase: string): Promise<PublicApiInventory> {
  const url = new URL('/api/public/inventory', `${apiBase}/`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PUBLIC_INVENTORY_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json() as { ok?: boolean; inventory?: unknown }
    if (payload.ok !== true || !isPublicApiInventory(payload.inventory)) {
      throw new Error('invalid public inventory response')
    }

    return payload.inventory
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const outputDir = resolve('.output/public')
  await mkdir(outputDir, { recursive: true })

  const siteUrl = normalizeAbsoluteUrl(process.env.NUXT_PUBLIC_SITE_URL, 'NUXT_PUBLIC_SITE_URL')
  const apiBase = normalizeAbsoluteUrl(
    process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:4000',
    'NUXT_PUBLIC_API_BASE',
  )
  const indexingEnabled = String(process.env.NUXT_PUBLIC_NOINDEX || 'false').toLowerCase() !== 'true'

  if (!siteUrl) {
    console.log('[public-seo] NUXT_PUBLIC_SITE_URL is empty so sitemap/llms/robots generation was skipped')
    return
  }

  let dynamicInventory: PublicApiInventory = { prompts: [], creators: [] }
  let blogArticles: BlogPublicInventoryArticle[] = []

  if (indexingEnabled) {
    const [backendInventory, repositoryArticles] = await Promise.all([
      fetchAuthoritativePublicInventory(apiBase),
      readBlogRepositoryDirectory(),
    ])
    dynamicInventory = backendInventory
    blogArticles = projectBlogPublicInventory(repositoryArticles)
  }

  const publicInventory = buildPublicUrlInventory({
    dynamicInventory,
    blogArticles,
    indexingEnabled,
  })
  const sitemap = renderSitemapXml(publicInventory, siteUrl)
  const llms = renderLlmsTxt(publicInventory, siteUrl)
  const robots = renderPublicRobotsTxt({
    siteUrl,
    indexingEnabled,
  })

  await writeFile(resolve(outputDir, 'sitemap.xml'), sitemap, 'utf8')
  await writeFile(resolve(outputDir, 'llms.txt'), llms, 'utf8')
  await writeFile(resolve(outputDir, 'robots.txt'), robots, 'utf8')

  const mode = indexingEnabled ? 'indexing enabled' : 'global noindex'
  console.log(`[public-seo] sitemap + llms generated from ${publicInventory.length} canonical public routes (${mode}); Blog repository projection: ${blogArticles.length} published Article(s)`)
}

main().catch((error) => {
  console.error('[public-seo] generation failed', error)
  process.exitCode = 1
})
