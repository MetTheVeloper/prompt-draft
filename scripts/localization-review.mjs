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
  'RENDER_LOCALIZED',
  'REVIEW_REQUIRED',
  'SEMANTIC_VALUE',
  'COMPILER_TEXT',
  'DEVELOPER_TEXT',
  'INTENTIONAL',
]

const CATEGORY_META = {
  LIKELY_UI: {
    action: 'localize',
    description: 'Visible UI text with a direct component/template signal.',
  },
  UI_METADATA: {
    action: 'localize-at-render-layer',
    description: 'Presentation metadata that still appears to need a render-layer translation boundary.',
  },
  RENDER_LOCALIZED: {
    action: 'no-action-render-localized',
    description: 'Canonical English presentation metadata already translated at render time. Keep the source value locale-independent.',
  },
  REVIEW_REQUIRED: {
    action: 'inspect-call-site',
    description: 'Static evidence is insufficient to decide safely.',
  },
  SEMANTIC_VALUE: {
    action: 'do-not-auto-localize',
    description: 'Prompt-facing values, token identity, keys or semantic helper output. Keep locale-independent.',
  },
  COMPILER_TEXT: {
    action: 'do-not-localize',
    description: 'Compiler/Natural prompt output. UI locale must not alter generated prompt semantics.',
  },
  DEVELOPER_TEXT: {
    action: 'ignore',
    description: 'Formatting, geometry, generated IDs, paths, CSS, identifiers or other developer-facing strings.',
  },
  INTENTIONAL: {
    action: 'ignore',
    description: 'Known parser false positives or intentionally language-neutral notation.',
  },
}

const PRESENTATION_PROPERTIES = new Set([
  'label', 'title', 'subtitle', 'description', 'descriptionPattern', 'placeholder',
  'emptyText', 'clearLabel', 'groupLabel', 'categoryLabel', 'tooltip', 'helperText',
])
const SEMANTIC_PROPERTIES = new Set([
  'value', 'valuePattern', 'key', 'keyPattern', 'promptText', 'absentPromptText',
  'token', 'variableToken', 'semanticValue', 'compilerText',
])

function parseArgs(argv) {
  const options = { input: DEFAULT_INPUT, jsonOutput: DEFAULT_JSON_OUTPUT, mdOutput: DEFAULT_MD_OUTPUT, stdout: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--stdout') options.stdout = true
    else if (arg === '--input' && argv[index + 1]) options.input = path.resolve(ROOT, argv[++index])
    else if (arg === '--json' && argv[index + 1]) options.jsonOutput = path.resolve(ROOT, argv[++index])
    else if (arg === '--markdown' && argv[index + 1]) options.mdOutput = path.resolve(ROOT, argv[++index])
  }
  return options
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function relativeFile(filePath) {
  const normalized = toPosix(filePath)
  const root = `${toPosix(ROOT).replace(/\/$/, '')}/`
  if (normalized.startsWith(root)) return normalized.slice(root.length)
  const marker = '/prompt-draft/'
  const index = normalized.toLowerCase().indexOf(marker)
  return index >= 0 ? normalized.slice(index + marker.length) : normalized
}

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function classification(category, confidence, reason) {
  return { category, classificationConfidence: confidence, classificationReason: reason, action: CATEGORY_META[category].action }
}

function isKeyboardShortcut(text) {
  if (/^Shift\s*\+\s*[SLC](?:\s*\/\s*[SLC])*$/i.test(text)) return true
  return /^(?:(?:Ctrl|Control|Shift|Alt|Option|Cmd|Command|⌘)\s*\+\s*)+[A-Za-z0-9]$/i.test(text)
}

function looksLikeTemplateExpressionFalsePositive(candidate) {
  if (candidate.reason !== 'Vue template text node') return false
  const text = String(candidate.text || '')
  return /(?:\}\}|\{\{|translate\(|catalogI18n\.|\$?t\(|\?\.|\|\|)/.test(text)
}

function isAlreadyLocalizedExpression(text) {
  return /(?:catalogI18n\.(?:uiText|catalogText|itemLabel|itemDescription)|\btranslate|\$?t|i18n\.t)\s*\(/.test(text)
}

function isTokenOnly(text) {
  return /^\{\$\{[^}]+\}\}$/.test(text) || /^\{[A-Za-z][\w.:-]*\}$/.test(text)
}

function isSemanticIdentityText(text) {
  return /^(?:user|system|module_entity):\$\{/.test(text)
}

function isPlatformDescriptor(text) {
  return /^(?:Unknown Device|Android Device|Windows PC|Linux PC|Windows Phone|iPhone|iPad|Mac)$/i.test(text)
}

function looksTechnicalReturn(text) {
  return [
    /\$\{[^}]+\}px\b/,
    /\bminmax\(/,
    /\brepeat\(/,
    /\blinear-gradient\(/,
    /\b(?:Date\.now|Math\.random|\.toString)\s*\(/,
    /(^|\s)(?:bg|hbg|gr|hgr|brs|bc|hbc|trnsx|trnsy|b\d|t\d|l\d|r\d)[-_0-9${}]/,
    /^\$\{[^}]+\}$/,
    /^#[A-Fa-f0-9]{3,8}$/,
    /^\d+(?:\.\d+)?\s*(?:px|rem|em|vh|vw|fr|ms|s|B|KB|MB|GB|TB)$/i,
    /^\/?[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_?=&${}.-]+)+$/,
    /^\/[A-Za-z0-9_-]+$/,
    /^\/[A-Za-z0-9_-]+\?[A-Za-z0-9_-]+=\$\{[^}]+\}$/,
    /^[A-Za-z0-9_.-]+\.\$\{[^}]+\}$/,
    /^[A-Za-z0-9_.-]*\$\{[^}]+\}[A-Za-z0-9_.-]*\.(?:png|jpe?g|webp|gif|svg|json|mp3|wav|m4a|mp4|webm|zip)$/i,
    /^PDVAR\$\{[^}]+\}TOKEN$/,
    /^\$\{[^}]*moduleKey[^}]*\}:\$\{[^}]*field\.id[^}]*\}:(?:block|group)_\$\{[^}]+\}:\$\{[^}]+\}$/,
    /\.zip$/i,
    /^[A-Za-z0-9_-]+(?::[A-Za-z0-9_${}.-]+){1,}$/,
    /^(?:effect|light|variable|draft|layout|region|setup|typography|block|group)[_:-].*\$\{/i,
  ].some((pattern) => pattern.test(text))
}

function isCompilerFile(file) {
  const lower = file.toLowerCase()
  return lower.includes('/utils/compile') || /(?:^|\/)compile[^/]*\.(?:ts|js)$/.test(lower)
}

function isSemanticHelperFile(file) {
  const lower = file.toLowerCase()
  return [
    'semantictargets.ts', 'structuralvariables.ts', 'hairvariables.ts',
    'outfitvariables.ts', 'promptvariables.ts', 'typography.ts',
  ].some((name) => lower.endsWith(`/${name}`))
}

function isProtectedSemanticCatalog(file) {
  return /^app\/modules\/(?:hair|outfit)\.catalog\.ts$/i.test(file) || file === 'app/modules/variables.blueprints.ts'
}

function isModuleDefinition(file) {
  return /^app\/modules\/[^/]+\.module\.ts$/i.test(file)
}

function isBlueprintCanonicalDraftMetadata(file, text) {
  if (file !== 'app/components/modules/variables/VariableBlueprintModal.vue') return false
  return /^(?:Variables|Variable \$\{|Custom variable \$\{|\$\{group\.label\} template)/.test(text)
}

function isRenderLocalizedCanonicalMetadata(file, property) {
  if (file === 'app/constants/collage.ts' && property === 'label') return true
  if (file === 'app/modules/texture.semantic.ts' && property === 'categoryLabel') return true
  return false
}

function classifyCandidate(candidate) {
  const file = relativeFile(candidate.file)
  const lowerFile = file.toLowerCase()
  const text = String(candidate.text || '').trim()
  const reason = candidate.reason || ''
  const property = candidate.property || null

  if (looksLikeTemplateExpressionFalsePositive(candidate)) {
    return classification('INTENTIONAL', 100, 'Template expression captured by the heuristic scanner.')
  }
  if (isKeyboardShortcut(text)) {
    return classification('INTENTIONAL', 100, 'Keyboard shortcut notation is intentionally language-neutral.')
  }
  if (isPlatformDescriptor(text)) {
    return classification('DEVELOPER_TEXT', 99, 'Platform/device diagnostic label is technical metadata, not localized product copy.')
  }
  if (isCompilerFile(file)) {
    return classification('COMPILER_TEXT', 99, 'Compiler output can change generated prompt semantics.')
  }
  if (isSemanticHelperFile(file) || isSemanticIdentityText(text)) {
    return classification('SEMANTIC_VALUE', 98, 'Semantic/token helper output must remain locale-independent.')
  }
  if (isTokenOnly(text)) {
    return classification('SEMANTIC_VALUE', 99, 'Variable/token identity is intentionally locale-independent even when displayed as a label.')
  }
  if (isAlreadyLocalizedExpression(text)) {
    return classification('RENDER_LOCALIZED', 100, 'The expression already resolves through the localization layer at render time.')
  }
  if (isBlueprintCanonicalDraftMetadata(file, text)) {
    return classification('RENDER_LOCALIZED', 99, 'Blueprint draft metadata is deliberately canonical; a separate display helper localizes it at render time.')
  }
  if (isRenderLocalizedCanonicalMetadata(file, property)) {
    const reasonText = file === 'app/constants/collage.ts'
      ? 'Collage option labels stay canonical while the active controls project them through locale-aware render helpers or label keys.'
      : 'Texture category labels stay canonical while MaterialAssignmentsField translates their category keys at render time.'
    return classification('RENDER_LOCALIZED', 99, reasonText)
  }
  if (file === 'app/utils/promptVariableCatalog.ts' && property === 'description') {
    return classification('SEMANTIC_VALUE', 97, 'System-variable catalog descriptions are canonical search/reference metadata and are not rendered as localized UI copy.')
  }
  if (reason === 'Returned display string' && looksTechnicalReturn(text)) {
    return classification('DEVELOPER_TEXT', 99, 'Generated identifier/path/formatting return value, not UI prose.')
  }

  if (isProtectedSemanticCatalog(file)) {
    if (property && SEMANTIC_PROPERTIES.has(property)) {
      return classification('SEMANTIC_VALUE', 100, `Catalog property \`${property}\` is semantic/prompt-facing and must not be localized.`)
    }
    if (property && PRESENTATION_PROPERTIES.has(property)) {
      return classification('RENDER_LOCALIZED', 100, `Canonical catalog \`${property}\` is already translated by the render-layer catalog i18n boundary.`)
    }
    return classification('REVIEW_REQUIRED', 82, 'Protected semantic catalog candidate without a confirmed presentation property.')
  }

  if (isModuleDefinition(file) && reason === 'UI-like object property') {
    if (property && SEMANTIC_PROPERTIES.has(property)) {
      return classification('SEMANTIC_VALUE', 98, `Module property \`${property}\` is semantic-shaped.`)
    }
    if (property && PRESENTATION_PROPERTIES.has(property)) {
      return classification('RENDER_LOCALIZED', 96, 'Module presentation metadata is used as a canonical fallback while the panel renders the matching i18n key.')
    }
  }

  if (lowerFile.endsWith('.vue')) {
    if (reason === 'Vue template text node' || reason.startsWith('Static UI attribute:')) {
      return classification('LIKELY_UI', 99, 'Direct visible Vue template/attribute text.')
    }
    if (reason === 'UI-like object property') {
      if (property && SEMANTIC_PROPERTIES.has(property)) {
        return classification('SEMANTIC_VALUE', 95, `Property \`${property}\` is semantic-shaped even though it appears in a component.`)
      }
      return classification('LIKELY_UI', 94, 'UI-shaped object metadata inside a Vue component.')
    }
    if (reason === 'Returned display string') {
      if (!looksTechnicalReturn(text) && /[A-Za-z]{2,}/.test(text.replace(/\$\{[^}]+\}/g, ' '))) {
        return classification('LIKELY_UI', 84, 'Human-readable returned string inside a Vue component.')
      }
      return classification('DEVELOPER_TEXT', 92, 'Returned component string appears technical.')
    }
  }

  if (file.startsWith('app/constants/') && reason === 'UI-like object property') {
    if (property && SEMANTIC_PROPERTIES.has(property)) {
      return classification('SEMANTIC_VALUE', 92, `Constant property \`${property}\` is semantic-shaped.`)
    }
    return classification('UI_METADATA', 94, 'Constant-backed presentation metadata is likely rendered by controls and still needs a call-site translation boundary.')
  }

  const uiCatalogFiles = new Set([
    'app/composables/prompt/useSemanticTargetCatalog.ts',
    'app/composables/prompt/useSubjectAssignmentTargets.ts',
  ])
  if (uiCatalogFiles.has(file) && reason === 'UI-like object property') {
    return classification('UI_METADATA', 88, 'Selector/catalog presentation metadata needs confirmation that its render path translates the canonical label.')
  }

  if (file.startsWith('app/composables/useScreen.') && reason === 'Returned display string') {
    return classification('DEVELOPER_TEXT', 95, 'Screen/layout utility output appears technical.')
  }

  if ((file.startsWith('app/utils/') || file.startsWith('app/composables/')) && reason === 'Returned display string') {
    return classification('REVIEW_REQUIRED', 65, 'Utility/composable return string needs a call-site check.')
  }

  if (reason === 'UI-like object property') {
    if (property && SEMANTIC_PROPERTIES.has(property)) {
      return classification('SEMANTIC_VALUE', 90, `Property \`${property}\` is semantic-shaped.`)
    }
    return classification('UI_METADATA', 78, 'UI-shaped metadata outside a direct Vue template.')
  }

  return classification('REVIEW_REQUIRED', 50, 'Insufficient static evidence to classify safely.')
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
    alreadyRenderLocalized: categories.RENDER_LOCALIZED,
    inspectManually: categories.REVIEW_REQUIRED,
    doNotAutoLocalize: categories.SEMANTIC_VALUE + categories.COMPILER_TEXT + categories.DEVELOPER_TEXT + categories.INTENTIONAL,
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
    return fileCompare || (a.line || 0) - (b.line || 0)
  })
}

function buildMarkdown(report) {
  const lines = [
    '# Localization Review', '',
    `Generated: ${report.generatedAt}`,
    `Source audit: ${report.sourceAuditGeneratedAt || 'unknown'}`, '',
    '## Summary', '', '| Category | Count | Recommended action |', '| --- | ---: | --- |',
  ]
  for (const category of CATEGORY_ORDER) lines.push(`| \`${category}\` | ${report.summary.categories[category]} | ${CATEGORY_META[category].action} |`)
  lines.push(
    '',
    `- Actionable UI/UI metadata: **${report.summary.actionable}**`,
    `- Already localized at render layer: **${report.summary.alreadyRenderLocalized}**`,
    `- Manual call-site review: **${report.summary.inspectManually}**`,
    `- Do not auto-localize / ignore: **${report.summary.doNotAutoLocalize}**`, '',
  )

  for (const category of CATEGORY_ORDER) {
    const items = report.items.filter((item) => item.category === category)
    lines.push(`## ${category} — ${items.length}`, '', CATEGORY_META[category].description, '')
    if (!items.length) { lines.push('No candidates.', ''); continue }
    lines.push('| Confidence | Text | Property | Location | Why |', '| ---: | --- | --- | --- | --- |')
    for (const item of items) lines.push(`| ${item.classificationConfidence}% | ${markdownEscape(item.text)} | ${item.property || ''} | \`${relativeFile(item.file)}:${item.line}\` | ${markdownEscape(item.classificationReason)} |`)
    lines.push('')
  }

  lines.push(
    '## Notes', '',
    '- `RENDER_LOCALIZED` is deliberately non-actionable: canonical English metadata remains stable while the render layer supplies the active locale.',
    '- Protected Hair/Outfit/Variable Blueprint semantic values remain locale-independent.',
    '- Direct Vue text nodes and static visible attributes remain high-confidence UI candidates.',
    '- Generated IDs, paths, token labels and compiler output are excluded from localization work.', '',
  )
  return `${lines.join('\n')}\n`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const audit = JSON.parse(await fs.readFile(options.input, 'utf8'))
  const candidates = Array.isArray(audit.hardcoded) ? audit.hardcoded : []
  const items = sortItems(candidates.map((candidate) => ({ ...candidate, ...classifyCandidate(candidate) })))
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
  console.log(`Render-localized:       ${report.summary.alreadyRenderLocalized}`)
  console.log(`Review required:        ${report.summary.inspectManually}`)
  console.log(`Do not auto-localize:   ${report.summary.doNotAutoLocalize}`)
  for (const category of CATEGORY_ORDER) console.log(`${category.padEnd(18)} ${report.summary.categories[category]}`)
}

main().catch((error) => {
  console.error('Localization review failed:')
  console.error(error)
  process.exitCode = 1
})
