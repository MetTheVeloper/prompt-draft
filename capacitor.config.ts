/// <reference types="@capacitor/splash-screen" />

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

    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#0f0f14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config