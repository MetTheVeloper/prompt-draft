#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()

const protectedFiles = [
  'app/utils/compileHair.ts',
  'app/utils/compileOutfit.ts',
  'app/utils/hairVariables.ts',
  'app/utils/outfitVariables.ts',
  'app/utils/promptVariables.ts',
  'app/modules/hair.catalog.ts',
  'app/modules/outfit.catalog.ts',
  'app/modules/variables.blueprints.ts',
]

const forbiddenRuntimeI18n = [
  /\buseI18n\s*\(/,
  /\buseCatalogI18n\s*\(/,
  /\bi18n\.t\s*\(/,
  /\$t\s*\(/,
]

const requiredBlueprintDefaults = [
  'attached artwork reference image',
  'front center of the t-shirt',
  'natural DTF garment print',
]

function fail(message) {
  throw new Error(message)
}

async function assertSemanticBoundary() {
  console.log('Checking localization / semantic boundary...')

  for (const relative of protectedFiles) {
    const absolute = path.join(ROOT, relative)
    const source = await fs.readFile(absolute, 'utf8')

    for (const pattern of forbiddenRuntimeI18n) {
      if (pattern.test(source)) {
        fail(`${relative} imports or invokes locale-dependent translation. Protected semantic/compiler files must stay locale-independent.`)
      }
    }
  }

  const blueprints = await fs.readFile(path.join(ROOT, 'app/modules/variables.blueprints.ts'), 'utf8')
  for (const value of requiredBlueprintDefaults) {
    if (!blueprints.includes(value)) {
      fail(`Protected Blueprint semantic default changed or disappeared: ${JSON.stringify(value)}`)
    }
  }

  const [hairCatalog, outfitCatalog] = await Promise.all([
    fs.readFile(path.join(ROOT, 'app/modules/hair.catalog.ts'), 'utf8'),
    fs.readFile(path.join(ROOT, 'app/modules/outfit.catalog.ts'), 'utf8'),
  ])

  if (!/promptText\s*:/.test(hairCatalog) || !/promptText\s*:/.test(outfitCatalog)) {
    fail('Expected locale-independent promptText metadata is missing from Hair or Outfit catalog.')
  }

  console.log('Semantic boundary check passed. ✅')
  console.log('')
}

function runNodeScript(relative, args = []) {
  const script = path.join(ROOT, relative)
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    fail(`${relative} exited with status ${result.status}`)
  }
}

async function main() {
  await assertSemanticBoundary()

  // Keep audit and review as the final two stages so one command always leaves
  // fresh reports behind for the handoff/checkpoint review.
  runNodeScript('scripts/localization-audit.mjs', ['all', '--strict'])
  console.log('')
  runNodeScript('scripts/localization-review.mjs')
  console.log('')
  console.log('Localization consolidation complete. ✅')
}

main().catch((error) => {
  console.error('Localization consolidation failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
