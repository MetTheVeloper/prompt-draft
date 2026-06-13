import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ir.promptdraft.app',
  appName: 'PROMPT DRAFT',
  webDir: '.output/public',

  android: {
    backgroundColor: '#0f0f14',
  },

  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
      animation: 'NONE',
    },
  },
}

export default config