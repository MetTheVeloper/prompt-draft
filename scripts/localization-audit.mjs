#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import vm from 'node:vm'

const ROOT = process.cwd()
const LOCALES_DIR = path.join(ROOT, 'i18n', 'locales')
const REPORTS_DIR = path.join(ROOT, 'reports')
const REPORT_MD = path.join(REPORTS_DIR, 'localization-audit.md')
const REPORT_JSON = path.join(REPORTS_DIR, 'localization-audit.json')

const SOURCE_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const EXCLUDED_DIRS = new Set([
  '.git', '.nuxt', '.output', '.idea', '.vscode', 'node_modules', 'dist',
  'coverage', 'reports', 'android', 'ios',
])
const EXCLUDED_FILE_PATTERNS = [
  /\/i18n\/locales\//,
  /\/scripts\/localization-(?:audit|review|consolidate)\.mjs$/,
  /\.bak(?:\.|$)/,
]

const HIGH_CONFIDENCE_ATTRS = new Set([
  'label', 'placeholder', 'title', 'subtitle', 'description', 'alt', 'tooltip',
  'aria-label', 'clear-label', 'empty-text', 'helper-text', 'confirm-label',
  'cancel-label', 'button-label',
])
const SHORT_UI_TEXT = new Set(['ok', 'go', 'on', 'off', 'no', 'yes'])
const UI_OBJECT_PROPERTIES = new Set([
  'label', 'title', 'subtitle', 'description', 'descriptionPattern', 'placeholder',
  'emptyText', 'clearLabel', 'groupLabel', 'categoryLabel', 'tooltip', 'helperText',
])

const mode = normalizeMode(process.argv.slice(2).find((arg) => !arg.startsWith('--')) || 'all')
const strict = process.argv.includes('--strict')
const stdoutOnly = process.argv.includes('--stdout')
const noHardcoded = process.argv.includes('--no-hardcoded')

function normalizeMode(value) {
  const valid = new Set(['all', 'source', 'parity', 'hardcoded'])
  if (!valid.has(value)) {
    console.error(`Unknown localization audit mode: ${value}`)
    console.error('Use one of: all, source, parity, hardcoded')
    process.exit(2)
  }
  return value
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function relativeFile(file) {
  return toPosix(path.relative(ROOT, file))
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(target, source) {
  const out = isPlainObject(target) ? { ...target } : {}
  for (const [key, value] of Object.entries(source || {})) {
    if (isPlainObject(value)) out[key] = deepMerge(out[key], value)
    else out[key] = value
  }
  return out
}

function flattenMessages(input, prefix = '', output = new Map()) {
  if (!isPlainObject(input)) return output
  for (const [key, value] of Object.entries(input)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(value)) flattenMessages(value, fullKey, output)
    else output.set(fullKey, value)
  }
  return output
}

async function importDefault(filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  const match = source.match(/^\s*export\s+default\s+([\s\S]*)$/)
  if (!match) throw new Error(`Locale file must use a plain export default object: ${relativeFile(filePath)}`)
  const expression = match[1].trim().replace(/;\s*$/, '')
  const value = vm.runInNewContext(`(${expression})`, Object.create(null), {
    filename: filePath,
    timeout: 1000,
  })
  if (!isPlainObject(value)) throw new Error(`Locale default export is not an object: ${relativeFile(filePath)}`)
  return value
}

async function loadEffectiveLocale(locale) {
  const rootPath = path.join(LOCALES_DIR, `${locale}.ts`)
  const rootMessages = await importDefault(rootPath)
  let messages = rootMessages
  const entries = await fs.readdir(LOCALES_DIR, { withFileTypes: true })
  const fragments = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(`.${locale}.ts`) && !entry.name.includes('.bak.'))
    .map((entry) => entry.name)
    .sort()
  const fragmentFlats = new Map()

  for (const fileName of fragments) {
    const moduleKey = fileName.slice(0, -`.${locale}.ts`.length)
    const fragment = await importDefault(path.join(LOCALES_DIR, fileName))
    fragmentFlats.set(moduleKey, flattenMessages(fragment))
    messages = deepMerge(messages, {
      modules: {
        ...(messages.modules || {}),
        [moduleKey]: deepMerge(messages?.modules?.[moduleKey] || {}, fragment),
      },
    })
  }

  return {
    rootMessages,
    rootFlat: flattenMessages(rootMessages),
    messages,
    flat: flattenMessages(messages),
    fragments,
    fragmentFlats,
  }
}

async function walkSourceFiles(directory = ROOT) {
  const files = []
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || /^\.layout-stage\d+-backup$/i.test(entry.name)) continue
        await visit(absolute)
        continue
      }
      if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue
      const relative = `/${toPosix(path.relative(ROOT, absolute))}`
      if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relative))) continue
      files.push(absolute)
    }
  }
  await visit(directory)
  return files.sort()
}

function lineAndColumn(source, index) {
  const before = source.slice(0, index)
  const lines = before.split('\n')
  return { line: lines.length, column: (lines.at(-1) || '').length + 1 }
}

function decodeSimpleEscapes(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([\\"'`])/g, '$1')
}

function readQuoted(source, index) {
  const quote = source[index]
  if (!['"', "'", '`'].includes(quote)) return null
  let i = index + 1
  let value = ''
  let dynamic = false
  while (i < source.length) {
    const char = source[i]
    if (char === '\\') {
      value += char
      if (i + 1 < source.length) value += source[++i]
      i += 1
      continue
    }
    if (quote === '`' && char === '$' && source[i + 1] === '{') {
      dynamic = true
      let depth = 1
      let j = i + 2
      let expression = ''
      while (j < source.length && depth > 0) {
        if (source[j] === '{') depth += 1
        if (source[j] === '}') depth -= 1
        if (depth > 0) expression += source[j]
        j += 1
      }
      value += `\${${expression}}`
      i = j
      continue
    }
    if (char === quote) return { value: decodeSimpleEscapes(value), dynamic, end: i + 1 }
    value += char
    i += 1
  }
  return null
}

function splitCallArguments(source, openParenIndex) {
  const args = []
  let currentStart = openParenIndex + 1
  let i = currentStart
  let paren = 0
  let bracket = 0
  let brace = 0
  let quote = null
  let escaped = false
  while (i < source.length) {
    const char = source[i]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      i += 1
      continue
    }
    if (['"', "'", '`'].includes(char)) { quote = char; i += 1; continue }
    if (char === '(') paren += 1
    else if (char === ')') {
      if (paren === 0 && bracket === 0 && brace === 0) {
        args.push(source.slice(currentStart, i).trim())
        return args
      }
      paren -= 1
    } else if (char === '[') bracket += 1
    else if (char === ']') bracket -= 1
    else if (char === '{') brace += 1
    else if (char === '}') brace -= 1
    else if (char === ',' && paren === 0 && bracket === 0 && brace === 0) {
      args.push(source.slice(currentStart, i).trim())
      currentStart = i + 1
    }
    i += 1
  }
  return null
}

function parseLiteralArgument(argument) {
  if (!argument) return null
  const trimmed = argument.trim()
  const parsed = readQuoted(trimmed, 0)
  return parsed && parsed.end === trimmed.length ? parsed : null
}

function looksLikeI18nKey(value) {
  return /^[A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)+$/.test(value)
}

function extractI18nCalls(source, file) {
  const staticKeys = []
  const dynamicKeys = []
  const callRegex = /(?:\b(?:t|translate|tc)\b|\$t\b|\bi18n\.t\b)\s*\(/g
  let match
  while ((match = callRegex.exec(source))) {
    const openParen = source.indexOf('(', match.index)
    const args = splitCallArguments(source, openParen)
    if (!args?.length) continue
    const first = parseLiteralArgument(args[0])
    if (!first) continue
    const pos = lineAndColumn(source, match.index)
    const fallback = parseLiteralArgument(args[1])
    if (first.dynamic) {
      dynamicKeys.push({ pattern: first.value.replace(/\$\{[^}]+\}/g, '*'), raw: first.value, file, ...pos })
    } else if (looksLikeI18nKey(first.value)) {
      staticKeys.push({ key: first.value, fallback: fallback && !fallback.dynamic ? fallback.value : '', file, ...pos })
    }
  }

  const vtRegex = /\bv-t\s*=\s*(["'])(.*?)\1/g
  while ((match = vtRegex.exec(source))) {
    const key = match[2].trim().replace(/^['"]|['"]$/g, '')
    if (looksLikeI18nKey(key)) staticKeys.push({ key, fallback: '', file, ...lineAndColumn(source, match.index) })
  }
  const keypathRegex = /<i18n-t\b[^>]*\bkeypath\s*=\s*(["'])(.*?)\1/gi
  while ((match = keypathRegex.exec(source))) {
    const key = match[2].trim()
    if (looksLikeI18nKey(key)) staticKeys.push({ key, fallback: '', file, ...lineAndColumn(source, match.index) })
  }
  return { staticKeys, dynamicKeys }
}

function normalizeCandidateText(value) {
  return String(value || '')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function isHumanEnglishText(value, { allowShort = false } = {}) {
  const text = normalizeCandidateText(value)
  if (!text || text.length > 240 || !/[A-Za-z]/.test(text)) return false
  if (text.length < 3 && !(allowShort && SHORT_UI_TEXT.has(text.toLowerCase()))) return false
  if (/^[A-Za-z0-9_.:/@#%+={}()\[\]-]+$/.test(text) && !/\s/.test(text) && !SHORT_UI_TEXT.has(text.toLowerCase())) return false
  if (/^(true|false|null|undefined|auto|none|normal|inherit)$/i.test(text)) return false
  if (/^(https?:|data:|var\(|rgb\(|hsl\()/i.test(text)) return false
  return true
}

function extractVueHardcoded(source, file) {
  if (!file.endsWith('.vue')) return []
  const results = []
  const template = source
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const textRegex = />([^<>]+)</g
  let match
  while ((match = textRegex.exec(template))) {
    const raw = match[1]
    const text = normalizeCandidateText(raw)
    if (!isHumanEnglishText(text, { allowShort: true })) continue
    if (/[{}]/.test(text) || /(?:translate|\$?t)\s*\(/.test(text) || text.includes('?.')) continue
    const absoluteIndex = source.indexOf(raw)
    results.push({
      text, file, ...lineAndColumn(source, Math.max(0, absoluteIndex)),
      confidence: 'high', reason: 'Vue template text node', property: null,
    })
  }

  const attrRegex = /(?:^|\s)(?![:@])([A-Za-z][\w-]*)\s*=\s*(["'])(.*?)\2/g
  while ((match = attrRegex.exec(template))) {
    const property = match[1]
    if (!HIGH_CONFIDENCE_ATTRS.has(property)) continue
    const text = normalizeCandidateText(match[3])
    if (!isHumanEnglishText(text, { allowShort: true })) continue
    const absoluteIndex = source.indexOf(match[0])
    results.push({
      text, file, ...lineAndColumn(source, Math.max(0, absoluteIndex)),
      confidence: 'high', reason: `Static UI attribute: ${property}`, property,
    })
  }
  return results
}

function extractCodeHardcoded(source, file) {
  const results = []
  let scanSource = source
  if (file.endsWith('.vue')) {
    scanSource = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1])
      .join('\n')
  }

  const propertyNames = [...UI_OBJECT_PROPERTIES].join('|')
  const propertyRegex = new RegExp(`\\b(${propertyNames})\\s*:\\s*(["'\\x60])([^\\n]{1,240}?)\\2`, 'g')
  let match
  while ((match = propertyRegex.exec(scanSource))) {
    const property = match[1]
    const text = normalizeCandidateText(match[3])
    if (!isHumanEnglishText(text, { allowShort: true }) || looksLikeI18nKey(text)) continue
    results.push({
      text, file, ...lineAndColumn(scanSource, match.index),
      confidence: 'medium', reason: 'UI-like object property', property,
    })
  }

  const returnRegex = /\breturn\s+(["'`])([^\n]{2,120}?)\1\s*[;\n}]/g
  while ((match = returnRegex.exec(scanSource))) {
    const text = normalizeCandidateText(match[2])
    if (!isHumanEnglishText(text) || looksLikeI18nKey(text)) continue
    results.push({
      text, file, ...lineAndColumn(scanSource, match.index),
      confidence: 'medium', reason: 'Returned display string', property: null,
    })
  }
  return results
}

function dedupe(items, identity) {
  const seen = new Set()
  return items.filter((item) => {
    const key = identity(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function humanizeKeySegment(key) {
  const segment = key.split('.').at(-1) || key
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())
}

function makeSourceAudit(staticOccurrences, dynamicOccurrences, enFlat) {
  const grouped = new Map()
  for (const occurrence of staticOccurrences) {
    const list = grouped.get(occurrence.key) || []
    list.push(occurrence)
    grouped.set(occurrence.key, list)
  }
  const missingInEn = []
  for (const [key, occurrences] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (enFlat.has(key)) continue
    const fallback = occurrences.find((item) => item.fallback)?.fallback || ''
    missingInEn.push({ key, suggestedValue: fallback || humanizeKeySegment(key), suggestionConfidence: fallback ? 100 : 60, occurrences })
  }
  return {
    usedStaticKeys: [...grouped.keys()].sort(),
    missingInEn,
    dynamicKeys: dedupe(dynamicOccurrences, (item) => `${item.pattern}|${item.file}|${item.line}`)
      .sort((a, b) => a.pattern.localeCompare(b.pattern)),
  }
}

function compareFlatMaps(enFlat, faFlat, prefix = '') {
  const enKeys = [...enFlat.keys()].sort()
  const faKeys = [...faFlat.keys()].sort()
  const withPrefix = (key) => prefix ? `${prefix}.${key}` : key
  return {
    missing: enKeys
      .filter((key) => !faFlat.has(key))
      .map((key) => ({ key: withPrefix(key), en: enFlat.get(key) })),
    extra: faKeys
      .filter((key) => !enFlat.has(key))
      .map((key) => ({ key: withPrefix(key), fa: faFlat.get(key) })),
  }
}

function makeFragmentParity(enLocale, faLocale) {
  const moduleKeys = new Set([
    ...enLocale.fragmentFlats.keys(),
    ...faLocale.fragmentFlats.keys(),
  ])
  const missing = []
  const extra = []
  const missingFiles = []
  const extraFiles = []

  for (const moduleKey of [...moduleKeys].sort()) {
    const enFlat = enLocale.fragmentFlats.get(moduleKey)
    const faFlat = faLocale.fragmentFlats.get(moduleKey)
    if (enFlat && !faFlat) {
      missingFiles.push(`${moduleKey}.fa.ts`)
      for (const [key, value] of enFlat.entries()) {
        missing.push({ key: `modules.${moduleKey}.${key}`, en: value, source: 'fragment-file-missing' })
      }
      continue
    }
    if (!enFlat && faFlat) {
      extraFiles.push(`${moduleKey}.fa.ts`)
      for (const [key, value] of faFlat.entries()) {
        extra.push({ key: `modules.${moduleKey}.${key}`, fa: value, source: 'fragment-file-extra' })
      }
      continue
    }
    if (!enFlat || !faFlat) continue
    const compared = compareFlatMaps(enFlat, faFlat, `modules.${moduleKey}`)
    missing.push(...compared.missing.map((item) => ({ ...item, source: 'fragment' })))
    extra.push(...compared.extra.map((item) => ({ ...item, source: 'fragment' })))
  }

  return { missing, extra, missingFiles, extraFiles }
}

function makeParityAudit(enLocale, faLocale, sourceAudit) {
  const inventory = compareFlatMaps(enLocale.flat, faLocale.flat)
  const activeStaticKeys = new Set(sourceAudit?.usedStaticKeys || [])
  const missingStatic = inventory.missing.filter((item) => activeStaticKeys.has(item.key))
  const fragment = makeFragmentParity(enLocale, faLocale)

  const blockingMissingByKey = new Map()
  for (const item of [...missingStatic, ...fragment.missing]) {
    if (!blockingMissingByKey.has(item.key)) blockingMissingByKey.set(item.key, item)
  }
  const blockingExtraByKey = new Map()
  for (const item of fragment.extra) {
    if (!blockingExtraByKey.has(item.key)) blockingExtraByKey.set(item.key, item)
  }

  const sameValue = [...enLocale.flat.keys()]
    .filter((key) => faLocale.flat.has(key))
    .filter((key) => typeof enLocale.flat.get(key) === 'string' && enLocale.flat.get(key) === faLocale.flat.get(key))
    .map((key) => ({ key, value: enLocale.flat.get(key) }))

  return {
    missingInFa: [...blockingMissingByKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
    extraInFa: [...blockingExtraByKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
    inventoryMissingInFa: inventory.missing,
    inventoryExtraInFa: inventory.extra,
    inactiveInventoryMissingInFa: inventory.missing.filter((item) => !blockingMissingByKey.has(item.key)),
    fragment,
    sameValue,
    emptyInEn: [...enLocale.flat.keys()].filter((key) => enLocale.flat.get(key) === '' || enLocale.flat.get(key) == null).map((key) => ({ key })),
    emptyInFa: [...faLocale.flat.keys()].filter((key) => faLocale.flat.get(key) === '' || faLocale.flat.get(key) == null).map((key) => ({ key })),
  }
}

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function buildMarkdown(report) {
  const lines = [
    '# Localization Audit', '',
    `Generated: ${report.generatedAt}`, `Mode: \`${report.mode}\``, '',
    '## Summary', '', '| Check | Count |', '| --- | ---: |',
    `| Source files scanned | ${report.summary.sourceFiles} |`,
    `| Static i18n keys used | ${report.summary.staticKeysUsed} |`,
    `| Missing in EN (active source) | ${report.summary.missingInEn} |`,
    `| Missing in FA (blocking active/fragment parity) | ${report.summary.missingInFa} |`,
    `| Extra in FA fragments (blocking) | ${report.summary.extraInFa} |`,
    `| Missing in FA full inventory (advisory) | ${report.summary.inventoryMissingInFa} |`,
    `| Extra in FA full inventory (advisory) | ${report.summary.inventoryExtraInFa} |`,
    `| Dynamic i18n patterns | ${report.summary.dynamicPatterns} |`,
    `| Hardcoded UI candidates | ${report.summary.hardcodedCandidates} |`, '',
  ]

  if (report.source) {
    lines.push('## Missing statically referenced EN keys', '')
    if (!report.source.missingInEn.length) lines.push('None. ✅', '')
    else for (const item of report.source.missingInEn) {
      lines.push(`- \`${item.key}\` → ${JSON.stringify(item.suggestedValue)}`)
    }
    lines.push('', '## Dynamic i18n patterns', '')
    if (!report.source.dynamicKeys.length) lines.push('None.')
    else for (const item of report.source.dynamicKeys) lines.push(`- \`${item.pattern}\` — \`${relativeFile(item.file)}:${item.line}\``)
    lines.push('')
  }

  if (report.parity) {
    lines.push('## Blocking EN → FA parity', '', '### Missing in FA (active static keys + locale fragments)', '')
    if (!report.parity.missingInFa.length) lines.push('None. ✅')
    else for (const item of report.parity.missingInFa) lines.push(`- \`${item.key}\` — ${markdownEscape(item.en)}`)
    lines.push('', '### Extra in FA fragments', '')
    if (!report.parity.extraInFa.length) lines.push('None. ✅')
    else for (const item of report.parity.extraInFa) lines.push(`- \`${item.key}\` — ${markdownEscape(item.fa)}`)

    lines.push('', '## Full locale inventory parity — advisory', '')
    lines.push('The full root dictionaries can contain historical/unused inventory. These gaps stay visible but do not block consolidation unless the key is used by active source or belongs to an active locale fragment.', '')
    lines.push(`- Missing in FA inventory: **${report.parity.inventoryMissingInFa.length}**`)
    lines.push(`- Extra in FA inventory: **${report.parity.inventoryExtraInFa.length}**`)
    if (report.parity.inactiveInventoryMissingInFa.length) {
      lines.push('', '### Inactive/historical EN keys absent from FA', '')
      for (const item of report.parity.inactiveInventoryMissingInFa.slice(0, 250)) {
        lines.push(`- \`${item.key}\` — ${markdownEscape(item.en)}`)
      }
      if (report.parity.inactiveInventoryMissingInFa.length > 250) {
        lines.push(`- … ${report.parity.inactiveInventoryMissingInFa.length - 250} more in JSON report`)
      }
    }
    lines.push('')
  }

  if (report.hardcoded) {
    lines.push('## Hardcoded UI candidates', '', '| Confidence | Text | Location | Property | Reason |', '| --- | --- | --- | --- | --- |')
    if (!report.hardcoded.length) lines.push('| — | None | — | — | — |')
    else for (const item of report.hardcoded) {
      lines.push(`| ${item.confidence} | ${markdownEscape(item.text)} | \`${relativeFile(item.file)}:${item.line}\` | ${item.property || ''} | ${item.reason} |`)
    }
    lines.push('')
  }

  lines.push(
    '## Notes', '',
    '- Blocking FA parity is intentionally scoped to active static source keys and complete `*.en.ts` / `*.fa.ts` fragment pairs.',
    '- Full root-locale inventory parity remains reported separately so legacy/dead keys are visible without pretending they are active UI defects.',
    '- Catalog scanning is presentation-field aware: semantic `value`, `promptText`, `absentPromptText`, keys and tokens are not harvested as UI metadata.',
    '- Short text detection is intentionally whitelist-based to catch real controls such as `OK` without turning technical two-letter tokens into UI findings.',
    '- Dynamic i18n keys are reported separately and never guessed.',
    '- This auditor is read-only apart from report files.', '',
  )
  return `${lines.join('\n')}\n`
}

async function main() {
  const [enLocale, faLocale, sourceFiles] = await Promise.all([
    loadEffectiveLocale('en'), loadEffectiveLocale('fa'), walkSourceFiles(),
  ])
  const staticOccurrences = []
  const dynamicOccurrences = []
  const hardcodedCandidates = []
  const shouldScanSource = mode === 'all' || mode === 'source' || mode === 'hardcoded'

  if (shouldScanSource) {
    for (const filePath of sourceFiles) {
      const source = await fs.readFile(filePath, 'utf8')
      const extracted = extractI18nCalls(source, filePath)
      staticOccurrences.push(...extracted.staticKeys)
      dynamicOccurrences.push(...extracted.dynamicKeys)
      if (!noHardcoded && (mode === 'all' || mode === 'hardcoded')) {
        const relative = `/${relativeFile(filePath)}`
        if (relative.startsWith('/app/') || relative.startsWith('/pages/') || relative.startsWith('/layouts/')) {
          hardcodedCandidates.push(...extractVueHardcoded(source, filePath), ...extractCodeHardcoded(source, filePath))
        }
      }
    }
  }

  const sourceAudit = mode === 'all' || mode === 'source'
    ? makeSourceAudit(staticOccurrences, dynamicOccurrences, enLocale.flat)
    : null
  const parityAudit = mode === 'all' || mode === 'parity'
    ? makeParityAudit(enLocale, faLocale, sourceAudit)
    : null
  const hardcoded = mode === 'all' || mode === 'hardcoded'
    ? dedupe(hardcodedCandidates, (item) => `${item.file}|${item.line}|${item.text}`)
        .sort((a, b) => (a.confidence === b.confidence ? relativeFile(a.file).localeCompare(relativeFile(b.file)) || a.line - b.line : a.confidence === 'high' ? -1 : 1))
    : null

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    localeFragments: { en: enLocale.fragments, fa: faLocale.fragments },
    summary: {
      sourceFiles: sourceFiles.length,
      staticKeysUsed: sourceAudit?.usedStaticKeys.length || 0,
      missingInEn: sourceAudit?.missingInEn.length || 0,
      missingInFa: parityAudit?.missingInFa.length || 0,
      extraInFa: parityAudit?.extraInFa.length || 0,
      inventoryMissingInFa: parityAudit?.inventoryMissingInFa.length || 0,
      inventoryExtraInFa: parityAudit?.inventoryExtraInFa.length || 0,
      dynamicPatterns: sourceAudit?.dynamicKeys.length || 0,
      hardcodedCandidates: hardcoded?.length || 0,
    },
    source: sourceAudit,
    parity: parityAudit,
    hardcoded,
  }

  const markdown = buildMarkdown(report)
  if (stdoutOnly) process.stdout.write(markdown)
  else {
    await fs.mkdir(REPORTS_DIR, { recursive: true })
    await Promise.all([
      fs.writeFile(REPORT_MD, markdown, 'utf8'),
      fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    ])
    console.log('Localization audit complete.')
    console.log(`Markdown: ${toPosix(path.relative(ROOT, REPORT_MD))}`)
    console.log(`JSON:     ${toPosix(path.relative(ROOT, REPORT_JSON))}`)
    console.log('')
    console.log(`Missing in EN (active):  ${report.summary.missingInEn}`)
    console.log(`Missing in FA (blocking): ${report.summary.missingInFa}`)
    console.log(`Extra in FA fragments:   ${report.summary.extraInFa}`)
    console.log(`Missing in FA inventory: ${report.summary.inventoryMissingInFa}`)
    console.log(`Dynamic key patterns:    ${report.summary.dynamicPatterns}`)
    console.log(`Hardcoded candidates:    ${report.summary.hardcodedCandidates}`)
  }

  if (strict) {
    const failures = (report.summary.missingInEn || 0) + (report.summary.missingInFa || 0) + (report.summary.extraInFa || 0)
    if (failures > 0) process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Localization audit failed:')
  console.error(error)
  process.exitCode = 1
})
