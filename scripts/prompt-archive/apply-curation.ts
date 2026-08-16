import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type PromptItem = {
  id: number
  tags: string[]
  images: string[]
  [key: string]: unknown
}

type PromptArchive = {
  items: PromptItem[]
  [key: string]: unknown
}

type CurationConfig = {
  version: number
  tagOverrides: Record<string, string[]>
  excludeImages: Record<string, string[]>
}

const archivePath = resolve(process.cwd(), 'public/data/prompts.json')
const curationPath = resolve(process.cwd(), 'scripts/prompt-archive/curation.json')

async function main() {
  const [archiveRaw, curationRaw] = await Promise.all([
    readFile(archivePath, 'utf8'),
    readFile(curationPath, 'utf8'),
  ])

  const archive = JSON.parse(archiveRaw) as PromptArchive
  const curation = JSON.parse(curationRaw) as CurationConfig

  const ids = new Set(archive.items.map(item => item.id))
  const unknownTagIds = Object.keys(curation.tagOverrides)
    .map(Number)
    .filter(id => !ids.has(id))
  const unknownImageIds = Object.keys(curation.excludeImages)
    .map(Number)
    .filter(id => !ids.has(id))

  if (unknownTagIds.length || unknownImageIds.length) {
    throw new Error(
      `Curation references missing prompt IDs: ${[
        ...new Set([...unknownTagIds, ...unknownImageIds]),
      ].join(', ')}`,
    )
  }

  let tagUpdates = 0
  let removedImages = 0

  for (const item of archive.items) {
    const key = String(item.id)
    const tags = curation.tagOverrides[key]

    if (tags) {
      item.tags = Array.from(new Set(tags))
      tagUpdates += 1
    }

    const exclusions = new Set(curation.excludeImages[key] || [])

    if (exclusions.size) {
      const previousCount = item.images.length
      item.images = item.images.filter(image => !exclusions.has(image))
      removedImages += previousCount - item.images.length
    }
  }

  await writeFile(archivePath, `${JSON.stringify(archive, null, 2)}\n`, 'utf8')

  console.log(`[prompt-archive] curated tags: ${tagUpdates}`)
  console.log(`[prompt-archive] excluded raw images: ${removedImages}`)
}

main().catch(error => {
  console.error('[prompt-archive] Failed to apply curation:', error)
  process.exitCode = 1
})
