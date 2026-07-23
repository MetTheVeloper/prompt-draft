#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs"
import { join, resolve } from "node:path"
import process from "node:process"

const projectRoot = resolve(process.cwd())
const backupBase = join(projectRoot, ".layout-stage1-backup")

if (!existsSync(backupBase)) {
  console.error("No Layout stage 1 backup directory was found.")
  process.exit(1)
}

const backupNames = readdirSync(backupBase)
  .filter((name) => existsSync(join(backupBase, name, "manifest.json")))
  .sort()
  .reverse()

const selectedBackup = process.argv[2] || backupNames[0]

if (!selectedBackup) {
  console.error("No Layout stage 1 backup was found.")
  process.exit(1)
}

const backupRoot = join(backupBase, selectedBackup)
const manifestPath = join(backupRoot, "manifest.json")

if (!existsSync(manifestPath)) {
  console.error(`Backup manifest not found: ${selectedBackup}`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))

for (const relativePath of manifest.files || []) {
  copyFileSync(
    join(backupRoot, relativePath),
    join(projectRoot, relativePath),
  )

  console.log(`Restored: ${relativePath}`)
}

console.log(`Restored backup: ${selectedBackup}`)
