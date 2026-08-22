#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const DEFAULT_INPUT = path.join(ROOT, 'reports', 'localization-audit.json')
const DEFAULT_JSON_OUTPUT = path.join(ROOT, 'reports', 'localization-review.json')
const DEFAULT_MD_OUTPUT = path.join(ROOT, 'reports', 'localization-review.md')

const CATEGORY_ORDER = [
  'LIKELY_UI',
  'UI_METADATA',
  'REVIEW_REQUIRED',
  'SEMANTIC_VALUE',
  'COMPILER_TEXT',
  'DEVELOPER_TEXT',
  'INTENTIONAL',
]

const CATEGORY_META = {
  LIKELY_UI: {
    action: 'localize',
    description: 'Likely visible UI text. Usually safe to convert to i18n after a quick context check.',
  },
  UI_METADATA: {
    action: 'localize-at-render-layer',
    description: 'Labels/descriptions stored in catalogs, blueprints, constants or selector metadata. Prefer stable translation keys or render-layer translation instead of mutating semantic values.',
  },
  REVIEW_REQUIRED: {
    action: 'inspect-call-site',
    description: 'Static evidence is insufficient. Inspect the consumer before deciding whether the string belongs to UI or semantics.',
  },
  SEMANTIC_VALUE: {
    action: 'do-not-auto-localize',
    description: 'Semantic tokens, identifiers or prompt-facing helper text. Keep locale-independent unless the semantic architecture explicitly changes.',
  },
  COMPILER_TEXT: {
    action: 'do-not-localize',
    description: 'Compiler/Natural prompt output. Translating it with the UI locale would change generated prompt semantics.',
  },
  DEVELOPER_TEXT: {
    action: 'ignore',
    description: 'Formatting, CSS, geometry, identifiers or other technical strings that are not normal user-facing prose.',
  },
  INTENTIONAL: {
    action: 'ignore',
    description: 'Known parser false positives or intentionally language-neutral strings such as keyboard shortcuts.',
  },
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    mdOutput: DEFAULT_MD_OUTPUT,
    stdout: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--stdout') {
      options.stdout = true
      continue
    }
    if (arg === '--input' && argv[index + 1]) {
      options.input = path.resolve(ROOT, argv[++index])
      continue
    }
    if (arg === '--json' && argv[index + 1]) {
      options.jsonOutput = path.resolve(ROOT, argv[++index])
      continue
    }
    if (arg === '--markdown' && argv[index + 1]) {
      options.mdOutput = path.resolve(ROOT, argv[++index])
      continue
    }
  }

  return options
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function relativeFile(filePath) {
  const normalized = toPosix(filePath)
  const rootNormalized = `${toPosix(ROOT).replace(/\/$/, '')}/`
  if (normalized.startsWith(rootNormalized)) return normalized.slice(rootNormalized.length)

  const marker = '/prompt-draft/'
  const markerIndex = normalized.toLowerCase().indexOf(marker)
  if (markerIndex >= 0) return normalized.slice(markerIndex + marker.length)

  return normalized
}

function markdownEscape(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
}

function isKeyboardShortcut(text) {
  if (/^Shift\s*\+\s*[SLC](?:\s*\/\s*[SLC])*$/i.test(text)) return true
  return /^(?:(?:Ctrl|Control|Shift|Alt|Option|Cmd|Command|⌘)\s*\+\s*)+[A-Za-z0-9]$/i.test(text)
}

function looksLikeTemplateExpressionFalsePositive(candidate) {
  if (candidate.confidence !== 'high') return false
  if (candidate.reason !== 'Vue template text node') return false

  const text = candidate.text
  return text.includes('}}') || text.includes('translate(') || text.includes('?.') || text.includes('||')
}

function looksTechnicalReturn(text) {
  const patterns = [
    /\$\{[^}]+\}px\b/,
    /\bminmax\(/,
    /\brepeat\(/,
    /\blinear-gradient\(/,
    /(^|\s)(?:bg|hbg|gr|hgr|trnsx|trnsy|b\d|t\d|l\d|r\d)[-_0-9${}]/,
    /^\$\{[^}]+\}$/,
    /^#[A-Fa-f0-9]{3,8}$/,
    /^\$\{[^}]+\},\$\{[^}]+\}$/,
    /^\d+(?:\.\d+)?\s*(?:px|rem|em|vh|vw|fr|ms|s)$/i,
  ]

  return patterns.some((pattern) => pattern.test(text))
}

function humanWordsOutsideInterpolation(text) {
  const stripped = text.replace(/\$\{[^}]+\}/g, ' ')
  return stripped.match(/[A-Za-z]{2,}/g) || []
}

function classifyCandidate(candidate) {
  const file = relativeFile(candidate.file)
  const lowerFile = file.toLowerCase()
  const text = String(candidate.text || '').trim()
  const reason = candidate.reason || ''

  if (looksLikeTemplateExpressionFalsePositive(candidate)) {
    return classification(
      'INTENTIONAL',
      100,
      'Template expression was captured as a text node by the heuristic scanner.',
    )
  }

  if (isKeyboardShortcut(text)) {
    return classification(
      'INTENTIONAL',
      100,
      'Keyboard shortcut notation is intentionally language-neutral.',
    )
  }

  if (
    lowerFile.includes('/utils/compile') ||
    /(?:^|\/)compile[^/]*\.(?:ts|js)$/.test(lowerFile)
  ) {
    return classification(
      'COMPILER_TEXT',
      98,
      'Compiler output text can affect generated prompt semantics.',
    )
  }

  const semanticHelperFiles = [
    'semanticTargets.ts',
    'structuralVariables.ts',
    'hairVariables.ts',
    'outfitVariables.ts',
    'promptVariables.ts',
    'typography.ts',
  ]

  if (semanticHelperFiles.some((name) => lowerFile.endsWith(`/${name.toLowerCase()}`))) {
    return classification(
      'SEMANTIC_VALUE',
      96,
      'Semantic/token helper output should remain locale-independent unless explicitly redesigned.',
    )
  }

  if (reason === 'Returned display string' && looksTechnicalReturn(text)) {
    return classification(
      'DEVELOPER_TEXT',
      98,
      'Formatting/style/technical return value, not ordinary user-facing prose.',
    )
  }

  if (
    /^app\/modules\/(?:hair|outfit)\.catalog\.ts$/i.test(file) ||
    file === 'app/modules/variables.blueprints.ts'
  ) {
    return classification(
      'UI_METADATA',
      98,
      'Catalog/blueprint label or description is authoring UI metadata. Keep semantic values separate.',
    )
  }

  if (file.startsWith('app/constants/') && reason === 'UI-like object property') {
    return classification(
      'UI_METADATA',
      94,
      'Constant-backed label/description is likely rendered by UI controls.',
    )
  }

  const uiCatalogFiles = new Set([
    'app/utils/promptVariableCatalog.ts',
    'app/composables/prompt/useSemanticTargetCatalog.ts',
    'app/composables/prompt/useSubjectAssignmentTargets.ts',
  ])

  if (uiCatalogFiles.has(file) && reason === 'UI-like object property') {
    return classification(
      'UI_METADATA',
      92,
      'Catalog entry label/description is assembled for UI selection.',
    )
  }

  if (file.endsWith('.vue')) {
    if (reason === 'UI-like object property') {
      if (
        text.startsWith('${') &&
        /^(?:\$\{[^}]+\}|[\s·:/()+\-–—])+$/.test(text)
      ) {
        return classification(
          'DEVELOPER_TEXT',
          90,
          'Pure formatting expression inside a component script.',
        )
      }

      return classification(
        'LIKELY_UI',
        92,
        'UI-like property inside a Vue component is likely visible to users.',
      )
    }

    if (reason === 'Returned display string') {
      const words = humanWordsOutsideInterpolation(text)
      if (words.length >= 1 && !looksTechnicalReturn(text)) {
        return classification(
          'LIKELY_UI',
          82,
          'Human-readable returned string inside a Vue component.',
        )
      }

      return classification(
        'DEVELOPER_TEXT',
        88,
        'Returned component string appears to be formatting or technical output.',
      )
    }
  }

  if (/^app\/modules\/[^/]+\.module\.ts$/i.test(file) && reason === 'UI-like object property') {
    return classification(
      'UI_METADATA',
      88,
      'Module label/description metadata is likely displayed, but may share semantic data structures.',
    )
  }

  if (file.startsWith('app/composables/useScreen.') && reason === 'Returned display string') {
    if (/\b(?:Device|PC|Phone)\b/i.test(text)) {
      return classification(
        'REVIEW_REQUIRED',
        65,
        'Device label may be user-visible diagnostics or internal metadata.',
      )
    }

    return classification(
      'DEVELOPER_TEXT',
      95,
      'Screen/layout utility return value appears technical.',
    )
  }

  if (file.startsWith('app/utils/') && reason === 'Returned display string') {
    return classification(
      'REVIEW_REQUIRED',
      60,
      'Utility return string needs call-site review before localization.',
    )
  }

  if (file.startsWith('app/composables/') && reason === 'Returned display string') {
    return classification(
      'REVIEW_REQUIRED',
      60,
      'Composable return string needs call-site review before localization.',
    )
  }

  if (reason === 'UI-like object property') {
    return classification(
      'UI_METADATA',
      75,
      'UI-shaped metadata outside a direct Vue template.',
    )
  }

  return classification(
    'REVIEW_REQUIRED',
    50,
    'Insufficient static evidence to decide whether this text is UI or semantic output.',
  )
}

function classification(category, confidence, reason) {
  return {
    category,
    classificationConfidence: confidence,
    classificationReason: reason,
    action: CATEGORY_META[category].action,
  }
}

function buildSummary(items) {
  const categories = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]))
  const files = new Map()

  for (const item of items) {
    categories[item.category] += 1
    const file = relativeFile(item.file)
    files.set(file, (files.get(file) || 0) + 1)
  }

  return {
    total: items.length,
    categories,
    actionable: categories.LIKELY_UI + categories.UI_METADATA,
    inspectManually: categories.REVIEW_REQUIRED,
    doNotAutoLocalize:
      categories.SEMANTIC_VALUE +
      categories.COMPILER_TEXT +
      categories.DEVELOPER_TEXT +
      categories.INTENTIONAL,
    topFiles: [...files.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 25)
      .map(([file, count]) => ({ file, count })),
  }
}

function sortItems(items) {
  const categoryIndex = new Map(CATEGORY_ORDER.map((category, index) => [category, index]))

  return [...items].sort((a, b) => {
    const categoryCompare = categoryIndex.get(a.category) - categoryIndex.get(b.category)
    if (categoryCompare) return categoryCompare
    const fileCompare = relativeFile(a.file).localeCompare(relativeFile(b.file))
    if (fileCompare) return fileCompare
    return (a.line || 0) - (b.line || 0)
  })
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# Localization Review')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Source audit: ${report.sourceAuditGeneratedAt || 'unknown'}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Category | Count | Recommended action |')
  lines.push('| --- | ---: | --- |')

  for (const category of CATEGORY_ORDER) {
    lines.push(
      `| \`${category}\` | ${report.summary.categories[category]} | ${CATEGORY_META[category].action} |`,
    )
  }

  lines.push('')
  lines.push(`- Actionable UI/UI metadata: **${report.summary.actionable}**`)
  lines.push(`- Manual call-site review: **${report.summary.inspectManually}**`)
  lines.push(`- Do not auto-localize / ignore: **${report.summary.doNotAutoLocalize}**`)
  lines.push('')
  lines.push('## Category guide')
  lines.push('')

  for (const category of CATEGORY_ORDER) {
    lines.push(`### ${category}`)
    lines.push('')
    lines.push(CATEGORY_META[category].description)
    lines.push('')
  }

  lines.push('## Top files')
  lines.push('')
  lines.push('| File | Candidates |')
  lines.push('| --- | ---: |')
  for (const item of report.summary.topFiles) {
    lines.push(`| \`${item.file}\` | ${item.count} |`)
  }
  lines.push('')

  for (const category of CATEGORY_ORDER) {
    const items = report.items.filter((item) => item.category === category)
    lines.push(`## ${category} — ${items.length}`)
    lines.push('')
    lines.push(CATEGORY_META[category].description)
    lines.push('')

    if (!items.length) {
      lines.push('No candidates.')
      lines.push('')
      continue
    }

    lines.push('| Confidence | Text | Location | Why |')
    lines.push('| ---: | --- | --- | --- |')
    for (const item of items) {
      lines.push(
        `| ${item.classificationConfidence}% | ${markdownEscape(item.text)} | \`${relativeFile(item.file)}:${item.line}\` | ${markdownEscape(item.classificationReason)} |`,
      )
    }
    lines.push('')
  }

  lines.push('## Notes')
  lines.push('')
  lines.push('- This is a second-stage classifier over `localization-audit.json`; it does not replace missing-key/parity checks.')
  lines.push('- Classification is advisory and read-only. No source or locale files are edited.')
  lines.push('- `UI_METADATA` should normally be translated at the render layer or via stable translation-key metadata, not by localizing semantic prompt values.')
  lines.push('- `COMPILER_TEXT` and `SEMANTIC_VALUE` are deliberately conservative because changing them with the active UI locale can change generated prompt meaning or token identity.')
  lines.push('')

  return `${lines.join('\n')}\n`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const raw = await fs.readFile(options.input, 'utf8')
  const audit = JSON.parse(raw)
  const candidates = Array.isArray(audit.hardcoded) ? audit.hardcoded : []

  const items = sortItems(
    candidates.map((candidate) => ({
      ...candidate,
      ...classifyCandidate(candidate),
    })),
  )

  const report = {
    generatedAt: new Date().toISOString(),
    sourceAuditGeneratedAt: audit.generatedAt || null,
    sourceAuditSummary: audit.summary || null,
    summary: buildSummary(items),
    categories: CATEGORY_META,
    items,
  }

  const markdown = buildMarkdown(report)

  if (options.stdout) {
    process.stdout.write(markdown)
    return
  }

  await fs.mkdir(path.dirname(options.jsonOutput), { recursive: true })
  await Promise.all([
    fs.writeFile(options.jsonOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    fs.writeFile(options.mdOutput, markdown, 'utf8'),
  ])

  console.log('Localization review complete.')
  console.log(`Markdown: ${toPosix(path.relative(ROOT, options.mdOutput))}`)
  console.log(`JSON:     ${toPosix(path.relative(ROOT, options.jsonOutput))}`)
  console.log('')
  console.log(`Actionable UI/metadata: ${report.summary.actionable}`)
  console.log(`Review required:        ${report.summary.inspectManually}`)
  console.log(`Do not auto-localize:   ${report.summary.doNotAutoLocalize}`)
  console.log('')
  for (const category of CATEGORY_ORDER) {
    console.log(`${category.padEnd(18)} ${report.summary.categories[category]}`)
  }
}

main().catch((error) => {
  console.error('Localization review failed:')
  console.error(error)
  process.exitCode = 1
})
