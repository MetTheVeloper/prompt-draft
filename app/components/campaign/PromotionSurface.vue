<script setup lang="ts">
import type {
  CampaignPromotion,
  CampaignPromotionLocalizedContent,
} from '~/composables/useCampaignPromotions'

const props = defineProps<{
  promotion: CampaignPromotion
  content: CampaignPromotionLocalizedContent
  canDismiss: boolean
}>()

const emit = defineEmits<{
  (event: 'activate'): void
  (event: 'dismiss'): void
}>()

const { mobile } = useScreen()

const rendererKey = computed(() => props.promotion.renderer.key)
const isHeader = computed(() => rendererKey.value === 'header-campaign-cta-v1')
const isFloating = computed(() => rendererKey.value === 'floating-campaign-card-v1')
const isModal = computed(() => rendererKey.value === 'campaign-modal-v1')
const isDashboard = computed(() => rendererKey.value === 'dashboard-campaign-banner-v1')
const actionLabel = computed(() => props.content.ctaLabel || props.content.title)
</script>

<template>
  <el-flex
    v-if="isHeader"
    rules="rcc"
    :gap="4">
    <el-button
      color="prim"
      mode="flat"
      icon="campaign"
      :type="mobile ? 'fab' : 'default'"
      :label="actionLabel"
      :tooltip="mobile ? content.title : false"
      :p="mobile ? 8 : [8, 10]"
      @click="emit('activate')"
    />

    <el-button
      v-if="canDismiss"
      type="fab"
      mode="flat"
      icon="close"
      :size="12"
      :p="6"
      @click="emit('dismiss')"
    />
  </el-flex>

  <el-flex
    v-else-if="isFloating"
    rules="csc"
    :gap="10"
    :p="14"
    :radius="14"
    :br="1"
    bc="normal15"
    bg="surface"
    class="campaign-promotion--floating">
    <el-flex rules="rbc" :gap="10" class="w100">
      <el-text :size="13" :weight="700">
        {{ content.title }}
      </el-text>

      <el-button
        v-if="canDismiss"
        type="fab"
        mode="flat"
        icon="close"
        :size="12"
        :p="6"
        @click="emit('dismiss')"
      />
    </el-flex>

    <el-text
      v-if="content.subtitle || content.description"
      color="normal55"
      :size="11">
      {{ content.subtitle || content.description }}
    </el-text>

    <el-button
      color="prim"
      icon="campaign"
      :label="actionLabel"
      @click="emit('activate')"
    />
  </el-flex>

  <el-flex
    v-else-if="isModal"
    rules="csc"
    :gap="14"
    class="w100">
    <el-text
      v-if="content.description"
      color="normal55"
      :size="12">
      {{ content.description }}
    </el-text>

    <el-flex rules="rbe" :gap="8" class="w100 fw">
      <el-button
        color="prim"
        icon="campaign"
        :label="actionLabel"
        @click="emit('activate')"
      />

      <el-button
        v-if="canDismiss"
        type="fab"
        mode="flat"
        icon="close"
        :size="13"
        :p="8"
        @click="emit('dismiss')"
      />
    </el-flex>
  </el-flex>

  <el-flex
    v-else-if="isDashboard"
    rules="rbc"
    :gap="14"
    :p="14"
    :radius="14"
    :br="1"
    bc="normal15"
    bg="surface"
    class="w100 fw">
    <el-flex rules="csc" :gap="4" class="fg100">
      <el-text :size="13" :weight="700">
        {{ content.title }}
      </el-text>
      <el-text
        v-if="content.subtitle || content.description"
        color="normal55"
        :size="11">
        {{ content.subtitle || content.description }}
      </el-text>
    </el-flex>

    <el-flex rules="rcc" :gap="6">
      <el-button
        color="prim"
        icon="campaign"
        :label="actionLabel"
        @click="emit('activate')"
      />
      <el-button
        v-if="canDismiss"
        type="fab"
        mode="flat"
        icon="close"
        :size="12"
        :p="6"
        @click="emit('dismiss')"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.campaign-promotion--floating {
  position: fixed;
  inset-inline-end: 16px;
  bottom: 16px;
  z-index: 190;
  width: min(360px, calc(100vw - 32px));
}
</style>
