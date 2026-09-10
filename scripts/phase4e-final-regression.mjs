import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'

const gates = [
  ['Accepted Phase 4A–4D aggregate baseline', 'test:phase4d-final'],
  ['Blog Article contract + runtime loader', 'test:blog-contract'],
  ['Public Blog SSR + SEO + projection', 'test:blog-public'],
  ['Blog sitemap / llms / public inventory integration', 'test:blog-inventory'],
  ['Blog management authorization + authoring', 'test:blog-manage'],
  ['Managed Blog media + Gallery authoring', 'test:blog-media'],
  ['Canonical Git publication + audit', 'test:blog-publish'],
]

function runPnpmScript(script) {
  if (isWindows) {
    return spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', `pnpm ${script}`],
      { stdio: 'inherit', env: process.env },
    )
  }

  return spawnSync('pnpm', [script], {
    stdio: 'inherit',
    env: process.env,
  })
}

function fail(label, result) {
  if (result.error) {
    console.error(`[phase4e-final] Failed to start ${label}:`, result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\n[phase4e-final] FAIL: ${label} exited with ${result.status ?? 'unknown status'}`)
    process.exit(result.status ?? 1)
  }
}

console.log('[phase4e-final] Running aggregate Blog V1 regression against the accepted Phase 4A–4D baseline.')
console.log('[phase4e-final] This command intentionally does not rebuild Docker services.')
console.log('[phase4e-final] 4E.1–4E.5 must already be accepted before this final aggregate gate is used.')

for (const [label, script] of gates) {
  console.log(`\n[phase4e-final] ${label}`)
  const result = runPnpmScript(script)
  fail(`pnpm ${script}`, result)
}

console.log('\n[phase4e-final] PASS: Phase 4A–4D baseline and all Blog contract/public/inventory/manage/media/publication regressions passed.')
