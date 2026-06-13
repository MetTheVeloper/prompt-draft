<script setup lang="ts">
const { locale } = useI18n();
onMounted(() => {});
</script>

<template>
  <el-flex
    :gap="0"
    bg="background"
    rules="csc"
    :class="['por ofha hvh100', `d${locale === 'en' ? 'ltr' : 'rtl'}`]"
  >
    <Header />
    <el-flex rules="csc" class="w100 fg100 p24 ofha">
      <slot />
    </el-flex>
    <el-pwa />
  </el-flex>
</template>
