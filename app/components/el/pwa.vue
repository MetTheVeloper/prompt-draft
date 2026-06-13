<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

const isNativeApp = ref(false)

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

const { t } = useI18n()

const DISMISS_DAYS = 3
const DISMISS_KEY = 'prompt-draft:pwa-install-dismissed-until'

const installPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)

const isInstallable = ref(false)
const isIosGuideVisible = ref(false)
const isDismissed = ref(false)
const isStandaloneMode = ref(false)

const shouldShowBanner = computed(() => {
  if (isNativeApp.value) return false
  if (isDismissed.value) return false
  if (isStandaloneMode.value) return false

  return isInstallable.value || isIosGuideVisible.value
})

const bannerTitle = computed(() => {
  if (isInstallable.value) return t('pwa.install.android.title')
  return t('pwa.install.ios.title')
})

const bannerDescription = computed(() => {
  if (isInstallable.value) {
    return t('pwa.install.android.description')
  }

  return t('pwa.install.ios.description')
})

const getIsStandalone = () => {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const getIsIos = () => {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  return (
    /iphone|ipad|ipod/.test(ua) ||
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
  )
}

const getDismissedState = () => {
  if (typeof window === 'undefined') return false

  const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY))

  if (!dismissedUntil) return false

  return Date.now() < dismissedUntil
}

const dismissBanner = () => {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000

  localStorage.setItem(DISMISS_KEY, String(dismissedUntil))

  isDismissed.value = true
  isInstallable.value = false
  isIosGuideVisible.value = false
  installPrompt.value = null
}

const handleBeforeInstallPrompt = (event: Event) => {
  if (isStandaloneMode.value) return
  if (isDismissed.value) return

  event.preventDefault()

  installPrompt.value = event as BeforeInstallPromptEvent
  isInstallable.value = true
  isIosGuideVisible.value = false
}

const handleAppInstalled = () => {
  isInstallable.value = false
  isIosGuideVisible.value = false
  installPrompt.value = null
  isStandaloneMode.value = true

  localStorage.removeItem(DISMISS_KEY)
}

const handleInstallClick = async () => {
  if (!installPrompt.value) return

  await installPrompt.value.prompt()

  const { outcome } = await installPrompt.value.userChoice

  if (outcome === 'accepted') {
    isInstallable.value = false
    localStorage.removeItem(DISMISS_KEY)
  }

  installPrompt.value = null
}

onMounted(() => {
  isNativeApp.value = Capacitor.isNativePlatform()
  isStandaloneMode.value = getIsStandalone()

  if (isStandaloneMode.value) return

  isDismissed.value = getDismissedState()

  if (!isDismissed.value && getIsIos()) {
    isIosGuideVisible.value = true
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<template>
  <Transition name="pwa-banner">
    <el-flex v-if="shouldShowBanner" rules="csc" :gap="14" :p="16" :radius="18" class="pof bp20 rp20 lp20 zi300 mxwp300"
      :br="[2, 4, 4, 4]" :bc="['prim50', 'prim', 'prim', 'prim']" bg="normal5" bd="b8">
      <el-flex rules="rss" :gap="12" class="w100">
        <el-icon :icon="isInstallable ? 'mobile' : 'home'" :size="24" color="onPrim" class="bg-prim p10 br16 fccc" />

        <el-grid :gap="4">
          <el-text type="h3" :size="16" weight="700">
            {{ bannerTitle }}
          </el-text>

          <el-text type="p" :size="14" :weight="600" color="normal75" class="lh15">
            {{ bannerDescription }}
          </el-text>
        </el-grid>
      </el-flex>

      <el-grid v-if="isIosGuideVisible" class="w100" :gap="4" :p="10" :radius="12" bg="normal10">
        <el-text type="p" :size="12" color="normal70">
          {{ t('pwa.install.ios.steps.share') }}
        </el-text>

        <el-text type="p" :size="12" color="normal70">
          {{ t('pwa.install.ios.steps.addToHomeScreen') }}
        </el-text>

        <el-text type="p" :size="12" color="normal70">
          {{ t('pwa.install.ios.steps.confirm') }}
        </el-text>
      </el-grid>

      <el-flex rules="rec" :gap="8" class="w100">
        <el-button v-if="isInstallable" :size="14" color="prim" icon="mobile" :label="t('pwa.install.android.action')"
          @click="handleInstallClick" />

        <el-button v-else :size="14" icon="like-1" :label="t('pwa.install.ios.action')" @click="dismissBanner" />

        <el-button :size="14" icon="close-simple" :label="t('pwa.install.actions.close')" mode="flat" color="red"
          @click="dismissBanner" />
      </el-flex>
    </el-flex>
  </Transition>
</template>

<style scoped>
.pwa-banner-enter-active,
.pwa-banner-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.pwa-banner-enter-from,
.pwa-banner-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>