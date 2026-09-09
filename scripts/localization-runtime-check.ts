import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const SOURCE_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const EXCLUDED_DIRS = new Set([
  '.git', '.nuxt', '.output', '.idea', '.vscode', 'node_modules', 'dist',
  'coverage', 'reports', 'android', 'ios',
])
const EXCLUDED_FILE_PATTERNS = [
  /\/i18n\/locales\//,
  /\/i18n\/i18n\.config\.ts$/,
  /\/scripts\/localization-(?:audit|review|consolidate|runtime-check)\.(?:mjs|ts)$/,
  /\.bak(?:\.|$)/,
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function flattenMessages(
  input: unknown,
  prefix = '',
  output = new Map<string, unknown>(),
): Map<string, unknown> {
  if (!isPlainObject(input)) return output

  for (const [key, value] of Object.entries(input)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(value)) flattenMessages(value, fullKey, output)
    else output.set(fullKey, value)
  }

  return output
}

async function loadRuntimeMessages() {
  const globalScope = globalThis as typeof globalThis & {
    defineI18nConfig?: (factory: () => unknown) => () => unknown
  }

  const previous = globalScope.defineI18nConfig
  globalScope.defineI18nConfig = factory => factory

  try {
    const module = await import('../i18n/i18n.config.ts')
    const factory = module.default as unknown
    if (typeof factory !== 'function') {
      throw new Error('i18n.config.ts did not export a configuration factory')
    }

    const config = (factory as () => { messages?: Record<string, unknown> })()
    const en = config?.messages?.en
    const fa = config?.messages?.fa
    if (!isPlainObject(en) || !isPlainObject(fa)) {
      throw new Error('Runtime i18n configuration must expose both EN and FA messages')
    }

    return {
      en: flattenMessages(en),
      fa: flattenMessages(fa),
    }
  } finally {
    if (previous) globalScope.defineI18nConfig = previous
    else delete globalScope.defineI18nConfig
  }
}

async function walkSourceFiles(directory = ROOT) {
  const files: string[] = []

  async function visit(current: string) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || /^\.layout-stage\d+-backup$/i.test(entry.name)) continue
        await visit(absolute)
        continue
      }

      if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue
      const relative = `/${path.relative(ROOT, absolute).split(path.sep).join('/')}`
      if (EXCLUDED_FILE_PATTERNS.some(pattern => pattern.test(relative))) continue
      files.push(absolute)
    }
  }

  await visit(directory)
  return files.sort()
}

function extractStaticI18nKeys(source: string) {
  const keys = new Set<string>()
  const callRegex = /(?:\b(?:t|translate|tc)\b|\$t\b|\bi18n\.t\b)\s*\(\s*(["'`])([A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)+)\1/g
  const vTRegex = /\bv-t\s*=\s*(["'])\s*['"]([A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)+)['"]\s*\1/g
  const keypathRegex = /<i18n-t\b[^>]*\bkeypath\s*=\s*(["'])([A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)+)\1/gi

  for (const regex of [callRegex, vTRegex, keypathRegex]) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(source))) {
      keys.add(match[2])
    }
  }

  return keys
}

function difference(left: string[], right: Set<string>) {
  return left.filter(key => !right.has(key))
}

async function main() {
  const [{ en, fa }, sourceFiles] = await Promise.all([
    loadRuntimeMessages(),
    walkSourceFiles(),
  ])

  const usedKeys = new Set<string>()
  for (const file of sourceFiles) {
    const source = await fs.readFile(file, 'utf8')
    for (const key of extractStaticI18nKeys(source)) usedKeys.add(key)
  }

  const sortedUsedKeys = [...usedKeys].sort()
  const enKeys = new Set(en.keys())
  const faKeys = new Set(fa.keys())
  const missingFallbackEn = difference(sortedUsedKeys, enKeys)

  const creatorPrefix = 'growth.publicCreator.'
  const creatorEnKeys = [...enKeys].filter(key => key.startsWith(creatorPrefix)).sort()
  const creatorFaKeys = [...faKeys].filter(key => key.startsWith(creatorPrefix)).sort()
  const creatorMissingInFa = difference(creatorEnKeys, faKeys)
  const creatorExtraInFa = difference(creatorFaKeys, enKeys)

  const globalMissingInFa = difference([...enKeys].sort(), faKeys)
  const globalExtraInFa = difference([...faKeys].sort(), enKeys)

  console.log('Localization runtime check complete.')
  console.log(`Static i18n keys used:             ${sortedUsedKeys.length}`)
  console.log(`Missing fallback EN keys:          ${missingFallbackEn.length}`)
  console.log(`Public Creator missing in FA:      ${creatorMissingInFa.length}`)
  console.log(`Public Creator extra in FA:        ${creatorExtraInFa.length}`)
  console.log(`Global FA parity debt (info):      ${globalMissingInFa.length} missing / ${globalExtraInFa.length} extra`)

  if (missingFallbackEn.length) {
    console.error('\nMissing statically referenced fallback EN keys:')
    for (const key of missingFallbackEn) console.error(`- ${key}`)
  }

  if (creatorMissingInFa.length || creatorExtraInFa.length) {
    console.error('\nPublic Creator locale parity mismatch:')
    for (const key of creatorMissingInFa) console.error(`- missing in FA: ${key}`)
    for (const key of creatorExtraInFa) console.error(`- extra in FA: ${key}`)
  }

  if (missingFallbackEn.length || creatorMissingInFa.length || creatorExtraInFa.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Localization runtime check failed:')
  console.error(error)
  process.exitCode = 1
})
