<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();

const { t, locale } = useI18n();
const { mini } = useScreen();

const statusCode = computed(() => Number(props.error?.statusCode || 500));

const errorKind = computed<'forbidden' | 'notFound' | 'generic'>(() => {
  if (statusCode.value === 403) return 'forbidden';
  if (statusCode.value === 404) return 'notFound';
  return 'generic';
});

const icon = computed(() => {
  if (statusCode.value === 403) return 'lock';
  if (statusCode.value === 404) return 'search_off';
  return 'warning';
});

const accentColor = computed(() => {
  if (statusCode.value === 403) return 'orange';
  if (statusCode.value === 404) return 'blue';
  return 'red';
});

async function goHome() {
  await clearError({ redirect: '/' });
}
</script>

<template>
  <el-flex
    rules="ccc"
    class="w100 hvh100"
    bg="background"
    :class="`d${locale === 'en' ? 'ltr' : 'rtl'}`"
    :p="24">
    <el-flex
      rules="ccc"
      class="w100"
      :gap="16"
      :p="mini ? 24 : 36"
      :radius="24"
      :br="1"
      bc="normal15"
      bg="surface50"
      style="max-width: 680px; text-align: center">
      <el-flex
        rules="rcc"
        :p="14"
        :radius="100"
        :bg="`${accentColor}15`">
        <el-icon :icon="icon" :color="accentColor" :size="30" />
      </el-flex>

      <el-text
        :size="11"
        :weight="800"
        :color="accentColor">
        {{ t(`errors.${errorKind}.eyebrow`) }}
      </el-text>

      <el-text
        type="h1"
        :size="mini ? 28 : 38"
        :weight="900"
        style="line-height: 1.1">
        {{ statusCode }}
      </el-text>

      <el-text
        type="h2"
        :size="mini ? 22 : 28"
        :weight="900"
        style="max-width: 560px; line-height: 1.25">
        {{ t(`errors.${errorKind}.title`) }}
      </el-text>

      <el-text
        type="p"
        :size="13"
        color="normal55"
        style="max-width: 520px; line-height: 1.65">
        {{ t(`errors.${errorKind}.description`) }}
      </el-text>

      <el-flex rules="rcc" :gap="8" wrap>
        <el-button
          color="prim"
          icon="home"
          :label="t('errors.actions.home')"
          :p="[10, 16]"
          @click="goHome"
        />

        <el-button
          to="https://t.me/prompt-draft"
          mode="flat"
          color="blue"
          icon="send"
          :label="t('errors.actions.telegram')"
          :p="[10, 16]"
        />
      </el-flex>
    </el-flex>
  </el-flex>
</template>
