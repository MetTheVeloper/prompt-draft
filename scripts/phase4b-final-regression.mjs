import { spawnSync } from 'node:child_process'

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const gates = [
  ['SEO contracts', 'test:seo-contracts'],
  ['Public Prompt browser/SSR DTO', 'test:public-prompt-web'],
  ['Public Prompt SEO', 'test:public-prompt-seo'],
  ['Localized Public Prompt description', 'test:public-prompt-description'],
  ['Shared Prompt presentation', 'test:prompt-presentation'],
  ['Public Discovery visual layer', 'test:public-discovery-visual'],
  ['Public Prompt link migration', 'test:public-prompt-links'],
  ['Interaction polish', 'test:interaction-polish'],
  ['Strict locale-routing audit', 'seo:audit-routes:strict'],
]

for (const [label, script] of gates) {
  console.log(`\n[phase4b-final] ${label}`)
  const result = spawnSync(pnpm, [script], {
    stdio: 'inherit',
    env: process.env,
  })

  if (result.error) {
    console.error(`[phase4b-final] Failed to start ${script}:`, result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\n[phase4b-final] FAIL: ${script} exited with ${result.status ?? 'unknown status'}`)
    process.exit(result.status ?? 1)
  }
}

console.log('\n[phase4b-final] PASS: all frontend/SEO/routing/presentation/discovery regression gates passed.')
