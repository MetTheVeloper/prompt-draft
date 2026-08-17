import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const APP = path.join(ROOT, 'app')
const VALIDATION_PATH = path.join(ROOT, '.icon-migration-validation.json')
const TEXT_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.mjs', '.cjs'])

const ICON_MAP = new Map(Object.entries({
  'add-circle': 'add_circle',
  'arrow-down': 'arrow_downward',
  'arrow-down-1': 'arrow_downward',
  'arrow-left': 'arrow_left',
  'arrow-right': 'arrow_right',
  'arrow-up': 'arrow_upward',
  'brush-2': 'brush',
  'calendar-1': 'calendar_month',
  'chart-square': 'analytics',
  'clipboard': 'content_paste',
  'clock': 'schedule',
  'clock-1': 'schedule',
  'close-circle': 'cancel',
  'close-simple': 'close',
  'cloud-add': 'cloud_upload',
  'color-swatch': 'palette',
  'component': 'widgets',
  'copy': 'content_copy',
  'danger': 'warning',
  'document': 'description',
  'document-copy': 'file_copy',
  'document-text': 'description',
  'drop': 'water_drop',
  'edit-2': 'edit',
  'element-3': 'dashboard',
  'element-4': 'widgets',
  'eraser': 'ink_eraser',
  'export-3': 'download',
  'eye': 'visibility',
  'filter-remove': 'filter_alt_off',
  'folder-open': 'folder_open',
  'forbidden-2': 'block',
  'forward-item': 'transform',
  'gallery': 'photo_library',
  'gallery-add': 'add_photo_alternate',
  'gallery-export': 'image',
  'gallery-remove': 'delete',
  'gallery-slash': 'hide_image',
  'global': 'language',
  'grid-1': 'grid_view',
  'grid-5': 'grid_view',
  'import-2': 'upload_file',
  'info-circle': 'info',
  'information': 'info',
  'lamp': 'lightbulb',
  'like-1': 'thumb_up',
  'magic-star': 'auto_awesome',
  'magicpen': 'auto_fix_high',
  'maximize': 'fullscreen',
  'maximize-3': 'fullscreen',
  'message-question': 'help',
  'mobile': 'smartphone',
  'more-vertical': 'more_vert',
  'mouse-circle': 'mouse',
  'note-text': 'description',
  'path-square': 'polyline',
  'ram': 'memory',
  'receive-square': 'download',
  'refresh-2': 'refresh',
  'rotate-left': 'rotate_left',
  'row-horizontal': 'view_list',
  'scan': 'document_scanner',
  'search-status': 'search',
  'send-2': 'send',
  'setting': 'settings',
  'setting-2': 'tune',
  'share-1': 'share',
  'shield-tick': 'verified_user',
  'slash': 'remove',
  'smileys': 'sentiment_satisfied',
  'text': 'text_fields',
  'text-block': 'select_all',
  'tick': 'check',
  'tick-circle': 'check_circle',
  'tick-square': 'check_box',
  'trash': 'delete',
  'user': 'person',
  'user-edit': 'manage_accounts',
  'video-play': 'play_circle',
  'warning-2': 'warning',
  'wind-2': 'air',
}))

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

function replaceStaticIcons(text) {
  let result = text
  for (const [legacy, symbol] of ICON_MAP) {
    const escaped = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result
      .replace(new RegExp(`(\\bicon\\s*=\\s*["'])${escaped}(["'])`, 'g'), `$1${symbol}$2`)
      .replace(new RegExp(`(\\bicon\\s*:\\s*["'])${escaped}(["'])`, 'g'), `$1${symbol}$2`)
  }
  return result
}

async function migrateSource() {
  const files = await walk(APP)
  let changed = 0
  for (const file of files) {
    let text = await fs.readFile(file, 'utf8')
    const original = text

    // Context-specific exception: this action exports the active draft to a local file.
    if (file.endsWith(path.join('pages', 'create.vue'))) {
      text = text.replace(/(:label="t\('create\.draft\.download'\)"[\s\S]{0,160}?\bicon=")import-2(")/g, '$1download$2')
    }

    text = replaceStaticIcons(text)

    // Legacy renderer mode stays accepted by <el-icon>, but active consumers use a neutral name.
    text = text.replace(/(iconMode\s*:\s*\{[\s\S]{0,180}?default:\s*["'])vuesax(["'])/g, '$1symbols$2')
    text = text.replace(/(\bmode:\s*["'])vuesax(["'])/g, '$1symbols$2')

    if (text !== original) {
      await fs.writeFile(file, text)
      changed += 1
    }
  }
  console.log(`[icons:migrate] updated ${changed} active source files`)
}

async function cleanLegacyCss() {
  const cssPath = path.join(ROOT, 'app/assets/css/style.css')
  let css = await fs.readFile(cssPath, 'utf8')

  css = css.replace(/\/\* vuesax icons \*\/[\s\S]*?(?=\/\* canvas fonts \*\/)/, '')
  css = css.replace(/\ni\s*\{[\s\S]*?font-family:\s*['"]zkit['"]\s*!important;[\s\S]*?\}\s*/m, '\n')

  const iconTableStart = css.indexOf('\n.i-telegram:before')
  if (iconTableStart !== -1) {
    const tail = css.slice(iconTableStart)
    if (!tail.includes('.i-woman:before')) {
      throw new Error('Legacy icon table end marker was not found; refusing to truncate style.css')
    }
    css = `${css.slice(0, iconTableStart).trimEnd()}\n`
  }

  await fs.writeFile(cssPath, css)

  for (const name of ['zkit.eot', 'zkit.svg', 'zkit.ttf', 'zkit.woff']) {
    await fs.rm(path.join(ROOT, 'app/assets/fonts', name), { force: true })
  }
  await fs.rm(path.join(ROOT, 'app/components/el/Iconsax.vue'), { force: true })
}

async function writeMaterialSymbolsCss() {
  const target = path.join(ROOT, 'app/assets/css/material-symbols.css')
  const families = [
    ['Outlined', 'outlined'],
    ['Rounded', 'rounded'],
    ['Sharp', 'sharp'],
  ]
  const blocks = families.map(([family, slug]) => `@font-face {\n  font-family: "Material Symbols ${family}";\n  font-style: normal;\n  font-weight: 100 700;\n  font-display: block;\n  src: url("/fonts/material-symbols/material-symbols-${slug}.woff2") format("woff2");\n}\n\n.material-symbols-${slug} {\n  font-family: "Material Symbols ${family}";\n  font-weight: normal;\n  font-style: normal;\n  line-height: 1;\n  letter-spacing: normal;\n  text-transform: none;\n  white-space: nowrap;\n  word-wrap: normal;\n  direction: ltr;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  text-rendering: optimizeLegibility;\n  font-feature-settings: "liga";\n}`)
  await fs.writeFile(target, `${blocks.join('\n\n')}\n`)
}

async function updateNuxtCssSource() {
  const configPath = path.join(ROOT, 'nuxt.config.ts')
  let config = await fs.readFile(configPath, 'utf8')
  config = config.replace('"material-symbols/index.css",', '"~/assets/css/material-symbols.css",')
  await fs.writeFile(configPath, config)
}

async function updateIconDefaults() {
  const iconPath = path.join(ROOT, 'app/components/el/Icon.vue')
  let icon = await fs.readFile(iconPath, 'utf8')
  icon = icon.replace('mode: "vuesax",', 'mode: "symbols",')
  await fs.writeFile(iconPath, icon)
}

function collectLiteralIcons(text, file) {
  const items = []
  const patterns = [
    /\bicon\s*=\s*(["'])([^"']+)\1/g,
    /\bicon\s*:\s*(["'])([^"']+)\1/g,
  ]
  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      const value = match[2]
      if (!/^[a-z0-9_]+$/.test(value)) continue
      items.push({ file, value })
    }
  }
  return items
}

async function validateNames() {
  const response = await fetch('https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.codepoints')
  if (!response.ok) throw new Error(`Failed to load official Material Symbols codepoints: ${response.status}`)
  const codepoints = await response.text()
  const official = new Set(codepoints.split(/\r?\n/).map(line => line.trim().split(/\s+/)[0]).filter(Boolean))

  const files = await walk(APP)
  const invalid = []
  for (const absolute of files) {
    const relative = path.relative(ROOT, absolute).split(path.sep).join('/')
    const text = await fs.readFile(absolute, 'utf8')
    for (const item of collectLiteralIcons(text, relative)) {
      if (!official.has(item.value)) invalid.push(item)
    }
  }

  const uniqueInvalid = [...new Map(invalid.map(item => [`${item.file}:${item.value}`, item])).values()]
  await fs.writeFile(VALIDATION_PATH, `${JSON.stringify({ invalid: uniqueInvalid }, null, 2)}\n`)
  console.log(`[icons:validate] ${uniqueInvalid.length} unique invalid static icon names remain`)
}

await migrateSource()
await cleanLegacyCss()
await writeMaterialSymbolsCss()
await updateNuxtCssSource()
await updateIconDefaults()
await validateNames()
