<script setup lang="ts">
import { useAppStore } from "~/store/app";

const { t } = useI18n();
const app = useAppStore();

const { mini } = useScreen();

onMounted(() => {
  console.log("normal0:", splitColor("normal0"));
});
</script>

<template>
  <el-flex :gap="0" rules="ccc" class="h100">
    <el-flex rules="csc">
      <el-text type="span" :size="12" :weight="600" class="tc">
        {{ t("home.eyebrow") }}
      </el-text>
      <el-text type="h1" :size="mini ? 40 : 64" :weight="800" effect="glitch" class="tc">
        {{ t("home.title") }}
      </el-text>
      <el-text type="p" :size="mini ? 14 : 16" :weight="400" class="tc">
        {{ t("home.description") }}
      </el-text>
      <el-divider />
      <el-button :size="16" :label="t('home.createPrompt')" icon="magicpen" to="/create" />
      <el-button :size="14" :label="t('app.navigation.guide')" icon="message-question" to="/guide" color="prim" mode="flat" />
    </el-flex>
  </el-flex>
</template>
