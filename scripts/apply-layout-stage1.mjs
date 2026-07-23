#!/usr/bin/env node

import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import process from "node:process"

const projectRoot = resolve(process.cwd())
const force = process.argv.includes("--force")

const targets = {
  types: "app/modules/types.ts",
  registry: "app/modules/registry.ts",
  compileModules: "app/utils/compileModules.ts",
  panelBase: "app/components/modules/panel/base.vue",
  promptEditor: "app/components/prompt/editor.vue",
}

const expectedBlobShas = {
  [targets.types]: "764c88f356904ea685151d82fd25030830ba1d92",
  [targets.registry]: "1c2d0f5ed138fbbf8adc963532dfb1714adc12e3",
  [targets.compileModules]: "40f3dda81b7ce33960bec7c8148018c611396b0d",
  [targets.panelBase]: "eebf496c5424f33fafc3215bb52dae9085291ef8",
  [targets.promptEditor]: "437c479828cf2f57dfe3340e04820d136c358776",
}

function normalizeEol(value) {
  return value.replace(/\r\n/g, "\n")
}

function getGitBlobSha(value) {
  const normalized = normalizeEol(value)
  const content = Buffer.from(normalized, "utf8")
  const header = Buffer.from(`blob ${content.length}\0`, "utf8")

  return createHash("sha1")
    .update(Buffer.concat([header, content]))
    .digest("hex")
}

function readProjectFile(relativePath) {
  const absolutePath = join(projectRoot, relativePath)

  if (!existsSync(absolutePath)) {
    throw new Error(`Missing file: ${relativePath}`)
  }

  const raw = readFileSync(absolutePath, "utf8")

  return {
    absolutePath,
    raw,
    eol: raw.includes("\r\n") ? "\r\n" : "\n",
    text: normalizeEol(raw),
  }
}

function replaceOnce(text, search, replacement, label) {
  const firstIndex = text.indexOf(search)

  if (firstIndex < 0) {
    throw new Error(`Patch anchor not found: ${label}`)
  }

  if (text.indexOf(search, firstIndex + search.length) >= 0) {
    throw new Error(`Patch anchor is not unique: ${label}`)
  }

  return text.slice(0, firstIndex) + replacement + text.slice(firstIndex + search.length)
}

function writePatchedFile(file, nextText) {
  const output = file.eol === "\r\n"
    ? nextText.replace(/\n/g, "\r\n")
    : nextText

  writeFileSync(file.absolutePath, output, "utf8")
}

function assertSourceVersion(relativePath, raw, alreadyPatched) {
  if (alreadyPatched) return

  const expected = expectedBlobShas[relativePath]
  const actual = getGitBlobSha(raw)

  if (actual === expected) return

  if (force) {
    console.warn(`Warning: ${relativePath} differs from the expected main version.`)
    return
  }

  throw new Error(
    [
      `${relativePath} differs from the main version used to build this patch.`,
      `Expected blob: ${expected}`,
      `Actual blob:   ${actual}`,
      `Run with --force only after reviewing the local changes.`,
    ].join("\n"),
  )
}

function patchTypes(text) {
  if (text.includes("| 'layoutRegions'")) return text

  let next = `import type { LayoutRegion } from "./layout.types"\n\n${text}`

  next = replaceOnce(
    next,
    "  | 'textarea'\n  | 'colorAssignments'",
    "  | 'textarea'\n  | 'layoutRegions'\n  | 'colorAssignments'",
    "types: ModuleFieldType",
  )

  next = replaceOnce(
    next,
    "  | TypographyTextGroup[]\n  | PromptVariable[]\n  | Record<string, unknown>[]",
    "  | TypographyTextGroup[]\n  | PromptVariable[]\n  | LayoutRegion[]\n  | Record<string, unknown>[]",
    "types: ModuleFieldValue",
  )

  next = replaceOnce(
    next,
    "  component?: 'input' | 'textarea' | 'select' | 'multiSelect' | 'segmented' | 'checkbox' | 'slider' | 'color' | 'colorAssignments' | 'textGroups' | 'variables'",
    "  component?: 'input' | 'textarea' | 'select' | 'multiSelect' | 'segmented' | 'checkbox' | 'slider' | 'color' | 'colorAssignments' | 'textGroups' | 'variables' | 'layoutRegions'",
    "types: ModuleFieldUiConfig component",
  )

  return next
}

function patchRegistry(text) {
  if (text.includes("developmentModules") && text.includes("LayoutModule")) return text

  let next = replaceOnce(
    text,
    "import { VariablesModule } from './variables.module'\n",
    "import { VariablesModule } from './variables.module'\nimport { LayoutModule } from './layout.module'\n\nconst developmentModules = import.meta.dev\n  ? [LayoutModule]\n  : []\n",
    "registry: LayoutModule import",
  )

  next = replaceOnce(
    next,
    "  VariablesModule,\n  StyleModule,",
    "  VariablesModule,\n  ...developmentModules,\n  StyleModule,",
    "registry: development module insertion",
  )

  return next
}

function patchCompileModules(text) {
  if (text.includes('from "./compileLayout"')) return text

  let next = replaceOnce(
    text,
    'import { formatPromptVariableDefinitions } from "./promptVariables";\n',
    'import { formatPromptVariableDefinitions } from "./promptVariables";\nimport { compileLayoutModule } from "./compileLayout";\n',
    "compileModules: compileLayout import",
  )

  next = replaceOnce(
    next,
    '  if (module.key === "typography") {\n    return compileTypographyModule(module, values);\n  }\n',
    '  if (module.key === "typography") {\n    return compileTypographyModule(module, values);\n  }\n\n  if (module.key === "layout") {\n    return compileLayoutModule(module, values);\n  }\n',
    "compileModules: layout compiler branch",
  )

  return next
}

function patchPanelBase(text) {
  if (text.includes("modules-layout-layout-regions-field")) return text

  let next = replaceOnce(
    text,
    '} from "../../../modules/types";\n\nimport type { PromptValidationIssue }',
    '} from "../../../modules/types";\nimport type { LayoutRegion } from "../../../modules/layout.types";\nimport type { ModuleOutputValue } from "../../../utils/compilePrompt";\n\nimport type { PromptValidationIssue }',
    "panel base: type imports",
  )

  next = replaceOnce(
    next,
    '  (event: "update:output", value: string): void;',
    '  (event: "update:output", value: ModuleOutputValue): void;',
    "panel base: output emit type",
  )

  next = replaceOnce(
    next,
    'function fieldClasses(field: ModuleField) {',
    'function getLayoutRegionsValue(fieldId: string) {\n  const value = values[fieldId];\n\n  return Array.isArray(value) ? value as LayoutRegion[] : [];\n}\n\nfunction fieldClasses(field: ModuleField) {',
    "panel base: layout region value helper",
  )

  next = replaceOnce(
    next,
    '      field.type === "textGroups" ||\n      field.type === "variables" ||\n      isCategorizedSelect(field),',
    '      field.type === "textGroups" ||\n      field.type === "variables" ||\n      field.type === "layoutRegions" ||\n      isCategorizedSelect(field),',
    "panel base: full-width field class",
  )

  next = replaceOnce(
    next,
    '      field.type === "textGroups" ||\n      field.type === "colorAssignments" ||\n      isCategorizedSelect(field)',
    '      field.type === "textGroups" ||\n      field.type === "colorAssignments" ||\n      field.type === "layoutRegions" ||\n      isCategorizedSelect(field)',
    "panel base: group columns",
  )

  next = replaceOnce(
    next,
    'async function copyOutput() {\n  if (!output.value) return;\n\n  try {\n    await navigator.clipboard.writeText(output.value);',
    'function getModuleOutputText(value: ModuleOutputValue) {\n  return typeof value === "string" ? value : JSON.stringify(value, null, 2);\n}\n\nasync function copyOutput() {\n  if (!output.value) return;\n\n  try {\n    await navigator.clipboard.writeText(getModuleOutputText(output.value));',
    "panel base: object output copy",
  )

  next = replaceOnce(
    next,
    '{{ output ? output : t("panel.emptyOutput") }}',
    '{{ output ? getModuleOutputText(output) : t("panel.emptyOutput") }}',
    "panel base: object output preview",
  )

  const textGroupsRenderer = `            <modules-panel-text-groups-field v-else-if="field.type === 'textGroups'" v-model="values[field.id]"
              :field="field" :module-key="module.key" />

            <input v-else-if="field.type === 'number'"`

  const layoutRenderer = `            <modules-panel-text-groups-field v-else-if="field.type === 'textGroups'" v-model="values[field.id]"
              :field="field" :module-key="module.key" />

            <modules-layout-layout-regions-field
              v-else-if="field.type === 'layoutRegions'"
              :model-value="getLayoutRegionsValue(field.id)"
              :field="field"
              @update:model-value="values[field.id] = $event"
            />

            <input v-else-if="field.type === 'number'"`

  next = replaceOnce(
    next,
    textGroupsRenderer,
    layoutRenderer,
    "panel base: layout region renderer",
  )

  return next
}

function patchPromptEditor(text) {
  if (text.includes("ModuleOutputValue") && text.includes("output: ModuleOutputValue")) {
    return text
  }

  let next = replaceOnce(
    text,
    'import type { ModuleOutputMap } from "../../utils/compilePrompt";',
    'import type {\n  ModuleOutputMap,\n  ModuleOutputValue,\n} from "../../utils/compilePrompt";',
    "prompt editor: ModuleOutputValue import",
  )

  next = replaceOnce(
    next,
    "function updateModuleOutput(moduleKey: string, output: string) {",
    "function updateModuleOutput(moduleKey: string, output: ModuleOutputValue) {",
    "prompt editor: updateModuleOutput type",
  )

  return next
}

const patchers = {
  [targets.types]: patchTypes,
  [targets.registry]: patchRegistry,
  [targets.compileModules]: patchCompileModules,
  [targets.panelBase]: patchPanelBase,
  [targets.promptEditor]: patchPromptEditor,
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
const backupRoot = join(projectRoot, ".layout-stage1-backup", timestamp)

try {
  const sourceFiles = Object.entries(patchers).map(([relativePath, patcher]) => {
    const file = readProjectFile(relativePath)
    const alreadyPatched = patcher(file.text) === file.text

    assertSourceVersion(relativePath, file.raw, alreadyPatched)

    return {
      relativePath,
      patcher,
      file,
      alreadyPatched,
    }
  })

  const changedFiles = sourceFiles.filter((item) => !item.alreadyPatched)

  if (!changedFiles.length) {
    console.log("Layout stage 1 is already applied.")
    process.exit(0)
  }

  changedFiles.forEach(({ relativePath, file }) => {
    const backupPath = join(backupRoot, relativePath)
    mkdirSync(dirname(backupPath), { recursive: true })
    copyFileSync(file.absolutePath, backupPath)
  })

  changedFiles.forEach(({ relativePath, patcher, file }) => {
    const nextText = patcher(file.text)
    writePatchedFile(file, nextText)
    console.log(`Patched: ${relativePath}`)
  })

  writeFileSync(
    join(backupRoot, "manifest.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        projectRoot,
        files: changedFiles.map((item) => item.relativePath),
      },
      null,
      2,
    ),
    "utf8",
  )

  console.log("")
  console.log(`Backup created at: ${relative(projectRoot, backupRoot)}`)
  console.log("Layout stage 1 was applied successfully.")
} catch (error) {
  console.error("")
  console.error("Layout stage 1 patch failed.")
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
