import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'

const backendGates = [
  ['Creator profile foundation', 'test:creator-profile-foundation'],
  ['Creator skill taxonomy', 'test:profile-skill-taxonomy'],
  ['Authenticated profile management', 'test:profile-management'],
  ['Creator application + admin review', 'test:creator-account'],
  ['Generated username contract', 'test:generated-username'],
  ['Public Creator policy/API', 'test:public-creator'],
  ['Prompt/Discovery Creator attribution', 'test:creator-attribution'],
]

const frontendGates = [
  ['Public Creator SSR/SEO/browser contract', 'test:public-creator-web'],
  ['Creator attribution browser contract', 'test:creator-attribution-web'],
  ['Phase 4B protected/public regression', 'test:phase4b-final'],
  ['Runtime localization contract', 'locale:check'],
]

function fail(label, result) {
  if (result.error) {
    console.error(`[phase4c-final] Failed to start ${label}:`, result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\n[phase4c-final] FAIL: ${label} exited with ${result.status ?? 'unknown status'}`)
    process.exit(result.status ?? 1)
  }
}

function runBackendScript(label, script) {
  console.log(`\n[phase4c-final] Backend — ${label}`)
  const result = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'api', 'npm', 'run', script],
    { stdio: 'inherit', env: process.env },
  )
  fail(`backend ${script}`, result)
}

function runPnpmScript(label, script) {
  console.log(`\n[phase4c-final] Frontend — ${label}`)

  const result = isWindows
    ? spawnSync(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', `pnpm ${script}`],
        { stdio: 'inherit', env: process.env },
      )
    : spawnSync('pnpm', [script], { stdio: 'inherit', env: process.env })

  fail(`pnpm ${script}`, result)
}

console.log('[phase4c-final] Running aggregate Phase 4C regression against the currently running API image.')
console.log('[phase4c-final] This command intentionally does not rebuild Docker services.')

for (const [label, script] of backendGates) {
  runBackendScript(label, script)
}

for (const [label, script] of frontendGates) {
  runPnpmScript(label, script)
}

console.log('\n[phase4c-final] PASS: all Phase 4C backend/frontend/privacy/routing/localization regression gates passed.')
