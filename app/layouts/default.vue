<script setup lang="ts">
const { locale } = useI18n();
const { mobile, tablet } = useScreen();
const route = useRoute();

const padding = computed(() => {
  return route.name === 'index' ? 0 : tablet.value ? 24 : mobile.value ? 16 : 32;
})

onMounted(() => {});
</script>

<template>
  <el-flex
    :gap="0"
    bg="background"
    rules="csc"
    :class="['por ofha hvh100', `d${locale === 'en' ? 'ltr' : 'rtl'}`]">
    <Header />
    <el-flex rules="csc" class="w100 fg100 ofha"
      :p="padding">
      <slot />
    </el-flex>
    <el-pwa />
  </el-flex>
</template>
