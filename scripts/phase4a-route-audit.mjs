import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const ROOTS = ['app']
const SOURCE_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.mjs'])
const IGNORE_DIRS = new Set(['node_modules', '.nuxt', '.output', 'dist'])

const CHECKS = [
  {
    id: 'raw-navigate-to',
    description: 'Programmatic navigateTo() uses a raw internal path instead of localePath().',
    pattern: /\bnavigateTo\s*\(\s*([`'"])\/(?!\/)/g,
  },
  {
    id: 'raw-router-push',
    description: 'router.push() uses a raw internal path instead of a locale-aware route.',
    pattern: /\brouter\.(?:push|replace)\s*\(\s*([`'"])\/(?!\/)/g,
  },
  {
    id: 'raw-window-location',
    description: 'window.location navigation uses a raw internal path.',
    pattern: /\bwindow\.location(?:\.href|\.assign|\.replace)?\s*(?:=|\()\s*([`'"])\/(?!\/)/g,
  },
  {
    id: 'direct-route-name',
    description: 'Direct route.name comparison may break after localized route names are enabled.',
    pattern: /\broute\.name\s*(?:===|!==|==|!=)\s*([`'"])/g,
  },
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await walk(path))
      continue
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(path)
    }
  }

  return files
}

function lineNumberAt(source, offset) {
  let line = 1
  for (let index = 0; index < offset; index += 1) {
    if (source.charCodeAt(index) === 10) line += 1
  }
  return line
}

function lineTextAt(source, offset) {
  const start = source.lastIndexOf('\n', offset - 1) + 1
  const endIndex = source.indexOf('\n', offset)
  const end = endIndex === -1 ? source.length : endIndex
  return source.slice(start, end).trim()
}

function auditSource(path, source) {
  const findings = []

  for (const check of CHECKS) {
    check.pattern.lastIndex = 0
    let match

    while ((match = check.pattern.exec(source)) !== null) {
      findings.push({
        check: check.id,
        description: check.description,
        path,
        line: lineNumberAt(source, match.index),
        text: lineTextAt(source, match.index),
      })
    }
  }

  return findings
}

async function main() {
  const strict = process.argv.includes('--strict')
  const files = []

  for (const root of ROOTS) {
    files.push(...await walk(root))
  }

  const findings = []
  for (const path of files) {
    const source = await readFile(path, 'utf8')
    findings.push(...auditSource(relative('.', path), source))
  }

  findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.check.localeCompare(b.check))

  if (!findings.length) {
    console.log(`[phase4a-route-audit] PASS: ${files.length} source files scanned; no locale-routing hazards found.`)
    return
  }

  console.log(`[phase4a-route-audit] ${findings.length} finding(s) across ${files.length} source files:`)
  for (const finding of findings) {
    console.log(`\n[${finding.check}] ${finding.path}:${finding.line}`)
    console.log(`  ${finding.text}`)
    console.log(`  ${finding.description}`)
  }

  if (strict) {
    console.error('\n[phase4a-route-audit] FAIL: resolve findings before enabling prefix_except_default.')
    process.exitCode = 1
  } else {
    console.log('\n[phase4a-route-audit] Advisory mode only. Re-run with --strict for the Phase 4A activation gate.')
  }
}

main().catch((error) => {
  console.error('[phase4a-route-audit] audit failed', error)
  process.exitCode = 1
})
