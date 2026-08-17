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
const modal = useModal()
const offlinePackage = useOfflinePackage()

const DISMISS_DAYS = 3
const DISMISS_KEY = 'prompt-draft:pwa-install-dismissed-until'
const OFFLINE_PROMPT_KEY = 'prompt-draft:offline-package-prompted'

const installPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)

const isInstallable = ref(false)
const isIosGuideVisible = ref(false)
const isDismissed = ref(false)
const isStandaloneMode = ref(false)
const isMounted = ref(false)

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

function hasPromptedForVersion(version: string) {
  if (!import.meta.client) return false

  try {
    return sessionStorage.getItem(OFFLINE_PROMPT_KEY) === version
  } catch {
    return false
  }
}

function markVersionPrompted(version: string) {
  if (!import.meta.client) return

  try {
    sessionStorage.setItem(OFFLINE_PROMPT_KEY, version)
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
}

async function maybeOfferOfflinePackage() {
  if (!isMounted.value) return
  if (isNativeApp.value) return
  if (!offlinePackage.state.isStandalone) return
  if (!offlinePackage.state.online) return
  if (!offlinePackage.state.checked) return
  if (offlinePackage.state.ready) return

  const hasCompleteCurrentCache = (
    offlinePackage.state.totalFiles > 0 &&
    offlinePackage.state.completedFiles >= offlinePackage.state.totalFiles &&
    offlinePackage.state.progress >= 100
  )

  if (hasCompleteCurrentCache) return
  if (offlinePackage.state.downloading) return
  if (!offlinePackage.state.version) return
  if (hasPromptedForVersion(offlinePackage.state.version)) return

  markVersionPrompted(offlinePackage.state.version)

  const isUpdate = offlinePackage.state.updateAvailable

  modal.open({
    header: {
      icon: isUpdate ? 'refresh' : 'cloud_upload',
      title: isUpdate
        ? t('pwa.offline.prompt.updateTitle')
        : t('pwa.offline.prompt.title'),
      subtitle: t('pwa.offline.prompt.subtitle'),
      closeButton: true,
      color: 'prim',
    },
    descriptions: [
      isUpdate
        ? t('pwa.offline.prompt.updateDescription', {
            size: offlinePackage.formattedTotalSize.value,
          })
        : t('pwa.offline.prompt.description', {
            size: offlinePackage.formattedTotalSize.value,
          }),
      t('pwa.offline.prompt.backgroundHint'),
    ],
    actions: [
      {
        label: isUpdate
          ? t('pwa.offline.prompt.updateAction')
          : t('pwa.offline.prompt.action'),
        icon: 'cloud_upload',
        color: 'prim',
        close: true,
        handler: async () => {
          const started = await offlinePackage.download()
          return started
        },
      },
      {
        label: t('pwa.offline.prompt.later'),
        icon: 'schedule',
        color: 'normal',
        mode: 'flat',
        close: true,
      },
    ],
    options: {
      width: 520,
      closeOnBackdrop: true,
      closeOnEsc: true,
      persistent: false,
      blur: true,
    },
  })
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

watch(
  () => [
    offlinePackage.state.isStandalone,
    offlinePackage.state.online,
    offlinePackage.state.checked,
    offlinePackage.state.ready,
    offlinePackage.state.downloading,
    offlinePackage.state.version,
    offlinePackage.state.updateAvailable,
  ],
  () => {
    void maybeOfferOfflinePackage()
  },
)

watch(
  () => offlinePackage.state.error,
  (error) => {
    if (!error || !isMounted.value) return
    if (!offlinePackage.state.isStandalone) return

    modal.open({
      header: {
        icon: 'warning',
        title: t('pwa.offline.status.failed'),
        closeButton: true,
        color: 'orange',
      },
      descriptions: t('pwa.offline.status.failedDescription'),
      actions: [
        {
          label: t('pwa.offline.status.retry'),
          icon: 'refresh',
          color: 'prim',
          close: true,
          disable: () => !offlinePackage.state.online,
          handler: async () => offlinePackage.download(),
        },
        {
          label: t('pwa.offline.prompt.later'),
          icon: 'cancel',
          color: 'normal',
          mode: 'flat',
          close: true,
        },
      ],
      options: {
        width: 480,
        closeOnBackdrop: true,
        closeOnEsc: true,
      },
    })
  },
)

onMounted(() => {
  isMounted.value = true
  isNativeApp.value = Capacitor.isNativePlatform()
  isStandaloneMode.value = getIsStandalone()

  if (!isStandaloneMode.value) {
    isDismissed.value = getDismissedState()

    if (!isDismissed.value && getIsIos()) {
      isIosGuideVisible.value = true
    }
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  void maybeOfferOfflinePackage()
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
        <el-button v-if="isInstallable" :size="14" color="prim" icon="smartphone" :label="t('pwa.install.android.action')"
          @click="handleInstallClick" />

        <el-button v-else :size="14" icon="thumb_up" :label="t('pwa.install.ios.action')" @click="dismissBanner" />

        <el-button :size="14" icon="close" :label="t('pwa.install.actions.close')" mode="flat" color="red"
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
