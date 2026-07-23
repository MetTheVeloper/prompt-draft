#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import process from "node:process"

const projectRoot = resolve(process.cwd())
const targetRelativePath = "app/components/modules/panel/base.vue"
const targetPath = join(projectRoot, targetRelativePath)

if (!existsSync(targetPath)) {
  console.error(`File not found: ${targetRelativePath}`)
  process.exit(1)
}

const raw = readFileSync(targetPath, "utf8")
const eol = raw.includes("\r\n") ? "\r\n" : "\n"
let text = raw.replace(/\r\n/g, "\n")

const importLine =
  'import LayoutRegionsField from "../layout/LayoutRegionsField.vue";'

const wrongTag = "modules-layout-layout-regions-field"
const correctTag = "LayoutRegionsField"

if (!text.includes(wrongTag) && text.includes(importLine)) {
  console.log("Layout region component fix is already applied.")
  process.exit(0)
}

const backupPath = `${targetPath}.before-layout-region-fix`

if (!existsSync(backupPath)) {
  copyFileSync(targetPath, backupPath)
}

if (!text.includes(importLine)) {
  const preferredAnchor =
    'import type { LayoutRegion } from "../../../modules/layout.types";\n'

  const fallbackAnchor =
    '} from "../../../modules/types";\n'

  if (text.includes(preferredAnchor)) {
    text = text.replace(
      preferredAnchor,
      `${preferredAnchor}${importLine}\n`,
    )
  } else if (text.includes(fallbackAnchor)) {
    text = text.replace(
      fallbackAnchor,
      `${fallbackAnchor}${importLine}\n`,
    )
  } else {
    console.error("Could not find a safe import anchor in base.vue.")
    process.exit(1)
  }
}

if (!text.includes(wrongTag)) {
  console.error(
    `Could not find <${wrongTag}> in ${targetRelativePath}.`,
  )
  process.exit(1)
}

text = text.replaceAll(wrongTag, correctTag)

const output = eol === "\r\n"
  ? text.replace(/\n/g, "\r\n")
  : text

writeFileSync(targetPath, output, "utf8")

console.log(`Fixed: ${targetRelativePath}`)
console.log(`Backup: ${targetRelativePath}.before-layout-region-fix`)
console.log("")
console.log("Restart the Nuxt dev server after clearing .nuxt.")
