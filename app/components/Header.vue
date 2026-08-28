<script setup lang="ts">
import type { GlobalMenuItem } from '~/composables/useMenu'
import { useAppStore } from "~/store/app";
import { NAVIGATION } from '~/config/navigation'
import ImageBatchConverter from '~/components/tools/ImageBatchConverter.vue'
import AboutModal from '~/components/modals/about.vue'

const route = useRoute();

const { t, switchTheme } = useTheme();
const { locale, locales, localeProperties, setLocale, t: translate } = useI18n();
const app = useAppStore();
const { mini, mobile } = useScreen();
const menu = useMenu();
const modal = useModal();
const toolsButtonRef = ref();
const languageButtonRef = ref();
const offlinePackage = useOfflinePackage();

const offlineHeaderLabel = computed(() => {
  if (offlinePackage.state.downloading) {
    if (mini.value) return `${offlinePackage.state.progress}%`

    return translate('pwa.offline.status.downloading', {
      progress: offlinePackage.state.progress,
    })
  }

  if (offlinePackage.state.isStandalone && !offlinePackage.state.online) {
    return translate('pwa.offline.status.offlineMode')
  }

  return ''
})

const offlineHeaderMarker = computed(() => {
  return offlinePackage.state.downloading ? 'prim40' : 'orange40'
})

const emit = defineEmits<{
  (event: "contextmenu", value: MouseEvent): void;
}>();

function handleHeaderContextMenu(event: MouseEvent) {
  emit("contextmenu", event);
}

const isRtl = computed(() => {
  return localeProperties.value?.dir === 'rtl'
})

const languageMenuItems = computed<GlobalMenuItem[]>(() => {
  return locales.value.map((item) => {
    const code = typeof item === 'string'
      ? item
      : item.code

    const label = typeof item === 'string'
      ? item.toUpperCase()
      : item.name || item.code.toUpperCase()

    return {
      label,
      value: code,
      active: code === locale.value,
      color: 'normal15',
      handler: async () => {
        if (code === locale.value) return

        await setLocale(code)
      },
    }
  })
})

function openLanguageMenu() {
  menu.open({
    mode: 'dropdown',
    anchor: languageButtonRef.value,
    placement: isRtl.value ? 'bottom-start' : 'bottom-end',
    items: languageMenuItems.value,
    options: {
      minWidth: 160,
      closeOnSelect: true,
    },
  })
}

function openImageConverterModal() {
  modal.open({
    header: {
      icon: 'image',
      title: translate('tools.imageConverter.title'),
      subtitle: translate('tools.imageConverter.subtitle'),
      closeButton: true,
      color: 'prim',
    },
    component: ImageBatchConverter,
    options: {
      width: 720,
      maxHeight: '85vh',
      closeOnBackdrop: false,
      closeOnEsc: true,
      persistent: true,
    },
  })
}

function openAboutModal() {
  modal.open({
    header: {
      icon: 'info',
      title: 'tools.about.title',
      subtitle: 'tools.about.subtitle',
      closeButton: true,
      color: 'prim',
    },
    component: AboutModal,
    options: {
      width: 520,
      maxHeight: '80vh',
      closeOnBackdrop: true,
      closeOnEsc: true,
    },
  })
}

function openVectorizer() {
  navigateTo('/vectorizer')
}

function openPortraitWizard() {
  navigateTo('/wizard/portrait')
}

function openToolsMenu() {
  menu.open({
    mode: 'dropdown',
    anchor: toolsButtonRef.value,
    placement: isRtl.value ? 'bottom-start' : 'bottom-end',
    items: [
      {
        label: translate('app.tools.convert'),
        icon: 'image',
        color: 'normal15',
        handler: openImageConverterModal,
      },
      {
        label: translate('tools.imageVectorizer.title'),
        icon: 'shapes',
        color: 'normal15',
        handler: openVectorizer,
      },
      {
        type: 'divider',
      },
      {
        label: translate('app.tools.about'),
        icon: 'info',
        color: 'normal15',
        handler: openAboutModal,
      },
    ],
    options: {
      minWidth: 180,
      closeOnSelect: true,
    },
  })
}

const mobileMenuItems = computed<GlobalMenuItem[]>(() => {
  const navigationItems: GlobalMenuItem[] = NAVIGATION
    .filter(item => item.name !== 'vectorizer')
    .map(item => ({
      label: translate(`app.navigation.${item.name}`),
      icon: item.icon,
      active: route.name === item.name,
      color: 'normal15',
      value: item.to,
      handler: async () => {
        await navigateTo(item.to)
      },
    }))

  const statusItems: GlobalMenuItem[] = offlineHeaderLabel.value
    ? [
        {
          type: 'header',
          label: offlineHeaderLabel.value,
        },
        {
          type: 'divider',
        },
      ]
    : []

  const wizardItems: GlobalMenuItem[] = route.name === 'create'
    ? [
        {
          type: 'divider',
        },
        {
          label: 'Portrait Wizard',
          icon: 'auto_awesome',
          color: 'prim15',
          handler: openPortraitWizard,
        },
      ]
    : []

  return [
    ...statusItems,
    ...navigationItems,
    ...wizardItems,
    {
      type: 'divider',
    },
    {
      label: translate('app.tools.convert'),
      icon: 'image',
      color: 'normal15',
      handler: openImageConverterModal,
    },
    {
      label: translate('tools.imageVectorizer.title'),
      icon: 'shapes',
      color: 'normal15',
      handler: openVectorizer,
    },
    {
      label: translate('app.tools.about'),
      icon: 'info',
      color: 'normal15',
      handler: openAboutModal,
    },
  ]
})

function openMobileMenu() {
  menu.open({
    mode: 'drawer',
    items: mobileMenuItems.value,
    options: {
      width: 'min(86vw, 340px)',
      maxWidth: '340px',
      maxHeight: '100vh',
      safePadding: 0,
      offset: 0,
      closeOnSelect: true,
      closeOnOutside: true,
      closeOnEsc: true,
      closeOnScroll: false,
      closeOnResize: true,
      drawerSide: isRtl.value ? 'left' : 'right',
      zIndex: 2400,
    },
  })
}
</script>

<template>
  <el-flex
    v-if="app.ready"
    rules="rbc"
    type="header"
    :p="[8, 24]"
    :gap="16"
    :br="[0, 0, 1, 0]"
    bc="normal5"
    bg="surface65"
    bd="b8"
    :class="['post t0 l0 r0 w100 zi200 app-header', `mnhp${dimension().header.height}`]"
    @contextmenu="handleHeaderContextMenu">

    <el-flex rules="rsc" type="link" to="/">
      <img
        :src="`img/g_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`"
        class="hp32"
        :alt="$t('app.title')"
      />
    </el-flex>

    <el-divider
      v-if="!mobile"
      direction="vertical"
      :height="24"
      mode="dashed"
      :dash="4"
      :gap="2"
      color="prim"
    />

    <el-flex
      v-if="!mobile"
      rules="rsc"
      class="fg100"
      :gap="8">
      <el-button
        v-for="item in NAVIGATION"
        :key="item.to"
        :to="item.to"
        v-show="item.name !== 'vectorizer'"
        :color="route.name === item.name ? 'prim' : 'normal'"
        :effect="true"
        :mode="route.name === item.name ? 'normal' : 'flat'"
        :label="$t(`app.navigation.${item.name}`)"
        :icon="item.icon"
        :type="mini && route.name !== item.name ? 'fab' : 'default'"
        :gap="8"
        :size="12"
        :p="[8, 12]"
      />
    </el-flex>

    <div v-else class="fg100" />

    <el-button
      v-if="!mobile && route.name === 'create'"
      label="Portrait Wizard"
      icon="auto_awesome"
      color="prim"
      :mode="mini ? 'flat' : 'normal'"
      :type="mini ? 'fab' : 'default'"
      :size="12"
      :p="[8, 12]"
      @click="openPortraitWizard"
    />

    <el-text
      v-if="!mobile && offlineHeaderLabel"
      type="span"
      :size="mini ? 10 : 11"
      :weight="700"
      :marker="offlineHeaderMarker"
      class="wsnw">
      {{ offlineHeaderLabel }}
    </el-text>

    <el-flex rules="rcc" :gap="2">
      <el-button
        :size="14"
        :p="8"
        mode="flat"
        type="fab"
        :label="$t('app.switchTheme')"
        :icon="t.theme.mode === 'dark' ? 'light_mode' : 'dark_mode'"
        @click="switchTheme"
      />

      <el-button
        ref="languageButtonRef"
        :size="14"
        :p="8"
        mode="flat"
        type="fab"
        :label="$t('app.switchLang')"
        icon="language"
        @click="openLanguageMenu"
      />

      <el-button
        v-if="mobile"
        :size="14"
        :p="8"
        mode="flat"
        type="fab"
        :label="$t('app.tools.menu')"
        icon="menu"
        @click="openMobileMenu"
      />

      <el-button
        v-else
        ref="toolsButtonRef"
        :size="14"
        :p="8"
        mode="flat"
        type="fab"
        :label="$t('app.tools.menu')"
        icon="more_vert"
        @click="openToolsMenu"
      />
    </el-flex>
  </el-flex>
</template>

<style>
html.is-native-app .app-header {
  top: 0 !important;
  padding-top: calc(var(--safe-area-inset-top, env(var(--safe-area-inset-top), 0px)) + 8px) !important;
}
</style>
