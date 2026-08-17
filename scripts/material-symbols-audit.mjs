import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, '.icon-migration-audit.json')
const SKIP_DIRS = new Set(['.git', 'node_modules', '.nuxt', '.output', 'dist', 'android', '_layout-stage2-payload'])
const TEXT_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.mjs', '.cjs', '.css', '.scss', '.json', '.md'])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) files.push(absolute)
  }
  return files
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length
}

function collectMatches(text, relativePath) {
  const found = []
  const patterns = [
    { kind: 'template-static', re: /(?<!:)\bicon\s*=\s*(["'])([^"']+)\1/g },
    { kind: 'object-static', re: /\bicon\s*:\s*(["'])([^"']+)\1/g },
    { kind: 'template-bound-static', re: /\b:icon\s*=\s*(["'])\s*(["'])([^"']+)\2\s*\1/g, valueIndex: 3 },
    { kind: 'mode-static', re: /\b(?:iconMode|mode)\s*[:=]\s*(["'])(vuesax|material)\1/g },
  ]

  for (const { kind, re, valueIndex = 2 } of patterns) {
    for (const match of text.matchAll(re)) {
      found.push({
        file: relativePath,
        line: lineNumber(text, match.index ?? 0),
        kind,
        value: match[valueIndex],
        context: text.slice(Math.max(0, (match.index ?? 0) - 90), Math.min(text.length, (match.index ?? 0) + match[0].length + 90)).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  return found
}

const files = await walk(ROOT)
const usages = []
const legacyReferences = []

for (const absolute of files) {
  if (absolute === OUT) continue
  const relativePath = path.relative(ROOT, absolute).split(path.sep).join('/')
  if (relativePath.startsWith('scripts/material-symbols-')) continue
  const text = await fs.readFile(absolute, 'utf8')
  usages.push(...collectMatches(text, relativePath))

  const legacyTerms = ['el-iconsax', 'Iconsax', 'vuesax', 'uiIcon', "font-family: 'zkit'", 'Material Icons', 'material-icons']
  for (const term of legacyTerms) {
    let cursor = 0
    while ((cursor = text.indexOf(term, cursor)) !== -1) {
      legacyReferences.push({ file: relativePath, line: lineNumber(text, cursor), term })
      cursor += term.length
    }
  }
}

const values = [...new Set(usages.filter(item => item.kind.includes('static') && !item.kind.startsWith('mode')).map(item => item.value))].sort()
const report = {
  generatedAt: new Date().toISOString(),
  totalUsages: usages.length,
  uniqueStaticIconValues: values.length,
  values,
  usages: usages.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
  legacyReferences: legacyReferences.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
}

await fs.writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`)
console.log(`[icons:audit] ${report.totalUsages} usages · ${report.uniqueStaticIconValues} unique static values · ${report.legacyReferences.length} legacy references`)
