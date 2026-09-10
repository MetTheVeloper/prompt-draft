import { readdirSync, readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import { assertValidBlogRepositoryAssets } from '../shared/blog-article'

async function collectTextAssets(rootDir: string, currentDir = rootDir, assets: Record<string, string> = {}) {
  const entries = await readdir(currentDir, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await collectTextAssets(rootDir, absolute, assets)
      continue
    }
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.json') && !entry.name.endsWith('.md')) continue
    const key = relative(rootDir, absolute).split(sep).join('/')
    assets[key] = await readFile(absolute, 'utf8')
  }
  return assets
}

function collectTextAssetsSync(rootDir: string, currentDir = rootDir, assets: Record<string, string> = {}) {
  const entries = readdirSync(currentDir, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      collectTextAssetsSync(rootDir, absolute, assets)
      continue
    }
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.json') && !entry.name.endsWith('.md')) continue
    const key = relative(rootDir, absolute).split(sep).join('/')
    assets[key] = readFileSync(absolute, 'utf8')
  }
  return assets
}

export async function readBlogRepositoryDirectory(
  rootDir = resolve(process.cwd(), 'content/blog'),
) {
  const assets = await collectTextAssets(rootDir)
  return assertValidBlogRepositoryAssets(assets)
}

export function readBlogRepositoryDirectorySync(
  rootDir = resolve(process.cwd(), 'content/blog'),
) {
  const assets = collectTextAssetsSync(rootDir)
  return assertValidBlogRepositoryAssets(assets)
}
