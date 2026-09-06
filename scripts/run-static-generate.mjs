import { spawnSync } from 'node:child_process'

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const result = spawnSync(
  command,
  ['exec', 'nuxt', 'generate'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NUXT_LEGACY_STATIC_GENERATE: 'true',
    },
  },
)

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
