#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { join, resolve } from "node:path"
import process from "node:process"

const projectRoot = resolve(process.cwd())
const backupBase = join(projectRoot, ".layout-stage2-backup")

if (!existsSync(backupBase)) {
  console.error("No Layout stage 2 backup directory was found.")
  process.exit(1)
}

const backups = readdirSync(backupBase)
  .filter((name) => existsSync(join(backupBase, name, "manifest.json")))
  .sort()
  .reverse()

const selectedBackup = process.argv[2] || backups[0]

if (!selectedBackup) {
  console.error("No Layout stage 2 backup was found.")
  process.exit(1)
}

const backupRoot = join(backupBase, selectedBackup)
const manifest = JSON.parse(
  readFileSync(join(backupRoot, "manifest.json"), "utf8"),
)

for (const entry of manifest.entries || []) {
  const targetPath = join(projectRoot, entry.path)

  if (entry.existed) {
    copyFileSync(join(backupRoot, entry.path), targetPath)
    console.log(`Restored: ${entry.path}`)
    continue
  }

  if (existsSync(targetPath)) {
    rmSync(targetPath, { force: true })
    console.log(`Removed: ${entry.path}`)
  }
}

console.log(`Restored backup: ${selectedBackup}`)
