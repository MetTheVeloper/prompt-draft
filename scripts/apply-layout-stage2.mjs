#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import process from "node:process"

const projectRoot = resolve(process.cwd())
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDirectory, "..")
const payloadRoot = join(packageRoot, "_layout-stage2-payload")
const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
const backupRoot = join(projectRoot, ".layout-stage2-backup", timestamp)

const patchTargets = [
  "app/modules/types.ts",
  "app/components/modules/panel/base.vue",
  "app/components/prompt/editor.vue",
  "app/pages/create.vue",
]

const payloadFiles = [
  "app/modules/layout.types.ts",
  "app/modules/layout.module.ts",
  "app/utils/layoutRegions.ts",
  "app/utils/compileLayout.ts",
  "app/components/modules/layout/LayoutRegionsField.vue",
  "app/components/modules/layout/LayoutRegionEditorModal.vue",
  "app/components/modules/layout/VisualLayoutBuilderModal.vue",
]

function normalizeEol(value) {
  return value.replace(/\r\n/g, "\n")
}

function readProjectFile(relativePath) {
  const absolutePath = join(projectRoot, relativePath)

  if (!existsSync(absolutePath)) {
    throw new Error(`Missing file: ${relativePath}`)
  }

  const raw = readFileSync(absolutePath, "utf8")

  return {
    relativePath,
    absolutePath,
    raw,
    text: normalizeEol(raw),
    eol: raw.includes("\r\n") ? "\r\n" : "\n",
  }
}

function writeProjectFile(file, text) {
  const output = file.eol === "\r\n"
    ? text.replace(/\n/g, "\r\n")
    : text

  writeFileSync(file.absolutePath, output, "utf8")
}

function replaceOnce(text, search, replacement, label) {
  const index = text.indexOf(search)

  if (index < 0) {
    throw new Error(`Patch anchor not found: ${label}`)
  }

  return text.slice(0, index) + replacement + text.slice(index + search.length)
}

function patchTypes(text) {
  let next = text

  next = next.replace(
    /import type \{\s*LayoutRegion\s*\} from ["']\.\/layout\.types["'];?/,
    'import type { LayoutRegion, LayoutRegionsState } from "./layout.types"',
  )

  if (!next.includes("LayoutRegionsState")) {
    next = `import type { LayoutRegion, LayoutRegionsState } from "./layout.types"\n\n${next}`
  }

  if (!next.includes("  | LayoutRegionsState\n")) {
    if (next.includes("  | LayoutRegion[]\n")) {
      next = next.replace(
        "  | LayoutRegion[]\n",
        "  | LayoutRegion[]\n  | LayoutRegionsState\n",
      )
    } else {
      throw new Error("Patch anchor not found: types ModuleFieldValue LayoutRegion[]")
    }
  }

  return next
}

function patchPanelBase(text) {
  let next = text

  next = next.replace(
    /import type \{\s*LayoutRegion\s*\} from ["']\.\.\/\.\.\/\.\.\/modules\/layout\.types["'];?/,
    'import type { LayoutRegion, LayoutRegionsState } from "../../../modules/layout.types";',
  )

  if (!next.includes("LayoutRegionsState")) {
    throw new Error("Could not update LayoutRegion type import in base.vue")
  }

  if (!next.includes('from "../../../utils/layoutRegions"')) {
    const layoutTypeImport =
      'import type { LayoutRegion, LayoutRegionsState } from "../../../modules/layout.types";\n'

    next = replaceOnce(
      next,
      layoutTypeImport,
      `${layoutTypeImport}import { normalizeLayoutRegionsState } from "../../../utils/layoutRegions";\n`,
      "base normalizeLayoutRegionsState import",
    )
  }

  if (!/\baspectRatio\?:\s*string;/.test(next)) {
    const panelStatePropPattern = /^(\s*)panelState\?:\s*ModulePanelState;\s*$/m

    if (!panelStatePropPattern.test(next)) {
      throw new Error("Patch anchor not found: base props aspectRatio")
    }

    next = next.replace(
      panelStatePropPattern,
      (_, indent) => `${indent}panelState?: ModulePanelState;\n${indent}aspectRatio?: string;`,
    )
  }

  next = next.replace(
    /:model-value="Array\.isArray\(values\[field\.id\]\) \? values\[field\.id\] as LayoutRegion\[\] : \[\]"/,
    ':model-value="values[field.id] as LayoutRegionsState | LayoutRegion[]"',
  )

  if (!next.includes(':aspect-ratio="aspectRatio"')) {
    next = replaceOnce(
      next,
      '              :field="field"\n              @update:model-value="values[field.id] = $event"',
      '              :field="field"\n              :aspect-ratio="aspectRatio"\n              @update:model-value="values[field.id] = $event"',
      "base LayoutRegionsField aspectRatio",
    )
  }

  if (!next.includes("normalizeLayoutRegionsState(value).regions.length > 0")) {
    const filledStatePattern = /(function isFieldFilled\(field:\s*ModuleField\)\s*\{\s*\n\s*const value = values\[field\.id\];\s*\n)/

    if (!filledStatePattern.test(next)) {
      throw new Error("Patch anchor not found: base layout region filled state")
    }

    next = next.replace(
      filledStatePattern,
      '$1\n  if (field.type === "layoutRegions") {\n    return normalizeLayoutRegionsState(value).regions.length > 0;\n  }\n',
    )
  }

  return next
}

function patchPromptEditor(text) {
  let next = text

  if (!/\baspectRatio\?:\s*string;/.test(next)) {
    const editorPropsPattern = /^(\s*)modulePanelStates\?:\s*Record<string,\s*ModulePanelState>;\s*$/m

    if (!editorPropsPattern.test(next)) {
      throw new Error("Patch anchor not found: editor props aspectRatio")
    }

    next = next.replace(
      editorPropsPattern,
      (_, indent) => `${indent}modulePanelStates?: Record<string, ModulePanelState>;\n${indent}aspectRatio?: string;`,
    )
  }

  if (!next.includes(':aspect-ratio="aspectRatio"')) {
    next = replaceOnce(
      next,
      '        :panel-state="modulePanelStates[module.key]"\n',
      '        :panel-state="modulePanelStates[module.key]"\n        :aspect-ratio="aspectRatio"\n',
      "editor base aspectRatio",
    )
  }

  return next
}

function patchCreatePage(text) {
  let next = text

  if (!next.includes(':aspect-ratio="promptSettings.aspectRatio"')) {
    next = replaceOnce(
      next,
      '<PromptEditor :modules="selectedModules" v-model:module-values="moduleValues"\n',
      '<PromptEditor :modules="selectedModules" :aspect-ratio="promptSettings.aspectRatio" v-model:module-values="moduleValues"\n',
      "create PromptEditor aspectRatio",
    )
  }

  return next
}

const patchers = {
  "app/modules/types.ts": patchTypes,
  "app/components/modules/panel/base.vue": patchPanelBase,
  "app/components/prompt/editor.vue": patchPromptEditor,
  "app/pages/create.vue": patchCreatePage,
}

try {
  for (const relativePath of payloadFiles) {
    const sourcePath = join(payloadRoot, relativePath)

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing payload file: ${relativePath}`)
    }
  }

  const patchFiles = patchTargets.map(readProjectFile)
  const patchResults = patchFiles.map((file) => ({
    ...file,
    patched: patchers[file.relativePath](file.text),
  }))

  const allTargets = [...new Set([...patchTargets, ...payloadFiles])]
  const manifestEntries = allTargets.map((relativePath) => {
    const targetPath = join(projectRoot, relativePath)
    const existed = existsSync(targetPath)

    if (existed) {
      const backupPath = join(backupRoot, relativePath)
      mkdirSync(dirname(backupPath), { recursive: true })
      copyFileSync(targetPath, backupPath)
    }

    return {
      path: relativePath,
      existed,
    }
  })

  for (const file of patchResults) {
    if (file.patched !== file.text) {
      writeProjectFile(file, file.patched)
      console.log(`Patched: ${file.relativePath}`)
    } else {
      console.log(`Already patched: ${file.relativePath}`)
    }
  }

  for (const relativePath of payloadFiles) {
    const sourcePath = join(payloadRoot, relativePath)
    const targetPath = join(projectRoot, relativePath)

    mkdirSync(dirname(targetPath), { recursive: true })
    copyFileSync(sourcePath, targetPath)
    console.log(`Installed: ${relativePath}`)
  }

  writeFileSync(
    join(backupRoot, "manifest.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        entries: manifestEntries,
      },
      null,
      2,
    ),
    "utf8",
  )

  console.log("")
  console.log(`Backup created at: ${relative(projectRoot, backupRoot)}`)
  console.log("Layout stage 2 was applied successfully.")
} catch (error) {
  console.error("")
  console.error("Layout stage 2 installation failed.")
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
