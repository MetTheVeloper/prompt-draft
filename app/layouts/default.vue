<script setup lang="ts">
import type { GlobalMenuItem } from "~/composables/useMenu";

const { t, locale, locales, localeProperties, setLocale } = useI18n();
const { t: theme, switchTheme } = useTheme();
const { mobile, tablet } = useScreen();
const route = useRoute();
const { openPageContextMenu } = usePageContextMenu();

const currentThemeMode = computed(() => {
  return unref(theme)?.theme?.mode || "dark";
});

const localeCodes = computed(() => {
  return locales.value
    .map((item) => typeof item === "string" ? item : item.code)
    .filter(Boolean);
});

const nextLocaleCode = computed(() => {
  const codes = localeCodes.value;
  if (!codes.length) return "en";

  const currentIndex = codes.indexOf(locale.value);
  return codes[(currentIndex + 1 + codes.length) % codes.length] || codes[0];
});

const nextLocaleName = computed(() => {
  const nextCode = nextLocaleCode.value;
  const item = locales.value.find((localeItem) => {
    return typeof localeItem === "string"
      ? localeItem === nextCode
      : localeItem.code === nextCode;
  });

  return typeof item === "string"
    ? item.toUpperCase()
    : item?.name || nextCode.toUpperCase();
});

const layoutDirection = computed(() => {
  return localeProperties.value?.dir === "rtl" ? "rtl" : "ltr";
});

const promptDetailMode = computed(() => {
  return (
    route.name === "prompts" &&
    typeof route.query.id === "string" &&
    route.query.id.trim().length > 0
  );
});

const padding = computed(() => {
  return (
    route.name === "index" ||
    route.name === "collage" ||
    route.name === "vectorizer" ||
    promptDetailMode.value
  )
    ? 0
    : tablet.value
      ? 24
      : mobile.value
        ? 16
        : 32;
});

function refreshPage() {
  if (!import.meta.client) return;

  window.location.reload();
}

async function switchLanguage() {
  await setLocale(nextLocaleCode.value);
}

function openVectorizer() {
  navigateTo('/vectorizer')
}

import ImageBatchConverter from '~/components/tools/ImageBatchConverter.vue'

const modal = useModal();

function openImageConverterModal() {
  modal.open({
    header: {
      icon: 'image',
      title: t('tools.imageConverter.title'),
      subtitle: t('tools.imageConverter.subtitle'),
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

const layoutContextMenuItems = computed<GlobalMenuItem[]>(() => {
  return [
    {
      label: t("app.switchTheme"),
      icon: currentThemeMode.value === "dark" ? "light_mode" : "dark_mode",
      handler: switchTheme,
      color: 'normal15',
    },
    {
      label: t("app.switchLang"),
      description: nextLocaleName.value,
      icon: "language",
      handler: switchLanguage,
      color: 'normal15',
    },
    {
      type: "divider",
    },
    {
      label: t("tools.imageConverter.title"),
      icon: 'image',
      handler: openImageConverterModal,
      color: 'normal15',
    },
    {
      label: t("tools.imageVectorizer.title"),
      icon: 'shapes',
      handler: openVectorizer,
      color: 'normal15',
    },
    {
      type: "divider",
    },
    {
      label: t("components.contextMenu.actions.refreshPage"),
      icon: "refresh",
      color: "blue",
      handler: refreshPage,
    },
  ];
});

function openLayoutDefaultContextMenu(event: MouseEvent) {
  openPageContextMenu(event, {
    items: layoutContextMenuItems.value,
    minWidth: 190,
    maxWidth: 240,
    closeOnScroll: false,
    respectIgnoreSelector: false,
    zIndex: 2300,
  });
}

function handleLayoutContextMenu(event: MouseEvent) {
  if (import.meta.client) {
    const pageContextMenuEvent = new CustomEvent("prompt-draft:open-page-context-menu", {
      cancelable: true,
      detail: {
        event,
        routeName: route.name,
      },
    });

    window.dispatchEvent(pageContextMenuEvent);

    if (pageContextMenuEvent.defaultPrevented) return;
  }

  openLayoutDefaultContextMenu(event);
}
</script>

<template>
  <el-flex
    :gap="0"
    bg="background"
    rules="csc"
    :class="['por ofha hvh100', `d${layoutDirection}`]">
    <Header @contextmenu="openLayoutDefaultContextMenu" />

    <el-flex
      rules="csc"
      :style="{
        height: `calc(100vh - ${dimension().header.height}px)`,
      }"
      class="w100 ofha"
      :p="padding"
      @contextmenu="handleLayoutContextMenu">
      <slot />
    </el-flex>

    <el-pwa />
  </el-flex>
</template>