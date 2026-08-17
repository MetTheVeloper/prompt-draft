import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const APP = path.join(ROOT, 'app')
const phase = process.argv.includes('--offline') ? 'offline' : 'source'
const TEXT_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.mjs', '.cjs', '.css', '.scss'])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) files.push(absolute)
  }
  return files
}

function collectLiteralIcons(text, file) {
  const found = []
  const patterns = [
    /(?<!:)\bicon\s*=\s*(["'])([a-z0-9_]+)\1/g,
    /\bicon\s*:\s*(["'])([a-z0-9_]+)\1/g,
    /\b:icon\s*=\s*(["'])\s*(["'])([a-z0-9_]+)\2\s*\1/g,
  ]

  for (const [index, re] of patterns.entries()) {
    for (const match of text.matchAll(re)) {
      found.push({ file, value: match[index === 2 ? 3 : 2] })
    }
  }
  return found
}

async function validateSource() {
  const response = await fetch('https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.codepoints')
  if (!response.ok) throw new Error(`Unable to fetch official Material Symbols codepoints (${response.status})`)
  const official = new Set((await response.text()).split(/\r?\n/).map(line => line.trim().split(/\s+/)[0]).filter(Boolean))

  const invalid = []
  const legacy = []
  const legacyTerms = ['el-iconsax', 'Iconsax', 'uiIcon', "font-family: 'zkit'", 'font-family: "zkit"', 'Material Icons', 'material-icons']
  const appFiles = await walk(APP)

  for (const absolute of appFiles) {
    const relative = path.relative(ROOT, absolute).split(path.sep).join('/')
    const text = await fs.readFile(absolute, 'utf8')
    for (const icon of collectLiteralIcons(text, relative)) {
      if (!official.has(icon.value)) invalid.push(icon)
    }
    for (const term of legacyTerms) {
      if (text.includes(term)) legacy.push({ file: relative, term })
    }
  }

  const iconComponent = await fs.readFile(path.join(APP, 'components/el/Icon.vue'), 'utf8')
  if (!iconComponent.includes('variant?: MaterialSymbolVariant')) throw new Error('Material Symbol variant API is missing')
  if (!iconComponent.includes('fontVariationSettings')) throw new Error('Material Symbol variation axes are not wired')
  if (!iconComponent.includes('aria-hidden="true"')) throw new Error('Decorative icon accessibility behavior is missing')

  const oldAssets = [
    'app/components/el/Iconsax.vue',
    'app/assets/fonts/zkit.eot',
    'app/assets/fonts/zkit.svg',
    'app/assets/fonts/zkit.ttf',
    'app/assets/fonts/zkit.woff',
  ]
  for (const relative of oldAssets) {
    try {
      await fs.access(path.join(ROOT, relative))
      legacy.push({ file: relative, term: 'legacy asset still exists' })
    } catch {}
  }

  const fonts = ['outlined', 'rounded', 'sharp']
  for (const variant of fonts) {
    const font = path.join(ROOT, `public/fonts/material-symbols/material-symbols-${variant}.woff2`)
    const stat = await fs.stat(font)
    if (stat.size < 100_000) throw new Error(`Material Symbols ${variant} font looks invalid (${stat.size} bytes)`)
  }

  if (invalid.length || legacy.length) {
    console.error(JSON.stringify({ invalid, legacy }, null, 2))
    process.exit(1)
  }

  console.log(`[icons:verify] source OK · ${appFiles.length} active text source files checked · all literal icons resolve to official Material Symbols`)
}

async function validateOfflineOutput() {
  const manifestPath = path.join(ROOT, '.output/public/offline-manifest.json')
  const manifest = await fs.readFile(manifestPath, 'utf8')
  const required = [
    'fonts/material-symbols/material-symbols-outlined.woff2',
    'fonts/material-symbols/material-symbols-rounded.woff2',
    'fonts/material-symbols/material-symbols-sharp.woff2',
  ]
  const missing = required.filter(item => !manifest.includes(item))
  if (missing.length) {
    console.error('Offline manifest is missing Material Symbols fonts:', missing)
    process.exit(1)
  }
  console.log('[icons:verify] offline manifest contains all three self-hosted Material Symbols variable fonts')
}

if (phase === 'offline') await validateOfflineOutput()
else await validateSource()
