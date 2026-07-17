<script setup lang="ts">
import { useAppStore } from "~/store/app";
import { NAVIGATION } from '~/config/navigation'
import ImageBatchConverter from '~/components/tools/ImageBatchConverter.vue'
import AboutModal from '~/components/modals/about.vue'
const route = useRoute();

const { t, switchTheme } = useTheme();
const { locale, setLocale, t: translate } = useI18n();
const app = useAppStore();
const { mini } = useScreen();
const menu = useMenu();
const modal = useModal();
const toolsButtonRef = ref();
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

async function switchLanguage() {
  const nextLocale = locale.value === 'en' ? 'fa' : 'en'

  await setLocale(nextLocale)
}

function openImageConverterModal() {
  modal.open({
    header: {
      icon: 'gallery-export',
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
      icon: 'info-circle',
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

function openToolsMenu() {
  menu.open({
    mode: 'dropdown',
    anchor: toolsButtonRef.value,
    placement: locale.value === 'fa' ? 'bottom-start' : 'bottom-end',
    items: [
      {
        label: translate('app.tools.convert'),
        icon: 'gallery-export',
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
        icon: 'info-circle',
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

</script>

<template>
  <el-flex v-if="app.ready" rules="rbc" type="header" :p="[8, 24]" :gap="16" :br="[0, 0, 1, 0]" bc="normal5"
    bg="surface65" bd="b8"
    :class="['post t0 l0 r0 w100 zi200 app-header', `mnhp${dimension().header.height}`]"
    @contextmenu="handleHeaderContextMenu">
    <el-flex rules="rsc" type="link" to="/">
      <img :src="`img/g_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`" class="hp32" :alt="$t('app.title')" />
      <!-- <img :src="`img/logo_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`" class="hp40" :alt="$t('app.title')" /> -->
    </el-flex>
    <el-divider direction="vertical" :height="24" mode="dashed" :dash="4" :gap="2" color="prim" />
    <el-flex rules="rsc" class="fg100" :gap="8">
      <el-button v-for="item in NAVIGATION" :key="item.to" :to="item.to"
        v-show="item.name !== 'vectorizer'"
        :color="route.name === item.name ? 'prim' : 'normal'" :effect="true"
        :mode="route.name === item.name ? 'normal' : 'flat'" :label="$t(`app.navigation.${item.name}`)"
        :icon="item.icon" :type="mini && route.name !== item.name ? 'fab' : 'default'" :gap="8" :size="12"
        :p="[8, 12]" />
    </el-flex>
    <el-text
      v-if="offlineHeaderLabel"
      type="span"
      :size="mini ? 10 : 11"
      :weight="700"
      :marker="offlineHeaderMarker"
      :style="{ whiteSpace: 'nowrap' }">
      {{ offlineHeaderLabel }}
    </el-text>
    <el-flex rules="rcc">
      <el-button :size="14" :p="8" mode="flat" type="fab" :label="$t('app.switchTheme')"
        :icon="t.theme.mode === 'dark' ? 'sun-1' : 'moon'" @click="switchTheme" />
      <el-button :size="14" :p="8" mode="flat" type="fab" :label="$t('app.switchLang')"
        :icon="locale === 'fa' ? 'en' : 'fa'" @click="switchLanguage" />
      <el-button ref="toolsButtonRef" :size="14" :p="8" mode="flat" type="fab" :label="$t('app.tools.menu')"
        icon="more-vertical" @click="openToolsMenu" />
    </el-flex>
  </el-flex>
</template>

<style>
html.is-native-app .app-header {
  top: 0 !important;
  padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 8px) !important;
}
</style>