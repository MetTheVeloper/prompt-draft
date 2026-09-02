<script setup lang="ts">
const appVersion = '2.0.0'
const { t } = useTheme()
</script>

<template>
  <el-flex rules="csc" :gap="16" class="about-modal-content">
    <el-flex rules="rsc" :gap="12">
      <img :src="`/img/g_${t.theme.mode === 'light' ? 'black' : 'white'}.svg`" class="about-modal-logo" :alt="$t('app.title')" />

      <el-flex rules="csc" :gap="4">
        <el-text :size="22" :weight="700">
          {{ $t('app.title') }}
        </el-text>
        <el-text :size="12" :weight="300" color="normal70">
          {{ $t('tools.about.version', { version: appVersion }) }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-text :size="14" :weight="300" color="normal80" class="about-modal-description">
      {{ $t('tools.about.description') }}
    </el-text>
  </el-flex>
</template>

<style scoped>
.about-modal-content {
  width: 100%;
}

.about-modal-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.about-modal-description {
  line-height: 2;
}
</style>
