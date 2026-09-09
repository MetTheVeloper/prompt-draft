import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const command = isWindows
  ? (process.env.ComSpec || process.env.COMSPEC || 'cmd.exe')
  : 'pnpm'
const args = isWindows
  ? ['/d', '/s', '/c', 'pnpm exec nuxt generate']
  : ['exec', 'nuxt', 'generate']

const result = spawnSync(
  command,
  args,
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
