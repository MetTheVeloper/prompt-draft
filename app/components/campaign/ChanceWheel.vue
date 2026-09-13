<script setup lang="ts">
import type { CampaignCallerState, CampaignPublicMechanic, PublicCampaign } from '~/composables/useCampaignRuntime'

const props = defineProps<{
  campaign: PublicCampaign
  mechanic: CampaignPublicMechanic
  state: CampaignCallerState
  refreshing: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t, locale } = useI18n()
const {
  recovering,
  reserving,
  spinning,
  error,
  remainingAttempts,
  busy,
  canSpin,
  possibleLabels,
  outcomeLabel,
  spin,
} = useCampaignChanceWheel(
  props,
  () => locale.value === 'fa' ? 'fa' : 'en',
  () => emit('refresh'),
)
</script>

<template>
  <el-flex
    rules="csc"
    :gap="12"
    :p="16"
    :radius="14"
    :br="1"
    bc="normal15"
    bg="surface"
    class="w100"
  >
    <el-flex rules="rbc" class="w100">
      <el-text :size="14" :weight="700">{{ t('campaign.wheel.title') }}</el-text>
      <el-text v-if="remainingAttempts !== null" color="normal55" :size="11">
        {{ t('campaign.wheel.remaining', { count: remainingAttempts }) }}
      </el-text>
    </el-flex>

    <el-text color="normal55" :size="11">{{ t('campaign.wheel.serverDecides') }}</el-text>

    <el-flex v-if="possibleLabels.length" rules="csc" :gap="4">
      <el-text color="normal55" :size="11">{{ t('campaign.wheel.possible') }}</el-text>
      <el-text :size="12">{{ possibleLabels.join(' · ') }}</el-text>
    </el-flex>

    <el-flex v-if="outcomeLabel" rules="csc" :gap="4">
      <el-text color="normal55" :size="11">{{ t('campaign.wheel.result') }}</el-text>
      <el-text color="prim" :size="18" :weight="800">{{ outcomeLabel }}</el-text>
    </el-flex>

    <el-button
      v-if="canSpin || busy"
      color="prim"
      :disable="busy"
      :label="recovering || reserving || spinning ? t('campaign.wheel.spinning') : t('campaign.wheel.spin')"
      @click="spin"
    />

    <el-text v-else-if="!outcomeLabel" color="normal55" :size="11">
      {{ t('campaign.wheel.unavailable') }}
    </el-text>

    <el-text v-if="error" color="red" :size="11">{{ error }}</el-text>
  </el-flex>
</template>
