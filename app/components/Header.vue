<script setup lang="ts">
import { useAppStore } from "~/store/app";
import { NAVIGATION } from '~/config/navigation'
const route = useRoute();

const { t, switchTheme } = useTheme();
const { locale, setLocale } = useI18n();
const app = useAppStore();
const { mini } = useScreen();
</script>

<template>
  <el-flex v-if="app.ready" rules="rbc" type="header" :p="[8, 24]" :gap="16" :br="[0, 0, 1, 0]" bc="normal5" bg="surface65" bd="b8"
    class="post t0 l0 r0 w100 zi200 app-header">
    <el-flex rules="rsc" type="link" to="/">
      <img :src="`img/g_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`" class="hp32" :alt="$t('app.title')" />
      <!-- <img :src="`img/logo_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`" class="hp40" :alt="$t('app.title')" /> -->
    </el-flex>
    <el-divider direction="vertical" :height="24" mode="dashed" :dash="4" :gap="2" color="prim" />
    <el-flex rules="rsc" class="fg100" :gap="8">
      <el-button v-for="item in NAVIGATION"
        :key="item.to"
        :to="item.to"
        :color="route.name === item.name ? 'prim' : 'normal'"
        :effect="true"
        :mode="route.name === item.name ? 'normal' : 'flat'"
        :label="$t(`app.navigation.${item.name}`)"
        :icon="item.icon"
        :type="mini && route.name !== item.name ? 'fab' : 'default'"
        :gap="8"
        :size="12"
        :p="[8, 12]" />
    </el-flex>
    <el-flex rules="rcc">
      <el-button :size="14" :p="8" mode="flat" type="fab" :label="$t('app.switchTheme')"
        :icon="t.theme.mode === 'dark' ? 'sun-1' : 'moon'" @click="switchTheme" />
      <el-button :size="14" :p="8" mode="flat" type="fab" :label="$t('app.switchLang')"
        :icon="locale === 'fa' ? 'en' : 'fa'" @click="setLocale(locale === 'en' ? 'fa' : 'en')" />
    </el-flex>
  </el-flex>
</template>

<style>
html.is-native-app .app-header {
  top: 0 !important;
  padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 8px) !important;
}
</style>