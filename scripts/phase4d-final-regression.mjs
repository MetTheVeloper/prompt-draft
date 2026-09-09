import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'

const gates = [
  ['Accepted Phase 4A–4C aggregate baseline', 'test:phase4c-final'],
  ['Shared public URL inventory + sitemap projection', 'test:public-url-inventory'],
  ['Robots policy + runtime delivery', 'test:robots-policy'],
  ['llms.txt shared projection + runtime delivery', 'test:llms-discovery'],
  ['Native Discovery SEO + legacy-generator retirement', 'test:discovery-seo'],
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
    console.error(`[phase4d-final] Failed to start ${label}:`, result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\n[phase4d-final] FAIL: ${label} exited with ${result.status ?? 'unknown status'}`)
    process.exit(result.status ?? 1)
  }
}

console.log('[phase4d-final] Running aggregate Phase 4D regression against the currently running services.')
console.log('[phase4d-final] This command intentionally does not rebuild Docker services.')
console.log('[phase4d-final] It first proves the accepted 4A–4C baseline, then the 4D inventory/robots/llms/Discovery contracts.')

for (const [label, script] of gates) {
  console.log(`\n[phase4d-final] ${label}`)
  const result = runPnpmScript(script)
  fail(`pnpm ${script}`, result)
}

console.log('\n[phase4d-final] PASS: accepted 4A–4C regressions and all Phase 4D public inventory/robots/AI-discovery/Discovery migration contracts passed.')
