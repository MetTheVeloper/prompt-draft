<script setup lang="ts">
import type {
  CampaignCallerState,
  CampaignLocalizedContent,
  CampaignViewer,
  PublicCampaign,
} from '~/composables/useCampaignRuntime'

const props = defineProps<{
  campaign: PublicCampaign
  content: CampaignLocalizedContent
  viewer: CampaignViewer
  state: CampaignCallerState | null
  refreshing: boolean
  starting: boolean
  actionError: string
}>()

const emit = defineEmits<{
  (event: 'login'): void
  (event: 'start'): void
}>()

const { t, locale } = useI18n()

const participation = computed(() => props.state?.participation ?? props.viewer.participation)
const eligibility = computed(() => props.state?.eligibility ?? props.viewer.eligibility)
const authenticated = computed(() => props.state ? true : props.viewer.authenticated)

const statusColor = computed(() => {
  if (props.campaign.status === 'active') return 'green'
  if (props.campaign.status === 'scheduled') return 'blue'
  if (props.campaign.status === 'paused') return 'orange'
  return 'normal55'
})

const statusLabel = computed(() => t(`campaign.status.${props.campaign.status}`))
const participationStatus = computed(() => participation.value
  ? t(`campaign.participation.status.${participation.value.status}`)
  : '')

const endLabel = computed(() => {
  const value = props.campaign.lifecycle.endsAt
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return t('campaign.endsAt', {
    date: new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
  })
})

const canStart = computed(() => {
  return props.campaign.status === 'active' &&
    authenticated.value &&
    !participation.value &&
    eligibility.value.eligible
})

const needsLogin = computed(() => {
  return props.campaign.status === 'active' &&
    !authenticated.value &&
    !participation.value
})

const isClosed = computed(() => props.campaign.status !== 'active' && !participation.value)
</script>

<template>
  <el-flex
    rules="csc"
    :gap="18"
    class="w100">
    <el-flex
      rules="csc"
      :gap="8"
      class="w100">
      <el-text
        color="prim"
        :size="11"
        :weight="700">
        {{ t('campaign.eyebrow') }}
      </el-text>

      <el-flex
        rules="rbc"
        :gap="12"
        class="w100 fw">
        <el-text
          :size="32"
          :weight="800">
          {{ content.title }}
        </el-text>

        <el-text
          :color="statusColor"
          :size="12"
          :weight="700">
          {{ statusLabel }}
        </el-text>
      </el-flex>

      <el-text
        v-if="content.subtitle"
        color="normal55"
        :size="15"
        :weight="600">
        {{ content.subtitle }}
      </el-text>

      <el-text
        v-if="content.description"
        color="normal55"
        :size="13">
        {{ content.description }}
      </el-text>

      <el-text
        v-if="endLabel"
        color="normal45"
        :size="11">
        {{ endLabel }}
      </el-text>
    </el-flex>

    <el-flex
      rules="csc"
      :gap="12"
      :p="16"
      :radius="14"
      :br="1"
      bc="normal15"
      bg="surface"
      class="w100">
      <el-text :size="13" :weight="700">
        {{ t('campaign.participation.title') }}
      </el-text>

      <el-text
        v-if="refreshing"
        color="normal55"
        :size="12">
        {{ t('campaign.participation.loading') }}
      </el-text>

      <template v-else-if="participation">
        <el-text :size="13" :weight="700">
          {{ t('campaign.participation.joined') }}
        </el-text>
        <el-text color="normal55" :size="12">
          {{ t('campaign.participation.currentStatus', { status: participationStatus }) }}
        </el-text>
      </template>

      <template v-else-if="needsLogin">
        <el-text color="normal55" :size="12">
          {{ t('campaign.participation.signInHelper') }}
        </el-text>
        <el-button
          color="prim"
          :label="t('campaign.participation.signIn')"
          @click="emit('login')"
        />
      </template>

      <template v-else-if="canStart">
        <el-text color="normal55" :size="12">
          {{ t('campaign.participation.startHelper') }}
        </el-text>
        <el-button
          color="prim"
          icon="campaign"
          :disable="starting"
          :label="starting ? t('campaign.participation.starting') : t('campaign.participation.start')"
          @click="emit('start')"
        />
      </template>

      <el-text
        v-else-if="isClosed"
        color="normal55"
        :size="12">
        {{ t('campaign.participation.closed') }}
      </el-text>

      <el-text
        v-else
        color="normal55"
        :size="12">
        {{ t('campaign.participation.notEligible') }}
      </el-text>

      <el-text
        v-if="actionError"
        color="red"
        :size="11">
        {{ actionError }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="campaign.rewards.length"
      rules="csc"
      :gap="8"
      class="w100">
      <el-text :size="13" :weight="700">
        {{ t('campaign.rewards.title') }}
      </el-text>

      <el-flex
        rules="rsc"
        :gap="8"
        class="w100 fw">
        <el-flex
          v-for="reward in campaign.rewards"
          :key="reward.id"
          rules="rcc"
          :gap="6"
          :p="[8, 10]"
          :radius="12"
          :br="1"
          bc="normal15"
          bg="surface">
          <el-text color="prim" :size="12" :weight="800">
            {{ t('campaign.rewards.amount', { amount: reward.amount }) }}
          </el-text>
          <el-text color="normal55" :size="11">
            {{ t('campaign.rewards.goin') }}
          </el-text>
        </el-flex>
      </el-flex>
    </el-flex>
  </el-flex>
</template>
