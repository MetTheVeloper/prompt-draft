<script setup lang="ts">
const props = defineProps<{ passed: boolean; canRetry: boolean; busy: boolean }>()
const emit = defineEmits<{ (event: 'retry'): void }>()
const { t } = useI18n()
</script>
<template>
  <el-flex rules="csc" :gap="8" class="w100">
    <el-text :color="props.passed ? 'green' : 'orange'" :size="16" :weight="800">{{ props.passed ? t('campaign.challenge.passed') : t('campaign.challenge.notPassed') }}</el-text>
    <el-text color="normal55" :size="12">{{ props.passed ? t('campaign.challenge.passedHelper') : t('campaign.challenge.notPassedHelper') }}</el-text>
    <el-button v-if="canRetry" mode="flat" :disable="busy" :label="t('campaign.challenge.tryAgain')" @click="emit('retry')" />
  </el-flex>
</template>
