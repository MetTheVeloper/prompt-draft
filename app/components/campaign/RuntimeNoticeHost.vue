<script setup lang="ts">
import type {
  CampaignCallerState,
  PublicCampaign,
} from '~/composables/useCampaignRuntime'

const props = defineProps<{
  campaign: PublicCampaign
  state: CampaignCallerState
  placement: 'campaign' | 'mechanic'
  mechanicId?: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const notices = computed(() => (props.state.activeNotices ?? []).filter((notice) => {
  if (notice.placement !== props.placement) return false
  if (props.placement === 'mechanic') return notice.mechanicId === props.mechanicId
  return true
}))
</script>

<template>
  <el-flex v-if="notices.length" rules="csc" :gap="8" class="w100">
    <CampaignRuntimeNotice
      v-for="notice in notices"
      :key="notice.id"
      :notice="notice"
      :server-now="state.serverNow"
      :default-locale="campaign.experience.defaultLocale"
      @expired="emit('refresh')"
    />
  </el-flex>
</template>
