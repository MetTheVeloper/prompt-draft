<script setup lang="ts">
import type { CampaignCallerState, CampaignPublicMechanic, PublicCampaign } from '~/composables/useCampaignRuntime'
const props = defineProps<{ campaign: PublicCampaign; mechanic: CampaignPublicMechanic; state: CampaignCallerState; refreshing: boolean }>()
const emit = defineEmits<{ (event: 'refresh'): void }>()
const { t, locale } = useI18n()
const flow = useCampaignCustomGame(props, () => locale.value === 'fa' ? 'fa' : 'en', () => emit('refresh'))
</script>
<template>
  <el-flex rules="csc" :gap="12" :p="16" :radius="14" :br="1" bc="normal15" bg="surface" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100 fw">
      <el-text :size="13" :weight="700">{{ t('campaign.game.title') }}</el-text>
      <el-text v-if="flow.availability.value" color="normal55" :size="11">{{ t('campaign.game.remaining', { count: flow.availability.value.remainingAttempts }) }}</el-text>
    </el-flex>
    <el-text color="normal55" :size="11">{{ t('campaign.game.serverVerified') }}</el-text>
    <el-text v-if="refreshing || flow.recovering.value" color="normal55" :size="12">{{ t('campaign.game.recovering') }}</el-text>
    <template v-else-if="!flow.attempt.value">
      <el-text color="normal55" :size="12">{{ t('campaign.game.helper') }}</el-text>
      <el-button v-if="flow.canReserve.value" color="prim" :disable="flow.busy.value" :label="t('campaign.game.start')" @click="flow.begin" />
      <el-text v-else color="normal55" :size="12">{{ t('campaign.game.unavailable') }}</el-text>
    </template>
    <template v-else-if="flow.attempt.value.status === 'reserved'">
      <el-text color="normal55" :size="12">{{ t('campaign.game.starting') }}</el-text>
      <el-button color="prim" :disable="flow.starting.value" :label="t('campaign.game.retryStart')" @click="flow.retryStart" />
    </template>
    <template v-else-if="flow.attempt.value.status === 'started'">
      <el-text color="prim" :size="11" :weight="700">{{ t('campaign.game.challenge') }}</el-text>
      <el-text v-if="flow.challengePrompt.value" :size="16" :weight="700">{{ flow.challengePrompt.value }}</el-text>
      <el-text v-else color="red" :size="12">{{ t('campaign.game.challengeUnavailable') }}</el-text>
      <el-text-field v-if="flow.challengePrompt.value" v-model="flow.answer.value" :actions="false" :disabled="flow.submitting.value || Boolean(flow.submittedAnswer.value)" :placeholder="t('campaign.game.answerPlaceholder')" class="w100" @keyup.enter="flow.submit" />
      <el-button v-if="flow.challengePrompt.value" color="prim" :disable="flow.submitting.value || (!flow.submittedAnswer.value && !flow.answerValid.value)" :label="flow.submitting.value ? t('campaign.game.submitting') : flow.submittedAnswer.value ? t('campaign.game.retrySubmit') : t('campaign.game.submit')" @click="flow.submit" />
    </template>
    <CampaignChallengeResult
      v-else-if="flow.attempt.value.status === 'resolved' && flow.outcome.value"
      :passed="flow.outcome.value === 'win'"
      :can-retry="flow.canTryAgain.value"
      :busy="flow.busy.value"
      @retry="flow.tryAgain"
    />
    <el-text v-else color="red" :size="12">{{ t('campaign.game.invalidAttempt') }}</el-text>
    <el-text v-if="flow.error.value" color="red" :size="11">{{ flow.error.value }}</el-text>
  </el-flex>
</template>
