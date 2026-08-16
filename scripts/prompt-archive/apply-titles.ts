import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type LocalizedTitle = { fa: string; en: string }
type TitleConfig = {
  schemaVersion: number
  keyPattern: string
  items: Record<string, LocalizedTitle>
}

const root = process.cwd()
const archivePath = resolve(root, 'public/data/prompts.json')
const titlesPath = resolve(root, 'scripts/prompt-archive/titles.json')

function toPatchSource(locale: 'fa' | 'en', titles: TitleConfig) {
  const lines = ['export default {']

  for (const [id, value] of Object.entries(titles.items)) {
    const key = titles.keyPattern.replace('{id}', id)
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value[locale])},`)
  }

  lines.push('}', '')
  return lines.join('\n')
}

async function main() {
  const [archiveRaw, titlesRaw] = await Promise.all([
    readFile(archivePath, 'utf8'),
    readFile(titlesPath, 'utf8'),
  ])

  const archive = JSON.parse(archiveRaw)
  const titles = JSON.parse(titlesRaw) as TitleConfig
  const archiveIds = new Set<string>(
    archive.items.map((item: { id: number }) => String(item.id)),
  )
  const titleIds = new Set(Object.keys(titles.items))

  const missing = [...archiveIds].filter(id => !titleIds.has(id))
  const stale = [...titleIds].filter(id => !archiveIds.has(id))

  if (missing.length) {
    throw new Error(`Missing curated titles for message IDs: ${missing.join(', ')}`)
  }

  if (stale.length) {
    console.warn(`[prompt titles] Curated IDs not present in archive: ${stale.join(', ')}`)
  }

  archive.schemaVersion = Math.max(Number(archive.schemaVersion) || 1, 2)

  for (const item of archive.items) {
    const id = String(item.id)
    const titleKey = titles.keyPattern.replace('{id}', id)

    if (!item.sourceTitle) {
      item.sourceTitle = item.title || ''
    }

    item.titleKey = titleKey
    delete item.title
  }

  await Promise.all([
    writeFile(archivePath, `${JSON.stringify(archive, null, 2)}\n`, 'utf8'),
    writeFile(
      resolve(root, 'scripts/i18n-patches/fa.prompts-titles.ts'),
      toPatchSource('fa', titles),
      'utf8',
    ),
    writeFile(
      resolve(root, 'scripts/i18n-patches/en.prompts-titles.ts'),
      toPatchSource('en', titles),
      'utf8',
    ),
  ])

  console.log(`[prompt titles] Applied ${archive.items.length} localized title keys`)
}

main().catch((error) => {
  console.error('[prompt titles]', error)
  process.exitCode = 1
})
