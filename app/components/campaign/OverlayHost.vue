<script setup lang="ts">
import PromotionSurface from '~/components/campaign/PromotionSurface.vue'
import type { CampaignPromotion } from '~/composables/useCampaignPromotions'

const auth = useAuth()
const modal = useModal()
const promotions = useCampaignPromotions()
const openedModalKeys = new Set<string>()
let modalId: string | null = null
let refreshVersion = 0

function promotionKey(promotion: CampaignPromotion) {
  return `${promotion.campaignSlug}:${promotion.campaignVersion}:${promotion.promotionId}`
}

function closePromotionModal() {
  if (!modalId) return
  modal.close(modalId)
  modalId = null
}

async function activateModalPromotion(promotion: CampaignPromotion) {
  closePromotionModal()
  await promotions.activate(promotion)
}

async function dismissModalPromotion(promotion: CampaignPromotion) {
  const dismissed = await promotions.dismiss(promotion)
  if (!dismissed) return
  closePromotionModal()
}

async function refreshModalPromotion() {
  const version = ++refreshVersion
  const candidates = await promotions.load('modal')
  if (version !== refreshVersion) return

  const promotion = candidates[0]
  if (!promotion) {
    closePromotionModal()
    return
  }

  const key = promotionKey(promotion)
  if (openedModalKeys.has(key)) return
  openedModalKeys.add(key)

  const content = promotions.localizedContent(promotion)
  promotions.recordImpression(promotion)

  modalId = modal.open({
    header: {
      icon: 'campaign',
      title: content.title,
      subtitle: content.subtitle || '',
      closeButton: true,
      color: 'prim',
    },
    component: PromotionSurface,
    props: {
      promotion,
      content,
      canDismiss: promotions.canDismiss(promotion),
      onActivate: () => {
        void activateModalPromotion(promotion)
      },
      onDismiss: () => {
        void dismissModalPromotion(promotion)
      },
    },
    options: {
      width: 520,
      maxHeight: '80vh',
      closeOnBackdrop: true,
      closeOnEsc: true,
      persistent: false,
    },
  })
}

onMounted(refreshModalPromotion)

watch(
  () => auth.user.value?.id ?? null,
  () => {
    if (!auth.initialized.value) return
    closePromotionModal()
    void refreshModalPromotion()
  },
)

onBeforeUnmount(closePromotionModal)
</script>

<template>
  <CampaignPlacement slot="floating_corner" />
</template>
