<script setup lang="ts">
import CampaignDefaultExperience from '~/components/campaign/DefaultExperience.vue'
import type { AdminCampaignDefinition } from '~/types/adminCampaignApi'
import type {
  CampaignLocale,
  CampaignLocalizedContent,
  CampaignPublicMechanic,
  CampaignPublicReward,
  CampaignStatus,
  CampaignViewer,
  PublicCampaign,
} from '~/composables/useCampaignRuntime'

const props = withDefaults(defineProps<{
  definition: AdminCampaignDefinition
  campaignId?: string
  publishedVersion?: number
}>(), {
  campaignId: 'campaign-draft-preview',
  publishedVersion: 0,
})

const { t, locale } = useI18n()

type UnknownRecord = Record<string, unknown>
type PreviewAttemptPeriod = NonNullable<CampaignPublicMechanic['attemptPolicy']>['period']

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalString(value: unknown) {
  const result = readString(value)
  return result || undefined
}

function readFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readIso(value: unknown) {
  const raw = readString(value)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function sanitizeLocalizedContent(value: unknown): CampaignLocalizedContent | null {
  const record = asRecord(value)
  const title = readString(record.title)
  if (!title) return null

  const subtitle = readOptionalString(record.subtitle)
  const description = readOptionalString(record.description)
  const body = readOptionalString(record.body)
  const ctaLabel = readOptionalString(record.ctaLabel)
  const rewardLabel = readOptionalString(record.rewardLabel)
  const countdownLabel = readOptionalString(record.countdownLabel)

  return {
    title,
    ...(subtitle ? { subtitle } : {}),
    ...(description ? { description } : {}),
    ...(body ? { body } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(rewardLabel ? { rewardLabel } : {}),
    ...(countdownLabel ? { countdownLabel } : {}),
  }
}

function sanitizeRewards(value: unknown): CampaignPublicReward[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    const reward = asRecord(item)
    const amount = readFiniteNumber(reward.amount)
    if (amount === null) return []

    const triggerRecord = asRecord(reward.trigger)
    const triggerType = readString(triggerRecord.type)
    if (triggerType !== 'campaign_completion' && triggerType !== 'mechanic_outcome') return []

    const mechanicId = readOptionalString(triggerRecord.mechanicId)
    const outcome = readOptionalString(triggerRecord.outcome)
    const perUserLimit = readFiniteNumber(reward.perUserLimit)
    const expiresAfterSeconds = readFiniteNumber(reward.expiresAfterSeconds)

    return [{
      id: readString(reward.id) || `preview-reward-${index + 1}`,
      type: readString(reward.type) || 'goin',
      amount,
      trigger: {
        type: triggerType,
        ...(mechanicId ? { mechanicId } : {}),
        ...(outcome ? { outcome } : {}),
      },
      ...(perUserLimit !== null ? { perUserLimit } : {}),
      ...(expiresAfterSeconds !== null ? { expiresAfterSeconds } : {}),
    }]
  })
}

function sanitizeMechanics(value: unknown): CampaignPublicMechanic[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    const mechanic = asRecord(item)
    const type = readString(mechanic.type)
    if (!type) return []

    const config = asRecord(mechanic.config)
    const renderer = asRecord(mechanic.renderer)
    const attemptPolicy = asRecord(mechanic.attemptPolicy)
    const rendererKind = readString(renderer.kind)
    const rendererKey = readString(renderer.key)
    const attemptPeriod = readString(attemptPolicy.period)
    const maxAttempts = readFiniteNumber(attemptPolicy.maxAttempts)
    const attemptTimezone = readOptionalString(attemptPolicy.timezone)

    return [{
      id: readString(mechanic.id) || `preview-mechanic-${index + 1}`,
      type,
      ...(rendererKey && (rendererKind === 'builtin' || rendererKind === 'custom')
        ? { renderer: { kind: rendererKind, key: rendererKey } }
        : {}),
      config: {
        public: asRecord(config.public),
      },
      ...(maxAttempts !== null && ['campaign', 'calendar_day', 'rolling_24h', 'session'].includes(attemptPeriod)
        ? {
            attemptPolicy: {
              maxAttempts,
              period: attemptPeriod as PreviewAttemptPeriod,
              ...(attemptTimezone ? { timezone: attemptTimezone } : {}),
            },
          }
        : {}),
    }]
  })
}

const definition = computed(() => asRecord(props.definition))
const identity = computed(() => asRecord(definition.value.identity))
const lifecycleDefinition = computed(() => asRecord(definition.value.lifecycle))
const experienceDefinition = computed(() => asRecord(definition.value.experience))
const rendererDefinition = computed(() => asRecord(experienceDefinition.value.renderer))
const contentDefinition = computed(() => asRecord(experienceDefinition.value.content))
const seoDefinition = computed(() => asRecord(experienceDefinition.value.seo))

const activeLocale = computed<CampaignLocale>(() => locale.value === 'fa' ? 'fa' : 'en')

const configuredLocales = computed<CampaignLocale[]>(() => {
  const value = experienceDefinition.value.locales
  if (!Array.isArray(value)) return []
  return value.filter((item): item is CampaignLocale => item === 'en' || item === 'fa')
})

const localizedContent = computed(() => sanitizeLocalizedContent(contentDefinition.value[activeLocale.value]))
const localeAvailable = computed(() => (
  configuredLocales.value.includes(activeLocale.value) && Boolean(localizedContent.value)
))

const previewContent = computed<CampaignLocalizedContent>(() => (
  localizedContent.value ?? { title: '' }
))

const rendererSupported = computed(() => (
  readString(rendererDefinition.value.kind) === 'builtin' &&
  readString(rendererDefinition.value.key) === 'campaign-default-v1'
))

const effectiveStatus = computed<CampaignStatus>(() => {
  const startsAt = readIso(lifecycleDefinition.value.startsAt)
  const endsAt = readIso(lifecycleDefinition.value.endsAt)
  if (!startsAt) return 'draft'

  const now = Date.now()
  if (endsAt && now >= new Date(endsAt).getTime()) return 'ended'
  if (now < new Date(startsAt).getTime()) return 'scheduled'
  return 'active'
})

const campaign = computed<PublicCampaign>(() => {
  const indexing = readString(seoDefinition.value.indexing)
  const endBehavior = readString(seoDefinition.value.endBehavior)
  const rendererKind = readString(rendererDefinition.value.kind)
  const rendererKey = readString(rendererDefinition.value.key)
  const defaultLocale = readString(experienceDefinition.value.defaultLocale)
  const participationAfterEnd = readString(lifecycleDefinition.value.participationAfterEnd)
  const redirectPath = readOptionalString(seoDefinition.value.redirectPath)

  const content: Partial<Record<CampaignLocale, CampaignLocalizedContent>> = {}
  for (const campaignLocale of configuredLocales.value) {
    const localized = sanitizeLocalizedContent(contentDefinition.value[campaignLocale])
    if (localized) content[campaignLocale] = localized
  }

  return {
    id: props.campaignId,
    slug: readString(identity.value.slug) || 'draft-preview',
    version: Math.max(0, props.publishedVersion) + 1,
    schemaVersion: 'campaign.v1',
    status: effectiveStatus.value,
    lifecycle: {
      startsAt: readIso(lifecycleDefinition.value.startsAt),
      endsAt: readIso(lifecycleDefinition.value.endsAt),
      timezone: readString(lifecycleDefinition.value.timezone) || null,
      participationAfterEnd: participationAfterEnd === 'allow_existing_only'
        ? 'allow_existing_only'
        : 'deny',
    },
    experience: {
      renderer: rendererKey && (rendererKind === 'builtin' || rendererKind === 'custom')
        ? { kind: rendererKind, key: rendererKey }
        : null,
      locales: configuredLocales.value,
      defaultLocale: defaultLocale === 'en' || defaultLocale === 'fa' ? defaultLocale : null,
      content,
      seo: {
        ...(indexing === 'index' || indexing === 'noindex' ? { indexing } : {}),
        ...(endBehavior === 'archive' || endBehavior === 'gone' || endBehavior === 'redirect' ? { endBehavior } : {}),
        ...(redirectPath ? { redirectPath } : {}),
      },
    },
    mechanics: sanitizeMechanics(definition.value.mechanics),
    completion: null,
    rewards: sanitizeRewards(definition.value.rewards),
  }
})

const viewer: CampaignViewer = {
  authenticated: false,
  eligibility: {
    eligible: false,
    reasonCodes: ['PREVIEW_MODE'],
  },
  participation: null,
}

function ignorePreviewAction() {
  // Draft Preview is intentionally presentation-only. Runtime actions are never forwarded.
}
</script>

<template>
  <el-flex rules="csc" :gap="14" class="w100">
    <el-flex
      rules="rsc"
      :gap="10"
      class="w100"
      bg="blue10"
      :p="12"
      :radius="12">
      <el-icon icon="visibility" color="blue" :size="18" />
      <el-flex rules="css" :gap="2" class="fg100">
        <el-text :size="12" :weight="800" color="blue">
          {{ t('manage.marketing.preview.safeMode') }}
        </el-text>
        <el-text :size="10" color="normal55">
          {{ t('manage.marketing.preview.unsavedHint') }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex
      v-if="!localeAvailable"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="orange10"
      :p="12"
      :radius="12">
      <el-icon icon="translate" color="orange" :size="18" />
      <el-text :size="11" color="normal55">
        {{ t('manage.marketing.preview.localeUnavailable') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else-if="!rendererSupported"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="orange10"
      :p="12"
      :radius="12">
      <el-icon icon="widgets" color="orange" :size="18" />
      <el-text :size="11" color="normal55">
        {{ t('manage.marketing.preview.rendererUnavailable') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else
      rules="csc"
      :gap="16"
      :p="[18, 4]"
      class="campaign-draft-preview-shell w100">
      <CampaignDefaultExperience
        :campaign="campaign"
        :content="previewContent"
        :viewer="viewer"
        :state="null"
        :refreshing="false"
        :starting="false"
        action-error=""
        @login="ignorePreviewAction"
        @start="ignorePreviewAction"
      />

      <el-flex
        v-if="campaign.mechanics.length"
        rules="rsc"
        :gap="8"
        class="w100"
        bg="normal05"
        :p="10"
        :radius="10">
        <el-icon icon="lock" color="normal55" :size="16" />
        <el-text :size="10" color="normal55">
          {{ t('manage.marketing.preview.mechanicsDisabled') }}
        </el-text>
      </el-flex>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.campaign-draft-preview-shell {
  max-width: 920px;
  margin-inline: auto;
}
</style>
