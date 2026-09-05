<script setup lang="ts">
import {
  DISCOVERY_INTERESTS,
  type DiscoveryInterestKey,
} from '~/composables/useDiscoveryPreferences'

const { t } = useI18n()
const { mini } = useScreen()
const offlinePackage = useOfflinePackage()
const auth = useAuth()
const discovery = useDiscoveryPreferences()

const draftInterests = ref<DiscoveryInterestKey[]>([])
const editingPreferences = ref(false)
const preferenceError = ref(false)
const preferencesReady = ref(false)

const selectedDefinitions = computed(() => {
  const selected = new Set(discovery.interests.value)
  return DISCOVERY_INTERESTS.filter(interest => selected.has(interest.key))
})

const showPreferenceEditor = computed(() => {
  if (!preferencesReady.value || !auth.isLoggedIn.value || discovery.loading.value) return false
  return editingPreferences.value || discovery.interests.value.length === 0
})

const showPersonalizedDiscovery = computed(() => {
  return preferencesReady.value &&
    auth.isLoggedIn.value &&
    !discovery.loading.value &&
    !showPreferenceEditor.value &&
    selectedDefinitions.value.length > 0
})

onMounted(async () => {
  await auth.initialize()
  if (!auth.isLoggedIn.value) return
  await loadPreferences()
})

async function loadPreferences() {
  preferenceError.value = false
  preferencesReady.value = false

  try {
    await discovery.load(true)
    draftInterests.value = [...discovery.interests.value]
    preferencesReady.value = true
  } catch (error) {
    console.warn('[Prompt Draft] discovery preferences load failed', error)
    preferenceError.value = true
  }
}

function isDraftInterestSelected(key: DiscoveryInterestKey) {
  return draftInterests.value.includes(key)
}

function toggleDraftInterest(key: DiscoveryInterestKey) {
  preferenceError.value = false

  if (isDraftInterestSelected(key)) {
    draftInterests.value = draftInterests.value.filter(value => value !== key)
    return
  }

  draftInterests.value = [...draftInterests.value, key]
}

async function savePreferences() {
  if (!draftInterests.value.length || discovery.saving.value) return
  preferenceError.value = false

  try {
    await discovery.save(draftInterests.value)
    draftInterests.value = [...discovery.interests.value]
    preferencesReady.value = true
    editingPreferences.value = false
  } catch (error) {
    console.warn('[Prompt Draft] discovery preferences save failed', error)
    preferenceError.value = true
  }
}

function editPreferences() {
  draftInterests.value = [...discovery.interests.value]
  preferenceError.value = false
  editingPreferences.value = true
}

function cancelPreferenceEditing() {
  draftInterests.value = [...discovery.interests.value]
  preferenceError.value = false
  editingPreferences.value = false
}

function openInterest(primaryTag: string) {
  return navigateTo(`/prompts?tag=${encodeURIComponent(primaryTag)}`)
}
</script>

<template>
  <el-grid :gap="0" :cols="1" rules="ccc" class="h100 w100 home-page">
    <visual-tile
      :count="94"
      :interval="2000"
      :transition-duration="5000"
      extension="webp"
      :edge-blur="400"
      :z-index="50"
    />

    <el-flex
      rules="ccc"
      class="zi100 w100 h100 home-page__surface"
      bg="surface45"
      bd="b0"
      :radius="0"
      :gap="10"
      :p="32">
      <el-text
        v-if="offlinePackage.state.isStandalone && !offlinePackage.state.online"
        type="span"
        :size="12"
        :weight="700"
        marker="orange40"
        class="tc">
        {{ t('pwa.offline.status.offlineMode') }}
      </el-text>

      <el-text type="span" :size="12" :weight="600" class="tc">
        {{ t('home.eyebrow') }}
      </el-text>
      <el-text
        type="h1"
        :size="mini ? 40 : 64"
        :weight="800"
        effect="glitch"
        marker="normal50"
        color="surface"
        class="tc">
        {{ t('home.title').toUpperCase() }}
      </el-text>
      <el-text type="p" :size="mini ? 14 : 20" :weight="400" class="tc mxwp400">
        {{ t('home.description') }}
      </el-text>
      <el-divider class="mxwp200" />
      <el-button :size="16" :label="t('home.createPrompt')" icon="auto_fix_high" to="/create" />
      <el-button
        :size="14"
        :label="t('app.navigation.guide')"
        icon="help"
        to="/guide"
        color="normal"
        mode="flat"
      />

      <el-flex
        v-if="auth.isLoggedIn.value"
        rules="csc"
        class="home-discovery w100"
        :gap="12"
        :p="16"
        :radius="18"
        :br="1"
        bc="normal20"
        bg="surface15"
        bd="b8">
        <template v-if="discovery.loading.value">
          <el-text :size="12" color="normal55">
            {{ t('growth.discovery.common.loading') }}
          </el-text>
        </template>

        <template v-else-if="!preferencesReady">
          <el-text :size="12" color="red">
            {{ t('growth.discovery.onboarding.error') }}
          </el-text>
          <el-button
            color="normal"
            mode="flat"
            icon="refresh"
            :label="t('prompts.error.retry')"
            @click="loadPreferences"
          />
        </template>

        <template v-else-if="showPreferenceEditor">
          <el-flex rules="csc" :gap="4" class="w100">
            <el-text :size="10" :weight="900" color="prim">
              {{ t('growth.discovery.onboarding.eyebrow') }}
            </el-text>
            <el-text :size="18" :weight="800">
              {{ t('growth.discovery.onboarding.title') }}
            </el-text>
            <el-text :size="12" color="normal55">
              {{ t('growth.discovery.onboarding.description') }}
            </el-text>
          </el-flex>

          <div class="home-discovery__grid w100">
            <button
              v-for="interest in DISCOVERY_INTERESTS"
              :key="interest.key"
              type="button"
              class="home-discovery__interest"
              :data-selected="isDraftInterestSelected(interest.key) ? 'true' : 'false'"
              :aria-pressed="isDraftInterestSelected(interest.key)"
              @click="toggleDraftInterest(interest.key)">
              <el-icon :icon="interest.icon" :size="19" color="prim" />
              <span class="home-discovery__interest-copy">
                <strong>{{ t(interest.messageKey) }}</strong>
                <small>{{ t(interest.descriptionKey) }}</small>
              </span>
            </button>
          </div>

          <el-text v-if="preferenceError" :size="11" color="red">
            {{ t('growth.discovery.onboarding.error') }}
          </el-text>

          <el-flex rules="rsc" :gap="8" wrap>
            <el-button
              color="prim"
              icon="save"
              :label="discovery.saving.value
                ? t('growth.discovery.onboarding.saving')
                : t('growth.discovery.onboarding.save')"
              :disable="!draftInterests.length || discovery.saving.value"
              @click="savePreferences"
            />
            <el-button
              v-if="discovery.interests.value.length"
              color="normal"
              mode="flat"
              icon="close"
              :label="t('growth.discovery.common.cancel')"
              :disable="discovery.saving.value"
              @click="cancelPreferenceEditing"
            />
          </el-flex>
        </template>

        <template v-else-if="showPersonalizedDiscovery">
          <el-flex rules="rbc" :gap="12" class="w100" wrap>
            <el-flex rules="csc" :gap="4" class="fg100">
              <el-text :size="10" :weight="900" color="prim">
                {{ t('growth.discovery.personalized.eyebrow') }}
              </el-text>
              <el-text :size="18" :weight="800">
                {{ t('growth.discovery.personalized.title') }}
              </el-text>
              <el-text :size="12" color="normal55">
                {{ t('growth.discovery.personalized.description') }}
              </el-text>
            </el-flex>

            <el-button
              color="normal"
              mode="flat"
              icon="tune"
              :label="t('growth.discovery.personalized.edit')"
              @click="editPreferences"
            />
          </el-flex>

          <div class="home-discovery__grid w100">
            <button
              v-for="interest in selectedDefinitions"
              :key="interest.key"
              type="button"
              class="home-discovery__interest home-discovery__interest--link"
              @click="openInterest(interest.primaryTag)">
              <el-icon :icon="interest.icon" :size="19" color="prim" />
              <span class="home-discovery__interest-copy">
                <strong>{{ t(interest.messageKey) }}</strong>
                <small>{{ t(interest.descriptionKey) }}</small>
              </span>
              <el-icon icon="arrow_forward" :size="17" color="normal55" />
            </button>
          </div>
        </template>
      </el-flex>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.home-page {
  overflow: hidden;
}

.home-page__surface {
  overflow-y: auto;
}

.home-discovery {
  max-width: 760px;
  margin-top: 10px;
}

.home-discovery__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.home-discovery__interest {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid rgba(127, 127, 127, 0.22);
  border-radius: 13px;
  background: rgba(127, 127, 127, 0.07);
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.home-discovery__interest:hover {
  background: rgba(127, 127, 127, 0.12);
}

.home-discovery__interest:active {
  transform: translateY(1px);
}

.home-discovery__interest[data-selected='true'] {
  border-color: var(--themePrimary);
  background: color-mix(in srgb, var(--themePrimary) 14%, transparent);
}

.home-discovery__interest--link {
  justify-content: flex-start;
}

.home-discovery__interest-copy {
  display: grid;
  gap: 3px;
  flex: 1 1 auto;
  min-width: 0;
}

.home-discovery__interest-copy strong {
  font-size: 12px;
  line-height: 1.3;
}

.home-discovery__interest-copy small {
  color: rgba(127, 127, 127, 0.9);
  font-size: 10px;
  line-height: 1.45;
}

.home-discovery__interest:focus-visible {
  outline: 2px solid var(--themePrimary);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .home-discovery__grid {
    grid-template-columns: 1fr;
  }
}
</style>
