<script setup lang="ts">
const { t } = useI18n()
const { mini } = useScreen()
const offlinePackage = useOfflinePackage()
</script>

<template>
  <el-grid :gap="0" :cols="1" rules="ccc" class="h100 w100">
    <visual-tile :count="94" :interval="2000" :transition-duration="5000" extension="webp" :edge-blur="400"
      :z-index="50" />
    <el-flex rules="ccc" class="zi100 w100 h100" bg="surface45" bd="b0" :radius="0" :p="32">
      <el-text
        v-if="offlinePackage.state.isStandalone && !offlinePackage.state.online"
        type="span"
        :size="12"
        :weight="700"
        marker="orange40"
        class="tc">
        {{ t('pwa.offline.status.offlineMode') }}
      </el-text>

      <el-text type="span" :size="12" :weight="600" class="tc">
        {{ t("home.eyebrow") }} test
      </el-text>
      <el-text type="h1" :size="mini ? 40 : 64" :weight="800" effect="glitch" marker="normal50" color="surface"
        class="tc">
        {{ t("home.title").toUpperCase() }}
      </el-text>
      <el-text type="p" :size="mini ? 14 : 20" :weight="400" class="tc mxwp400">
        {{ t("home.description") }}
      </el-text>
      <el-divider class="mxwp200" />
      <el-button :size="16" :label="t('home.createPrompt')" icon="magicpen" to="/create" class="" />
      <el-button :size="14" :label="t('app.navigation.guide')" icon="message-question" to="/guide" color="normal"
        mode="flat" />
    </el-flex>
  </el-grid>
</template>
