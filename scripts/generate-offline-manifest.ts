import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

const outputDirectory = resolve(process.cwd(), '.output/public')
const manifestPath = resolve(outputDirectory, 'offline-manifest.json')

const excludedFiles = new Set([
  'offline-manifest.json',
  'sw.js',
  'service-worker.js',
  '.DS_Store',
])

type OfflineAsset = {
  url: string
  size: number
  revision: string
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath))
      continue
    }

    if (entry.isFile()) {
      files.push(absolutePath)
    }
  }

  return files
}

function toPublicUrl(filePath: string) {
  const relativePath = relative(outputDirectory, filePath)
  const segments = relativePath.split(sep).map(segment => encodeURIComponent(segment))

  return `/${segments.join('/')}`
}

async function createAsset(filePath: string): Promise<OfflineAsset> {
  const [buffer, fileStat] = await Promise.all([
    readFile(filePath),
    stat(filePath),
  ])

  return {
    url: toPublicUrl(filePath),
    size: fileStat.size,
    revision: createHash('sha256').update(buffer).digest('hex').slice(0, 20),
  }
}

async function main() {
  const files = (await collectFiles(outputDirectory))
    .filter(filePath => !excludedFiles.has(relative(outputDirectory, filePath)))

  const assets = await Promise.all(files.map(createAsset))
  assets.sort((a, b) => a.url.localeCompare(b.url))

  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)
  const versionSource = assets
    .map(asset => `${asset.url}:${asset.revision}:${asset.size}`)
    .join('\n')
  const version = createHash('sha256')
    .update(versionSource)
    .digest('hex')
    .slice(0, 20)

  const manifest = {
    version,
    generatedAt: new Date().toISOString(),
    totalFiles: assets.length,
    totalBytes,
    assets,
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  const sizeInMb = (totalBytes / 1024 / 1024).toFixed(1)
  console.log(`[offline] ${assets.length} files · ${sizeInMb} MB · version ${version}`)
}

main().catch((error) => {
  console.error('[offline] Failed to generate offline manifest:', error)
  process.exitCode = 1
})
