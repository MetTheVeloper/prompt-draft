<script setup lang="ts">
import type {
  CampaignPromotion,
  CampaignPromotionSlot,
} from '~/composables/useCampaignPromotions'

const props = defineProps<{
  slot: CampaignPromotionSlot
}>()

const auth = useAuth()
const promotions = useCampaignPromotions()
const current = ref<CampaignPromotion | null>(null)
const impressedKey = ref('')
let refreshVersion = 0

const content = computed(() => {
  return current.value
    ? promotions.localizedContent(current.value)
    : null
})

const dismissible = computed(() => {
  return current.value ? promotions.canDismiss(current.value) : false
})

function keyFor(promotion: CampaignPromotion) {
  return `${promotion.campaignSlug}:${promotion.campaignVersion}:${promotion.promotionId}`
}

async function refresh() {
  const version = ++refreshVersion
  const candidates = await promotions.load(props.slot)
  if (version !== refreshVersion) return

  current.value = candidates[0] ?? null
  await nextTick()

  const promotion = current.value
  if (!promotion) return
  const key = keyFor(promotion)
  if (impressedKey.value === key) return

  impressedKey.value = key
  promotions.recordImpression(promotion)
}

async function activate() {
  if (!current.value) return
  await promotions.activate(current.value)
}

async function dismiss() {
  const promotion = current.value
  if (!promotion) return

  const dismissed = await promotions.dismiss(promotion)
  if (!dismissed) return

  current.value = null
  await refresh()
}

onMounted(refresh)

watch(
  () => auth.user.value?.id ?? null,
  () => {
    if (!auth.initialized.value) return
    void refresh()
  },
)

watch(
  () => props.slot,
  () => {
    impressedKey.value = ''
    void refresh()
  },
)
</script>

<template>
  <CampaignPromotionSurface
    v-if="current && content"
    :promotion="current"
    :content="content"
    :can-dismiss="dismissible"
    @activate="activate"
    @dismiss="dismiss"
  />
</template>
