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
  '.git',
  '.nuxt',
  '.output',
  '.idea',
  '.vscode',
  'node_modules',
  'dist',
  'coverage',
  'reports',
  'android',
  'ios',
])
const EXCLUDED_FILE_PATTERNS = [
  /\/i18n\/locales\//,
  /\/scripts\/localization-audit\.mjs$/,
  /\.bak(?:\.|$)/,
]

const HIGH_CONFIDENCE_ATTRS = new Set([
  'label',
  'placeholder',
  'title',
  'description',
  'aria-label',
  'clear-label',
  'empty-text',
  'confirm-label',
  'cancel-label',
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(target, source) {
  const out = isPlainObject(target) ? { ...target } : {}

  for (const [key, value] of Object.entries(source || {})) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value)
    } else if (isPlainObject(value)) {
      out[key] = deepMerge({}, value)
    } else {
      out[key] = value
    }
  }

  return out
}

function flattenMessages(input, prefix = '', output = new Map()) {
  if (!isPlainObject(input)) return output

  for (const [key, value] of Object.entries(input)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (isPlainObject(value)) {
      flattenMessages(value, fullKey, output)
      continue
    }

    output.set(fullKey, value)
  }

  return output
}

async function importDefault(filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  const match = source.match(/^\s*export\s+default\s+([\s\S]*)$/)
  if (!match) {
    throw new Error(`Locale file must use a plain export default object: ${relativeFile(filePath)}`)
  }

  const expression = match[1].trim().replace(/;\s*$/, '')
  const value = vm.runInNewContext(`(${expression})`, Object.create(null), {
    filename: filePath,
    timeout: 1000,
  })

  if (!isPlainObject(value)) {
    throw new Error(`Locale default export is not an object: ${relativeFile(filePath)}`)
  }

  return value
}

async function loadEffectiveLocale(locale) {
  const rootPath = path.join(LOCALES_DIR, `${locale}.ts`)
  let messages = await importDefault(rootPath)
  const entries = await fs.readdir(LOCALES_DIR, { withFileTypes: true })

  const fragmentNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(`.${locale}.ts`))
    .filter((name) => !name.includes('.bak.'))
    .sort()

  for (const fileName of fragmentNames) {
    const moduleKey = fileName.slice(0, -`.${locale}.ts`.length)
    const fragment = await importDefault(path.join(LOCALES_DIR, fileName))
    const currentModule = messages?.modules?.[moduleKey] || {}

    messages = deepMerge(messages, {
      modules: {
        ...(messages.modules || {}),
        [moduleKey]: deepMerge(currentModule, fragment),
      },
    })
  }

  return {
    messages,
    flat: flattenMessages(messages),
    fragments: fragmentNames,
  }
}

async function walkSourceFiles(directory = ROOT) {
  const files = []

  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith('.') && EXCLUDED_DIRS.has(entry.name)) continue
      const absolute = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue
        await visit(absolute)
        continue
      }

      if (!entry.isFile()) continue
      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue

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
  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  }
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
      if (i + 1 < source.length) {
        value += source[i + 1]
        i += 2
        continue
      }
    }

    if (quote === '`' && char === '$' && source[i + 1] === '{') {
      dynamic = true
      let depth = 1
      let j = i + 2
      let expression = ''

      while (j < source.length && depth > 0) {
        const current = source[j]
        if (current === '{') depth += 1
        if (current === '}') depth -= 1
        if (depth > 0) expression += current
        j += 1
      }

      value += `\${${expression}}`
      i = j
      continue
    }

    if (char === quote) {
      return {
        raw: source.slice(index, i + 1),
        value: decodeSimpleEscapes(value),
        dynamic,
        end: i + 1,
      }
    }

    value += char
    i += 1
  }

  return null
}

function decodeSimpleEscapes(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([\\"'`])/g, '$1')
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
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      i += 1
      continue
    }

    if (['"', "'", '`'].includes(char)) {
      quote = char
      i += 1
      continue
    }

    if (char === '(') paren += 1
    else if (char === ')') {
      if (paren === 0 && bracket === 0 && brace === 0) {
        args.push(source.slice(currentStart, i).trim())
        return { args, end: i + 1 }
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
  if (!parsed || parsed.end !== trimmed.length) return null
  return parsed
}

function looksLikeI18nKey(value) {
  return /^[A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)+$/.test(value)
}

function dynamicPattern(value) {
  return value.replace(/\$\{[^}]+\}/g, '*')
}

function extractI18nCalls(source, file) {
  const staticKeys = []
  const dynamicKeys = []
  const callRegex = /(?:\b(?:t|translate|tc)\b|\$t\b|\bi18n\.t\b)\s*\(/g
  let match

  while ((match = callRegex.exec(source))) {
    const openParen = source.indexOf('(', match.index)
    const parsedCall = splitCallArguments(source, openParen)
    if (!parsedCall?.args?.length) continue

    const first = parseLiteralArgument(parsedCall.args[0])
    if (!first) continue

    const pos = lineAndColumn(source, match.index)
    const fallback = parseLiteralArgument(parsedCall.args[1])

    if (first.dynamic) {
      dynamicKeys.push({
        pattern: dynamicPattern(first.value),
        raw: first.value,
        file,
        ...pos,
      })
      continue
    }

    if (!looksLikeI18nKey(first.value)) continue

    staticKeys.push({
      key: first.value,
      fallback: fallback && !fallback.dynamic ? fallback.value : '',
      file,
      ...pos,
    })
  }

  const vtRegex = /\bv-t\s*=\s*(["'])(.*?)\1/g
  while ((match = vtRegex.exec(source))) {
    const raw = match[2].trim().replace(/^['"]|['"]$/g, '')
    if (!looksLikeI18nKey(raw)) continue
    const pos = lineAndColumn(source, match.index)
    staticKeys.push({ key: raw, fallback: '', file, ...pos })
  }

  const keypathRegex = /<i18n-t\b[^>]*\bkeypath\s*=\s*(["'])(.*?)\1/gi
  while ((match = keypathRegex.exec(source))) {
    const key = match[2].trim()
    if (!looksLikeI18nKey(key)) continue
    const pos = lineAndColumn(source, match.index)
    staticKeys.push({ key, fallback: '', file, ...pos })
  }

  return { staticKeys, dynamicKeys }
}

function isHumanEnglishText(value) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length < 3 || text.length > 240) return false
  if (!/[A-Za-z]/.test(text)) return false
  if (/^[A-Za-z0-9_.:/@#%+={}()\[\]-]+$/.test(text) && !/\s/.test(text)) return false
  if (/^(true|false|null|undefined|auto|none|normal|inherit)$/i.test(text)) return false
  if (/^(https?:|data:|var\(|rgb\(|hsl\()/i.test(text)) return false
  return true
}

function normalizeCandidateText(value) {
  return value
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractVueHardcoded(source, file) {
  const results = []
  if (!file.endsWith('.vue')) return results

  const template = source
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const textRegex = />([^<>]+)</g
  let match
  while ((match = textRegex.exec(template))) {
    const text = normalizeCandidateText(match[1])
    if (!text || !isHumanEnglishText(text)) continue
    if (/^[·•◦–—\-\s]+$/.test(text)) continue

    const pos = lineAndColumn(source, source.indexOf(match[1]))
    results.push({
      text,
      file,
      ...pos,
      confidence: 'high',
      reason: 'Vue template text node',
    })
  }

  const attrRegex = /(?:^|\s)(?![:@])([A-Za-z][\w-]*)\s*=\s*(["'])(.*?)\2/g
  while ((match = attrRegex.exec(template))) {
    const attr = match[1]
    if (!HIGH_CONFIDENCE_ATTRS.has(attr)) continue
    const text = normalizeCandidateText(match[3])
    if (!isHumanEnglishText(text)) continue

    const absoluteIndex = source.indexOf(match[0])
    const pos = lineAndColumn(source, Math.max(0, absoluteIndex))
    results.push({
      text,
      file,
      ...pos,
      confidence: 'high',
      reason: `Static UI attribute: ${attr}`,
    })
  }

  return results
}

function extractCodeHardcoded(source, file) {
  const results = []
  if (file.endsWith('.vue')) {
    const scriptMatches = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    source = scriptMatches.map((match) => match[1]).join('\n')
  }

  const patterns = [
    {
      regex: /\b(?:label|title|description|placeholder|emptyText|clearLabel)\s*:\s*(["'`])([^\n]{2,240}?)\1/g,
      reason: 'UI-like object property',
    },
    {
      regex: /\breturn\s+(["'`])([^\n]{2,120}?)\1\s*[;\n}]/g,
      reason: 'Returned display string',
    },
  ]

  for (const { regex, reason } of patterns) {
    let match
    while ((match = regex.exec(source))) {
      const text = normalizeCandidateText(match[2])
      if (!isHumanEnglishText(text)) continue
      if (looksLikeI18nKey(text)) continue
      const pos = lineAndColumn(source, match.index)
      results.push({
        text,
        file,
        ...pos,
        confidence: 'medium',
        reason,
      })
    }
  }

  return results
}

function dedupeOccurrences(items, identity) {
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

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function relativeFile(file) {
  return toPosix(path.relative(ROOT, file))
}

function isUiSourceFile(file) {
  const relative = `/${toPosix(path.relative(ROOT, file))}`
  return relative.startsWith('/app/') || relative.startsWith('/pages/') || relative.startsWith('/layouts/')
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
    missingInEn.push({
      key,
      suggestedValue: fallback || humanizeKeySegment(key),
      suggestionConfidence: fallback ? 100 : 60,
      occurrences,
    })
  }

  return {
    usedStaticKeys: [...grouped.keys()].sort(),
    missingInEn,
    dynamicKeys: dedupeOccurrences(dynamicOccurrences, (item) => `${item.pattern}|${item.file}|${item.line}`)
      .sort((a, b) => a.pattern.localeCompare(b.pattern)),
  }
}

function makeParityAudit(enFlat, faFlat) {
  const enKeys = [...enFlat.keys()].sort()
  const faKeys = [...faFlat.keys()].sort()

  const missingInFa = enKeys
    .filter((key) => !faFlat.has(key))
    .map((key) => ({ key, en: enFlat.get(key) }))

  const extraInFa = faKeys
    .filter((key) => !enFlat.has(key))
    .map((key) => ({ key, fa: faFlat.get(key) }))

  const sameValue = enKeys
    .filter((key) => faFlat.has(key))
    .filter((key) => typeof enFlat.get(key) === 'string' && enFlat.get(key) === faFlat.get(key))
    .map((key) => ({ key, value: enFlat.get(key) }))

  const emptyInEn = enKeys
    .filter((key) => enFlat.get(key) === '' || enFlat.get(key) == null)
    .map((key) => ({ key }))

  const emptyInFa = faKeys
    .filter((key) => faFlat.get(key) === '' || faFlat.get(key) == null)
    .map((key) => ({ key }))

  return { missingInFa, extraInFa, sameValue, emptyInEn, emptyInFa }
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# Localization Audit')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Mode: \`${report.mode}\``)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Check | Count |')
  lines.push('| --- | ---: |')
  lines.push(`| Source files scanned | ${report.summary.sourceFiles} |`)
  lines.push(`| Static i18n keys used | ${report.summary.staticKeysUsed} |`)
  lines.push(`| Missing in EN | ${report.summary.missingInEn} |`)
  lines.push(`| Missing in FA | ${report.summary.missingInFa} |`)
  lines.push(`| Extra keys in FA | ${report.summary.extraInFa} |`)
  lines.push(`| Dynamic i18n patterns | ${report.summary.dynamicPatterns} |`)
  lines.push(`| Hardcoded UI candidates | ${report.summary.hardcodedCandidates} |`)
  lines.push('')

  if (report.source) {
    lines.push('## EN patch plan — keys used in source but missing in EN')
    lines.push('')
    if (!report.source.missingInEn.length) {
      lines.push('No statically referenced keys are missing in the effective English locale. ✅')
    } else {
      for (const item of report.source.missingInEn) {
        lines.push(`### \`${item.key}\``)
        lines.push('')
        lines.push(`Suggested EN: **${markdownEscape(item.suggestedValue)}**`)
        lines.push(`Suggestion confidence: **${item.suggestionConfidence}%**`)
        lines.push('')
        lines.push('Used at:')
        for (const occurrence of item.occurrences.slice(0, 8)) {
          const fallback = occurrence.fallback ? ` — fallback: \`${markdownEscape(occurrence.fallback)}\`` : ''
          lines.push(`- \`${relativeFile(occurrence.file)}:${occurrence.line}:${occurrence.column}\`${fallback}`)
        }
        lines.push('')
      }

      lines.push('### Suggested flat EN patch map')
      lines.push('')
      lines.push('```text')
      for (const item of report.source.missingInEn) {
        lines.push(`${JSON.stringify(item.key)}: ${JSON.stringify(item.suggestedValue)},`)
      }
      lines.push('```')
      lines.push('')
    }

    lines.push('## Dynamic i18n keys — review required')
    lines.push('')
    if (!report.source.dynamicKeys.length) {
      lines.push('No dynamic i18n patterns detected.')
    } else {
      lines.push('| Pattern | Location |')
      lines.push('| --- | --- |')
      for (const item of report.source.dynamicKeys) {
        lines.push(`| \`${markdownEscape(item.pattern)}\` | \`${relativeFile(item.file)}:${item.line}\` |`)
      }
    }
    lines.push('')
  }

  if (report.parity) {
    lines.push('## EN → FA parity')
    lines.push('')
    lines.push('### Missing in FA')
    lines.push('')
    if (!report.parity.missingInFa.length) {
      lines.push('No English keys are missing in Persian. ✅')
    } else {
      lines.push('| Key | English value |')
      lines.push('| --- | --- |')
      for (const item of report.parity.missingInFa) {
        lines.push(`| \`${item.key}\` | ${markdownEscape(item.en)} |`)
      }
    }
    lines.push('')

    lines.push('### Extra in FA / missing in EN')
    lines.push('')
    if (!report.parity.extraInFa.length) {
      lines.push('No Persian-only keys detected.')
    } else {
      lines.push('| Key | Persian value |')
      lines.push('| --- | --- |')
      for (const item of report.parity.extraInFa) {
        lines.push(`| \`${item.key}\` | ${markdownEscape(item.fa)} |`)
      }
    }
    lines.push('')

    lines.push('### Same English/Persian value — review candidates')
    lines.push('')
    lines.push('These are not automatically errors: brand names, tokens, acronyms, URLs and intentionally untranslated UI may appear here.')
    lines.push('')
    for (const item of report.parity.sameValue.slice(0, 200)) {
      lines.push(`- \`${item.key}\` → ${JSON.stringify(item.value)}`)
    }
    if (report.parity.sameValue.length > 200) {
      lines.push(`- … ${report.parity.sameValue.length - 200} more in JSON report`)
    }
    lines.push('')
  }

  if (report.hardcoded) {
    lines.push('## Hardcoded UI candidates')
    lines.push('')
    lines.push('This section is heuristic. High-confidence candidates are Vue text/attributes; medium-confidence candidates need human review.')
    lines.push('')
    if (!report.hardcoded.length) {
      lines.push('No hardcoded UI candidates detected.')
    } else {
      lines.push('| Confidence | Text | Location | Reason |')
      lines.push('| --- | --- | --- | --- |')
      for (const item of report.hardcoded) {
        lines.push(`| ${item.confidence} | ${markdownEscape(item.text)} | \`${relativeFile(item.file)}:${item.line}\` | ${item.reason} |`)
      }
    }
    lines.push('')
  }

  lines.push('## Notes')
  lines.push('')
  lines.push('- Locale fragments named `*.en.ts` / `*.fa.ts` are merged under `modules.<fragmentName>` to mirror the current i18n config convention.')
  lines.push('- Static literal key detection is high confidence. Dynamic template keys are intentionally reported separately instead of guessed.')
  lines.push('- Hardcoded UI detection is advisory and never edits source files.')
  lines.push('- The auditor is read-only; it writes only report files unless `--stdout` is used.')
  lines.push('')

  return `${lines.join('\n')}\n`
}

async function main() {
  const [enLocale, faLocale, sourceFiles] = await Promise.all([
    loadEffectiveLocale('en'),
    loadEffectiveLocale('fa'),
    walkSourceFiles(),
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

      if (!noHardcoded && (mode === 'all' || mode === 'hardcoded') && isUiSourceFile(filePath)) {
        hardcodedCandidates.push(...extractVueHardcoded(source, filePath))
        hardcodedCandidates.push(...extractCodeHardcoded(source, filePath))
      }
    }
  }

  const sourceAudit = mode === 'all' || mode === 'source'
    ? makeSourceAudit(staticOccurrences, dynamicOccurrences, enLocale.flat)
    : null

  const parityAudit = mode === 'all' || mode === 'parity'
    ? makeParityAudit(enLocale.flat, faLocale.flat)
    : null

  const hardcoded = mode === 'all' || mode === 'hardcoded'
    ? dedupeOccurrences(
        hardcodedCandidates,
        (item) => `${item.file}|${item.line}|${item.text}`,
      ).sort((a, b) => {
        if (a.confidence !== b.confidence) return a.confidence === 'high' ? -1 : 1
        return relativeFile(a.file).localeCompare(relativeFile(b.file)) || a.line - b.line
      })
    : null

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    localeFragments: {
      en: enLocale.fragments,
      fa: faLocale.fragments,
    },
    summary: {
      sourceFiles: sourceFiles.length,
      staticKeysUsed: sourceAudit?.usedStaticKeys.length || 0,
      missingInEn: sourceAudit?.missingInEn.length || 0,
      missingInFa: parityAudit?.missingInFa.length || 0,
      extraInFa: parityAudit?.extraInFa.length || 0,
      dynamicPatterns: sourceAudit?.dynamicKeys.length || 0,
      hardcodedCandidates: hardcoded?.length || 0,
    },
    source: sourceAudit,
    parity: parityAudit,
    hardcoded,
  }

  const markdown = buildMarkdown(report)

  if (stdoutOnly) {
    process.stdout.write(markdown)
  } else {
    await fs.mkdir(REPORTS_DIR, { recursive: true })
    await Promise.all([
      fs.writeFile(REPORT_MD, markdown, 'utf8'),
      fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    ])

    console.log('Localization audit complete.')
    console.log(`Markdown: ${toPosix(path.relative(ROOT, REPORT_MD))}`)
    console.log(`JSON:     ${toPosix(path.relative(ROOT, REPORT_JSON))}`)
    console.log('')
    console.log(`Missing in EN:          ${report.summary.missingInEn}`)
    console.log(`Missing in FA:          ${report.summary.missingInFa}`)
    console.log(`Dynamic key patterns:   ${report.summary.dynamicPatterns}`)
    console.log(`Hardcoded candidates:   ${report.summary.hardcodedCandidates}`)
  }

  if (strict) {
    const failures = (report.summary.missingInEn || 0) + (report.summary.missingInFa || 0)
    if (failures > 0) process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Localization audit failed:')
  console.error(error)
  process.exitCode = 1
})
