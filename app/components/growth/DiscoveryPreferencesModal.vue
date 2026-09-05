<script setup lang="ts">
import {
  DISCOVERY_INTERESTS,
  type DiscoveryInterestKey,
} from '~/composables/useDiscoveryPreferences'

const props = defineProps<{
  onSaved?: (interests: DiscoveryInterestKey[]) => void | Promise<void>
}>()

const { t } = useI18n()
const modal = useModal()
const discovery = useDiscoveryPreferences()

const draftInterests = ref<DiscoveryInterestKey[]>([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    await discovery.load(true)
    draftInterests.value = [...discovery.interests.value]
  } catch (error) {
    console.warn('[Prompt Draft] discovery preference modal load failed', error)
    errorMessage.value = t('growth.discovery.onboarding.loadError')
  } finally {
    loading.value = false
  }
})

function isSelected(key: DiscoveryInterestKey) {
  return draftInterests.value.includes(key)
}

function toggle(key: DiscoveryInterestKey) {
  errorMessage.value = ''

  if (isSelected(key)) {
    draftInterests.value = draftInterests.value.filter(value => value !== key)
    return
  }

  draftInterests.value = [...draftInterests.value, key]
}

async function save() {
  if (discovery.saving.value || !draftInterests.value.length) return
  errorMessage.value = ''

  try {
    const interests = await discovery.save(draftInterests.value)
    await props.onSaved?.(interests)
    modal.close()
  } catch (error) {
    console.warn('[Prompt Draft] discovery preference modal save failed', error)
    errorMessage.value = t('growth.discovery.onboarding.error')
  }
}
</script>

<template>
  <el-flex rules="csc" class="w100 discovery-preferences-modal" :gap="18">
    <el-flex rules="csc" class="w100" :gap="6">
      <el-text :size="10" :weight="900" color="prim">
        {{ t('growth.discovery.onboarding.eyebrow') }}
      </el-text>
      <el-text type="h2" :size="28" :weight="900" style="line-height: 1.05">
        {{ t('growth.discovery.onboarding.title') }}
      </el-text>
      <el-text :size="12" color="normal55" style="max-width: 560px; line-height: 1.55">
        {{ t('growth.discovery.onboarding.modalDescription') }}
      </el-text>
    </el-flex>

    <el-flex v-if="loading" rules="ccc" class="w100" :gap="8" :p="28">
      <el-icon icon="refresh" :size="24" color="prim" />
      <el-text :size="12" color="normal55">
        {{ t('growth.discovery.common.loading') }}
      </el-text>
    </el-flex>

    <template v-else>
      <div class="discovery-preferences-modal__grid w100">
        <button
          v-for="interest in DISCOVERY_INTERESTS"
          :key="interest.key"
          type="button"
          class="discovery-preferences-modal__interest"
          :data-selected="isSelected(interest.key) ? 'true' : 'false'"
          :aria-pressed="isSelected(interest.key)"
          @click="toggle(interest.key)">
          <el-icon :icon="interest.icon" :size="20" color="prim" />
          <span class="discovery-preferences-modal__copy">
            <strong>{{ t(interest.messageKey) }}</strong>
            <small>{{ t(interest.descriptionKey) }}</small>
          </span>
          <el-icon
            :icon="isSelected(interest.key) ? 'check_circle' : 'circle'"
            :size="18"
            :color="isSelected(interest.key) ? 'prim' : 'normal30'"
          />
        </button>
      </div>

      <el-flex
        v-if="errorMessage"
        rules="rsc"
        class="w100"
        :gap="8"
        :p="12"
        :radius="12"
        bg="red10">
        <el-icon icon="warning" color="red" :size="17" />
        <el-text :size="11" color="red">{{ errorMessage }}</el-text>
      </el-flex>

      <el-flex rules="rsc" class="w100" :gap="8" wrap>
        <el-button
          color="prim"
          icon="tune"
          :label="discovery.saving.value
            ? t('growth.discovery.onboarding.saving')
            : t('growth.discovery.onboarding.save')"
          :disable="!draftInterests.length || discovery.saving.value"
          @click="save"
        />
        <el-button
          mode="flat"
          color="normal"
          :label="t('growth.discovery.common.cancel')"
          :disable="discovery.saving.value"
          @click="modal.close()"
        />
      </el-flex>
    </template>
  </el-flex>
</template>

<style scoped>
.discovery-preferences-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.discovery-preferences-modal__interest {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 13px;
  border: 1px solid color-mix(in srgb, var(--themeNormal) 18%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--themeSurface) 92%, transparent);
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.discovery-preferences-modal__interest:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--themeNormal) 7%, var(--themeSurface));
}

.discovery-preferences-modal__interest[data-selected='true'] {
  border-color: var(--themePrimary);
  background: color-mix(in srgb, var(--themePrimary) 12%, var(--themeSurface));
}

.discovery-preferences-modal__copy {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  gap: 3px;
}

.discovery-preferences-modal__copy strong {
  font-size: 12px;
  line-height: 1.35;
}

.discovery-preferences-modal__copy small {
  color: color-mix(in srgb, currentColor 58%, transparent);
  font-size: 10px;
  line-height: 1.45;
}

@media (max-width: 640px) {
  .discovery-preferences-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
