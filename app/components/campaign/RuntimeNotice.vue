<script setup lang="ts">
import type {
  CampaignLocale,
  CampaignRuntimeNotice,
} from '~/composables/useCampaignRuntime'

const props = defineProps<{
  notice: CampaignRuntimeNotice
  serverNow?: string
  defaultLocale?: CampaignLocale | null
}>()

const emit = defineEmits<{
  expired: []
}>()

const { t, locale } = useI18n()
const remainingMs = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | null = null
let anchorElapsed = 0
let initialRemaining = 0
let emittedForTarget = ''

const activeLocale = computed<CampaignLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const localizedContent = computed(() => {
  const content = props.notice.content
  if (!content) return null
  return content[activeLocale.value]
    ?? (props.defaultLocale ? content[props.defaultLocale] : undefined)
    ?? content.en
    ?? content.fa
    ?? null
})

const fallbackKey = computed(() => props.notice.templateKey ?? null)
const title = computed(() => {
  if (localizedContent.value?.title) return localizedContent.value.title
  return fallbackKey.value ? t(`campaign.notice.${fallbackKey.value}.title`) : ''
})
const body = computed(() => {
  if (localizedContent.value?.body) return localizedContent.value.body
  return fallbackKey.value ? t(`campaign.notice.${fallbackKey.value}.body`) : ''
})
const toneColor = computed(() => {
  if (props.notice.tone === 'success') return 'green'
  if (props.notice.tone === 'warning') return 'orange'
  if (props.notice.tone === 'info') return 'prim'
  return 'normal55'
})
const countdownText = computed(() => {
  if (remainingMs.value === null) return ''
  const totalSeconds = Math.max(0, Math.ceil(remainingMs.value / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':')
})

function clearTimer() {
  if (timer) clearInterval(timer)
  timer = null
}

function tickCountdown() {
  if (!import.meta.client || !props.notice.countdown) return
  const elapsed = performance.now() - anchorElapsed
  remainingMs.value = Math.max(0, initialRemaining - elapsed)
  if (remainingMs.value > 0) return
  clearTimer()
  const target = props.notice.countdown.targetAt
  if (emittedForTarget !== target) {
    emittedForTarget = target
    emit('expired')
  }
}

function startCountdown() {
  clearTimer()
  remainingMs.value = null
  if (!import.meta.client || !props.notice.countdown || !props.serverNow) return

  const targetMs = Date.parse(props.notice.countdown.targetAt)
  const serverNowMs = Date.parse(props.serverNow)
  if (!Number.isFinite(targetMs) || !Number.isFinite(serverNowMs)) return

  initialRemaining = Math.max(0, targetMs - serverNowMs)
  remainingMs.value = initialRemaining
  anchorElapsed = performance.now()

  // A state response whose target is already due is authoritative for that response.
  // Avoid a refresh loop; only emit when a live client-side countdown crosses zero.
  if (initialRemaining <= 0) return
  timer = setInterval(tickCountdown, 1000)
}

watch(
  () => [props.serverNow, props.notice.countdown?.targetAt] as const,
  startCountdown,
)
onMounted(startCountdown)
onBeforeUnmount(clearTimer)
</script>

<template>
  <el-flex
    rules="csc"
    :gap="6"
    :p="14"
    :radius="12"
    :br="1"
    bc="normal15"
    bg="surface"
    class="w100"
  >
    <el-text v-if="title" :color="toneColor" :size="13" :weight="800">
      {{ title }}
    </el-text>
    <el-text v-if="body" color="normal55" :size="12">
      {{ body }}
    </el-text>
    <el-flex v-if="countdownText" rules="rcc" :gap="6">
      <el-text color="normal55" :size="11">{{ t('campaign.notice.countdown') }}</el-text>
      <el-text :color="toneColor" :size="12" :weight="700">{{ countdownText }}</el-text>
    </el-flex>
  </el-flex>
</template>
